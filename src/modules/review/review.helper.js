import mongoose from "mongoose";
import ReviewModel from "../../models/review/review.model.js";
import ProductModel from "../../models/product/product.model.js";

export const recalculateProductReviewStats = async (productId) => {
    if (!mongoose.isValidObjectId(productId)) {
        return;
    }

    const normalizedProductId = new mongoose.Types.ObjectId(productId);
    const stats = await ReviewModel.aggregate([
        { $match: { product: normalizedProductId, isApproved: true } },
        {
            $group: {
                _id: "$product",
                averageRating: { $avg: "$rating" },
                reviewsCount: { $sum: 1 },
            },
        },
    ]);

    const productStats = stats[0] || { averageRating: 0, reviewsCount: 0 };
    const averageRating = Number((productStats.averageRating || 0).toFixed(2));
    const reviewsCount = productStats.reviewsCount || 0;

    await ProductModel.findByIdAndUpdate(
        normalizedProductId,
        { averageRating, reviewsCount },
        { new: true }
    );
};
