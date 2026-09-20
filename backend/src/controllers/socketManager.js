import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

let connections = {}
let messages = {}
let timeOnline = {}
let names = {}
let hosts = {}
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

        socket.on("join-call", (path, name) => {
            if (connections[path] && connections[path].length >= 500) {
                socket.emit("meeting-full");
                return;
            }

            names[socket.id] = name || "Guest";

            if (lockedMeetings[path] && hosts[path] !== socket.id) {
                socket.emit("meeting-locked");
                return;
            }

            // If meeting has a host and it's not the joiner, they must wait for admission
            if (hosts[path] && hosts[path] !== socket.id) {
                io.to(hosts[path]).emit("admission-request", { id: socket.id, name: names[socket.id] });
                socket.emit("waiting-for-admission");
                return;
            }

            socket.join(path); // Join the socket.io room
            completeJoin(socket, path, name);
        })

        socket.on("admission-response", (id, path, accepted) => {
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

        function completeJoin(socket, path, name) {
            if (connections[path] === undefined) {
                connections[path] = []
                hosts[path] = socket.id // First person to join is the host
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
            
            // Send all existing users with their full data to the new joiner
            const otherUsersData = usersInRoom.filter(u => u.id !== socket.id);
            socket.emit("all-users", otherUsersData);

            // Notify everyone in the room about the new joiner
            io.to(path).emit("update-participants", usersInRoom);
            io.to(path).emit("user-joined", socket.id, connections[path], usersInRoom);

            // Send existing whiteboard state to new joiner
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
            const rooms = Array.from(socket.rooms);
            rooms.forEach(path => {
                if (path !== socket.id && connections[path]) {
                    const index = connections[path].indexOf(socket.id);
                    if (index !== -1) {
                        connections[path].splice(index, 1);
                        
                        // If the person leaving was the host, assign a new host
                        if (hosts[path] === socket.id) {
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
                        }

                        if (connections[path].length === 0) {
                            delete connections[path];
                            delete hosts[path];
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

