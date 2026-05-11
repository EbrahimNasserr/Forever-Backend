import mongoose from "mongoose";
import OrderModel from "../../../models/order/order.model.js";
import UserModel from "../../../models/user/user.model.js";
import ProductModel from "../../../models/product/product.model.js";
import ActivityModel from "../../../models/activity/activity.model.js";

const getDashboardData = async (range = "30d") => {
    try {
        // Calculate date ranges
        const now = new Date();
        let startDate, previousStartDate, previousEndDate;
        let groupBy, previousGroupBy;

        switch (range) {
            case "7d":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                previousEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                groupBy = {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                };
                previousGroupBy = groupBy;
                break;
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                previousEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                groupBy = {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                };
                previousGroupBy = groupBy;
                break;
            case "12m":
                startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
                previousStartDate = new Date(now.getFullYear() - 1, now.getMonth() - 11, 1);
                previousEndDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
                groupBy = {
                    $dateToString: {
                        format: "%Y-%m",
                        date: "$createdAt"
                    }
                };
                previousGroupBy = groupBy;
                break;
            default:
                throw new Error("Invalid range");
        }

        // Execute all aggregations in parallel
        const [
            statsResult,
            salesChartResult,
            recentActivitiesResult,
            recentOrdersResult,
            topProductsResult
        ] = await Promise.all([
            getStats(startDate, previousStartDate, previousEndDate),
            getSalesChart(startDate, groupBy),
            getRecentActivities(),
            getRecentOrders(),
            getTopProducts()
        ]);

        return {
            stats: statsResult,
            salesChart: salesChartResult,
            recentActivities: recentActivitiesResult,
            recentOrders: recentOrdersResult,
            topProducts: topProductsResult
        };

    } catch (error) {
        console.error("Error getting dashboard data:", error);
        throw error;
    }
};

const getStats = async (startDate, previousStartDate, previousEndDate) => {
    // Current period aggregations
    const currentStats = await OrderModel.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: { $ne: "cancelled" }
            }
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: "$total" },
                orders: { $sum: 1 }
            }
        }
    ]);

    // Previous period aggregations
    const previousStats = await OrderModel.aggregate([
        {
            $match: {
                createdAt: { $gte: previousStartDate, $lt: previousEndDate },
                status: { $ne: "cancelled" }
            }
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: "$total" },
                orders: { $sum: 1 }
            }
        }
    ]);

    // Total customers (current total, not period-based)
    const customersResult = await UserModel.countDocuments({
        role: "user",
        isActive: true
    });

    // Previous customers count (for change calculation)
    const previousCustomersResult = await UserModel.countDocuments({
        role: "user",
        isActive: true,
        createdAt: { $lt: startDate }
    });

    // Total products
    const productsResult = await ProductModel.countDocuments({
        isActive: true
    });

    // Previous products count
    const previousProductsResult = await ProductModel.countDocuments({
        isActive: true,
        createdAt: { $lt: startDate }
    });

    const currentRevenue = currentStats[0]?.revenue || 0;
    const currentOrders = currentStats[0]?.orders || 0;
    const previousRevenue = previousStats[0]?.revenue || 0;
    const previousOrders = previousStats[0]?.orders || 0;

    const revenueChange = previousRevenue > 0 ?
        ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const ordersChange = previousOrders > 0 ?
        ((currentOrders - previousOrders) / previousOrders) * 100 : 0;
    const customersChange = previousCustomersResult > 0 ?
        ((customersResult - previousCustomersResult) / previousCustomersResult) * 100 : 0;
    const productsChange = previousProductsResult > 0 ?
        ((productsResult - previousProductsResult) / previousProductsResult) * 100 : 0;

    return {
        revenue: {
            value: Math.round(currentRevenue),
            change: Math.round(revenueChange * 100) / 100
        },
        orders: {
            value: currentOrders,
            change: Math.round(ordersChange * 100) / 100
        },
        customers: {
            value: customersResult,
            change: Math.round(customersChange * 100) / 100
        },
        products: {
            value: productsResult,
            change: Math.round(productsChange * 100) / 100
        }
    };
};

const getSalesChart = async (startDate, groupBy) => {
    const result = await OrderModel.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
                status: { $ne: "cancelled" }
            }
        },
        {
            $group: {
                _id: groupBy,
                revenue: { $sum: "$total" },
                orders: { $sum: 1 }
            }
        },
        {
            $sort: { "_id": 1 }
        },
        {
            $project: {
                _id: 0,
                label: "$_id",
                revenue: { $round: ["$revenue", 0] },
                orders: 1
            }
        }
    ]);

    return result;
};

const getRecentActivities = async () => {
    const activities = await ActivityModel.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select("-__v");

    // Add relative time
    const now = new Date();
    return activities.map(activity => {
        const diffMs = now - activity.createdAt;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let time;
        if (diffMins < 1) time = "Just now";
        else if (diffMins < 60) time = `${diffMins} minutes ago`;
        else if (diffHours < 24) time = `${diffHours} hours ago`;
        else time = `${diffDays} days ago`;

        return {
            id: activity._id,
            type: activity.type,
            who: activity.who,
            action: activity.action,
            target: activity.target,
            time,
            createdAt: activity.createdAt
        };
    });
};

const getRecentOrders = async () => {
    const orders = await OrderModel.find({})
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id user status paymentStatus total currency createdAt");

    return orders.map(order => ({
        _id: order._id,
        user: {
            name: order.user.name,
            email: order.user.email
        },
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt
    }));
};

const getTopProducts = async () => {
    const result = await OrderModel.aggregate([
        {
            $match: {
                status: { $ne: "cancelled" }
            }
        },
        {
            $unwind: "$items"
        },
        {
            $group: {
                _id: "$items.product",
                sales: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
            }
        },
        {
            $sort: { sales: -1 }
        },
        {
            $limit: 5
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        {
            $unwind: "$product"
        },
        {
            $match: {
                "product.isActive": true
            }
        },
        {
            $project: {
                _id: "$_id",
                name: "$product.name",
                price: "$product.price",
                image: { $arrayElemAt: ["$product.images", 0] },
                sales: 1
            }
        }
    ]);

    return result;
};

export { getDashboardData };