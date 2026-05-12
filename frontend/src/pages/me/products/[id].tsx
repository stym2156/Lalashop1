"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Save,
  Trash,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { productCategories } from "../opensho/constants";
import {
  CATEGORY_CONFIG,
  getCategoryConfig,
  type CategoryConfig,
} from "./categoryFields";
import { apiClient } from "@/services/apiClient";
import { uploadImage } from "@/services/uploadImage";

type ProductStatus = "Active" | "Draft" | "Archived";

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
  /** Cloudinary URL (already uploaded). */
  url?: string;
  /** Local file pending upload. */
  file?: File;
  preview: string;
}

const STATUS_OPTIONS: ProductStatus[] = ["Active", "Draft", "Archived"];

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white focus:outline-none transition-colors";

const SectionHeader = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="px-4 py-3 border-b border-gray-100">
    <h3 className="text-sm font-bold text-black">{title}</h3>
    {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
  </div>
);

const Field = ({
  label,
  children,
  optional,
  required,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
  required?: boolean;
}) => (
  <div className="space-y-1">
    <label className="text-[11px] font-semibold text-gray-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      {optional && <span className="ml-1 text-gray-400 font-normal">(optional)</span>}
    </label>
    {children}
  </div>
);

export default function MyProductDetailPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const productId = router.query.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProductStatus>("Draft");
  const [category, setCategory] = useState<string>(productCategories[0]?.value || "fashion");

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [advertImages, setAdvertImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const advertInputRef = useRef<HTMLInputElement>(null);

  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [stock, setStock] = useState("");

  const [moq, setMoq] = useState("");
  const [tiers, setTiers] = useState<TierPrice[]>([]);

  const [freeShipping, setFreeShipping] = useState(false);
  const [specifications, setSpecifications] = useState<SpecificationRow[]>([]);

  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const config: CategoryConfig = useMemo(() => getCategoryConfig(category), [category]);

  // Load product
  useEffect(() => {
    if (!productId) return;

    let me: any = null;
    try {
      me = JSON.parse(localStorage.getItem("userInfo") || "null");
    } catch {
      me = null;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await apiClient(`/products/${productId}`);
        const p = res?.data;
        if (!p) {
          setNotFound(true);
          return;
        }
        const sellerId = typeof p.seller === "string" ? p.seller : p.seller?._id;
        if (!me?._id || me._id !== sellerId) {
          setForbidden(true);
          return;
        }

        setName(p.name || "");
        setDescription(p.description || "");
        setStatus((p.status as ProductStatus) || "Draft");
        setCategory(p.category || productCategories[0]?.value || "fashion");

        const imgs: string[] = Array.isArray(p.images) && p.images.length
          ? p.images
          : Array.isArray(p.image)
          ? p.image
          : p.image
          ? [p.image]
          : [];
        setImages(imgs.map((url) => ({ id: newId(), url, preview: url })));

        const adverts: string[] = Array.isArray(p.advertImages) ? p.advertImages : [];
        setAdvertImages(adverts.map((url) => ({ id: newId(), url, preview: url })));

        setPrice(p.price !== undefined ? String(p.price) : "");
        setCompareAt(p.compareAt !== undefined && p.compareAt !== null ? String(p.compareAt) : "");
        setStock(p.countInStock !== undefined ? String(p.countInStock) : "");
        setMoq(p.moq !== undefined ? String(p.moq) : "");
        setFreeShipping(Boolean(p.freeShipping));

        setTiers(
          Array.isArray(p.tiers)
            ? p.tiers.map((t: any) => ({
                id: newId(),
                minQty: Number(t.minQty) || 0,
                price: t.price !== undefined ? String(t.price) : "",
                discountPercent:
                  t.discountPercent !== undefined ? String(t.discountPercent) : "",
              }))
            : []
        );

        setSpecifications(
          Array.isArray(p.specifications)
            ? p.specifications.map((s: any) => ({
                id: newId(),
                label: String(s.label || ""),
                value: String(s.value || ""),
              }))
            : []
        );

        setVariantOptions(
          Array.isArray(p.variantOptions)
            ? p.variantOptions.map((v: any) => ({
                id: newId(),
                name: String(v.name || ""),
                values: Array.isArray(v.values) ? v.values.map(String) : [],
              }))
            : []
        );
      } catch (e: any) {
        if (String(e?.message || "").toLowerCase().includes("not found")) {
          setNotFound(true);
        } else {
          setServerError(e?.message || "Failed to load product");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // Image helpers
  const handleFiles = (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<UploadedImage[]>>,
    cap: number
  ) => {
    if (!files) return;
    const next: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      next.push({ id: newId(), file, preview: URL.createObjectURL(file) });
    });
    setter((prev) => [...prev, ...next].slice(0, cap));
  };

  const removeImage = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<UploadedImage[]>>
  ) => {
    setter((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.file && found.preview.startsWith("blob:")) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const addTier = () =>
    setTiers((prev) => [
      ...prev,
      { id: newId(), minQty: 10, price: "", discountPercent: "" },
    ]);
  const removeTier = (id: string) => setTiers((prev) => prev.filter((t) => t.id !== id));
  const updateTier = (id: string, patch: Partial<TierPrice>) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const addSpec = () =>
    setSpecifications((prev) => [...prev, { id: newId(), label: "", value: "" }]);
  const removeSpec = (id: string) =>
    setSpecifications((prev) => prev.filter((s) => s.id !== id));
  const updateSpec = (id: string, patch: Partial<SpecificationRow>) =>
    setSpecifications((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

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
      })
    );

  const handleSave = async () => {
    setServerError(null);
    setSaved(false);
    if (!name.trim()) return setServerError(t("pages.productsAdd2.titleRequired"));
    if (!price || isNaN(Number(price))) return setServerError(t("pages.productsAdd2.priceRequired"));
    if (images.length === 0) return setServerError(t("pages.productsAdd2.addOneImage"));

    setSubmitting(true);
    try {
      const imageUrls = await Promise.all(
        images.map(async (img) => (img.url ? img.url : await uploadImage(img.file!, "products")))
      );
      const advertUrls = await Promise.all(
        advertImages.map(async (img) =>
          img.url ? img.url : await uploadImage(img.file!, "banners")
        )
      );

      const payload = {
        name,
        description,
        status,
        category,
        price: Number(price),
        compareAt: compareAt ? Number(compareAt) : undefined,
        countInStock: Number(stock || 0),
        moq: moq ? Number(moq) : 1,
        freeShipping,
        images: imageUrls,
        advertImages: advertUrls,
        tiers: tiers
          .filter((t) => t.price.trim() !== "" || t.discountPercent.trim() !== "")
          .map((t) => ({
            minQty: Number(t.minQty) || 0,
            price: Number(t.price) || 0,
            discountPercent: t.discountPercent ? Number(t.discountPercent) : 0,
          })),
        specifications: specifications
          .filter((s) => s.label.trim() && s.value.trim())
          .map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
        variantOptions: variantOptions
          .filter((v) => v.name.trim() && v.values.length > 0)
          .map((v) => ({ name: v.name, values: v.values })),
      };

      await apiClient(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSaved(true);
    } catch (e: any) {
      setServerError(e?.message || t("pages.productsAdd2.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("pages.productsAdd2.deletePermConfirm"))) return;
    try {
      await apiClient(`/products/${productId}`, { method: "DELETE" });
      router.push("/me/me");
    } catch (e: any) {
      alert(e?.message || t("pages.productsAdd2.deleteFailed"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        {t("pages.productsEdit.loading")}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 mx-auto flex items-center justify-center mb-4">
            <AlertCircle size={22} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t("pages.productsEdit.notFound")}</h2>
          <button
            onClick={() => router.push("/me/me")}
            className="mt-4 px-6 py-2.5 bg-primary text-white rounded-full text-xs font-bold tracking-widest"
          >
            {t("pages.productsEdit.backToMyShop")}
          </button>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
            <AlertCircle size={22} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t("pages.productsEdit.notYourProduct")}</h2>
          <p className="text-sm text-gray-500">
            {t("pages.productsEdit.onlyOwn")}
          </p>
          <button
            onClick={() => router.push(`/product/${productId}`)}
            className="mt-4 px-6 py-2.5 bg-primary text-white rounded-full text-xs font-bold tracking-widest"
          >
            {t("pages.productsEdit.viewPublicPage")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/me/me" className="text-gray-500 hover:text-black">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">{t("pages.productsEdit.title")}</h1>
              <p className="text-[11px] text-gray-400 truncate">
                {t("pages.productsEdit2.categoryTemplate", { label: config.label })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/product/${productId}`}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {t("pages.productsEdit.viewPublic")}
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100"
            >
              <Trash className="w-3.5 h-3.5" /> {t("pages.productsEdit.delete")}
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="inline-flex items-center gap-1 bg-primary text-white px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {submitting ? t("pages.productsAdd.saving") : t("pages.productsAdd2.saveChanges")}
            </button>
          </div>
        </div>
        {(serverError || saved) && (
          <div
            className={`text-xs px-4 py-2 text-center ${
              saved ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {saved ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={14} /> {t("pages.productsAdd2.changesSaved")}
              </span>
            ) : (
              serverError
            )}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">
            {/* General */}
            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader title={t("pages.productsAdd2.general")} />
              <div className="p-4 space-y-4">
                <Field label={t("pages.productsAdd2.fieldTitle")} required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label={t("pages.productsAdd2.fieldDescription")} optional>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className={`${inputCls} resize-y leading-relaxed`}
                  />
                </Field>
              </div>
            </div>
            {/* Media */}
            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader title={t("pages.productsAdd2.media")} hint={t("pages.productsEdit2.mediaUpTo8")} />
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
                          {t("pages.productsAdd2.cover")}
                        </span>
                      )}
                      <button
                        onClick={() => removeImage(img.id, setImages)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-md bg-gray-50 border border-dashed border-gray-200 hover:border-gray-300 flex flex-col items-center justify-center text-gray-500"
                    >
                      <ImagePlus className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-medium">{t("pages.productsAdd2.addImage")}</span>
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
                    handleFiles(e.target.files, setImages, 8);
                    if (e.target) e.target.value = "";
                  }}
                />
              </div>
            </div>

            {/* Pricing & stock */}
            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader title={t("pages.productsAdd2.pricingStock")} />
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label={t("pages.productsAdd2.fieldPrice")} required>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label={t("pages.productsAdd2.compareAt")} optional>
                  <input
                    type="number"
                    value={compareAt}
                    onChange={(e) => setCompareAt(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label={t("pages.productsAdd2.stockLabel")}>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            {/* Wholesale tiers */}
            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader title={t("pages.productsAdd2.wholesalePricing")} />
              <div className="p-4 space-y-3">
                <Field label="MOQ" optional>
                  <input
                    type="number"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className={`${inputCls} max-w-[160px]`}
                  />
                </Field>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-500 px-1">
                    <span className="col-span-3">{t("pages.productsAdd2.minQty")}</span>
                    <span className="col-span-5">{t("pages.productsAdd2.unitPrice")}</span>
                    <span className="col-span-3">{t("pages.productsAdd2.discountPct")}</span>
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
                      <input
                        type="number"
                        value={t.price}
                        onChange={(e) => updateTier(t.id, { price: e.target.value })}
                        className={`${inputCls} col-span-5`}
                        placeholder="0.00"
                      />
                      <input
                        type="number"
                        value={t.discountPercent}
                        onChange={(e) => updateTier(t.id, { discountPercent: e.target.value })}
                        className={`${inputCls} col-span-3`}
                        placeholder="%"
                      />
                      <button
                        onClick={() => removeTier(t.id)}
                        className="col-span-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addTier}
                    className="mt-2 inline-flex items-center text-[11px] font-semibold text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3 mr-1" /> {t("pages.productsAdd2.addTier")}
                  </button>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader title={t("pages.productsAdd2.specifications")} />
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-500 px-1">
                  <span className="col-span-4">{t("pages.productsAdd2.labelCol")}</span>
                  <span className="col-span-7">{t("pages.productsAdd2.valueCol")}</span>
                  <span className="col-span-1" />
                </div>
                {specifications.map((s) => (
                  <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={s.label}
                      onChange={(e) => updateSpec(s.id, { label: e.target.value })}
                      className={`${inputCls} col-span-4`}
                    />
                    <input
                      type="text"
                      value={s.value}
                      onChange={(e) => updateSpec(s.id, { value: e.target.value })}
                      className={`${inputCls} col-span-7`}
                    />
                    <button
                      onClick={() => removeSpec(s.id)}
                      className="col-span-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addSpec}
                  className="mt-2 inline-flex items-center text-[11px] font-semibold text-primary hover:underline"
                >
                  <Plus className="w-3 h-3 mr-1" /> {t("pages.productsAdd2.addSpec")}
                </button>
              </div>
            </div>

            {/* Variants */}
            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader
                title={t("pages.productsAdd2.variantsFor", { label: config.label })}
                hint={config.description}
              />
              <div className="p-4 space-y-3">
                {variantOptions.map((v, idx) => {
                  const seed = config.variantOptions[idx];
                  const suggestions = seed?.suggestions || [];
                  return (
                    <div key={v.id} className="rounded-md border border-gray-100 p-3 space-y-3">
                      <div className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-3">
                          <label className="text-[10px] font-semibold text-gray-500">
                            {t("pages.productsAdd2.optionName")}
                          </label>
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVariantOption(v.id, { name: e.target.value })}
                            placeholder={seed?.name || t("pages.productsAdd2.optionPlaceholder")}
                            className={`${inputCls} mt-1`}
                          />
                        </div>
                        <div className="col-span-8">
                          <label className="text-[10px] font-semibold text-gray-500">{t("pages.productsAdd2.valueCol")}s</label>
                          <div className="mt-1 flex flex-wrap gap-1.5 min-h-[34px] px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
                            {v.values.length === 0 && (
                              <span className="text-[11px] text-gray-400 px-1.5 py-1">
                                {t("pages.productsAdd2.tapSuggestions")}
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
                          className="col-span-1 text-gray-400 hover:text-red-600 mt-5"
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
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-primary"
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addVariantOption}
                  className="inline-flex items-center text-[11px] font-semibold text-primary hover:underline"
                >
                  <Plus className="w-3 h-3 mr-1" /> {t("pages.productsAdd2.addOption")}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader title={t("pages.productsAdd2.status")} />
              <div className="p-4 space-y-3">
                <Field label={t("pages.productsAdd2.visibility")}>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className={inputCls}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader title={t("pages.productsAdd2.organization")} />
              <div className="p-4 space-y-3">
                <Field label={t("pages.productsAdd2.category")} required>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputCls}
                  >
                    {productCategories.map((c) => {
                      const supported = !!CATEGORY_CONFIG[c.value];
                      return (
                        <option key={c.value} value={c.value}>
                          {c.label}
                          {supported ? "" : t("pages.productsAdd2.basicTemplate")}
                        </option>
                      );
                    })}
                  </select>
                </Field>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-gray-100">
              <SectionHeader title={t("pages.productsAdd2.shipping")} />
              <div className="p-4">
                <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(e) => setFreeShipping(e.target.checked)}
                    className="rounded mt-0.5"
                  />
                  <span>
                    <span className="font-semibold">{t("pages.productsAdd2.offerFreeShipping")}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">
                      {t("pages.productsAdd2.freeShippingDesc")}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
