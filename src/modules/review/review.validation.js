import mongoose from "mongoose";

const normalizeString = (value) => String(value || "").trim();

export const validateObjectId = (value, fieldName = "id") => {
    if (!value || !mongoose.isValidObjectId(value)) {
        return { isValid: false, message: `Invalid ${fieldName}` };
    }
    return { isValid: true };
};

export const validateReviewPayload = (payload) => {
    const productId = normalizeString(payload.productId);
    const rating = payload.rating;
    const title = normalizeString(payload.title);
    const comment = normalizeString(payload.comment);
    const images = payload.images;

    const objectIdValidation = validateObjectId(productId, "productId");
    if (!objectIdValidation.isValid) {
        return objectIdValidation;
    }

    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { isValid: false, message: "Rating must be an integer between 1 and 5" };
    }

    if (!comment) {
        return { isValid: false, message: "Comment is required" };
    }

    if (comment.length > 1000) {
        return { isValid: false, message: "Comment must be 1000 characters or fewer" };
    }

    if (title && title.length > 100) {
        return { isValid: false, message: "Title must be 100 characters or fewer" };
    }

    if (images !== undefined) {
        if (!Array.isArray(images)) {
            return { isValid: false, message: "Images must be an array of strings" };
        }

        if (images.length > 10) {
            return { isValid: false, message: "Images can include up to 10 items" };
        }

        const invalidImage = images.some((image) => typeof image !== "string" || !image.trim());
        if (invalidImage) {
            return { isValid: false, message: "Images must be a list of valid strings" };
        }
    }

    return { isValid: true };
};

export const validateReviewUpdatePayload = (payload) => {
    const allowedFields = ["rating", "title", "comment", "images"];
    const payloadKeys = Object.keys(payload).filter((key) => allowedFields.includes(key));

    if (payloadKeys.length === 0) {
        return { isValid: false, message: "No valid fields provided for update" };
    }

    if (payload.rating !== undefined) {
        const rating = payload.rating;
        if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
            return { isValid: false, message: "Rating must be an integer between 1 and 5" };
        }
    }

    if (payload.title !== undefined) {
        const title = normalizeString(payload.title);
        if (title.length > 100) {
            return { isValid: false, message: "Title must be 100 characters or fewer" };
        }
    }

    if (payload.comment !== undefined) {
        const comment = normalizeString(payload.comment);
        if (!comment) {
            return { isValid: false, message: "Comment cannot be empty" };
        }

        if (comment.length > 1000) {
            return { isValid: false, message: "Comment must be 1000 characters or fewer" };
        }
    }

    if (payload.images !== undefined) {
        const images = payload.images;
        if (!Array.isArray(images)) {
            return { isValid: false, message: "Images must be an array of strings" };
        }

        if (images.length > 10) {
            return { isValid: false, message: "Images can include up to 10 items" };
        }

        const invalidImage = images.some((image) => typeof image !== "string" || !image.trim());
        if (invalidImage) {
            return { isValid: false, message: "Images must be a list of valid strings" };
        }
    }

    return { isValid: true };
};

export const validateApprovalPayload = (payload) => {
    if (payload.isApproved === undefined || typeof payload.isApproved !== "boolean") {
        return { isValid: false, message: "isApproved must be a boolean" };
    }
    return { isValid: true };
};

export const parsePaginationParameters = (query) => {
    const page = Number(query.page) && Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) && Number(query.limit) > 0 ? Math.min(Number(query.limit), 100) : 10;
    return { page, limit };
};

export const parseSortParameter = (sort) => {
    switch (String(sort).toLowerCase()) {
        case "oldest":
            return { createdAt: 1 };
        case "helpful":
            return { helpfulCount: -1, createdAt: -1 };
        case "rating":
            return { rating: -1, createdAt: -1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
};

export const parseBooleanParam = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const text = String(value).toLowerCase().trim();
    if (text === "true") return true;
    if (text === "false") return false;
    return null;
};
