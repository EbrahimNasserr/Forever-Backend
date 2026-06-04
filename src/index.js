import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { connectCloudinary } from "./config/cloudinary.js";
import authRouter from "./modules/auth/auth.controller.js";
import productRouter from "./modules/product/product.controller.js";
import cartRouter from "./modules/cart/cart.controller.js";
import categoryRouter from "./modules/category/category.controller.js";
import orderRouter from "./modules/order/order.controller.js";
import paymentRouter from "./modules/payment/payment.routes.js";
import reviewRouter from "./modules/review/review.controller.js";
import adminRouter from "./modules/admin/dashboard/dashboard.controller.js";

dotenv.config({ path: "src/config/.env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Connect to Cloudinary
connectCloudinary();

// Middleware
app.use(cors({
    origin: "*",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/category", categoryRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin", adminRouter);

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));