import validator from "validator";

export const validateRegisterPayload = ({ name, email, password }) => {
    if (!name || !email || !password) {
        return "there are some required fields missing";
    }

    if (!validator.isLength(name.trim(), { min: 2, max: 50 })) {
        return "Name must be between 2 and 50 characters";
    }

    if (!validator.isEmail(email)) {
        return "Please provide a valid email address";
    }

    if (!validator.isLength(password, { min: 6 })) {
        return "Password must be at least 6 characters long";
    }

    return null;
};