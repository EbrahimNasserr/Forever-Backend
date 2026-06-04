import mongoose from "mongoose";
import ProductModel from "../../models/product/product.model.js";
import OrderModel from "../../models/order/order.model.js";
import {
    createReview as repositoryCreateReview,
    findReviewById,
    findReviewByUserAndProduct,
    updateReviewById,
    deleteReviewById,
    countReviews,
    findReviews,
    increaseReportCount,
    increaseHelpfulCount,
    createHelpfulVote,
    getReviewAggregates,
} from "./review.repository.js";
import {
    recalculateProductReviewStats,
} from "./review.helper.js";
import {
    validateReviewPayload,
    validateReviewUpdatePayload,
    validateApprovalPayload,
    validateObjectId,
    parsePaginationParameters,
    parseSortParameter,
    parseBooleanParam,
} from "./review.validation.js";

const buildPagination = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

const normalizeImages = (images) => {
    if (!Array.isArray(images)) {
        return [];
    }
    return images.map((image) => String(image).trim()).filter(Boolean);
};

const buildReviewResponse = (review) => ({
    ...review,
    id: review._id,
});

const createReview = async (req, res) => {
    try {
        const validation = validateReviewPayload(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const userId = req.user?.id;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(401).json({ success: false, message: "Invalid user credentials" });
        }

        const { productId, rating, title, comment, images } = req.body;
        const product = await ProductModel.findById(productId).lean();

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const existingReview = await findReviewByUserAndProduct(userId, productId);
        if (existingReview) {
            return res.status(409).json({ success: false, message: "You have already reviewed this product" });
        }

        const completedOrder = await OrderModel.exists({
            user: userId,
            status: "delivered",
            "items.product": productId,
        });

        const reviewPayload = {
            product: productId,
            user: userId,
            rating,
            title: title ? String(title).trim() : undefined,
            comment: String(comment).trim(),
            images: normalizeImages(images),
            isVerifiedPurchase: Boolean(completedOrder),
        };

        const review = await repositoryCreateReview(reviewPayload);
        await recalculateProductReviewStats(productId);

        return res.status(201).json({
            success: true,
            message: "Review created successfully",
            review: buildReviewResponse(review.toObject()),
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Duplicate review detected" });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const productId = req.params.productId;
        const objectIdValidation = validateObjectId(productId, "productId");
        if (!objectIdValidation.isValid) {
            return res.status(400).json({ success: false, message: objectIdValidation.message });
        }

        const product = await ProductModel.exists({ _id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const { page, limit } = parsePaginationParameters(req.query);
        const sort = parseSortParameter(req.query.sort);

        const filter = { product: productId, isApproved: true };
        if (req.query.rating !== undefined) {
            const rating = Number(req.query.rating);
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, message: "Rating filter must be an integer between 1 and 5" });
            }
            filter.rating = rating;
        }

        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            findReviews(filter, {
                sort,
                skip,
                limit,
                populate: [{ path: "user", select: "name" }],
                lean: true,
                select: "product user rating title comment images isVerifiedPurchase helpfulCount reportCount isApproved createdAt updatedAt",
            }),
            countReviews(filter),
        ]);

        return res.status(200).json({
            success: true,
            reviews,
            pagination: buildPagination(page, limit, total),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const idValidation = validateObjectId(reviewId, "review id");
        if (!idValidation.isValid) {
            return res.status(400).json({ success: false, message: idValidation.message });
        }

        const validation = validateReviewUpdatePayload(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const review = await findReviewById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const userId = req.user?.id;
        const isAdmin = req.user?.role === "admin";
        if (!isAdmin && String(review.user) !== String(userId)) {
            return res.status(403).json({ success: false, message: "You are not allowed to update this review" });
        }

        const updateFields = {};
        if (req.body.rating !== undefined) updateFields.rating = req.body.rating;
        if (req.body.title !== undefined) updateFields.title = String(req.body.title).trim();
        if (req.body.comment !== undefined) updateFields.comment = String(req.body.comment).trim();
        if (req.body.images !== undefined) updateFields.images = normalizeImages(req.body.images);

        const updatedReview = await updateReviewById(reviewId, updateFields);
        await recalculateProductReviewStats(review.product);

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review: buildReviewResponse(updatedReview.toObject()),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const idValidation = validateObjectId(reviewId, "review id");
        if (!idValidation.isValid) {
            return res.status(400).json({ success: false, message: idValidation.message });
        }

        const review = await findReviewById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const userId = req.user?.id;
        const isAdmin = req.user?.role === "admin";
        if (!isAdmin && String(review.user) !== String(userId)) {
            return res.status(403).json({ success: false, message: "You are not allowed to delete this review" });
        }

        await deleteReviewById(reviewId);
        await recalculateProductReviewStats(review.product);

        return res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const adminGetReviews = async (req, res) => {
    try {
        const { page, limit } = parsePaginationParameters(req.query);
        const sort = parseSortParameter(req.query.sort);
        const filter = {};

        if (req.query.rating !== undefined) {
            const rating = Number(req.query.rating);
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, message: "Rating filter must be an integer between 1 and 5" });
            }
            filter.rating = rating;
        }

        if (req.query.product !== undefined) {
            const productId = String(req.query.product).trim();
            if (!mongoose.isValidObjectId(productId)) {
                return res.status(400).json({ success: false, message: "Invalid product filter" });
            }
            filter.product = productId;
        }

        if (req.query.approved !== undefined) {
            const approved = parseBooleanParam(req.query.approved);
            if (approved === null) {
                return res.status(400).json({ success: false, message: "approved filter must be true or false" });
            }
            filter.isApproved = approved;
        }

        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            findReviews(filter, {
                sort,
                skip,
                limit,
                populate: [
                    { path: "user", select: "name" },
                    { path: "product", select: "name" },
                ],
                lean: true,
                select: "product user rating title comment images isVerifiedPurchase helpfulCount reportCount isApproved createdAt updatedAt",
            }),
            countReviews(filter),
        ]);

        return res.status(200).json({
            success: true,
            reviews,
            pagination: buildPagination(page, limit, total),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateReviewApproval = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const idValidation = validateObjectId(reviewId, "review id");
        if (!idValidation.isValid) {
            return res.status(400).json({ success: false, message: idValidation.message });
        }

        const validation = validateApprovalPayload(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const review = await updateReviewById(reviewId, { isApproved: req.body.isApproved });
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        await recalculateProductReviewStats(review.product);

        return res.status(200).json({
            success: true,
            message: "Review approval status updated successfully",
            review: buildReviewResponse(review.toObject()),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const reportReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const idValidation = validateObjectId(reviewId, "review id");
        if (!idValidation.isValid) {
            return res.status(400).json({ success: false, message: idValidation.message });
        }

        const review = await increaseReportCount(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        return res.status(200).json({ success: true, message: "Review reported successfully", review: buildReviewResponse(review.toObject()) });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const markHelpful = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const idValidation = validateObjectId(reviewId, "review id");
        if (!idValidation.isValid) {
            return res.status(400).json({ success: false, message: idValidation.message });
        }

        const userId = req.user?.id;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(401).json({ success: false, message: "Invalid user credentials" });
        }

        const existingReview = await findReviewById(reviewId);
        if (!existingReview) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        await createHelpfulVote({ review: reviewId, user: userId });
        const updatedReview = await increaseHelpfulCount(reviewId);

        return res.status(200).json({
            success: true,
            message: "Review marked helpful successfully",
            review: buildReviewResponse(updatedReview.toObject()),
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "You have already marked this review as helpful" });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getReviewStats = async (req, res) => {
    try {
        const stats = await getReviewAggregates();
        return res.status(200).json({
            success: true,
            data: {
                totalReviews: stats.totalReviews,
                averageRating: Number((stats.averageRating || 0).toFixed(2)),
                pendingReviews: stats.pendingReviews,
                reportedReviews: stats.reportedReviews,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    adminGetReviews,
    updateReviewApproval,
    reportReview,
    markHelpful,
    getReviewStats,
};
