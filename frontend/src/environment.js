const server = process.env.NODE_ENV === "production" ?
    "https://teem-meet-backend.onrender.com" :
    "http://localhost:8000";

export default server;
