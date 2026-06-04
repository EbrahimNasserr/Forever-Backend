import ReviewModel from "../../models/review/review.model.js";
import ReviewHelpfulModel from "../../models/reviewHelpful/reviewHelpful.model.js";

export const createReview = (reviewData) => ReviewModel.create(reviewData);
export const findReviewById = (id) => ReviewModel.findById(id);
export const findReviewByUserAndProduct = (userId, productId) =>
    ReviewModel.findOne({ user: userId, product: productId });
export const updateReviewById = (id, updateData) =>
    ReviewModel.findByIdAndUpdate(id, updateData, { new: true });
export const deleteReviewById = (id) => ReviewModel.findByIdAndDelete(id);
export const countReviews = (filter) => ReviewModel.countDocuments(filter);
export const findReviews = (filter, options = {}) => {
    const query = ReviewModel.find(filter);
    if (options.sort) {
        query.sort(options.sort);
    }
    if (options.skip !== undefined) {
        query.skip(options.skip);
    }
    if (options.limit !== undefined) {
        query.limit(options.limit);
    }
    if (options.populate) {
        options.populate.forEach((pop) => query.populate(pop));
    }
    if (options.select) {
        query.select(options.select);
    }
    if (options.lean) {
        query.lean();
    }
    return query;
};
export const increaseReportCount = (id) =>
    ReviewModel.findByIdAndUpdate(id, { $inc: { reportCount: 1 } }, { new: true });
export const increaseHelpfulCount = (id) =>
    ReviewModel.findByIdAndUpdate(id, { $inc: { helpfulCount: 1 } }, { new: true });
export const createHelpfulVote = (voteData) => ReviewHelpfulModel.create(voteData);
export const findHelpfulVoteForReviewAndUser = (reviewId, userId) =>
    ReviewHelpfulModel.findOne({ review: reviewId, user: userId });
export const countHelpfulVotes = (filter) => ReviewHelpfulModel.countDocuments(filter);
export const getReviewAggregates = async () => {
    const result = await ReviewModel.aggregate([
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
                pendingReviews: {
                    $sum: {
                        $cond: [{ $eq: ["$isApproved", false] }, 1, 0],
                    },
                },
                reportedReviews: {
                    $sum: {
                        $cond: [{ $gt: ["$reportCount", 0] }, 1, 0],
                    },
                },
            },
        },
    ]);

    return result[0] || {
        averageRating: 0,
        totalReviews: 0,
        pendingReviews: 0,
        reportedReviews: 0,
    };
};
