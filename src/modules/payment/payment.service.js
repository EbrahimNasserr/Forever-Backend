import Stripe from "stripe";
import mongoose from "mongoose";
import ProductModel from "../../models/product/product.model.js";
import OrderModel from "../../models/order/order.model.js";

const getStripeClient = () => {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
        throw new Error("Stripe secret key is not configured");
    }
    return new Stripe(apiKey, {
        apiVersion: "2023-08-16"
    });
};

const normalizeShipping = (shippingAddress) => {
    if (!shippingAddress) return null;
    const { street, city, state, zipCode, country } = shippingAddress;
    return {
        street: String(street || "").trim(),
        city: String(city || "").trim(),
        state: String(state || "").trim(),
        zipCode: String(zipCode || "").trim(),
        country: String(country || "").trim(),
    };
};

const createCheckoutSession = async ({ userId, items, shippingAddress, frontendUrl, userEmail }) => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe secret key is not configured");
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("Stripe webhook secret is not configured");
    }
    if (!frontendUrl) {
        throw new Error("FRONTEND_URL is not configured");
    }
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("items must be a non-empty array");
    }

    const normalizedShippingAddress = normalizeShipping(shippingAddress);
    if (!normalizedShippingAddress || !normalizedShippingAddress.street || !normalizedShippingAddress.city || !normalizedShippingAddress.state || !normalizedShippingAddress.zipCode || !normalizedShippingAddress.country) {
        throw new Error("Complete shipping address is required");
    }

    const productIds = items.map((item) => item.productId);
    if (!productIds.every((id) => mongoose.isValidObjectId(id))) {
        throw new Error("One or more productIds are invalid");
    }

    const requestedProducts = await ProductModel.find({ _id: { $in: productIds } });
    const productMap = requestedProducts.reduce((acc, product) => {
        acc[String(product._id)] = product;
        return acc;
    }, {});

    const lineItems = [];
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
        const productId = String(item.productId);
        const quantity = Number(item.quantity);

        if (!Number.isFinite(quantity) || quantity < 1) {
            throw new Error("quantity must be a positive integer");
        }

        const product = productMap[productId];
        if (!product || product.isActive === false) {
            throw new Error(`Product ${productId} is not available`);
        }

        if (product.stock < quantity) {
            throw new Error(`Insufficient stock for product ${product.name}`);
        }

        const unitPrice = Number(product.price);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error(`Invalid price for product ${product.name}`);
        }

        const itemTotal = unitPrice * quantity;
        subtotal += itemTotal;

        orderItems.push({
            product: product._id,
            quantity,
            price: unitPrice,
            name: product.name,
            image: Array.isArray(product.images) && product.images.length ? product.images[0] : null,
        });

        lineItems.push({
            price_data: {
                currency: "usd",
                product_data: {
                    name: product.name,
                    description: product.description || undefined,
                },
                unit_amount: Math.round(unitPrice * 100),
            },
            quantity,
        });
    }

    const tax = 0;
    const shippingFee = 0;
    const discount = 0;
    const total = Math.max(0, subtotal - discount + tax + shippingFee);

    const order = await OrderModel.create({
        user: userId,
        items: orderItems,
        currency: "USD",
        subtotal,
        discount,
        tax,
        shipping: shippingFee,
        total,
        status: "pending",
        paymentMethod: "card",
        paymentStatus: "pending",
        shippingAddress: normalizedShippingAddress,
        billingAddress: normalizedShippingAddress,
        stripeSessionId: null,
        stripePaymentIntentId: null,
    });

    const sessionParams = {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems,
        success_url: `${frontendUrl.replace(/\/$/, "")}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl.replace(/\/$/, "")}/cart`,
        metadata: {
            orderId: String(order._id),
        },
    };

    if (userEmail) {
        sessionParams.customer_email = userEmail;
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create(sessionParams);

    order.stripeSessionId = session.id;
    await order.save();

    return { order, session };
};

const handleStripeWebhook = async ({ rawBody, signature }) => {
    if (!signature) {
        throw new Error("Stripe signature header is missing");
    }

    const stripe = getStripeClient();
    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        throw new Error(`Webhook signature verification failed: ${error.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (!orderId || !mongoose.isValidObjectId(orderId)) {
            return { handled: false };
        }

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return { handled: false };
        }

        order.paymentStatus = "paid";
        order.status = "confirmed";
        if (session.payment_intent) {
            order.stripePaymentIntentId = session.payment_intent;
        }

        await order.save();
        return { handled: true };
    }

    if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;
        let order = null;

        if (orderId && mongoose.isValidObjectId(orderId)) {
            order = await OrderModel.findById(orderId);
        }

        if (!order && paymentIntent.id) {
            order = await OrderModel.findOne({ stripePaymentIntentId: paymentIntent.id });
        }

        if (!order) {
            return { handled: false };
        }

        order.paymentStatus = "failed";
        await order.save();
        return { handled: true };
    }

    return { handled: false };
};

const verifyPayment = async ({ userId, sessionId }) => {
    if (!sessionId) {
        throw new Error("session_id query parameter is required");
    }
    if (!mongoose.isValidObjectId(userId)) {
        throw new Error("Invalid user id");
    }

    const order = await OrderModel.findOne({ user: userId, stripeSessionId: sessionId });
    if (!order) {
        return { paid: false, order: null };
    }

    return {
        paid: order.paymentStatus === "paid",
        order,
    };
};

export { createCheckoutSession, handleStripeWebhook, verifyPayment };