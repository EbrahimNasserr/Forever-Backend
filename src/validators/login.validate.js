import validator from "validator";

export const validateLoginPayload = ({ email, password }) => {
    if (!email || !password) {
        return "Email and password are required";
    }

    if (!validator.isEmail(email)) {
        return "Please provide a valid email address";
    }

    return null;
};

