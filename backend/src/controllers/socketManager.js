import { Server } from "socket.io"


let connections = {}
let messages = {}
let timeOnline = {}
let names = {} // To store names by socket.id

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

            if (connections[path] === undefined) {
                connections[path] = []
            }
            
            // Avoid duplicates for the same socket
            if (!connections[path].includes(socket.id)) {
                connections[path].push(socket.id)
            }
            names[socket.id] = name || "Guest"

            timeOnline[socket.id] = new Date();

            // Notify everyone in the room about the new user
            const usersInRoom = connections[path].map(id => ({ id, name: names[id] }))
            connections[path].forEach(socketId => {
                io.to(socketId).emit("user-joined", socket.id, connections[path], usersInRoom)
            })

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }

        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("hand-raised", (path, status) => {
            if (connections[path]) {
                connections[path].forEach(elem => {
                    io.to(elem).emit("hand-raised", socket.id, status)
                })
            }
        })

        socket.on("mute-all", (path) => {
            if (connections[path]) {
                connections[path].forEach(elem => {
                    io.to(elem).emit("mute-all")
                })
            }
        })

        socket.on("remove-user", (path, id) => {
            if (connections[path]) {
                io.to(id).emit("remove-user", id)
            }
        })

        socket.on("toggle-feature", (path, feature, status) => {
            if (connections[path]) {
                connections[path].forEach(elem => {
                    if (elem !== socket.id) { // Don't mute the host themselves
                        io.to(elem).emit("feature-toggled", feature, status)
                    }
                })
            }
        })

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {


                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];

                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        socket.on("disconnect", () => {
            console.log("SOCKET DISCONNECTED:", socket.id);
            for (const [path, participants] of Object.entries(connections)) {
                const index = participants.indexOf(socket.id);
                if (index !== -1) {
                    // Remove user from room
                    participants.splice(index, 1);
                    
                    // Notify others in the room
                    participants.forEach(socketId => {
                        io.to(socketId).emit('user-left', socket.id);
                    });

                    // Clean up room if empty
                    if (participants.length === 0) {
                        delete connections[path];
                        console.log("ROOM DELETED:", path);
                    }
                    break; // User can only be in one room at a time
                }
            }
            delete timeOnline[socket.id];
            delete names[socket.id];
        })


    })


    return io;
}

