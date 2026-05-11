import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["order", "customer", "alert", "review", "coupon"],
        required: true,
        index: true,
    },
    who: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    target: {
        type: String,
        required: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

const ActivityModel = mongoose.model("Activity", activitySchema);
export default ActivityModel;