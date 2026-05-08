import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  ImagePlus, Upload, X, Plus, Trash2, ChevronDown, Eye, EyeOff,
  HelpCircle, CheckCircle2, Tag,
} from "lucide-react";
import { productCategories } from "@/pages/products/productCategories";
import {
  CATEGORY_CONFIG,
  getCategoryConfig,
  type CategoryConfig,
} from "@/pages/products/categoryFields";
import { uploadImage } from "@/services/uploadImage";

type ProductStatus = "Active" | "Draft" | "Archived";
type CommissionType = "percent" | "fixed";
type CreatorTier = "all" | "bronze" | "silver" | "gold";

interface TierPrice {
  id: string;
  minQty: number;
  price: string;
  discountPercent: string;
}

interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

interface SpecificationRow {
  id: string;
  label: string;
  value: string;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploadedUrl?: string;
}

const CREATOR_TIERS: { value: CreatorTier; label: string }[] = [
  { value: "all", label: "All approved creators" },
  { value: "bronze", label: "Bronze and above" },
  { value: "silver", label: "Silver and above" },
  { value: "gold", label: "Gold only" },
];

const COUNTRIES = ["Laos", "Thailand", "England", "China", "Japan", "Korea"];
const WEIGHT_UNITS = ["g", "kg", "lb", "oz"];
const DIMENSION_UNITS = ["cm", "in"];
const STATUS_OPTIONS: ProductStatus[] = ["Active", "Draft", "Archived"];

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-100 focus:border-[#00aeff] focus:bg-white focus:outline-none transition-colors";

const SectionHeader = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="px-4 py-3 border-b border-gray-100">
    <h3 className="text-sm font-bold text-black">{title}</h3>
    {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
  </div>
);

const Field = ({
  label, hint, children, optional, required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  optional?: boolean;
  required?: boolean;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
        {optional && <span className="ml-1 text-gray-400 font-normal">(optional)</span>}
      </label>
      {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
    </div>
    {children}
  </div>
);

const newId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

interface WebProductFormProps {
  onSuccess?: (productId: string) => void;
}

const WebProductForm: React.FC<WebProductFormProps> = ({ onSuccess }) => {
  const router = useRouter();

  // General
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProductStatus>("Draft");
  const [category, setCategory] = useState<string>(productCategories[0]?.value || "fashion");
  const [vendor, setVendor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [advertImages, setAdvertImages] = useState<UploadedImage[]>([]);
  const advertInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [freeShipping, setFreeShipping] = useState(false);

  const [specifications, setSpecifications] = useState<SpecificationRow[]>([
    { id: "spec-1", label: "Material", value: "" },
    { id: "spec-2", label: "Warranty", value: "" },
  ]);

  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [cost, setCost] = useState("");
  const [chargeTax, setChargeTax] = useState(true);

  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [allowOversell, setAllowOversell] = useState(false);
  const [stock, setStock] = useState("");
  const [reorderAt, setReorderAt] = useState("");

  const [moq, setMoq] = useState("");
  const [tiers, setTiers] = useState<TierPrice[]>([
    { id: "t1", minQty: 10, price: "", discountPercent: "" },
    { id: "t2", minQty: 50, price: "", discountPercent: "" },
  ]);

  const [allowCreators, setAllowCreators] = useState(false);
  const [commissionType, setCommissionType] = useState<CommissionType>("percent");
  const [commissionValue, setCommissionValue] = useState("");
  const [minTier, setMinTier] = useState<CreatorTier>("all");
  const [cookieDays, setCookieDays] = useState("30");

  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const seededCategoryRef = useRef<string | null>(null);

  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("g");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [dimUnit, setDimUnit] = useState("cm");
  const [originCountry, setOriginCountry] = useState("Laos");

  const [leadTimeMin, setLeadTimeMin] = useState("3");
  const [leadTimeMax, setLeadTimeMax] = useState("7");
  const [leadTimeUnit, setLeadTimeUnit] = useState<"hours" | "days" | "weeks">("days");

  const [returnAccepts, setReturnAccepts] = useState(true);
  const [returnDays, setReturnDays] = useState("7");
  const [returnNotes, setReturnNotes] = useState("");

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [slug, setSlug] = useState("");

  const [channels, setChannels] = useState({
    storefront: true,
    tiktok: true,
    facebook: false,
    instagram: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const config: CategoryConfig = useMemo(() => getCategoryConfig(category), [category]);

  useEffect(() => {
    if (seededCategoryRef.current === category) return;
    seededCategoryRef.current = category;

    setVariantOptions(
      config.variantOptions.map((axis) => ({
        id: newId(),
        name: axis.name,
        values: [],
      })),
    );
    setAttributes((prev) => {
      const next: Record<string, string> = {};
      config.attributes.forEach((attr) => {
        next[attr.key] = prev[attr.key] || "";
      });
      return next;
    });
  }, [category, config]);

  const profit = useMemo(() => {
    const p = parseFloat(price) || 0;
    const c = parseFloat(cost) || 0;
    return p - c;
  }, [price, cost]);

  const margin = useMemo(() => {
    const p = parseFloat(price) || 0;
    const c = parseFloat(cost) || 0;
    if (p <= 0) return 0;
    return ((p - c) / p) * 100;
  }, [price, cost]);

  const commissionPerSale = useMemo(() => {
    const v = parseFloat(commissionValue) || 0;
    const p = parseFloat(price) || 0;
    if (commissionType === "percent") return (p * v) / 100;
    return v;
  }, [commissionType, commissionValue, price]);

  const sellerNet = useMemo(
    () => Math.max(0, (parseFloat(price) || 0) - commissionPerSale),
    [price, commissionPerSale],
  );

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      next.push({
        id: newId(),
        file,
        preview: URL.createObjectURL(file),
      });
    });
    setImages((prev) => [...prev, ...next].slice(0, 8));
  };
  const removeImage = (id: string) => {
    setImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.preview?.startsWith("blob:")) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleAdvertFiles = (files: FileList | null) => {
    if (!files) return;
    const next: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      next.push({
        id: newId(),
        file,
        preview: URL.createObjectURL(file),
      });
    });
    setAdvertImages((prev) => [...prev, ...next].slice(0, 4));
  };
  const removeAdvert = (id: string) => {
    setAdvertImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.preview?.startsWith("blob:")) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const addSpecification = () =>
    setSpecifications((prev) => [...prev, { id: newId(), label: "", value: "" }]);
  const removeSpecification = (id: string) =>
    setSpecifications((prev) => prev.filter((s) => s.id !== id));
  const updateSpecification = (id: string, patch: Partial<SpecificationRow>) =>
    setSpecifications((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const nextMin = last ? last.minQty * 2 : 10;
    setTiers((prev) => [
      ...prev,
      { id: newId(), minQty: nextMin, price: "", discountPercent: "" },
    ]);
  };
  const removeTier = (id: string) => setTiers((prev) => prev.filter((t) => t.id !== id));
  const updateTier = (id: string, patch: Partial<TierPrice>) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const addVariantOption = () =>
    setVariantOptions((prev) => [...prev, { id: newId(), name: "", values: [] }]);
  const removeVariantOption = (id: string) =>
    setVariantOptions((prev) => prev.filter((v) => v.id !== id));
  const updateVariantOption = (id: string, patch: Partial<VariantOption>) =>
    setVariantOptions((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const toggleVariantValue = (id: string, value: string) =>
    setVariantOptions((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const has = v.values.includes(value);
        return {
          ...v,
          values: has ? v.values.filter((x) => x !== value) : [...v.values, value],
        };
      }),
    );

  const addCustomVariantValue = (id: string, raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setVariantOptions((prev) =>
      prev.map((v) =>
        v.id === id && !v.values.includes(value) ? { ...v, values: [...v.values, value] } : v,
      ),
    );
  };

  const updateAttribute = (key: string, value: string) =>
    setAttributes((prev) => ({ ...prev, [key]: value }));

  const handlePublish = async (statusOverride?: ProductStatus) => {
    setSubmitError(null);

    if (!name.trim()) return setSubmitError("Title is required.");
    if (!price || isNaN(Number(price))) return setSubmitError("Price is required.");
    if (images.length === 0) return setSubmitError("Add at least one product image.");

    const finalStatus = statusOverride || status;

    setSubmitting(true);
    try {
      const imageUrls = await Promise.all(
        images.map(async (img) =>
          img.uploadedUrl ? img.uploadedUrl : await uploadImage(img.file, "products")
        )
      );

      const advertUrls = await Promise.all(
        advertImages.map(async (img) =>
          img.uploadedUrl ? img.uploadedUrl : await uploadImage(img.file, "banners")
        )
      );

      const payload: Record<string, unknown> = {
        name,
        description,
        status: finalStatus,
        category,
        vendor,
        tags,
        price: Number(price),
        compareAt: compareAt ? Number(compareAt) : undefined,
        cost: cost ? Number(cost) : undefined,
        sku,
        barcode,
        trackInventory,
        allowOversell,
        countInStock: Number(stock || 0),
        reorderAt: reorderAt ? Number(reorderAt) : 0,
        moq: moq ? Number(moq) : 1,
        tiers: tiers
          .filter((t) => t.price.trim() !== "" || t.discountPercent.trim() !== "")
          .map((t) => ({
            minQty: Number(t.minQty) || 0,
            price: Number(t.price) || 0,
            discountPercent: t.discountPercent ? Number(t.discountPercent) : 0,
          })),
        allowCreators,
        commissionType,
        commissionValue: commissionValue ? Number(commissionValue) : 0,
        minCreatorTier: minTier,
        cookieDays: Number(cookieDays) || 30,
        variantOptions: variantOptions
          .filter((v) => v.name.trim() && v.values.length > 0)
          .map((v) => ({ name: v.name, values: v.values })),
        attributes,
        weight: weight ? Number(weight) : undefined,
        weightUnit,
        dimensions: {
          length: length ? Number(length) : undefined,
          width: width ? Number(width) : undefined,
          height: height ? Number(height) : undefined,
          unit: dimUnit,
        },
        originCountry,
        leadTime: {
          min: Number(leadTimeMin) || 0,
          max: Number(leadTimeMax) || Number(leadTimeMin) || 0,
          unit: leadTimeUnit,
        },
        returnPolicy: {
          accepts: returnAccepts,
          days: returnAccepts ? Number(returnDays) || 0 : 0,
          notes: returnNotes.trim(),
        },
        seoTitle,
        seoDescription: seoDesc,
        slug,
        channels,
        freeShipping,
        salesChannel: "web",
        showInStorefront: true,
        specifications: specifications
          .filter((s) => s.label.trim() && s.value.trim())
          .map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
        advertImages: advertUrls,
        images: imageUrls,
      };

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          ...(token && token !== "null" && token !== "undefined"
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to publish product");

      setSuccessId(data?.data?._id || "ok");
      onSuccess?.(data?.data?._id || "");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to publish product");
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div className="min-h-[400px] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Product saved</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your product is now in your store as <strong>{status}</strong>.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/products/list")}
              className="px-6 py-2.5 bg-[#00aeff] text-white rounded-full text-xs font-bold tracking-widest"
            >
              View my products
            </button>
            <button
              onClick={() => {
                setSuccessId(null);
                setName("");
                setDescription("");
                setPrice("");
                setStock("");
                setImages([]);
              }}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-full text-xs font-bold tracking-widest"
            >
              Add another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {submitError && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-xs px-4 py-2 rounded-md mb-3">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* General */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="General"
              hint="Basic info shown on the product page and search results."
            />
            <div className="p-4 space-y-4">
              <Field label="Title" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Premium Linen Oversized Shirt"
                  className={inputCls}
                />
              </Field>
              <Field label="Description" optional>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe the product. Include materials, fit, sizing, and unique selling points."
                  className={`${inputCls} resize-y leading-relaxed`}
                />
                <p className="text-[10px] text-gray-400">
                  {description.length} characters · plain text supported.
                </p>
              </Field>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="Media"
              hint="Upload up to 8 photos. The first image is used as the cover."
            />
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    className="relative group aspect-square rounded-md bg-gray-50 overflow-hidden border border-gray-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/70 text-white">
                        Cover
                      </span>
                    )}
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 8 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-md bg-gray-50 border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-100 flex flex-col items-center justify-center text-gray-500"
                  >
                    <ImagePlus className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-medium">Add image</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  if (e.target) e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center text-[11px] font-semibold text-gray-700 hover:text-black"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload from computer
              </button>
            </div>
          </div>

          {/* Advert images */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="Advertising images"
              hint="Up to 4 banner-style images shown on the home page promo strip."
            />
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {advertImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative group aspect-[4/3] rounded-md bg-gray-50 overflow-hidden border border-gray-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeAdvert(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {advertImages.length < 4 && (
                  <button
                    onClick={() => advertInputRef.current?.click()}
                    className="aspect-[4/3] rounded-md bg-gray-50 border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-100 flex flex-col items-center justify-center text-gray-500"
                  >
                    <ImagePlus className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-medium">Add banner</span>
                  </button>
                )}
              </div>
              <input
                ref={advertInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleAdvertFiles(e.target.files);
                  if (e.target) e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader title="Pricing" />
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Price" required>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">฿</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className={`${inputCls} pl-6`}
                    />
                  </div>
                </Field>
                <Field label="Compare-at price" hint="Strike-through" optional>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">฿</span>
                    <input
                      type="number"
                      value={compareAt}
                      onChange={(e) => setCompareAt(e.target.value)}
                      placeholder="0.00"
                      className={`${inputCls} pl-6`}
                    />
                  </div>
                </Field>
                <Field label="Cost per item" hint="Internal" optional>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">฿</span>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      className={`${inputCls} pl-6`}
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3 px-3 py-2 rounded-md bg-gray-50 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Profit</span>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    ฿{profit.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Margin</span>
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {margin.toFixed(1)}%
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={chargeTax}
                  onChange={(e) => setChargeTax(e.target.checked)}
                  className="rounded"
                />
                Charge VAT on this product
              </label>
            </div>
          </div>

          {/* Inventory */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader title="Inventory" />
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="SKU (Stock Keeping Unit)" optional>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. LSO-LSH-238"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="Barcode" hint="UPC/EAN/ISBN" optional>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="rounded"
                />
                Track quantity
              </label>

              {trackInventory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                  <Field label="Quantity on hand">
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Low stock threshold" hint="Triggers alert" optional>
                    <input
                      type="number"
                      value={reorderAt}
                      onChange={(e) => setReorderAt(e.target.value)}
                      placeholder="0"
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={allowOversell}
                  onChange={(e) => setAllowOversell(e.target.checked)}
                  className="rounded"
                />
                Continue selling when out of stock
              </label>
            </div>
          </div>

          {/* Wholesale */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="Wholesale pricing"
              hint="Set MOQ and tier pricing for B2B buyers."
            />
            <div className="p-4 space-y-4">
              <Field label="Minimum order quantity (MOQ)" optional>
                <input
                  type="number"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  placeholder="1"
                  className={`${inputCls} max-w-[160px]`}
                />
              </Field>
              <div>
                <p className="text-[11px] font-semibold text-gray-700 mb-2">Tier pricing</p>
                <p className="text-[11px] text-gray-500 mb-2">
                  Set bulk-buy thresholds. The tier price (or % discount off the base price) is
                  shown to buyers as a strike-through deal on the product page.
                </p>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-500 tracking-wide px-1">
                    <span className="col-span-3">Min qty</span>
                    <span className="col-span-5">Unit price</span>
                    <span className="col-span-3">Discount %</span>
                    <span className="col-span-1" />
                  </div>
                  {tiers.map((t) => (
                    <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="number"
                        value={t.minQty}
                        onChange={(e) => updateTier(t.id, { minQty: Number(e.target.value) })}
                        className={`${inputCls} col-span-3`}
                      />
                      <div className="relative col-span-5">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          ฿
                        </span>
                        <input
                          type="number"
                          value={t.price}
                          onChange={(e) => updateTier(t.id, { price: e.target.value })}
                          placeholder="0.00"
                          className={`${inputCls} pl-6`}
                        />
                      </div>
                      <div className="relative col-span-3">
                        <input
                          type="number"
                          value={t.discountPercent}
                          onChange={(e) => updateTier(t.id, { discountPercent: e.target.value })}
                          placeholder="0"
                          min="0"
                          max="100"
                          className={`${inputCls} pr-7`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          %
                        </span>
                      </div>
                      <button
                        onClick={() => removeTier(t.id)}
                        className="col-span-1 text-gray-400 hover:text-red-600 inline-flex justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addTier}
                  className="mt-2 inline-flex items-center text-[11px] font-semibold text-[#00aeff] hover:underline"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add tier
                </button>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="Specifications"
              hint="Key/value pairs (e.g. Material → 100% cotton). Shown on the Specifications tab of your product page."
            />
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-500 tracking-wide px-1">
                <span className="col-span-4">Label</span>
                <span className="col-span-7">Value</span>
                <span className="col-span-1" />
              </div>
              {specifications.map((s) => (
                <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => updateSpecification(s.id, { label: e.target.value })}
                    placeholder="e.g. Material"
                    className={`${inputCls} col-span-4`}
                  />
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => updateSpecification(s.id, { value: e.target.value })}
                    placeholder="e.g. Premium cotton"
                    className={`${inputCls} col-span-7`}
                  />
                  <button
                    onClick={() => removeSpecification(s.id)}
                    className="col-span-1 text-gray-400 hover:text-red-600 inline-flex justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addSpecification}
                className="mt-2 inline-flex items-center text-[11px] font-semibold text-[#00aeff] hover:underline"
              >
                <Plus className="w-3 h-3 mr-1" /> Add specification
              </button>
            </div>
          </div>

          {/* Variants */}
          <div className="rounded-lg bg-white border border-[#00aeff]/30 ring-1 ring-[#00aeff]/10">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-black flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[#00aeff]" /> Variants for {config.label}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{config.description}</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {variantOptions.length === 0 ? (
                <div className="rounded-md bg-gray-50 p-3 text-[11px] text-gray-500">
                  This category does not require variants. You can still add custom options if needed.
                </div>
              ) : (
                variantOptions.map((v, idx) => {
                  const seedAxis = config.variantOptions[idx];
                  const suggestions = seedAxis?.suggestions || [];
                  return (
                    <div key={v.id} className="rounded-md border border-gray-100 p-3 space-y-3">
                      <div className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-3">
                          <label className="text-[10px] font-semibold text-gray-500 tracking-wide">
                            Option name {seedAxis?.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVariantOption(v.id, { name: e.target.value })}
                            placeholder={seedAxis?.name || "e.g. Size"}
                            className={`${inputCls} mt-1`}
                          />
                        </div>
                        <div className="col-span-8">
                          <label className="text-[10px] font-semibold text-gray-500 tracking-wide">
                            Selected values
                          </label>
                          <div className="mt-1 flex flex-wrap gap-1.5 min-h-[34px] px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
                            {v.values.length === 0 && (
                              <span className="text-[11px] text-gray-400 px-1.5 py-1">
                                Tap suggestions or type your own.
                              </span>
                            )}
                            {v.values.map((val) => (
                              <span
                                key={val}
                                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-gray-200"
                              >
                                {val}
                                <button
                                  onClick={() => toggleVariantValue(v.id, val)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => removeVariantOption(v.id)}
                          className="col-span-1 text-gray-400 hover:text-red-600 mt-5 inline-flex justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions.map((s) => {
                            const active = v.values.includes(s);
                            return (
                              <button
                                key={s}
                                onClick={() => toggleVariantValue(v.id, s)}
                                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                                  active
                                    ? "bg-[#00aeff] text-white border-[#00aeff]"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-[#00aeff]"
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <CustomVariantInput onAdd={(value) => addCustomVariantValue(v.id, value)} />
                    </div>
                  );
                })
              )}
              <button
                onClick={addVariantOption}
                className="inline-flex items-center text-[11px] font-semibold text-[#00aeff] hover:underline"
              >
                <Plus className="w-3 h-3 mr-1" /> Add custom option
              </button>
            </div>
          </div>

          {/* Category attributes */}
          {config.attributes.length > 0 && (
            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader
                title={`${config.label} details`}
                hint="These descriptors appear on the product page so buyers know exactly what they're getting."
              />
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {config.attributes.map((attr) => (
                  <Field key={attr.key} label={attr.label} hint={attr.hint} optional={attr.optional}>
                    {attr.kind === "textarea" ? (
                      <textarea
                        value={attributes[attr.key] || ""}
                        onChange={(e) => updateAttribute(attr.key, e.target.value)}
                        placeholder={attr.placeholder}
                        rows={3}
                        className={`${inputCls} resize-y`}
                      />
                    ) : attr.kind === "select" && attr.options ? (
                      <div className="relative">
                        <select
                          value={attributes[attr.key] || ""}
                          onChange={(e) => updateAttribute(attr.key, e.target.value)}
                          className={`${inputCls} appearance-none pr-8`}
                        >
                          <option value="">Select…</option>
                          {attr.options.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type={attr.kind === "number" ? "number" : attr.kind === "date" ? "date" : "text"}
                        value={attributes[attr.key] || ""}
                        onChange={(e) => updateAttribute(attr.key, e.target.value)}
                        placeholder={attr.placeholder}
                        className={inputCls}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </div>
          )}

          {/* Creator affiliate */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="Creator affiliate program"
              hint="Let approved creators promote this product and earn commission on each verified sale."
            />
            <div className="p-4 space-y-4">
              <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCreators}
                  onChange={(e) => setAllowCreators(e.target.checked)}
                  className="rounded mt-0.5"
                />
                <span>
                  <span className="font-semibold">Allow creators to promote this product</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">
                    Creators add this product to their feed and you only pay commission on verified sales.
                  </span>
                </span>
              </label>

              {allowCreators && (
                <div className="space-y-4 pl-6 ml-2 border-l-2 border-gray-100 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Commission type">
                      <div className="inline-flex bg-gray-100 p-0.5 rounded-md w-full">
                        <button
                          type="button"
                          onClick={() => setCommissionType("percent")}
                          className={`flex-1 px-3 py-1.5 rounded text-[11px] font-semibold transition ${
                            commissionType === "percent"
                              ? "bg-white text-black shadow-sm"
                              : "text-gray-600 hover:text-black"
                          }`}
                        >
                          Percentage (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommissionType("fixed")}
                          className={`flex-1 px-3 py-1.5 rounded text-[11px] font-semibold transition ${
                            commissionType === "fixed"
                              ? "bg-white text-black shadow-sm"
                              : "text-gray-600 hover:text-black"
                          }`}
                        >
                          Fixed (฿)
                        </button>
                      </div>
                    </Field>

                    <Field
                      label={commissionType === "percent" ? "Commission rate" : "Commission amount"}
                      hint={commissionType === "percent" ? "Of selling price" : "Per unit sold"}
                    >
                      <div className="relative">
                        {commissionType === "fixed" && (
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            ฿
                          </span>
                        )}
                        <input
                          type="number"
                          value={commissionValue}
                          onChange={(e) => setCommissionValue(e.target.value)}
                          placeholder={commissionType === "percent" ? "10" : "0.00"}
                          step={commissionType === "percent" ? "0.5" : "0.01"}
                          min="0"
                          max={commissionType === "percent" ? "100" : undefined}
                          className={`${inputCls} ${commissionType === "fixed" ? "pl-6 pr-8" : "pr-8"}`}
                        />
                        {commissionType === "percent" && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            %
                          </span>
                        )}
                      </div>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Minimum creator tier" hint="Restricts who can promote">
                      <div className="relative">
                        <select
                          value={minTier}
                          onChange={(e) => setMinTier(e.target.value as CreatorTier)}
                          className={`${inputCls} appearance-none pr-8`}
                        >
                          {CREATOR_TIERS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </Field>

                    <Field label="Attribution window" hint="Days a click stays valid">
                      <div className="relative">
                        <input
                          type="number"
                          value={cookieDays}
                          onChange={(e) => setCookieDays(e.target.value)}
                          min="1"
                          max="90"
                          className={`${inputCls} pr-12`}
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          days
                        </span>
                      </div>
                    </Field>
                  </div>

                  <div className="rounded-md bg-gray-50 px-3 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Creator earns / sale</span>
                      <span className="font-semibold text-[#00aeff] tabular-nums">
                        ฿{commissionPerSale.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Your net / sale</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        ฿{sellerNet.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Effective rate</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {parseFloat(price) > 0
                          ? `${((commissionPerSale / parseFloat(price)) * 100).toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader title="Shipping" />
            <div className="p-4 space-y-4">
              <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                  className="rounded mt-0.5"
                />
                <span>
                  <span className="font-semibold">Offer free shipping</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">
                    A green &quot;Free shipping&quot; badge will appear on the product page.
                  </span>
                </span>
              </label>

              <Field label="Weight" optional>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.0"
                    className={`${inputCls} max-w-[160px]`}
                  />
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className={`${inputCls} max-w-[80px]`}
                  >
                    {WEIGHT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Package dimensions" hint="L × W × H" optional>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="L"
                    className={inputCls}
                  />
                  <span className="text-gray-400">×</span>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="W"
                    className={inputCls}
                  />
                  <span className="text-gray-400">×</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="H"
                    className={inputCls}
                  />
                  <select
                    value={dimUnit}
                    onChange={(e) => setDimUnit(e.target.value)}
                    className={`${inputCls} max-w-[80px]`}
                  >
                    {DIMENSION_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Country/region of origin" optional>
                <select
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  className={inputCls}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Lead time */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="Lead time"
              hint="How long after payment until you ship. Shown as 'Lead Time' on the product page."
            />
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <Field label="Minimum">
                    <input
                      type="number"
                      min="0"
                      value={leadTimeMin}
                      onChange={(e) => setLeadTimeMin(e.target.value)}
                      placeholder="3"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="col-span-1 text-center text-gray-400 pt-5">–</div>
                <div className="col-span-4">
                  <Field label="Maximum">
                    <input
                      type="number"
                      min="0"
                      value={leadTimeMax}
                      onChange={(e) => setLeadTimeMax(e.target.value)}
                      placeholder="7"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="col-span-3">
                  <Field label="Unit">
                    <select
                      value={leadTimeUnit}
                      onChange={(e) => setLeadTimeUnit(e.target.value as "hours" | "days" | "weeks")}
                      className={inputCls}
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Business days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </Field>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Buyers will see:{" "}
                <strong>
                  {leadTimeMin || "?"}–{leadTimeMax || "?"}{" "}
                  {leadTimeUnit === "days" ? "Business Days" : leadTimeUnit === "hours" ? "Hours" : "Weeks"}
                </strong>
              </p>
            </div>
          </div>

          {/* Returns */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="Returns"
              hint="Return window shown on the product page. Disable if you don't accept returns."
            />
            <div className="p-4 space-y-4">
              <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnAccepts}
                  onChange={(e) => setReturnAccepts(e.target.checked)}
                  className="rounded mt-0.5"
                />
                <span>
                  <span className="font-semibold">Accept returns on this product</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">
                    Buyers can request a return within the window below.
                  </span>
                </span>
              </label>

              {returnAccepts && (
                <div className="space-y-3 pl-6 ml-2 border-l-2 border-gray-100 pt-1">
                  <Field label="Return window (days)">
                    <input
                      type="number"
                      min="1"
                      value={returnDays}
                      onChange={(e) => setReturnDays(e.target.value)}
                      placeholder="7"
                      className={`${inputCls} max-w-[160px]`}
                    />
                  </Field>
                  <Field label="Conditions / notes" optional>
                    <textarea
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      rows={3}
                      placeholder="e.g. Item must be unopened and in original packaging."
                      className={`${inputCls} resize-y`}
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader
              title="Search engine listing"
              hint="How this product appears in Google and social shares."
            />
            <div className="p-4 space-y-4">
              <Field label="Page title" optional>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={name || "Premium product title"}
                  className={inputCls}
                />
                <p className="text-[10px] text-gray-400">{seoTitle.length}/70 characters</p>
              </Field>
              <Field label="Meta description" optional>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  rows={3}
                  placeholder="Short summary that appears on search results."
                  className={`${inputCls} resize-y`}
                />
                <p className="text-[10px] text-gray-400">{seoDesc.length}/160 characters</p>
              </Field>
              <Field label="URL handle" optional>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-md text-xs text-gray-500 font-mono bg-gray-100">
                    lalashop.com/products/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="premium-linen-shirt"
                    className={`${inputCls} rounded-l-none font-mono`}
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader title="Status" />
            <div className="p-4 space-y-3">
              <Field label="Visibility">
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className={`${inputCls} appearance-none pr-8`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </Field>
              <p className="flex items-start gap-1.5 text-[11px] text-gray-500">
                {status === "Active" ? (
                  <>
                    <Eye className="w-3 h-3 mt-0.5 text-green-600" /> Visible on storefront after publishing.
                  </>
                ) : status === "Draft" ? (
                  <>
                    <EyeOff className="w-3 h-3 mt-0.5 text-gray-400" /> Hidden until you publish.
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 mt-0.5 text-gray-400" /> Removed from all sales channels.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader title="Organization" />
            <div className="p-4 space-y-4">
              <Field label="Category" hint="Drives variants" required>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputCls} appearance-none pr-8`}
                  >
                    {productCategories.map((c) => {
                      const supported = !!CATEGORY_CONFIG[c.value];
                      return (
                        <option key={c.value} value={c.value}>
                          {c.label}
                          {supported ? "" : " (basic template)"}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Switching the category resets the variant template below.
                </p>
              </Field>

              <Field label="Vendor / Brand" optional>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Lala Premium"
                  className={inputCls}
                />
              </Field>

              <Field label="Tags" optional>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tag and press Enter"
                    className={inputCls}
                  />
                  <button
                    onClick={addTag}
                    className="px-2 py-1.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                      >
                        {t}
                        <button onClick={() => removeTag(t)} className="text-gray-400 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-gray-100">
            <SectionHeader title="Sales channels" />
            <div className="p-4 space-y-2">
              {(
                [
                  { key: "storefront", label: "Online storefront" },
                  { key: "tiktok", label: "TikTok Shop" },
                  { key: "facebook", label: "Facebook Shop" },
                  { key: "instagram", label: "Instagram Shop" },
                ] as { key: keyof typeof channels; label: string }[]
              ).map((c) => (
                <label key={c.key} className="flex items-center justify-between text-xs text-gray-700">
                  <span>{c.label}</span>
                  <input
                    type="checkbox"
                    checked={channels[c.key]}
                    onChange={(e) =>
                      setChannels((prev) => ({ ...prev, [c.key]: e.target.checked }))
                    }
                    className="rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-900">Need help with listings?</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Read our seller guide on writing titles, pricing for wholesale, and choosing the right variants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-6 mt-6 border-t border-gray-200">
        <button
          onClick={() => router.push("/products/list")}
          className="px-3 py-2 rounded-md text-xs font-medium text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={() => handlePublish("Draft")}
          disabled={submitting}
          className="px-4 py-2 rounded-md text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Save as draft
        </button>
        <button
          onClick={() => handlePublish("Active")}
          disabled={submitting}
          className="bg-[#00aeff] text-white px-5 py-2 rounded-md text-xs font-semibold hover:bg-[#0096db] disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Publish product"}
        </button>
      </div>
    </div>
  );
};

const CustomVariantInput = ({ onAdd }: { onAdd: (value: string) => void }) => {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(value);
            setValue("");
          }
        }}
        placeholder="Add custom value (press Enter)"
        className={`${inputCls} text-[11px]`}
      />
      <button
        type="button"
        onClick={() => {
          onAdd(value);
          setValue("");
        }}
        className="px-2 py-1.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 shrink-0"
      >
        Add
      </button>
    </div>
  );
};

export default WebProductForm;
