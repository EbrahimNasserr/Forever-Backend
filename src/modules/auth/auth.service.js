import validator from "validator";
import UserModel from "../../models/user/user.model.js";
import { validateRegisterPayload } from "../../validators/register.validate.js";
import { comparePassword, hashPassword } from "../../security/hash.js";
import { generateToken } from "../../security/token.js";

const buildSafeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

const normalizeEmailInput = (email) => validator.normalizeEmail(email.trim());

const validateLoginPayload = ({ email, password }) => {
    if (!email || !password) {
        return "Email and password are required";
    }

    if (!validator.isEmail(email)) {
        return "Please provide a valid email address";
    }

    return null;
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const validationError = validateLoginPayload({ email, password });

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const normalizedEmail = normalizeEmailInput(email);
        const existingUser = await UserModel.findOne({ email: normalizedEmail });

        if (!existingUser) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await comparePassword(password, existingUser.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = generateToken({ id: existingUser._id, role: existingUser.role });

        return res.status(200).json({
            message: "User logged in successfully",
            user: buildSafeUser(existingUser),
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const validationError = validateRegisterPayload({ name, email, password });

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const normalizedEmail = normalizeEmailInput(email);
        const checkUser = await UserModel.findOne({ email: normalizedEmail });

        if (checkUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const newUser = await UserModel.create({
            name: name.trim(),
            email: normalizedEmail,
            password: await hashPassword(password),
        });

        const token = generateToken({ id: newUser._id, role: newUser.role });

        res.status(201).json({
            message: "User created successfully",
            user: buildSafeUser(newUser),
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// admin login
const adminLogin = async (req, res) => { };

export { loginUser, registerUser, adminLogin };