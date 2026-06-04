import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        title: {
            type: String,
            trim: true,
            maxlength: 100,
            default: null,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        images: {
            type: [String],
            default: [],
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: false,
        },
        isApproved: {
            type: Boolean,
            default: true,
            index: true,
        },
        helpfulCount: {
            type: Number,
            default: 0,
        },
        reportCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const ReviewModel = mongoose.model("Review", reviewSchema);
export default ReviewModel;
