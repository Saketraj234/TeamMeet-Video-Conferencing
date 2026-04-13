import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username and password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
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
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
}

const register = async (req, res) => {
    const { name, username, password, email } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword,
            email: email
        });

        await newUser.save();
        res.status(httpStatus.CREATED).json({ message: "User Registered Successfully" });
    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
}

const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const meetings = await Meeting.find({ user_id: decoded.username });
        res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        res.status(httpStatus.UNAUTHORIZED).json({ message: `Invalid or expired token: ${e.message}` });
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code, scheduled_at } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const newMeeting = new Meeting({
            user_id: decoded.username,
            meetingCode: meeting_code,
            scheduledAt: scheduled_at
        });

        await newMeeting.save();
        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        res.status(httpStatus.UNAUTHORIZED).json({ message: `Invalid or expired token: ${e.message}` });
    }
}

const updateProfile = async (req, res) => {
    const { token, name, phone, profileImg, password, currentPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

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
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        res.status(httpStatus.OK).json(user);
    } catch (e) {
        res.status(httpStatus.UNAUTHORIZED).json({ message: e.message });
    }
}

export { login, register, getUserHistory, addToHistory, updateProfile, getUserData };