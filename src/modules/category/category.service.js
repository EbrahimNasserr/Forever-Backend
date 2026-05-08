import mongoose from "mongoose";
import CategoryModel, { toSlug } from "../../models/category/category.model.js";

const normalizeBoolean = (value, fallback = undefined) => {
    if (value === undefined) return fallback;
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return fallback;
};

const createCategory = async (req, res) => {
    try {
        const body = req.body || {};
        const { name, slug, isActive } = body;

        if (!name) {
            return res.status(400).json({ message: "name is required" });
        }

        const category = await CategoryModel.create({
            name: String(name).trim(),
            slug: toSlug(slug || name),
            isActive: normalizeBoolean(isActive, true),
        });

        return res.status(201).json({ message: "Category created", category });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "Category already exists" });
        }
        return res.status(500).json({ message: error.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await CategoryModel.find({}).sort({ name: 1 });
        return res.status(200).json({ count: categories.length, categories });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        const category = await CategoryModel.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        return res.status(200).json({ category });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};
        const { name, slug, isActive } = body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        const update = {};
        if (name !== undefined) update.name = String(name).trim();
        if (slug !== undefined) update.slug = toSlug(slug);
        if (isActive !== undefined) update.isActive = normalizeBoolean(isActive, true);

        const category = await CategoryModel.findByIdAndUpdate(id, update, { new: true });
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        return res.status(200).json({ message: "Category updated", category });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "Category already exists" });
        }
        return res.status(500).json({ message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        const deleted = await CategoryModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Category not found" });
        }

        return res.status(200).json({ message: "Category deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const addSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body || {};
        const { name, slug, isActive } = body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid category id" });
        }

        if (!name) {
            return res.status(400).json({ message: "name is required" });
        }

        const category = await CategoryModel.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const finalSlug = toSlug(slug || name);
        const exists = category.subCategories.some(
            (sub) => sub.name.toLowerCase() === String(name).trim().toLowerCase() || sub.slug === finalSlug
        );
        if (exists) {
            return res.status(409).json({ message: "Subcategory already exists in this category" });
        }

        category.subCategories.push({
            name: String(name).trim(),
            slug: finalSlug,
            isActive: normalizeBoolean(isActive, true),
        });

        await category.save();

        return res.status(201).json({ message: "Subcategory created", category });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateSubCategory = async (req, res) => {
    try {
        const { id, subId } = req.params;
        const body = req.body || {};
        const { name, slug, isActive } = body;

        if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(subId)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const category = await CategoryModel.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const sub = category.subCategories.id(subId);
        if (!sub) {
            return res.status(404).json({ message: "Subcategory not found" });
        }

        if (name !== undefined) sub.name = String(name).trim();
        if (slug !== undefined) sub.slug = toSlug(slug);
        if (name !== undefined && slug === undefined) sub.slug = toSlug(name);
        if (isActive !== undefined) sub.isActive = normalizeBoolean(isActive, true);

        await category.save();

        return res.status(200).json({ message: "Subcategory updated", category });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteSubCategory = async (req, res) => {
    try {
        const { id, subId } = req.params;

        if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(subId)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        const category = await CategoryModel.findById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const sub = category.subCategories.id(subId);
        if (!sub) {
            return res.status(404).json({ message: "Subcategory not found" });
        }

        sub.deleteOne();
        await category.save();

        return res.status(200).json({ message: "Subcategory deleted", category });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const seedDefaultStructure = async (req, res) => {
    try {
        const defaults = ["Men", "Women", "Kids"];
        const subDefaults = ["Topwear", "Bottomwear", "Winterwear"];

        for (const categoryName of defaults) {
            let category = await CategoryModel.findOne({ name: categoryName });

            if (!category) {
                category = await CategoryModel.create({
                    name: categoryName,
                    slug: toSlug(categoryName),
                    isActive: true,
                    subCategories: [],
                });
            }

            for (const subName of subDefaults) {
                const exists = category.subCategories.some((sub) => sub.slug === toSlug(subName));
                if (!exists) {
                    category.subCategories.push({
                        name: subName,
                        slug: toSlug(subName),
                        isActive: true,
                    });
                }
            }

            await category.save();
        }

        const categories = await CategoryModel.find({}).sort({ name: 1 });
        return res.status(200).json({ message: "Default categories seeded", count: categories.length, categories });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export {
    addSubCategory,
    createCategory,
    deleteCategory,
    deleteSubCategory,
    getCategories,
    getCategoryById,
    seedDefaultStructure,
    updateCategory,
    updateSubCategory,
};

