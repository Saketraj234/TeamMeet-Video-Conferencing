import jwt from "jsonwebtoken";
import httpStatus from "http-status";

const extractToken = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && String(authHeader).startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }
    if (req.body && req.body.token) return req.body.token;
    if (req.query && req.query.token) return req.query.token;
    return null;
};

export const protect = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({
            success: false,
            message: "Access denied. No token provided. Please login."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id || !decoded.username) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        }
        req.user = {
            id: decoded.id,
            username: decoded.username
        };
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Session expired. Please login again."
            });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        }
        return res.status(httpStatus.UNAUTHORIZED).json({
            success: false,
            message: "Authentication failed: " + err.message
        });
    }
};
