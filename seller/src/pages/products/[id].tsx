import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Save, Trash2, ImagePlus, X, AlertCircle,
  CheckCircle2, Eye, EyeOff, Package, Star, ShoppingBag,
  Tag,
} from "lucide-react";
import {
  fetchProductById,
  updateMyProduct,
  deleteMyProduct,
  type SellerProductDetail,
} from "@/services/sellerApi";
import { uploadImage } from "@/services/uploadImage";
import { productCategories } from "./productCategories";

type ProductStatus = "Active" | "Draft" | "Archived";

// Legacy products may have been saved with the human label (e.g. "Electronics")
// before we standardised on `value` (e.g. "electronics"). Map a stored category
// to a known value so the dropdown still shows it as selected; if neither value
// nor label matches we just keep the raw string.
const resolveCategoryValue = (raw?: string): string => {
  if (!raw) return productCategories[0].value;
  const byValue = productCategories.find((c) => c.value === raw);
  if (byValue) return byValue.value;
  const byLabel = productCategories.find(
    (c) => c.label.toLowerCase() === raw.toLowerCase(),
  );
  if (byLabel) return byLabel.value;
  return raw;
};

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

interface ImageSlot {
  id: string;
  url: string; // existing R2 url (or blob: preview while uploading)
  uploading?: boolean;
  file?: File;
}

