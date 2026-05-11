import mongoose from "mongoose";
import OrderModel from "../models/order/order.model.js";
import UserModel from "../models/user/user.model.js";
import ProductModel from "../models/product/product.model.js";
import ActivityModel from "../models/activity/activity.model.js";

export const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI || !process.env.DB_NAME) {
            throw new Error("Missing MONGO_URI or DB_NAME in environment variables");
        }

        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);
        console.log("Connected to MongoDB");

        // Create indexes for performance
        await createIndexes();
        console.log("Database indexes created");
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

const createIndexes = async () => {
    try {
        // Order indexes
        await OrderModel.collection.createIndex({ createdAt: 1 });
        await OrderModel.collection.createIndex({ status: 1 });
        await OrderModel.collection.createIndex({ user: 1 });

        // User indexes
        await UserModel.collection.createIndex({ role: 1 });
        await UserModel.collection.createIndex({ isActive: 1 });
        await UserModel.collection.createIndex({ createdAt: 1 });

        // Product indexes
        await ProductModel.collection.createIndex({ isActive: 1 });
        await ProductModel.collection.createIndex({ createdAt: 1 });

        // Activity indexes
        await ActivityModel.collection.createIndex({ createdAt: -1 });
        await ActivityModel.collection.createIndex({ type: 1 });

        console.log("All indexes created successfully");
    } catch (error) {
        console.log("Error creating indexes:", error);
    }
};