import mongoose from "mongoose";
import CartModel from "../../models/cart/cart.model.js";
import ProductModel from "../../models/product/product.model.js";

const recalcTotals = (cart) => {
    const subtotal = (cart.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.subtotal = Math.max(0, Number(subtotal) || 0);

    const discount = Math.max(0, Number(cart.discount) || 0);
    const tax = Math.max(0, Number(cart.tax) || 0);
    const shipping = Math.max(0, Number(cart.shipping) || 0);

    cart.total = Math.max(0, cart.subtotal - discount + tax + shipping);
};

const getOrCreateCart = async (userId) => {
    const existing = await CartModel.findOne({ user: userId });
    if (existing) return existing;
    return await CartModel.create({ user: userId, items: [] });
};

const getCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const cart = await getOrCreateCart(userId);
        return res.status(200).json({ cart });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const body = req.body || {};
        const { productId, quantity = 1, size = null, color = null } = body;

        if (!productId) {
            return res.status(400).json({ message: "productId is required" });
        }

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId" });
        }

        const qty = Number(quantity);
        if (!Number.isFinite(qty) || qty < 1) {
            return res.status(400).json({ message: "quantity must be >= 1" });
        }

        const product = await ProductModel.findById(productId);
        if (!product || product.isActive === false) {
            return res.status(404).json({ message: "Product not found" });
        }

        const cart = await getOrCreateCart(userId);

        const existingIndex = cart.items.findIndex(
            (i) =>
                String(i.product) === String(productId) &&
                String(i.size ?? "") === String(size ?? "") &&
                String(i.color ?? "") === String(color ?? "")
        );

        if (existingIndex >= 0) {
            cart.items[existingIndex].quantity += qty;
        } else {
            cart.items.push({
                product: product._id,
                quantity: qty,
                size,
                color,
                price: Number(product.price),
                name: product.name,
                image: Array.isArray(product.images) ? product.images[0] : null,
            });
        }

        recalcTotals(cart);
        await cart.save();

        return res.status(200).json({ message: "Added to cart", cart });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const body = req.body || {};
        const { productId, quantity, size = null, color = null } = body;

        if (!productId) {
            return res.status(400).json({ message: "productId is required" });
        }

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId" });
        }

        const qty = Number(quantity);
        if (!Number.isFinite(qty) || qty < 0) {
            return res.status(400).json({ message: "quantity must be >= 0" });
        }

        const cart = await getOrCreateCart(userId);

        const idx = cart.items.findIndex(
            (i) =>
                String(i.product) === String(productId) &&
                String(i.size ?? "") === String(size ?? "") &&
                String(i.color ?? "") === String(color ?? "")
        );

        if (idx < 0) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        if (qty === 0) {
            cart.items.splice(idx, 1);
        } else {
            cart.items[idx].quantity = qty;
        }

        recalcTotals(cart);
        await cart.save();

        return res.status(200).json({ message: "Cart updated", cart });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const removeCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const body = req.body || {};
        const productId = req.params.productId || body.productId;
        const { size = null, color = null } = body;
        const matchVariant = size !== null || color !== null;

        if (!productId) {
            return res.status(400).json({ message: "productId is required" });
        }

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: "Invalid productId" });
        }

        const cart = await getOrCreateCart(userId);

        const before = cart.items.length;
        cart.items = cart.items.filter(
            (i) =>
                !(
                    String(i.product) === String(productId) &&
                    (!matchVariant ||
                        (String(i.size ?? "") === String(size ?? "") && String(i.color ?? "") === String(color ?? "")))
                )
        );

        if (cart.items.length === before) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        recalcTotals(cart);
        await cart.save();

        return res.status(200).json({ message: "Item removed", cart });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const cart = await getOrCreateCart(userId);
        cart.items = [];
        cart.discount = 0;
        cart.tax = 0;
        cart.shipping = 0;
        recalcTotals(cart);
        await cart.save();
        return res.status(200).json({ message: "Cart cleared", cart });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export { addToCart, clearCart, getCart, removeCartItem, updateCartItem };