const newId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const toImageSlots = (urls: string[]): ImageSlot[] =>
  urls.filter(Boolean).map((url) => ({ id: newId(), url }));

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-100 focus:border-[#00aeff] focus:bg-white focus:outline-none transition-colors";

const ProductDetailPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation("common");
  const idParam = router.query.id;
  const id = typeof idParam === "string" ? idParam : null;

  const [product, setProduct] = useState<SellerProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("0");
  const [compareAt, setCompareAt] = useState("");
  const [stock, setStock] = useState("0");
  const [moq, setMoq] = useState("1");
  const [status, setStatus] = useState<ProductStatus>("Active");
  const [showInStorefront, setShowInStorefront] = useState(true);
  const [freeShipping, setFreeShipping] = useState(false);
  const [tagsCsv, setTagsCsv] = useState("");

  const [images, setImages] = useState<ImageSlot[]>([]);
  const [advertImages, setAdvertImages] = useState<ImageSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const advertInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchProductById(id);
      if (!p) {
        setError(t("pages.productDetail.errProductNotFound"));
        return;
      }
      setProduct(p);
      // Hydrate the form from the loaded product.
      setName(p.name || "");
      setDescription(p.description || "");
      setCategory(resolveCategoryValue(p.category));
      setPrice(String(p.price ?? 0));
      setCompareAt(p.compareAt ? String(p.compareAt) : "");
      setStock(String(p.countInStock ?? 0));
      setMoq(String(p.moq ?? 1));
      setStatus((p.status as ProductStatus) || "Active");
      setShowInStorefront(p.showInStorefront !== false);
      setFreeShipping(!!p.freeShipping);
      setTagsCsv((p.tags || []).join(", "));

      const imgs =
        p.images && p.images.length > 0
          ? p.images
          : Array.isArray(p.image)
          ? (p.image as string[])
          : typeof p.image === "string" && p.image
          ? [p.image]
          : [];
      setImages(toImageSlots(imgs));
      setAdvertImages(toImageSlots(p.advertImages || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.productDetail.errLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Upload new files via R2 presign and append as image slots.
  const handleAddImages = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "main" | "advert"
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const setSlots = target === "main" ? setImages : setAdvertImages;
    const max = target === "main" ? 8 : 4;

    setUploading(true);
    setError(null);
    try {
      // Optimistic placeholders so user sees them immediately.
      const placeholders: ImageSlot[] = files.map((file) => ({
        id: newId(),
        url: URL.createObjectURL(file),
        uploading: true,
        file,
      }));
      setSlots((prev) => [...prev, ...placeholders].slice(0, max));

      // Replace each placeholder with the real R2 URL one by one.
      for (const slot of placeholders) {
        if (!slot.file) continue;
        try {
          const url = await uploadImage(slot.file, target === "main" ? "products" : "banners");
          setSlots((prev) =>
            prev.map((s) => (s.id === slot.id ? { id: s.id, url } : s))
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : t("pages.productDetail.errUploadFailed"));
          // Remove the failed placeholder
          setSlots((prev) => prev.filter((s) => s.id !== slot.id));
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id: string, target: "main" | "advert") => {
    const setSlots = target === "main" ? setImages : setAdvertImages;
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    if (!id) return;
    if (!name.trim()) {
      setError(t("pages.productDetail.errNameRequired"));
      return;
    }
    if (images.some((s) => s.uploading)) {
      setError(t("pages.productDetail.errWaitUploads"));
      return;
    }
    if (images.length === 0) {
      setError(t("pages.productDetail.errImageRequired"));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const tags = tagsCsv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const imageUrls = images.map((s) => s.url);
      const advertUrls = advertImages.map((s) => s.url);

      const payload = {
        name: name.trim(),
        description,
        category,
        price: Number(price) || 0,
        compareAt: compareAt ? Number(compareAt) : 0,
        countInStock: Number(stock) || 0,
        moq: Number(moq) || 1,
        status,
        showInStorefront,
        freeShipping,
        tags,
        images: imageUrls,
        image: imageUrls[0],
        advertImages: advertUrls,
      };

      const updated = await updateMyProduct(id, payload);
      if (updated) {
        setProduct(updated);
        setSuccess(t("pages.productDetail.savedSuccessfully"));
        setTimeout(() => setSuccess(null), 2500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.productDetail.errSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !product) return;
    if (!window.confirm(t("pages.productDetail.deleteConfirm", { name: product.name })))
      return;
    setDeleting(true);
    try {
      await deleteMyProduct(id);
      void router.replace("/products/list");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.productDetail.errDeleteFailed"));
      setDeleting(false);
    }
  };

  const isPos = product?.salesChannel === "pos";

  const stats = useMemo(() => {
    if (!product) return null;
    return {
      rating: Number(product.rating ?? 0),
      numReviews: Number(product.numReviews ?? 0),
      soldCount: Number(product.soldCount ?? 0),
      created: product.createdAt
        ? new Date(product.createdAt).toLocaleDateString()
        : "—",
    };
  }, [product]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="space-y-3">
        <Link href="/products/list" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black">
          <ArrowLeft className="w-3.5 h-3.5" /> {t("pages.productDetail.backToProducts")}
        </Link>
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-4 text-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/products/list"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t("pages.productDetail.backToProducts")}
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="px-3 py-1.5 rounded-md text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 inline-flex items-center disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3 mr-1" /> {deleting ? t("pages.productDetail.deleting") : t("pages.productDetail.delete")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-[#00aeff] text-white px-4 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {saving ? t("pages.productDetail.saving") : t("pages.productDetail.saveChanges")}
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-lg border border-gray-100 p-4 bg-white flex items-start gap-4">
        <div className="w-16 h-16 rounded-md bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
          {images[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[16px] font-bold text-gray-900 truncate">{product.name}</h1>
            {isPos && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide bg-emerald-100 text-emerald-700">
                POS
              </span>
            )}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${
                product.showInStorefront !== false
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {product.showInStorefront !== false ? t("pages.productDetail.inStorefront") : t("pages.productDetail.hidden")}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {product._id}</p>
        </div>
        {stats && (
          <div className="hidden md:grid grid-cols-3 gap-3 text-right text-[10px] flex-shrink-0">
            <div>
              <p className="text-gray-400 inline-flex items-center gap-1 justify-end">
                <Star className="w-3 h-3" /> {t("pages.productDetail.rating")}
              </p>
              <p className="font-bold text-gray-900 tabular-nums">
                {stats.rating > 0 ? stats.rating.toFixed(1) : "—"}{" "}
                <span className="text-gray-400 font-normal">({stats.numReviews})</span>
              </p>
            </div>
            <div>
              <p className="text-gray-400 inline-flex items-center gap-1 justify-end">
                <ShoppingBag className="w-3 h-3" /> {t("pages.productDetail.sold")}
              </p>
              <p className="font-bold text-gray-900 tabular-nums">
                {stats.soldCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400">{t("pages.productDetail.created")}</p>
              <p className="font-bold text-gray-900">{stats.created}</p>
            </div>
          </div>
        )}
      </div>

      {/* Banners */}
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 inline-flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic info */}
          <Section title={t("pages.productDetail.basicInfo")}>
            <Field label={t("product.name")} required>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("pages.productDetail.productNamePlaceholder")}
              />
            </Field>
            <Field label={t("product.description")}>
              <textarea
                className={`${inputCls} resize-y`}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("pages.productDetail.descriptionPlaceholder")}
              />
              <p className="text-[10px] text-gray-400">{description.length} {t("common.characters")}</p>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label={t("product.category")} required>
                <select
                  className={inputCls}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {productCategories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {t(`pages.productCategories.${c.value}`)}
                    </option>
                  ))}
                  {/* Preserve legacy categories that don't match the canonical list */}
                  {category &&
                    !productCategories.some((c) => c.value === category) && (
                      <option value={category}>{category}</option>
                    )}
                </select>
              </Field>
              <Field label={t("pages.productDetail.tagsLabel")}>
                <input
                  className={inputCls}
                  value={tagsCsv}
                  onChange={(e) => setTagsCsv(e.target.value)}
                  placeholder={t("pages.productDetail.tagsPlaceholder")}
                />
              </Field>
            </div>
          </Section>

          {/* Images */}
          <Section title={t("product.images")} hint={t("pages.productDetail.imagesHint")}>
            <ImageGrid
              slots={images}
              max={8}
              onAdd={() => fileInputRef.current?.click()}
              onRemove={(id) => removeImage(id, "main")}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleAddImages(e, "main")}
            />
          </Section>

          {/* Advert banners */}
          <Section
            title={t("pages.productDetail.advertBanners")}
            hint={t("pages.productDetail.advertBannersHint")}
          >
            <ImageGrid
              slots={advertImages}
              max={4}
              aspect="aspect-[4/3]"
              onAdd={() => advertInputRef.current?.click()}
              onRemove={(id) => removeImage(id, "advert")}
            />
            <input
              ref={advertInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleAddImages(e, "advert")}
            />
          </Section>

          {/* Pricing & inventory */}
          <Section title={t("pages.productDetail.pricingInventory")}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label={t("pages.addProduct.priceLabel")} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
              <Field label={t("pages.productDetail.compareAt")} hint={t("pages.productDetail.compareAtHint")}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label={t("pages.productDetail.moq")}>
                <input
                  type="number"
                  min="1"
                  className={inputCls}
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                />
              </Field>
            </div>
            <Field label={t("pages.productDetail.stockQuantity")}>
              <input
                type="number"
                min="0"
                className={`${inputCls} max-w-[200px]`}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </Field>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Section title={t("pages.productDetail.status")}>
            <Field label={t("pages.productDetail.visibility")}>
              <select
                className={inputCls}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              >
                <option value="Active">{t("pages.productDetail.statusActive")}</option>
                <option value="Draft">{t("pages.productDetail.statusDraft")}</option>
                <option value="Archived">{t("pages.productDetail.statusArchived")}</option>
              </select>
            </Field>
            <ToggleRow
              icon={showInStorefront ? Eye : EyeOff}
              title={t("pages.productDetail.showOnStorefront")}
              desc={t("pages.productDetail.showOnStorefrontDesc")}
              checked={showInStorefront}
              onChange={setShowInStorefront}
            />
            <ToggleRow
              icon={Tag}
              title={t("pages.productDetail.freeShipping")}
              desc={t("pages.productDetail.freeShippingDesc")}
              checked={freeShipping}
              onChange={setFreeShipping}
            />
          </Section>

          {/* Read-only meta */}
          <Section title={t("pages.productDetail.meta")}>
            <Row label={t("pages.productDetail.salesChannel")} value={product.salesChannel || "web"} />
            {product.barcode && (
              <Row label={t("pages.productDetail.barcode")} value={product.barcode} mono />
            )}
            {product.sku && <Row label={t("pages.productDetail.skuLabel")} value={product.sku} mono />}
            <Row label={t("pages.productDetail.priceNow")} value={`฿${formatMoney(Number(price) || 0)}`} tone="text-[#00aeff] font-bold" />
            <Row label={t("product.stock")} value={t("pages.productDetail.stockUnits", { count: Number(stock) })} />
          </Section>
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, hint, children }) => (
  <div className="rounded-lg border border-gray-100 bg-white">
    <div className="px-4 py-3 border-b border-gray-100">
      <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
      {hint && <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, hint, required, children }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-bold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
    </div>
    {children}
  </div>
);

interface ToggleRowProps {
  icon: typeof Eye;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon: Icon, title, desc, checked, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-[12px] font-bold text-gray-900">{title}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-[#00aeff]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  </label>
);

interface RowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  tone?: string;
}

const Row: React.FC<RowProps> = ({ label, value, mono, tone }) => (
  <div className="flex items-center justify-between gap-2 py-1 border-b border-gray-50 last:border-b-0">
    <span className="text-gray-500 text-[11px]">{label}</span>
    <span className={`text-right text-gray-900 text-[12px] break-all ${mono ? "font-mono" : ""} ${tone || ""}`}>
      {value}
    </span>
  </div>
);

interface ImageGridProps {
  slots: ImageSlot[];
  max: number;
  aspect?: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ slots, max, aspect = "aspect-square", onAdd, onRemove }) => {
  const { t } = useTranslation("common");
  const coverLabel = t("pages.productDetail.cover");
  const addImageLabel = t("components.webProductForm.addImage");
  return (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {slots.map((slot, i) => (
      <div
        key={slot.id}
        className={`relative group ${aspect} rounded-md bg-gray-50 overflow-hidden border border-gray-100`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slot.url} alt="" className="w-full h-full object-cover" />
        {i === 0 && (
          <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
            {coverLabel}
          </span>
        )}
        {slot.uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
        )}
        <button
          type="button"
          onClick={() => onRemove(slot.id)}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
    {slots.length < max && (
      <button
        type="button"
        onClick={onAdd}
        className={`${aspect} rounded-md bg-gray-50 border border-dashed border-gray-200 hover:border-[#00aeff] hover:bg-blue-50/30 transition-colors flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#00aeff]`}
      >
        <ImagePlus className="w-5 h-5" />
        <span className="text-[10px] font-bold tracking-wide">{addImageLabel}</span>
      </button>
    )}
  </div>
  );
};

export default ProductDetailPage;
