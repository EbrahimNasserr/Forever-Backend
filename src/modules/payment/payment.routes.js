import express from "express";
import userAuth from "../../middleware/userAuth.js";
import { createCheckoutSession, handleStripeWebhook, verifyPayment } from "./payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", userAuth, createCheckoutSession);
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);
router.get("/verify/:sessionId", userAuth, verifyPayment);

export default router;
