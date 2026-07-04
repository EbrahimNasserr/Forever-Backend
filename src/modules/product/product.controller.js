import { Router } from "express";
import upload from "../../middleware/multer.js";
import adminAuth from "../../middleware/adminAuth.js";
import { addProduct, getAllProducts, getProductInfo, removeProduct, updateProduct } from "./product.service.js";

const router = Router();

router.post(
    "/add",
    adminAuth,
    upload.fields([
        { name: "images", maxCount: 4 },
        { name: "image", maxCount: 4 },
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "image4", maxCount: 1 },
    ]),
    addProduct
);
router.put(
    "/:id",
    adminAuth,
    upload.fields([
        { name: "images", maxCount: 4 },
        { name: "image", maxCount: 4 },
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "image4", maxCount: 1 },
    ]),
    updateProduct
);
router.delete("/remove/:id", adminAuth, removeProduct);
router.get("/all", getAllProducts);
router.get("/:id", getProductInfo);

export default router;