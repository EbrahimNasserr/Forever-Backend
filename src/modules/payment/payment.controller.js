import { createCheckoutSession as createCheckoutSessionService, handleStripeWebhook as handleStripeWebhookService, verifyPayment as verifyPaymentService } from "./payment.service.js";

const createCheckoutSession = async (req, res) => {
    try {
        const userId = req.user?.id;
        const body = req.body || {};
        const { items, shippingAddress } = body;

        if (!userId) {
            return res.status(401).json({ message: "User authentication required" });
        }

        const frontendUrl = process.env.FRONTEND_URL;
        const userEmail = req.user?.email;

        const { session } = await createCheckoutSessionService({
            userId,
            items,
            shippingAddress,
            frontendUrl,
            userEmail,
        });

        return res.status(200).json({ success: true, url: session.url });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const handleStripeWebhook = async (req, res) => {
    try {
        const rawBody = req.body;
        const signature = req.headers["stripe-signature"] || req.headers["Stripe-Signature"];

        const result = await handleStripeWebhookService({ rawBody, signature });
        if (result.handled) {
            return res.status(200).json({ received: true });
        }

        return res.status(200).json({ received: true, ignored: true });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const userId = req.user?.id;
        const sessionId = req.params.sessionId;

        const { paid, order } = await verifyPaymentService({ userId, sessionId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({ paid, orderId: order._id, status: order.status });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

export { createCheckoutSession, handleStripeWebhook, verifyPayment };