import { Router } from "express";
import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";
import {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    adminGetReviews,
    updateReviewApproval,
    reportReview,
    markHelpful,
    getReviewStats,
} from "./review.service.js";

const router = Router();

router.post("/", userAuth, createReview);
router.get("/product/:productId", getProductReviews);
router.put("/:id", userAuth, updateReview);
router.delete("/:id", userAuth, deleteReview);
router.patch("/:id/report", userAuth, reportReview);
router.patch("/:id/helpful", userAuth, markHelpful);
router.get("/admin", adminAuth, adminGetReviews);
router.patch("/admin/:id/approval", adminAuth, updateReviewApproval);
router.get("/admin/stats", adminAuth, getReviewStats);

export default router;
