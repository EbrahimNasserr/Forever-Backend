import validator from "validator";

export const normalizeEmailInput = (email) => validator.normalizeEmail(email.trim());

