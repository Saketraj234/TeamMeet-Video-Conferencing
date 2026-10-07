import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

let connections = {}
let messages = {}
let timeOnline = {}
let names = {}
let hosts = {}
let pendingAdmissions = {}
let whiteboardStates = {}
let whiteboardVisible = {}
let lockedMeetings = {}
let userStatus = {}

const extractSocketToken = (handshake) => {
    const authHeader = handshake.headers?.authorization || handshake.headers?.Authorization
    if (authHeader && String(authHeader).startsWith("Bearer ")) {
        return authHeader.split(" ")[1]
    }
    if (handshake.auth?.token) return handshake.auth.token
    if (handshake.query?.token) return handshake.query.token
    return null
}

export const connectToSocket = (server) => {
    const allowedOrigins = [
        "https://teem-meet-backend.onrender.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]

    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true)
                } else {
                    callback(new Error("Not allowed by CORS"))
                }
            },
            methods: ["GET", "POST"],
            allowedHeaders: ["Authorization", "Content-Type"],
            credentials: true
        }
    })

    io.use((socket, next) => {
        const token = extractSocketToken(socket.handshake)
        if (!token) {
            return next(new Error("Authentication required. Please login."))
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            if (!decoded || !decoded.id || !decoded.username) {
                return next(new Error("Invalid authentication token."))
            }
            socket.user = { id: decoded.id, username: decoded.username }
            next()
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return next(new Error("Session expired. Please login again."))
            }
            return next(new Error("Invalid authentication token."))
        }
    })

    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        const notifyRoomAboutPendingAdmissions = (path, extraTargets = []) => {
            if (!pendingAdmissions[path] || pendingAdmissions[path].size === 0) return
            const targets = new Set()
            if (hosts[path]) targets.add(hosts[path])
            if (connections[path]) connections[path].forEach(id => targets.add(id))
            extraTargets.forEach(id => targets.add(id))
            pendingAdmissions[path].forEach(waiterId => {
                const waiterName = names[waiterId] || "Guest"
                const payload = { id: waiterId, name: waiterName }
                targets.forEach(targetId => {
                    if (targetId === waiterId) return
                    io.to(targetId).emit("admission-request", payload)
                })
            })
        }

        const broadcastPendingAdmissionSnapshot = (path, targetId) => {
            if (!pendingAdmissions[path] || pendingAdmissions[path].size === 0) return
            pendingAdmissions[path].forEach(waiterId => {
                if (waiterId === targetId) return
                io.to(targetId).emit("admission-request", { id: waiterId, name: names[waiterId] || "Guest" })
            })
        }

        socket.on("join-call", (path, name, opts = {}) => {
            if (connections[path] && connections[path].length >= 500) {
                socket.emit("meeting-full");
                return;
            }

            names[socket.id] = name || "Guest";
            const isCreator = opts.isCreator === true;

            if (lockedMeetings[path] && hosts[path] !== socket.id && !isCreator) {
                socket.emit("meeting-locked");
                return;
            }

            if (isCreator) {
                const previousHost = hosts[path];
                hosts[path] = socket.id;

                if (pendingAdmissions[path]) {
                    pendingAdmissions[path].delete(socket.id);
                    if (pendingAdmissions[path].size === 0) delete pendingAdmissions[path];
                }

                if (!connections[path] || !connections[path].includes(socket.id)) {
                    socket.join(path);
                    completeJoin(socket, path, name, { isCreator: true, previousHost });
                } else {
                    const usersInRoom = connections[path].map(id => ({
                        id,
                        name: names[id],
                        isHost: id === hosts[path],
                        status: userStatus[id]
                    }));
                    io.to(path).emit("host-updated", hosts[path], usersInRoom);
                    io.to(path).emit("update-participants", usersInRoom);
                    broadcastPendingAdmissionSnapshot(path, socket.id)
                }
                socket.emit("admission-accepted");
                return;
            }

            if (hosts[path] && hosts[path] !== socket.id) {
                if (!pendingAdmissions[path]) pendingAdmissions[path] = new Set()
                const wasNotPending = !pendingAdmissions[path].has(socket.id)
                if (wasNotPending) {
                    pendingAdmissions[path].add(socket.id)
                    notifyRoomAboutPendingAdmissions(path)
                }
                socket.emit("waiting-for-admission");
                return;
            }

            socket.join(path);
            completeJoin(socket, path, name);
        })

        socket.on("admission-response", (id, path, accepted) => {
            const isHostResponder = hosts[path] === socket.id
            const isInRoom = connections[path]?.includes(socket.id)
            if (!isHostResponder && !isInRoom) return
            if (!pendingAdmissions[path]?.has(id)) return

            pendingAdmissions[path].delete(id);
            if (pendingAdmissions[path].size === 0) delete pendingAdmissions[path];

            if (connections[path]) {
                connections[path].forEach(memberId => {
                    io.to(memberId).emit("admission-cancelled", id)
                })
            }
            if (hosts[path]) io.to(hosts[path]).emit("admission-cancelled", id)

            if (accepted) {
                const targetSocket = io.sockets.sockets.get(id);
                if (targetSocket) {
                    targetSocket.join(path);
                    const name = names[id] || "Guest";
                    completeJoin(targetSocket, path, name);
                    io.to(id).emit("admission-accepted");
                }
            } else {
                io.to(id).emit("admission-rejected");
            }
        })

        socket.on("cancel-admission", (path) => {
            if (pendingAdmissions[path]?.has(socket.id)) {
                pendingAdmissions[path].delete(socket.id);
                if (pendingAdmissions[path].size === 0) delete pendingAdmissions[path];
                if (connections[path]) {
                    connections[path].forEach(memberId => {
                        io.to(memberId).emit("admission-cancelled", socket.id);
                    })
                }
                if (hosts[path]) io.to(hosts[path]).emit("admission-cancelled", socket.id);
            }
        })

        socket.on("sync-pending-admissions", (path) => {
            if (!path) return
            const isAllowed = hosts[path] === socket.id || connections[path]?.includes(socket.id)
            if (!isAllowed) return
            broadcastPendingAdmissionSnapshot(path, socket.id)
        })

        function completeJoin(socket, path, name, opts = {}) {
            if (connections[path] === undefined) {
                connections[path] = []
                if (!hosts[path]) {
                    hosts[path] = socket.id
                }
            }
            
            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id)
            }
            names[socket.id] = name || "Guest"
            if (!userStatus[socket.id]) {
                userStatus[socket.id] = { mic: true, video: true }
            }

            timeOnline[socket.id] = new Date();

            const usersInRoom = connections[path].map(id => ({ 
                id, 
                name: names[id],
                isHost: id === hosts[path],
                status: userStatus[id]
            }))
            
            const otherUsersData = usersInRoom.filter(u => u.id !== socket.id);
            socket.emit("all-users", otherUsersData);

            io.to(path).emit("update-participants", usersInRoom);
            io.to(path).emit("user-joined", socket.id, connections[path], usersInRoom);

            if (opts.isCreator && opts.previousHost && opts.previousHost !== socket.id) {
                io.to(path).emit("host-updated", hosts[path], usersInRoom);
            }

            if (pendingAdmissions[path]) {
                pendingAdmissions[path].forEach(waiterId => {
                    if (waiterId === socket.id) return
                    io.to(socket.id).emit("admission-request", { id: waiterId, name: names[waiterId] || "Guest" })
                })
            }

            if (whiteboardVisible[path]) {
                io.to(socket.id).emit("whiteboard-toggled", true)
                if (whiteboardStates[path]) {
                    whiteboardStates[path].forEach(drawData => {
                        io.to(socket.id).emit("whiteboard-data", drawData)
                    })
                }
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }
        }

        socket.on("sending-signal", (payload) => {
            io.to(payload.userToSignal).emit('receiving-signal', { signal: payload.signal, callerID: payload.callerID });
        })

        socket.on("returning-signal", (payload) => {
            io.to(payload.callerID).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("toggle-hand", (path, status) => {
            io.to(path).emit("hand-toggled", socket.id, status)
        })

        socket.on("mute-all", (path) => {
            socket.to(path).emit("mute-all")
        })

        socket.on("remove-participant", (path, id) => {
            io.to(id).emit("removed-from-meeting")
        })

        socket.on("toggle-feature", (path, feature, status) => {
            socket.to(path).emit("feature-toggled", feature, status) // send to all except sender
        })

        socket.on("whiteboard-toggle", (path, status) => {
            whiteboardVisible[path] = status;
            if (!status) delete whiteboardStates[path]; // Clear state when closed
            io.to(path).emit("whiteboard-toggled", status)
        })

        socket.on("whiteboard-draw", (path, data) => {
            if (!whiteboardStates[path]) whiteboardStates[path] = [];
            whiteboardStates[path].push(data);
            socket.to(path).emit("whiteboard-data", data)
        })

        socket.on("whiteboard-clear", (path) => {
            whiteboardStates[path] = [];
            io.to(path).emit("whiteboard-cleared")
        })

        socket.on("toggle-meeting-lock", (path, status) => {
            lockedMeetings[path] = status;
            io.to(path).emit("meeting-locked", status);
        })

        socket.on("update-status", (path, status) => {
            userStatus[socket.id] = status;
            io.to(path).emit("status-updated", socket.id, status);
        })

        socket.on("send-message", (data, sender) => {
            // Find room by socket.rooms
            const rooms = Array.from(socket.rooms);
            const matchingRoom = rooms.find(r => r !== socket.id);

            if (matchingRoom) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                io.to(matchingRoom).emit("receive-message", { name: sender, message: data, id: socket.id })
            }

        })

        socket.on("disconnecting", () => {
            Object.entries(pendingAdmissions).forEach(([path, requests]) => {
                if (requests.delete(socket.id) && connections[path]) {
                    connections[path].forEach(memberId => {
                        io.to(memberId).emit("admission-cancelled", socket.id);
                    })
                    if (hosts[path]) io.to(hosts[path]).emit("admission-cancelled", socket.id);
                }
                if (requests.size === 0) delete pendingAdmissions[path];
            });

            const rooms = Array.from(socket.rooms);
            rooms.forEach(path => {
                if (path !== socket.id && connections[path]) {
                    const index = connections[path].indexOf(socket.id);
                    if (index !== -1) {
                        connections[path].splice(index, 1);
                        
                        const wasHost = hosts[path] === socket.id
                        if (wasHost) {
                            if (connections[path].length > 0) {
                                hosts[path] = connections[path][0];
                            } else {
                                delete hosts[path];
                            }
                        }

                        const usersInRoom = connections[path].map(id => ({ 
                            id, 
                            name: names[id],
                            isHost: id === hosts[path],
                            status: userStatus[id]
                        }))

                        io.to(path).emit('user-left', socket.id);
                        
                        if (connections[path].length > 0) {
                            io.to(path).emit('host-updated', hosts[path], usersInRoom);
                            if (wasHost && pendingAdmissions[path]) {
                                pendingAdmissions[path].forEach(waiterId => {
                                    io.to(hosts[path]).emit("admission-request", {
                                        id: waiterId,
                                        name: names[waiterId] || "Guest"
                                    })
                                })
                            }
                        }

                        if (connections[path].length === 0) {
                            delete connections[path];
                            delete hosts[path];
                            delete pendingAdmissions[path];
                            delete whiteboardStates[path];
                            delete whiteboardVisible[path];
                            delete lockedMeetings[path];
                            console.log("ROOM DELETED:", path);
                        }
                    }
                }
            });
        })

        socket.on("disconnect", () => {
            console.log("SOCKET DISCONNECTED:", socket.id);
            delete timeOnline[socket.id];
            delete names[socket.id];
            delete userStatus[socket.id];
        })



    })


    return io;
}
