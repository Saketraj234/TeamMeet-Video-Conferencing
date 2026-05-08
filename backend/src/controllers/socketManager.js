import { Server } from "socket.io"


let connections = {}
let messages = {}
let timeOnline = {}
let names = {} // To store names by socket.id
let hosts = {} // To store host socket.id by path
let whiteboardStates = {} // To store whiteboard drawings by path
let whiteboardVisible = {} // To store whiteboard visibility status by path
let lockedMeetings = {} // To store locked status by path

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });


    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", (path, name) => {
            if (connections[path] && connections[path].length >= 100) {
                socket.emit("meeting-full");
                return;
            }

            if (lockedMeetings[path] && hosts[path] !== socket.id) {
                socket.emit("meeting-locked");
                return;
            }

            // If meeting has a host and it's not the joiner, they must wait for admission
            if (hosts[path] && hosts[path] !== socket.id) {
                io.to(hosts[path]).emit("admission-request", socket.id, name);
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

            timeOnline[socket.id] = new Date();

            const usersInRoom = connections[path].map(id => ({ 
                id, 
                name: names[id],
                isHost: id === hosts[path]
            }))
            
            // Notify everyone in the room
            io.to(path).emit("user-joined", socket.id, connections[path], usersInRoom, hosts[path])

            // Send existing whiteboard state to new joiner
            if (whiteboardVisible[path]) {
                io.to(socket.id).emit("whiteboard-toggle", true)
                if (whiteboardStates[path]) {
                    whiteboardStates[path].forEach(drawData => {
                        io.to(socket.id).emit("whiteboard-draw", drawData)
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

        socket.on("hand-raised", (path, status) => {
            io.to(path).emit("hand-raised", socket.id, status)
        })

        socket.on("mute-all", (path) => {
            socket.to(path).emit("mute-all")
        })

        socket.on("remove-user", (path, id) => {
            io.to(id).emit("remove-user", id)
        })

        socket.on("toggle-feature", (path, feature, status) => {
            socket.to(path).emit("feature-toggled", feature, status) // send to all except sender
        })

        socket.on("whiteboard-toggle", (path, status) => {
            whiteboardVisible[path] = status;
            if (!status) delete whiteboardStates[path]; // Clear state when closed
            io.to(path).emit("whiteboard-toggle", status)
        })

        socket.on("whiteboard-draw", (path, data) => {
            if (!whiteboardStates[path]) whiteboardStates[path] = [];
            whiteboardStates[path].push(data);
            socket.to(path).emit("whiteboard-draw", data)
        })

        socket.on("whiteboard-clear", (path) => {
            whiteboardStates[path] = [];
            io.to(path).emit("whiteboard-clear")
        })

        socket.on("toggle-meeting-lock", (path, status) => {
            lockedMeetings[path] = status;
            io.to(path).emit("meeting-lock-status", status);
        })

        socket.on("chat-message", (data, sender) => {
            // Find room by socket.rooms
            const rooms = Array.from(socket.rooms);
            const matchingRoom = rooms.find(r => r !== socket.id);

            if (matchingRoom) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                io.to(matchingRoom).emit("chat-message", data, sender, socket.id)
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
                            isHost: id === hosts[path]
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
        })



    })


    return io;
}

