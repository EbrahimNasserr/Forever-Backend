import { Router } from "express";
import adminAuth from "../../middleware/adminAuth.js";
import {
    addSubCategory,
    createCategory,
    deleteCategory,
    deleteSubCategory,
    getCategories,
    getCategoryById,
    seedDefaultStructure,
    updateCategory,
    updateSubCategory,
} from "./category.service.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.post("/add", adminAuth, createCategory);
router.put("/:id", adminAuth, updateCategory);
router.delete("/:id", adminAuth, deleteCategory);

router.post("/seed-defaults", adminAuth, seedDefaultStructure);

router.post("/:id/sub", adminAuth, addSubCategory);
router.put("/:id/sub/:subId", adminAuth, updateSubCategory);
router.delete("/:id/sub/:subId", adminAuth, deleteSubCategory);

export default router;

