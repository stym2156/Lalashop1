import { Request, Response } from "express";
import mongoose from "mongoose";
import Category from "../models/categoryModel";
import Product from "../models/productModel";

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ─── Public: list active categories ────────────────────────────────────

export const listPublicCategories = async (_req: Request, res: Response) => {
  try {
    const cats = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    res.status(200).json({ success: true, data: cats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin endpoints ───────────────────────────────────────────────────

export const adminListCategories = async (_req: Request, res: Response) => {
  try {
    const cats = await Category.find({}).sort({ displayOrder: 1, name: 1 }).lean();

    // Compute live product counts per category name
    const productCounts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countByName = new Map<string, number>();
    for (const c of productCounts as any[]) countByName.set(c._id, c.count);

    const data = cats.map((c) => ({
      ...c,
      productCount: countByName.get(c.name) ?? 0,
    }));

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminCreateCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, icon, parent, displayOrder, isActive } = req.body as {
      name: string;
      description?: string;
      icon?: string;
      parent?: string;
      displayOrder?: number;
      isActive?: boolean;
    };

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "name required" });
    }

    let slug = slugify(name);
    let counter = 1;
    while (await Category.findOne({ slug })) {
      slug = `${slugify(name)}-${counter++}`;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      slug,
      description: description ?? "",
      icon: icon ?? "",
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
    };
    if (parent && mongoose.isValidObjectId(parent)) {
      payload.parent = new mongoose.Types.ObjectId(parent);
    }

    const created = await Category.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ success: false, message: "Category not found" });

    const { name, description, icon, parent, displayOrder, isActive } = req.body as {
      name?: string;
      description?: string;
      icon?: string;
      parent?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    };

    if (typeof name === "string" && name.trim()) {
      cat.name = name.trim();
    }
    if (typeof description === "string") cat.description = description;
    if (typeof icon === "string") cat.icon = icon;
    if (typeof displayOrder === "number") cat.displayOrder = displayOrder;
    if (typeof isActive === "boolean") cat.isActive = isActive;
    if (parent === null) cat.parent = undefined;
    else if (typeof parent === "string" && mongoose.isValidObjectId(parent)) {
      cat.parent = new mongoose.Types.ObjectId(parent) as any;
    }

    await cat.save();
    res.status(200).json({ success: true, data: cat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminDeleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ success: false, message: "Category not found" });

    const productCount = await Product.countDocuments({ category: cat.name });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete: ${productCount} product${productCount === 1 ? "" : "s"} still use this category. Reassign or remove them first, or set the category inactive instead.`,
      });
    }

    await cat.deleteOne();
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
