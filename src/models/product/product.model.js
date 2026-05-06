import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    images: {
        type: [String],
        required: true,
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0 && value.length <= 4,
            message: "Product must have between 1 and 4 images",
        },
    },
    category: {
        type: String,
        required: true,
    },
    subCategory: {
        type: String,
        required: true,
    },
    size: {
        type: Array,
        default: [],
    },
    color: {
        type: Array,
        default: [],
    },
    stock: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    bestSeller: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;