import mongoose from "mongoose";

const toSlug = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

const subCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true }
);

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        subCategories: {
            type: [subCategorySchema],
            default: [],
        },
    },
    { timestamps: true, minimize: false }
);

categorySchema.pre("validate", function () {
    if (!this.slug && this.name) {
        this.slug = toSlug(this.name);
    }

    if (Array.isArray(this.subCategories)) {
        this.subCategories = this.subCategories.map((sub) => ({
            ...sub,
            slug: sub.slug ? toSlug(sub.slug) : toSlug(sub.name),
        }));
    }
});

const CategoryModel = mongoose.model("Category", categorySchema);

export { toSlug };
export default CategoryModel;

