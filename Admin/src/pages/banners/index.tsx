import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus, Edit, Trash2, X, Save, Loader2, Upload, ImageIcon,
  ToggleLeft, ToggleRight, ExternalLink, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  fetchAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  type AdminBannerRow,
  type BannerPayload,
} from "@/services/adminApi";
import { uploadImage } from "@/services/uploadImage";

interface FormState {
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
}

const emptyForm = (): FormState => ({
  imageUrl: "",
  title: "",
  subtitle: "",
  linkUrl: "",
  displayOrder: 0,
  isActive: true,
});

export default function BannersPage() {
  const { t } = useTranslation("common");
  const [items, setItems] = useState<AdminBannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminBannerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminBanners();
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), displayOrder: items.length });
    setCreating(true);
  };

  const openEdit = (banner: AdminBannerRow) => {
    setCreating(false);
    setEditing(banner);
    setForm({
      imageUrl: banner.imageUrl,
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      linkUrl: banner.linkUrl || "",
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm());
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("pages.banners.imageOnly", "File must be an image"));
      return;
    }
    setUploadingImage(true);
    setError(null);
    try {
      const url = await uploadImage(file, "banners");
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.imageUrl) {
      setError(t("pages.banners.imageRequired", "Banner image is required"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: BannerPayload = {
        imageUrl: form.imageUrl,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        linkUrl: form.linkUrl.trim(),
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await updateAdminBanner(editing._id, payload);
      } else {
        await createAdminBanner(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: AdminBannerRow) => {
    setBusyId(banner._id);
    try {
      await updateAdminBanner(banner._id, { isActive: !banner.isActive });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const reorder = async (banner: AdminBannerRow, delta: -1 | 1) => {
    setBusyId(banner._id);
    try {
      await updateAdminBanner(banner._id, {
        displayOrder: Math.max(0, banner.displayOrder + delta),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (banner: AdminBannerRow) => {
    if (!confirm(t("pages.banners.confirmDelete", "Delete this banner?"))) return;
    setBusyId(banner._id);
    try {
      await deleteAdminBanner(banner._id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const formOpen = creating || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("pages.banners.title", "Hero Banners")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              "pages.banners.subtitle",
              "Manage the homepage carousel slides shown to customers."
            )}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Plus size={16} /> {t("pages.banners.add", "Add banner")}
        </button>
      </div>

      {error && !formOpen && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <ImageIcon className="mx-auto text-slate-300 mb-3" size={36} />
          <p className="text-sm font-bold text-slate-600">
            {t("pages.banners.empty", "No banners yet")}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "pages.banners.emptyHint",
              "Add the first banner to start showing it on the homepage."
            )}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {items.map((banner, idx) => (
            <div
              key={banner._id}
              className={`flex items-center gap-4 p-4 ${
                idx > 0 ? "border-t border-slate-100" : ""
              } ${!banner.isActive ? "opacity-60" : ""}`}
            >
              <div className="w-32 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.imageUrl}
                  alt={banner.title || ""}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {banner.title || (
                      <span className="text-slate-400 italic">
                        {t("pages.banners.untitled", "Untitled")}
                      </span>
                    )}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    #{banner.displayOrder}
                  </span>
                </div>
                {banner.subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {banner.subtitle}
                  </p>
                )}
                {banner.linkUrl && (
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline mt-1 inline-flex items-center gap-1 truncate max-w-full"
                  >
                    <ExternalLink size={11} /> {banner.linkUrl}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => reorder(banner, -1)}
                  disabled={busyId === banner._id || idx === 0}
                  title={t("pages.banners.moveUp", "Move up")}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => reorder(banner, 1)}
                  disabled={busyId === banner._id || idx === items.length - 1}
                  title={t("pages.banners.moveDown", "Move down")}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => toggleActive(banner)}
                  disabled={busyId === banner._id}
                  title={banner.isActive ? t("status.active") : t("status.inactive")}
                  className={`p-2 rounded-lg hover:bg-slate-100 ${
                    banner.isActive ? "text-emerald-500" : "text-slate-300"
                  }`}
                >
                  {banner.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => openEdit(banner)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                  title={t("actions.edit")}
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(banner)}
                  disabled={busyId === banner._id}
                  className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                  title={t("actions.delete")}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editing
                  ? t("pages.banners.edit", "Edit banner")
                  : t("pages.banners.add", "Add banner")}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {error}
                </div>
              )}

              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("pages.banners.image", "Image")} *
                </label>
                {form.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[16/6]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-white"
                    >
                      {uploadingImage ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : (
                        t("pages.banners.replace", "Replace")
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full aspect-[16/6] rounded-xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary-soft/30 transition-colors flex flex-col items-center justify-center gap-2 text-slate-500"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="animate-spin text-primary" size={24} />
                        <span className="text-xs font-bold">
                          {t("pages.banners.uploading", "Uploading...")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={24} />
                        <span className="text-xs font-bold">
                          {t("pages.banners.uploadImage", "Click to upload")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t("pages.banners.recommend", "Recommended 1920×600 px")}
                        </span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("pages.banners.titleField", "Title")}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t("pages.banners.titlePlaceholder", "Optional title")}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("pages.banners.subtitleField", "Subtitle")}
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder={t("pages.banners.subtitlePlaceholder", "Optional subtitle")}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("pages.banners.linkField", "Link URL")}
                </label>
                <input
                  type="url"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://… or /products"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("pages.banners.order", "Display order")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({ ...form, displayOrder: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("pages.banners.status", "Status")}
                  </label>
                  <button
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`w-full h-[42px] flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-colors ${
                      form.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {form.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {form.isActive ? t("status.active") : t("status.inactive")}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={closeForm}
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                {t("actions.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploadingImage || !form.imageUrl}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                {t("actions.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
