import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meeting.model.js";

const verifyTurnstile = async (token) => {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) return { required: false, success: true };
    if (!token) return { required: true, success: false };
    try {
        const form = new URLSearchParams();
        form.append("secret", secretKey);
        form.append("response", token);
        const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: form,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        const data = await r.json();
        return { required: true, success: !!data.success };
    } catch (e) {
        console.error("Turnstile verify error:", e);
        return { required: true, success: false };
    }
};

const login = async (req, res) => {
    const { username, password, turnstileToken } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username/email and password" });
    }

    const turnstile = await verifyTurnstile(turnstileToken);
    if (turnstile.required && !turnstile.success) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please verify you are not a robot (check the box)." });
    }

    try {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(username).trim());
        const query = isEmail
            ? { email: String(username).trim().toLowerCase() }
            : { username: String(username).trim() };

        const user = await User.findOne(query);
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: isEmail
                    ? "No account found with this email. Please check or create a new account."
                    : "User Not Found. Please check your username or create a new account."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
                expiresIn: "7d"
            });

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ 
                token: token, 
                user: { 
                    id: user._id,
                    name: user.name, 
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    profileImg: user.profileImg,
                    lastUpdated: user.lastUpdated
                } 
            });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid password. Please try again." });
        }
    } catch (e) {
        console.error("Login error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Login failed. Please try again later.` });
    }
}

const register = async (req, res) => {
    const { name, username, password, email, turnstileToken } = req.body;

    if (!name || !username || !password || !email) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields are required" });
    }

    const turnstile = await verifyTurnstile(turnstileToken);
    if (turnstile.required && !turnstile.success) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please verify you are not a robot (check the box)." });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Name must be at least 2 characters long" });
    }

    const cleanUsername = String(username).trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Username must be 3-20 characters long" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Username can only contain letters, numbers, and underscores" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 8) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(password)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Password must contain at least one uppercase letter" });
    }
    if (!/[a-z]/.test(password)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Password must contain at least one lowercase letter" });
    }
    if (!/[0-9]/.test(password)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Password must contain at least one number" });
    }
    if (!/[!@#$%^&*]/.test(password)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Password must contain at least one special character (!@#$%^&*)" });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ username: cleanUsername }, { email: cleanEmail }]
        });
        if (existingUser) {
            if (existingUser.username === cleanUsername) {
                return res.status(httpStatus.CONFLICT).json({
                    message: "This username is already registered. Please try a different username or login instead."
                });
            }
            return res.status(httpStatus.CONFLICT).json({
                message: "This email is already registered. Please use a different email or login instead."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name.trim(),
            username: cleanUsername,
            password: hashedPassword,
            email: cleanEmail
        });

        await newUser.save();
        res.status(httpStatus.CREATED).json({ message: "User Registered Successfully" });
    } catch (e) {
        console.error("Registration error:", e);
        if (e && e.code === 11000) {
            const keyPattern = e.keyPattern || {};
            if (keyPattern.username) {
                return res.status(httpStatus.CONFLICT).json({
                    message: "This username is already registered. Please try a different username or login instead."
                });
            }
            if (keyPattern.email) {
                return res.status(httpStatus.CONFLICT).json({
                    message: "This email is already registered. Please use a different email or login instead."
                });
            }
            return res.status(httpStatus.CONFLICT).json({
                message: "Account already exists with these details. Please try logging in instead."
            });
        }
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Registration failed. Please try again later.` });
    }
}

const getUserHistory = async (req, res) => {
    try {
        const meetings = await Meeting.find({ user_id: req.user.username });
        res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Failed to fetch history: ${e.message}` });
    }
}

const addToHistory = async (req, res) => {
    const { meeting_code, scheduled_at } = req.body;

    try {
        const newMeeting = new Meeting({
            user_id: req.user.username,
            meetingCode: meeting_code,
            scheduledAt: scheduled_at
        });

        await newMeeting.save();
        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Failed to add history: ${e.message}` });
    }
}

const updateProfile = async (req, res) => {
    const { name, phone, profileImg, password, currentPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        // Check for 30-day limit on profile updates (excluding password change)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        // Allow first-time update (lastUpdated is null) OR if 30 days have passed
        if (user.lastUpdated && user.lastUpdated > thirtyDaysAgo && !password) {
            const nextUpdateDate = new Date(user.lastUpdated.getTime() + (30 * 24 * 60 * 60 * 1000));
            return res.status(httpStatus.FORBIDDEN).json({ 
                message: "You can only update your profile once every 30 days.",
                nextUpdateDate: nextUpdateDate
            });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (profileImg) user.profileImg = profileImg;
        
        if (password) {
            if (!currentPassword) {
                return res.status(httpStatus.BAD_REQUEST).json({ message: "Current password is required to set a new password" });
            }
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordCorrect) {
                return res.status(httpStatus.UNAUTHORIZED).json({ message: "Current password is incorrect" });
            }
            user.password = await bcrypt.hash(password, 10);
        } else {
            // Update lastUpdated if non-password fields were changed
            user.lastUpdated = now;
        }

        await user.save();

        // Generate a new token in case the username was updated
        const newToken = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.status(httpStatus.OK).json({ 
            message: "Profile updated successfully",
            token: newToken,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                profileImg: user.profileImg,
                lastUpdated: user.lastUpdated
            }
        });
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e.message });
    }
}

const getUserData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.status(httpStatus.OK).json(user);
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e.message });
    }
}

export { login, register, getUserHistory, addToHistory, updateProfile, getUserData };