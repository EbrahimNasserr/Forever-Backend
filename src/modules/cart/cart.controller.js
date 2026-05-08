import { Router } from "express";
import userAuth from "../../middleware/userAuth.js";
import { addToCart, clearCart, getCart, removeCartItem, updateCartItem } from "./cart.service.js";

const router = Router();

router.get("/", userAuth, getCart);
router.post("/add", userAuth, addToCart);
router.put("/item", userAuth, updateCartItem);
router.delete("/item/:productId", userAuth, removeCartItem);
router.delete("/clear", userAuth, clearCart);

export default router;

