import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Globe, Scan, ImagePlus, X, CheckCircle2, AlertCircle, Loader2,
  Printer, Download, Plug, Eye, EyeOff,
} from "lucide-react";
import { useCurrentSeller } from "@/services/useCurrentSeller";
import { usePrinter } from "@/services/usePrinter";
import { uploadImages } from "@/services/uploadImage";
import Barcode, { downloadBarcodeSvg, printBarcode } from "@/components/Barcode/Barcode";
import WebProductForm from "@/components/products/WebProductForm";
import { productCategories } from "./productCategories";

type Tab = "web" | "pos";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface CreatedPosProduct {
  _id: string;
  name: string;
  barcode: string;
  price: number;
}

const newId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-100 focus:border-[#00aeff] focus:bg-white focus:outline-none transition-colors";

const SectionHeader: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="px-4 py-3 border-b border-gray-100">
    <h3 className="text-sm font-bold text-black">{title}</h3>
    {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
  </div>
);

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, hint, required, optional, children }) => {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
          {optional && <span className="ml-1 text-gray-400 font-normal">{t("common.optional")}</span>}
        </label>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
};


interface ImageUploaderProps {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  max?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, setImages, max = 8 }) => {
  const { t } = useTranslation("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null): void => {
    if (!files) return;
    const remaining = max - images.length;
    const accepted = Array.from(files).slice(0, remaining);
    const newImages: UploadedImage[] = accepted.map((file) => ({
      id: newId(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id: string): void => {
    setImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(img.id)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-wide">{t("pages.addProduct.imageSection") === "Image" ? "Add image" : t("components.webProductForm.addImage")}</span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-[10px] text-gray-400">
        {t("pages.addProduct.uploadHint", { max })}
      </p>
    </div>
  );
};

const AddProductPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const printer = usePrinter();

  const [tab, setTab] = useState<Tab>("web");
  const [posSubmitting, setPosSubmitting] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);

  // POS product state
  const [posName, setPosName] = useState("");
  const [posPrice, setPosPrice] = useState("");
  const [posStock, setPosStock] = useState("0");
  const [posBarcodeManual, setPosBarcodeManual] = useState("");
  const [posCategory, setPosCategory] = useState(productCategories[0].value);
  const [posShowInStorefront, setPosShowInStorefront] = useState(false);
  const [posImages, setPosImages] = useState<UploadedImage[]>([]);
  const [createdPos, setCreatedPos] = useState<CreatedPosProduct | null>(null);

  useEffect(() => {
    return () => {
      posImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPosProduct = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setPosError(null);
    setCreatedPos(null);
    if (!posName.trim()) return setPosError(t("pages.addProduct.errProductName"));
    if (!posPrice || Number(posPrice) <= 0) return setPosError(t("pages.addProduct.errPrice"));
    if (posImages.length === 0) return setPosError(t("pages.addProduct.errImage"));

    setPosSubmitting(true);
    try {
      // Upload images to Cloudflare R2 via the backend presign endpoint;
      // the API receives only the public URLs.
      const imageUrls = await uploadImages(posImages.map((img) => img.file), "products");

      const payload: Record<string, unknown> = {
        name: posName.trim(),
        category: posCategory,
        price: Number(posPrice),
        countInStock: Number(posStock),
        // "Also show on website" → sells in both channels (visible to web
        // shoppers AND scannable at the POS terminal). Otherwise pos-only.
        salesChannel: posShowInStorefront ? "both" : "pos",
        showInStorefront: posShowInStorefront,
        status: "Active",
        images: imageUrls,
      };
      if (posBarcodeManual.trim()) payload.barcode = posBarcodeManual.trim();

      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("pages.addProduct.errFailedCreate"));

      const created = data.data;
      setCreatedPos({
        _id: created._id,
        name: created.name,
        barcode: created.barcode || "",
        price: created.price,
      });
      setPosName("");
      setPosPrice("");
      setPosStock("0");
      setPosBarcodeManual("");
      posImages.forEach((img) => URL.revokeObjectURL(img.preview));
      setPosImages([]);
    } catch (err) {
      setPosError(err instanceof Error ? err.message : t("pages.addProduct.errFailedCreate"));
    } finally {
      setPosSubmitting(false);
    }
  };

  if (sellerLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t("actions.back")}
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-gray-900">{t("pages.addProduct.title")}</h1>
        {seller?.name && (
          <span className="text-[11px] text-gray-500">
            {t("pages.addProduct.addingTo", { name: seller.name })}
          </span>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("web")}
          className={`px-5 py-2.5 inline-flex items-center gap-2 text-[12px] font-bold transition-colors -mb-px ${
            tab === "web"
              ? "text-[#00aeff] border-b-2 border-[#00aeff]"
              : "text-gray-500 hover:text-black border-b-2 border-transparent"
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> {t("pages.addProduct.tabWeb")}
        </button>
        <button
          onClick={() => setTab("pos")}
          className={`px-5 py-2.5 inline-flex items-center gap-2 text-[12px] font-bold transition-colors -mb-px ${
            tab === "pos"
              ? "text-emerald-600 border-b-2 border-emerald-600"
              : "text-gray-500 hover:text-black border-b-2 border-transparent"
          }`}
        >
          <Scan className="w-3.5 h-3.5" /> {t("pages.addProduct.tabPos")}
        </button>
      </div>

      {tab === "web" && <WebProductForm />}

      {tab === "pos" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800">
            <strong className="font-bold">{t("pages.addProduct.posIntro")}</strong> {t("pages.addProduct.posIntroBody")} <strong>{t("pages.addProduct.notWithdrawable")}</strong> {t("pages.addProduct.notWithdrawableSuffix")}
          </div>

          {posError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{posError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <form onSubmit={submitPosProduct} className="space-y-4 lg:col-span-2">
            {/* Where to sell — tag selector at the top so the seller commits */}
            {/* to inventory-only vs also-on-web before filling in the rest. */}
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <SectionHeader
                title={t("pages.addProduct.whereToSell")}
                hint={t("pages.addProduct.whereToSellHint")}
              />
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPosShowInStorefront(false)}
                    className={`text-left rounded-lg border-2 px-4 py-3 transition-all ${
                      !posShowInStorefront
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <EyeOff
                        className={`w-4 h-4 ${
                          !posShowInStorefront ? "text-emerald-600" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-[12px] font-bold ${
                          !posShowInStorefront ? "text-emerald-900" : "text-gray-700"
                        }`}
                      >
                        {t("pages.addProduct.storeOnly")}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {t("pages.addProduct.storeOnlyDesc")}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosShowInStorefront(true)}
                    className={`text-left rounded-lg border-2 px-4 py-3 transition-all ${
                      posShowInStorefront
                        ? "border-[#00aeff] bg-[#00aeff]/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Eye
                        className={`w-4 h-4 ${
                          posShowInStorefront ? "text-[#00aeff]" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-[12px] font-bold ${
                          posShowInStorefront ? "text-[#00aeff]" : "text-gray-700"
                        }`}
                      >
                        {t("pages.addProduct.alsoOnWeb")}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {t("pages.addProduct.alsoOnWebDesc")}
                    </p>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <SectionHeader
                title={t("pages.addProduct.productDetails")}
                hint={t("pages.addProduct.productDetailsHint")}
              />
              <div className="p-4 space-y-4">
                <Field label={t("product.name")} required>
                  <input
                    className={inputCls}
                    value={posName}
                    onChange={(e) => setPosName(e.target.value)}
                    placeholder={t("pages.addProduct.productNamePlaceholder")}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={t("pages.addProduct.priceLabel")} required>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={posPrice}
                      onChange={(e) => setPosPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </Field>
                  <Field label={t("pages.addProduct.stockQuantity")}>
                    <input
                      type="number"
                      min="0"
                      className={inputCls}
                      value={posStock}
                      onChange={(e) => setPosStock(e.target.value)}
                    />
                  </Field>
                  <Field label={t("pages.addProduct.category")}>
                    <select
                      className={inputCls}
                      value={posCategory}
                      onChange={(e) => setPosCategory(e.target.value)}
                    >
                      {productCategories.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field
                  label={t("pages.addProduct.existingBarcode")}
                  optional
                  hint={t("pages.addProduct.existingBarcodeHint")}
                >
                  <div className="relative">
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      className={`${inputCls} font-mono pl-9`}
                      value={posBarcodeManual}
                      onChange={(e) => setPosBarcodeManual(e.target.value)}
                      placeholder={t("pages.addProduct.barcodePlaceholder")}
                    />
                  </div>
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <SectionHeader title={t("pages.addProduct.imageSection")} hint={t("pages.addProduct.imageSectionHint")} />
              <div className="p-4">
                <ImageUploader images={posImages} setImages={setPosImages} max={4} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={posSubmitting}
                className="px-4 py-2 rounded-md text-[12px] font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {t("actions.cancel")}
              </button>
              <button
                type="submit"
                disabled={posSubmitting}
                className="bg-emerald-600 text-white px-5 py-2 rounded-md text-[12px] font-bold inline-flex items-center hover:bg-emerald-700 disabled:opacity-50"
              >
                {posSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Scan className="w-3.5 h-3.5 mr-1.5" />}
                {posSubmitting ? t("pages.addProduct.saving") : t("pages.addProduct.saveAndGenerate")}
              </button>
            </div>
          </form>

            <aside className="lg:col-span-1 lg:sticky lg:top-4">
              {createdPos ? (
                <PosCreatedCard
                  created={createdPos}
                  printerAvailable={printer.available}
                  printerConnected={printer.connected}
                  printerConnecting={printer.connecting}
                  connectPrinter={printer.connect}
                  onDone={() => setCreatedPos(null)}
                  onGoToTerminal={() => router.push("/pos/terminal")}
                />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                  <Scan className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[12px] font-bold text-gray-700">{t("pages.addProduct.barcodePreview")}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    {t("pages.addProduct.barcodePreviewHint")}
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

interface PosCreatedCardProps {
  created: CreatedPosProduct;
  printerAvailable: boolean;
  printerConnected: boolean;
  printerConnecting: boolean;
  connectPrinter: () => Promise<void>;
  onDone: () => void;
  onGoToTerminal: () => void;
}

const PosCreatedCard: React.FC<PosCreatedCardProps> = ({
  created,
  printerAvailable,
  printerConnected,
  printerConnecting,
  connectPrinter,
  onDone,
  onGoToTerminal,
}) => {
  const { t } = useTranslation("common");
  return (
    <div className="rounded-2xl  from-emerald-50 to-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-[14px] font-black text-emerald-900">{t("pages.addProduct.productCreated")}</h3>
        </div>
        <button
          onClick={onDone}
          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
        >
          {t("actions.addAnother")}
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-4 bg-white rounded-xl  border-emerald-100">
        <p className="text-[12px] font-bold text-gray-900 mb-3">{created.name}</p>
        {created.barcode ? (
          <Barcode value={created.barcode} width={2} height={70} />
        ) : (
          <p className="text-[11px] text-gray-400 italic">{t("pages.addProduct.noBarcode")}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => downloadBarcodeSvg(created.barcode, `${created.name.replace(/\s+/g, "_")}.svg`)}
          disabled={!created.barcode}
          className="px-3 py-1.5 rounded-md text-[11px] font-bold text-emerald-700 bg-white  border-emerald-200 hover:bg-emerald-50 inline-flex items-center disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" /> {t("pages.addProduct.downloadSvg")}
        </button>

        {!printerAvailable ? (
          <span className="px-3 py-1.5 text-[11px] text-gray-500 bg-gray-100 rounded-md inline-flex items-center">
            <Plug className="w-3.5 h-3.5 mr-1.5" /> {t("pages.addProduct.webUsbNotSupported")}
          </span>
        ) : !printerConnected ? (
          <button
            onClick={connectPrinter}
            disabled={printerConnecting}
            className="px-3 py-1.5 rounded-md text-[11px] font-bold text-amber-700   inline-flex items-center disabled:opacity-50"
          >
            {printerConnecting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plug className="w-3.5 h-3.5 mr-1.5" />}
            {printerConnecting ? t("pages.addProduct.connectingPrinter") : t("pages.addProduct.connectPrinter")}
          </button>
        ) : (
          <button
            onClick={() => printBarcode(created.barcode, created.name)}
            disabled={!created.barcode}
            className="px-3 py-1.5 rounded-md text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 inline-flex items-center disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> {t("pages.addProduct.printSticker")}
          </button>
        )}

        <button
          onClick={onGoToTerminal}
          className="ml-auto px-3 py-1.5 rounded-md text-[11px] font-bold text-gray-700 hover:bg-gray-100 inline-flex items-center"
        >
          {t("pages.addProduct.goToTerminal")} →
        </button>
      </div>

      <p className="text-[11px] text-emerald-800 leading-relaxed">
        {t("pages.addProduct.printerInfo")}
      </p>
    </div>
  );
};

export default AddProductPage;
