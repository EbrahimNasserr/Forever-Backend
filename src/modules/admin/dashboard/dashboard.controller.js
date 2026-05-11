import { Router } from "express";
import adminAuth from "../../../middleware/adminAuth.js";
import { getDashboardData } from "./dashboard.service.js";
import { validateDashboardRange } from "./dashboard.validation.js";

const router = Router();

// GET /api/admin/dashboard?range=30d
const getDashboard = async (req, res) => {
    try {
        const { range = "30d" } = req.query;

        // Validate range parameter
        const validation = validateDashboardRange(range);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const dashboardData = await getDashboardData(range);

        res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

router.get("/dashboard", adminAuth, getDashboard);

export default router;