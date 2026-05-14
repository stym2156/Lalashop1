import { Request, Response } from "express";
import Product from "../models/productModel";
import Address from "../models/addressModel";
import Order from "../models/orderModel";
import SearchLog from "../models/searchLogModel";
import { IAuthRequest } from "../middlewares/authMiddleware";

const safeJsonParse = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

// ─────────────────────────────────────────────────────────────────────
// Search + autocomplete (public — used by /search and the header bar)
// ─────────────────────────────────────────────────────────────────────

// Reusable query fragment that hides POS-only and storefront-disabled
// products from any public listing. Mirrors the rule in getProducts().
const PUBLIC_VISIBLE = {
  $and: [
    { $or: [{ showInStorefront: { $ne: false } }, { showInStorefront: { $exists: false } }] },
    { $or: [{ salesChannel: { $ne: "pos" } }, { salesChannel: { $exists: false } }] },
    { status: { $ne: "Archived" } },
  ],
};

interface SearchQuery {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  // relevance | newest | priceAsc | priceDesc | popular
  sort?: string;
  page?: string;
  limit?: string;
}

// @route GET /api/products/search
// Public search endpoint backed by the Mongo text index. Returns scored
// results with category facets so the client can render dynamic filters.
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice, sort, page, limit } =
      req.query as SearchQuery;

    const pageNum = Math.max(parseInt(page || "1", 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit || "24", 10) || 24, 1), 100);
    const skip = (pageNum - 1) * lim;

    const filter: Record<string, unknown> = { ...PUBLIC_VISIBLE };
    const trimmedQ = String(q || "").trim();
    if (trimmedQ) {
      filter.$text = { $search: trimmedQ };
    }
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      const range: Record<string, number> = {};
      const lo = Number(minPrice);
      const hi = Number(maxPrice);
      if (Number.isFinite(lo) && lo >= 0) range.$gte = lo;
      if (Number.isFinite(hi) && hi > 0) range.$lte = hi;
      if (Object.keys(range).length > 0) filter.price = range;
    }

    // Pick the sort order. Stock-aware: out-of-stock products always sink
    // to the bottom regardless of which user-chosen sort is active.
    const projection: Record<string, unknown> = {};
    let sortSpec: Record<string, unknown> = {};
    switch (sort) {
      case "newest":
        sortSpec = { outOfStock: 1, createdAt: -1 };
        break;
      case "priceAsc":
        sortSpec = { outOfStock: 1, price: 1, createdAt: -1 };
        break;
      case "priceDesc":
        sortSpec = { outOfStock: 1, price: -1, createdAt: -1 };
        break;
      case "popular":
        sortSpec = { outOfStock: 1, soldCount: -1, createdAt: -1 };
        break;
      case "relevance":
      default:
        if (trimmedQ) {
          projection.score = { $meta: "textScore" };
          sortSpec = { outOfStock: 1, score: { $meta: "textScore" }, createdAt: -1 };
        } else {
          // No query → fall back to "popular" so the storefront still ranks
          // sensibly when search is opened cold.
          sortSpec = { outOfStock: 1, soldCount: -1, createdAt: -1 };
        }
    }

    // Out-of-stock flag is computed via a tiny projection step in the
    // aggregation pipeline so we can sort by it without writing it to the
    // document. Aggregation also gives us the category facet in one round.
    const aggMatch: Record<string, unknown> = filter;
    const pipeline: any[] = [
      { $match: aggMatch },
      { $addFields: { outOfStock: { $cond: [{ $lte: ["$countInStock", 0] }, 1, 0] } } },
    ];
    if (trimmedQ) {
      pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
    }
    pipeline.push(
      {
        $facet: {
          items: [
            { $sort: sortSpec },
            { $skip: skip },
            { $limit: lim },
            {
              $project: {
                outOfStock: 0,
                score: 0,
              },
            },
          ],
          totalCount: [{ $count: "total" }],
          categoryFacet: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ],
          priceBounds: [
            {
              $group: {
                _id: null,
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
              },
            },
          ],
        },
      },
    );

    const [agg] = await Product.aggregate(pipeline);
    const items = agg?.items ?? [];
    const total = agg?.totalCount?.[0]?.total ?? 0;

    // No-result fallback — if a query was provided but nothing matched, try
    // a relaxed search ignoring text but matching the same category, so the
    // client can show "did you mean / similar in {category}".
    let suggestions: any[] = [];
    if (trimmedQ && total === 0) {
      const relaxed: Record<string, unknown> = { ...PUBLIC_VISIBLE };
      if (category) relaxed.category = category;
      suggestions = await Product.find(relaxed)
        .sort({ soldCount: -1, createdAt: -1 })
        .limit(8)
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        pages: Math.ceil(total / lim),
        hasMore: skip + items.length < total,
        facets: {
          categories: agg?.categoryFacet ?? [],
          priceBounds: agg?.priceBounds?.[0] ?? { minPrice: 0, maxPrice: 0 },
        },
        suggestions,
        // Echo back the query so trending/log analytics can attribute it.
        query: trimmedQ,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Search failed" });
  } finally {
    // Fire-and-forget: log the term to the analytics collection if non-empty
    // so /trending-searches can rank popular terms. Failures here must not
    // affect the response.
    void (async () => {
      try {
        const term = String(req.query.q || "").trim().toLowerCase();
        if (!term || term.length < 2) return;
        await SearchLog.updateOne(
          { term },
          { $inc: { hits: 1 }, $set: { lastSearchedAt: new Date() } },
          { upsert: true },
        );
      } catch {
        /* analytics best-effort */
      }
    })();
  }
};

