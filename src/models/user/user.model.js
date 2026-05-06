import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    cart: {
        type: Object,
        default: {},
    }
}, { timestamps: true , minimize: false });

const UserModel = mongoose.model("User", userSchema);
export default UserModel;