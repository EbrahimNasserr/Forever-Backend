import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { connectCloudinary } from "./config/cloudinary.js";
import authRouter from "./modules/auth/auth.controller.js";
import productRouter from "./modules/product/product.controller.js";

dotenv.config({ path: "src/config/.env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Connect to Cloudinary
connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));