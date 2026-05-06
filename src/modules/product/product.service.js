import cloudinary from "cloudinary";
import ProductModel from "../../models/product/product.model.js";

const parseArrayInput = (value) => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            return value.split(",").map((item) => item.trim()).filter(Boolean);
        }
    }

    return [];
};

const extractUploadFiles = (files) => {
    if (!files) {
        return [];
    }

    if (Array.isArray(files)) {
        return files;
    }

    return Object.values(files).flat();
};

const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, stock, bestSeller } = req.body;
        const uploadedFiles = extractUploadFiles(req.files);

        if (!name || !description || !price || !category || !subCategory || !stock) {
            return res.status(400).json({ message: "Missing required product fields" });
        }

        if (uploadedFiles.length === 0) {
            return res.status(400).json({ message: "At least one product image is required" });
        }

        if (uploadedFiles.length > 4) {
            return res.status(400).json({ message: "You can upload up to 4 images only" });
        }

        const uploadedImages = await Promise.all(
            uploadedFiles.map((file) =>
                cloudinary.v2.uploader.upload(file.path, {
                    folder: "forever/products",
                    resource_type: "image",
                })
            )
        );

        const imageUrls = uploadedImages.map((image) => image.secure_url);

        const newProduct = await ProductModel.create({
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            images: imageUrls,
            category: category.trim(),
            subCategory: subCategory.trim(),
            size: parseArrayInput(req.body.size),
            color: parseArrayInput(req.body.color),
            stock: Number(stock),
            bestSeller: bestSeller === "true" || bestSeller === true,
        });

        return res.status(201).json({
            message: "Product created successfully",
            product: newProduct,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const removeProduct = async (req, res) => {
    try {
        const productId = req.params.id || req.body.id;
        const deletedProduct = await ProductModel.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({ message: "Product removed successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getProductInfo = async (req, res) => {
    try {
        const productId = req.params.id || req.body.id;
        const product = await ProductModel.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({ product });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.find({});
        return res.status(200).json({ count: products.length, products });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export { addProduct, removeProduct, getProductInfo, getAllProducts };
