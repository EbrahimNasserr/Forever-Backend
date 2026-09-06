import { Router } from "express";
import userAuth from "../../middleware/userAuth.js";
import { addToWishlist, clearWishlist, getWishlist, removeFromWishlist } from "./wishlist.service.js";

const router = Router();

router.get("/", userAuth, getWishlist);
router.post("/add", userAuth, addToWishlist);
router.delete("/item/:productId", userAuth, removeFromWishlist);
router.delete("/clear", userAuth, clearWishlist);

export default router;
