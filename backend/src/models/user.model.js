import mongoose, { Schema } from "mongoose";

const userScheme = new Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email: { type: String },
        password: { type: String, required: true },
        phone: { type: String },
        profileImg: { type: String },
        token: { type: String },
        lastUpdated: { type: Date, default: null }
    }
)

const User = mongoose.model("User", userScheme);

export { User };