import mongoose from "mongoose";
import WishlistModel from "../../models/wishlist/wishlist.model.js";
import ProductModel from "../../models/product/product.model.js";

const getOrCreateWishlist = async (userId) => {
  const existing = await WishlistModel.findOne({ user: userId });
  if (existing) return existing;
  return await WishlistModel.create({ user: userId, items: [] });
};

// GET /api/wishlist
const getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const wishlist = await getOrCreateWishlist(userId);
    return res.status(200).json({ wishlist });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/wishlist/add
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.body || {};

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const product = await ProductModel.findById(productId);
    if (!product || product.isActive === false) {
      return res.status(404).json({ message: "Product not found" });
    }

    const wishlist = await getOrCreateWishlist(userId);

    const alreadyExists = wishlist.items.some(
      (i) => String(i.product) === String(productId)
    );

    if (alreadyExists) {
      return res.status(409).json({ message: "Product already in wishlist", wishlist });
    }

    wishlist.items.push({
      product: product._id,
      name: product.name,
      image: Array.isArray(product.images) ? product.images[0] : null,
      price: Number(product.price),
    });

    await wishlist.save();
    return res.status(200).json({ message: "Added to wishlist", wishlist });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/wishlist/item/:productId
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const productId = req.params.productId;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const wishlist = await getOrCreateWishlist(userId);

    const before = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (i) => String(i.product) !== String(productId)
    );

    if (wishlist.items.length === before) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    await wishlist.save();
    return res.status(200).json({ message: "Removed from wishlist", wishlist });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/wishlist/clear
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const wishlist = await getOrCreateWishlist(userId);
    wishlist.items = [];
    await wishlist.save();
    return res.status(200).json({ message: "Wishlist cleared", wishlist });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
