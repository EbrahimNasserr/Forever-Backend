import { Router } from "express";
import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    getAllOrders
} from "./order.service.js";

const router = Router();

// User routes
router.post("/", userAuth, createOrder);
router.get("/", userAuth, getOrders);
router.get("/:id", userAuth, getOrderById);
router.put("/:id/cancel", userAuth, cancelOrder);

// Admin routes
router.get("/admin/all", adminAuth, getAllOrders);
router.put("/admin/:id/status", adminAuth, updateOrderStatus);
router.delete("/admin/:id", adminAuth, deleteOrder);

export default router;