// @route GET /api/products/autocomplete?q=...
// Returns up to 8 product names whose name contains the query (case-
// insensitive). Uses regex against the name index so even partial typing
// like "shi" matches "Cotton Shirt".
export const autocompleteProducts = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q || q.length < 1) {
      return res.json({ success: true, data: [] });
    }
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "i");
    const items = await Product.find(
      { ...PUBLIC_VISIBLE, name: re },
      { name: 1, image: 1, images: 1, price: 1, category: 1 },
    )
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(8)
      .lean();
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/products/trending-searches
// Top 10 search terms by hit count over the last 30 days. Used by the
// search page's empty state to show "what others are looking for".
export const getTrendingSearches = async (_req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 30 * 86400_000);
    const items = await SearchLog.find({ lastSearchedAt: { $gte: since } })
      .sort({ hits: -1, lastSearchedAt: -1 })
      .limit(10)
      .lean();
    res.json({
      success: true,
      data: items.map((i: any) => ({ term: i.term, hits: i.hits })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all products (public storefront)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    // Public storefront only sees products that are not POS-only and have
    // `showInStorefront` enabled.
    const products = await Product.find({
      $and: [
        { $or: [{ showInStorefront: { $ne: false } }, { showInStorefront: { $exists: false } }] },
        { $or: [{ salesChannel: { $ne: "pos" } }, { salesChannel: { $exists: false } }] },
      ],
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "name username profileImage bio followers following isSeller createdAt"
    );
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Resolve "Ships From" from the seller's default address (privacy: only province + district)
    let shipsFrom: { province: string; district: string } | null = null;
    try {
      const sellerId = (product.seller as any)?._id || product.seller;
      if (sellerId) {
        const sellerAddress =
          (await Address.findOne({ user: sellerId, isDefault: true })) ||
          (await Address.findOne({ user: sellerId }));
        if (sellerAddress) {
          shipsFrom = {
            province: sellerAddress.province || "",
            district: sellerAddress.district || "",
          };
        }
      }
    } catch {
      shipsFrom = null;
    }

    // Compute sold count from paid orders (count units, not orders)
    let soldCount = product.soldCount || 0;
    try {
      const sold = await Order.aggregate([
        { $match: { isPaid: true } },
        { $unwind: "$orderItems" },
        { $match: { "orderItems.product": product._id } },
        { $group: { _id: null, total: { $sum: "$orderItems.qty" } } },
      ]);
      soldCount = sold[0]?.total || soldCount;
    } catch {
      // keep stored soldCount
    }

    // Real seller stats — replaces the marketing-copy "Supplier Profile"
    // (98%/12y/25K+/42 countries) we used to render with hardcoded values.
    let sellerStats: {
      productsCount: number;
      ordersCount: number;
      followersCount: number;
      joinedAt: string | null;
    } = {
      productsCount: 0,
      ordersCount: 0,
      followersCount: 0,
      joinedAt: null,
    };
    try {
      const sellerObj = product.seller as any;
      const sellerId = sellerObj?._id || product.seller;
      if (sellerId) {
        const [productsCount, ordersAgg] = await Promise.all([
          Product.countDocuments({ seller: sellerId }),
          Order.aggregate([
            { $match: { isPaid: true } },
            { $unwind: "$orderItems" },
            { $match: { "orderItems.seller": sellerId } },
            { $group: { _id: "$_id" } },
            { $count: "total" },
          ]),
        ]);
        sellerStats = {
          productsCount,
          ordersCount: ordersAgg[0]?.total || 0,
          followersCount: Array.isArray(sellerObj?.followers) ? sellerObj.followers.length : 0,
          joinedAt: sellerObj?.createdAt ? new Date(sellerObj.createdAt).toISOString() : null,
        };
      }
    } catch {
      // keep zeros — stats are best-effort
    }

    const data = {
      ...product.toObject(),
      shipsFrom,
      soldCount,
      sellerStats,
    };

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Get seller products
// @route   GET /api/products/my
// @access  Private/Seller
export const getMyProducts = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const channel = typeof req.query.channel === "string" ? req.query.channel : null;
    const storefrontOnly = req.query.storefrontOnly === "true";
    const filter: Record<string, unknown> = { seller: req.user._id };
    if (channel === "web") {
      filter.$or = [{ salesChannel: "web" }, { salesChannel: "both" }, { salesChannel: { $exists: false } }];
    } else if (channel === "pos") {
      filter.$or = [{ salesChannel: "pos" }, { salesChannel: "both" }];
    }
    // When storefrontOnly is set, hide products the seller marked "store
    // only" so the seller's /me/me shop tab matches what public visitors see.
    if (storefrontOnly) {
      filter.$or = [
        { showInStorefront: { $ne: false } },
        { showInStorefront: { $exists: false } },
      ];
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Get products by seller id (public — for View Shop)
// @route   GET /api/products/seller/:sellerId
// @access  Public
export const getProductsBySeller = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({
      seller: req.params.sellerId,
      status: { $ne: "Archived" },
      // Public storefront — hide products the seller marked "store only".
      // Mirrors the rule used by the global GET /api/products listing so
      // /u/{sellerId} shows the same set as visitors see browsing the site.
      $and: [
        { $or: [{ showInStorefront: { $ne: false } }, { showInStorefront: { $exists: false } }] },
        { $or: [{ salesChannel: { $ne: "pos" } }, { salesChannel: { $exists: false } }] },
      ],
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Get advert images across active products (for Home page banners)
// @route   GET /api/products/adverts
// @access  Public
export const getProductAdverts = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find({
      status: "Active",
      advertImages: { $exists: true, $not: { $size: 0 } },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("name advertImages seller");

    const adverts = products.flatMap((p: any) =>
      (p.advertImages || []).map((url: string) => ({
        productId: p._id,
        name: p.name,
        image: url,
      }))
    );

    res.status(200).json({ success: true, data: adverts });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const toBool = (v: unknown, fallback = false): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v === "true";
  return fallback;
};

const buildProductPayload = (raw: Record<string, any>): Record<string, any> => {
  const parseMaybe = <T,>(value: unknown, fallback: T): T => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === "string") return safeJsonParse<T>(value, fallback);
    return value as T;
  };

  const body: Record<string, any> = {
    name: raw.name,
    description: raw.description ?? "",
    price: raw.price !== undefined ? Number(raw.price) : undefined,
    compareAt: raw.compareAt !== undefined && raw.compareAt !== ""
      ? Number(raw.compareAt)
      : undefined,
    cost: raw.cost !== undefined && raw.cost !== "" ? Number(raw.cost) : undefined,
    category: raw.category,
    countInStock: Number(raw.countInStock ?? raw.stock ?? 0),
    moq: raw.moq !== undefined && raw.moq !== "" ? Number(raw.moq) : 1,
    sku: raw.sku || "",
    barcode: raw.barcode || "",
    salesChannel: raw.salesChannel || "web",
    showInStorefront: raw.showInStorefront !== undefined ? toBool(raw.showInStorefront, true) : true,
    trackInventory: toBool(raw.trackInventory, true),
    allowOversell: toBool(raw.allowOversell, false),
    reorderAt: raw.reorderAt !== undefined && raw.reorderAt !== ""
      ? Number(raw.reorderAt)
      : 0,
    status: raw.status || "Draft",
    tags: parseMaybe<string[]>(raw.tags, []),
    vendor: raw.vendor || "",
    variantOptions: parseMaybe<Array<{ name: string; values: string[] }>>(
      raw.variantOptions,
      []
    ),
    attributes: parseMaybe<Record<string, unknown>>(raw.attributes, {}),
    tiers: parseMaybe<
      Array<{ minQty: number; price: number; discountPercent?: number }>
    >(raw.tiers, []),
    weight: raw.weight !== undefined && raw.weight !== "" ? Number(raw.weight) : undefined,
    weightUnit: raw.weightUnit || "g",
    dimensions: parseMaybe<Record<string, unknown>>(raw.dimensions, {}),
    originCountry: raw.originCountry || "",
    seoTitle: raw.seoTitle || "",
    seoDescription: raw.seoDescription || "",
    slug: raw.slug || "",
    channels: parseMaybe<Record<string, boolean>>(raw.channels, {}),
    allowCreators: toBool(raw.allowCreators, false),
    commissionType: raw.commissionType || "percent",
    commissionValue: raw.commissionValue !== undefined && raw.commissionValue !== ""
      ? Number(raw.commissionValue)
      : 0,
    minCreatorTier: raw.minCreatorTier || "all",
    cookieDays: raw.cookieDays !== undefined && raw.cookieDays !== ""
      ? Number(raw.cookieDays)
      : 30,
    location: raw.location || "Thailand",
    freeShipping: toBool(raw.freeShipping, false),
    specifications: parseMaybe<Array<{ label: string; value: string }>>(
      raw.specifications,
      []
    ),
    advertImages: parseMaybe<string[]>(raw.advertImages, []),
    leadTime: parseMaybe<{ min: number; max: number; unit: string }>(
      raw.leadTime,
      undefined as any
    ),
    returnPolicy: parseMaybe<{ accepts: boolean; days: number; notes: string }>(
      raw.returnPolicy,
      undefined as any
    ),
  };

  // Frontend uploads to R2 directly and sends back URLs in body.images.
  const finalImages = parseMaybe<string[]>(raw.images, []);
  if (finalImages.length) {
    body.images = finalImages;
    body.image = finalImages[0];
  }

  // Strip undefined keys so they don't overwrite existing values on update
  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

  return body;
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Seller
export const createProduct = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (!req.user.isSeller) {
      return res.status(403).json({
        success: false,
        message: "Only approved sellers can create products.",
      });
    }

    const body = buildProductPayload(req.body || {});

    if (!body.name || !body.category) {
      return res.status(400).json({
        success: false,
        message: "name and category are required",
      });
    }
    if (typeof body.price !== "number" || Number.isNaN(body.price)) {
      return res.status(400).json({ success: false, message: "price must be a number" });
    }
    if (!body.images?.length) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // Auto-generate barcode for POS products that don't have one
    if (
      (body.salesChannel === "pos" || body.salesChannel === "both") &&
      (!body.barcode || !body.barcode.trim())
    ) {
      // Generate 12-digit numeric code (compatible with Code 128 / EAN-13 input)
      let candidate = "";
      let attempts = 0;
      do {
        candidate = "";
        for (let i = 0; i < 12; i++) candidate += Math.floor(Math.random() * 10);
        const exists = await Product.findOne({ barcode: candidate });
        if (!exists) break;
        attempts++;
      } while (attempts < 5);
      body.barcode = candidate;
    }

    // POS products default to not visible in storefront unless seller opts in
    if (body.salesChannel === "pos" && body.showInStorefront === undefined) {
      body.showInStorefront = false;
    }

    const product = await Product.create({
      ...body,
      seller: req.user._id,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Seller (owner)
export const updateProduct = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.seller.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to edit this product" });
    }

    const body = buildProductPayload(req.body || {});

    // Don't let an empty payload wipe required fields
    if (body.price !== undefined && (typeof body.price !== "number" || Number.isNaN(body.price))) {
      return res.status(400).json({ success: false, message: "price must be a number" });
    }

    Object.assign(product, body);
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Seller
export const deleteProduct = async (req: IAuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Product removed" });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
