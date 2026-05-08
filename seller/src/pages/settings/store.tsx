import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
import {
  fetchShopSettings,
  updateShopGeneral,
  type ShopGeneral,
} from "@/services/sellerApi";
import { uploadImage } from "@/services/uploadImage";
import { productCategories } from "../products/productCategories";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "th", label: "ไทย (Thai)" },
  { code: "lo", label: "ລາວ (Lao)" },
];

const CURRENCIES = [
  { code: "THB", label: "Thai Baht (฿)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "LAK", label: "Lao Kip (₭)" },
];

const initial: ShopGeneral = {
  storeName: "",
  storeSlug: "",
  tagline: "",
  description: "",
  logo: "",
  banner: "",
  category: productCategories[0].value,
  language: "en",
  currency: "THB",
};

const StoreSettings: React.FC = () => {
  const [form, setForm] = useState<ShopGeneral>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchShopSettings()
      .then((doc) => {
        if (cancelled || !doc) return;
        setForm({ ...initial, ...doc.general });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (field === "logo") setUploadingLogo(true);
    else setUploadingBanner(true);
    try {
      const url = await uploadImage(file, "profile");
      setForm((prev) => ({ ...prev, [field]: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (field === "logo") setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateShopGeneral(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">Store settings</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Public-facing identifiers and copy for your storefront.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#00aeff] text-white px-4 py-2 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db] disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 inline-flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully
        </div>
      )}

      <Section title="Brand identity" hint="Logo, banner, and how customers find your store.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Store name" required>
            <input
              className={inputCls}
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              placeholder="Lala Premium Co."
            />
          </Field>
          <Field label="Store URL handle" hint="lalashop.com/shop/[slug]">
            <input
              className={`${inputCls} font-mono`}
              value={form.storeSlug}
              onChange={(e) =>
                setForm({ ...form, storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })
              }
              placeholder="lala-premium"
            />
          </Field>
        </div>

        <Field label="Tagline">
          <input
            className={inputCls}
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="Premium wholesale for boutique buyers"
          />
        </Field>

        <Field label="Description">
          <textarea
            className={`${inputCls} resize-y leading-relaxed`}
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Tell shoppers what makes your shop unique."
          />
          <p className="text-[10px] text-gray-400">{form.description.length} characters</p>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageField
            label="Logo"
            url={form.logo}
            uploading={uploadingLogo}
            onUpload={(e) => handleUpload(e, "logo")}
            onClear={() => setForm({ ...form, logo: "" })}
            aspect="aspect-square"
          />
          <ImageField
            label="Banner"
            url={form.banner}
            uploading={uploadingBanner}
            onUpload={(e) => handleUpload(e, "banner")}
            onClear={() => setForm({ ...form, banner: "" })}
            aspect="aspect-[4/1]"
          />
        </div>
      </Section>

      <Section title="Localization" hint="Default language and currency for new customers.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Primary category">
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {productCategories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
              {/* Preserve legacy categories not in the canonical list */}
              {form.category &&
                !productCategories.some((c) => c.value === form.category) && (
                  <option value={form.category}>{form.category}</option>
                )}
            </select>
          </Field>
          <Field label="Language">
            <select
              className={inputCls}
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Currency">
            <select
              className={inputCls}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>
    </div>
  );
};

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-100 focus:border-[#00aeff] focus:bg-white focus:outline-none transition-colors";

const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({
  title,
  hint,
  children,
}) => (
  <div className="rounded-lg bg-white border border-gray-100">
    <div className="px-4 py-3 border-b border-gray-100">
      <h3 className="text-sm font-bold text-black">{title}</h3>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
);

const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, required, children }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <label className="text-[11px] font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
    </div>
    {children}
  </div>
);

interface ImageFieldProps {
  label: string;
  url: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  aspect: string;
}

const ImageField: React.FC<ImageFieldProps> = ({ label, url, uploading, onUpload, onClear, aspect }) => (
  <Field label={label}>
    <div className={`${aspect} rounded-md bg-gray-50 border border-gray-100 overflow-hidden relative group`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <ImageIcon className="w-8 h-8" />
        </div>
      )}
      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-white text-xs font-bold">
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span className="inline-flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Upload
          </span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
      </label>
    </div>
    {url && (
      <button
        type="button"
        onClick={onClear}
        className="text-[10px] text-red-600 font-bold hover:underline mt-1"
      >
        Remove
      </button>
    )}
  </Field>
);

export default StoreSettings;
