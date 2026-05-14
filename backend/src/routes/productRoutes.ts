import express from "express";
import {
  getProducts,
  getProductById,
  getMyProducts,
  getProductsBySeller,
  getProductAdverts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  autocompleteProducts,
  getTrendingSearches,
} from "../controllers/productController";
import {
  getProductReviews,
  createProductReview,
  getMySellerReviews,
} from "../controllers/reviewController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

// List all products
router.get("/", getProducts);

// Full-text search with filters/sort/facets/pagination. Must come before
// dynamic /:id routes so "/search" isn't interpreted as an id.
router.get("/search", searchProducts);

// Top-N name suggestions for the header autocomplete dropdown.
router.get("/autocomplete", autocompleteProducts);

// Trending terms over the last 30 days.
router.get("/trending-searches", getTrendingSearches);

// Adverts (banner images sourced from active products)
router.get("/adverts", getProductAdverts);

// Current seller's products
router.get("/my", protect, getMyProducts);

// Reviews across all of seller's products
router.get("/my/reviews", protect, getMySellerReviews);

// Products of a specific seller (View Shop)
router.get("/seller/:sellerId", getProductsBySeller);

// Create product — accepts JSON only. Frontend uploads images to R2 first
// (via /api/upload/presign) and passes the resulting public URLs in body.images.
router.post("/", protect, createProduct);

// Update product
router.put("/:id", protect, updateProduct);

// Reviews
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, createProductReview);

// Single product
router.get("/:id", getProductById);

// Delete
router.delete("/:id", protect, deleteProduct);

export default router;
