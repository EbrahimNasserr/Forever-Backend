import mongoose from "mongoose";
import OrderModel from "../../models/order/order.model.js";
import CartModel from "../../models/cart/cart.model.js";
import ProductModel from "../../models/product/product.model.js";

const createOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        const body = req.body || {};
        const {
            shippingAddress,
            billingAddress,
            paymentMethod = "cash_on_delivery",
            notes
        } = body;

        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city ||
            !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
            return res.status(400).json({ message: "Complete shipping address is required" });
        }

        // Get user's cart
        const cart = await CartModel.findOne({ user: userId });
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Validate products are still available
        for (const item of cart.items) {
            const product = await ProductModel.findById(item.product);
            if (!product || product.isActive === false) {
                return res.status(400).json({ message: `Product ${item.name} is no longer available` });
            }
        }

        // Create order from cart
        const orderData = {
            user: userId,
            items: cart.items,
            subtotal: cart.subtotal,
            discount: cart.discount,
            tax: cart.tax,
            shipping: cart.shipping,
            total: cart.total,
            currency: cart.currency,
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            paymentMethod,
            notes
        };

        const order = await OrderModel.create(orderData);

        // Clear the cart after successful order creation
        cart.items = [];
        cart.status = "ordered";
        await cart.save();

        return res.status(201).json({
            message: "Order created successfully",
            order
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;

        const query = { user: userId };
        if (status) {
            query.status = status;
        }

        const orders = await OrderModel.find(query)
            .populate('items.product', 'name images price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await OrderModel.countDocuments(query);

        return res.status(200).json({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const orderId = req.params.id;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const order = await OrderModel.findOne({ _id: orderId, user: userId })
            .populate('items.product', 'name images price description');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({ order });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status, trackingNumber } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;

        const order = await OrderModel.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true, runValidators: true }
        ).populate('items.product', 'name images price');

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            message: "Order updated successfully",
            order
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        const orderId = req.params.id;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const order = await OrderModel.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Only allow cancellation if order is still pending or confirmed
        if (!["pending", "confirmed"].includes(order.status)) {
            return res.status(400).json({
                message: "Order cannot be cancelled at this stage"
            });
        }

        order.status = "cancelled";
        await order.save();

        return res.status(200).json({
            message: "Order cancelled successfully",
            order
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }

        const order = await OrderModel.findByIdAndDelete(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            message: "Order deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Admin functions
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const userId = req.query.userId;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) query.status = status;
        if (userId) query.user = userId;

        const orders = await OrderModel.find(query)
            .populate('user', 'name email')
            .populate('items.product', 'name images price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await OrderModel.countDocuments(query);

        return res.status(200).json({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    getAllOrders
};