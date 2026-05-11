import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Zap, Trash2, Edit3, Calendar, TrendingUp } from "lucide-react";
import {
  fetchMyPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  fetchMyProducts,
  type SellerPromotion,
  type PromotionInput,
  type PromotionType,
  type PromotionStatus,
  type SellerProductRow,
} from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const STATUS_BADGE: Record<PromotionStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  ended: "bg-red-100 text-red-700",
};

const TYPE_LABEL: Record<PromotionType, string> = {
  flash_sale: "Flash sale",
  bundle: "Bundle",
  bogo: "Buy-1-Get-1",
  discount: "Discount",
};

const initialForm: PromotionInput = {
  name: "",
  type: "discount",
  description: "",
  productIds: [],
  discountPercent: 10,
  bundleQty: 0,
  bogoBuy: 1,
  bogoGet: 1,
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  status: "draft",
};

const PromotionsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [items, setItems] = useState<SellerPromotion[]>([]);
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionInput>(initialForm);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [promos, prods] = await Promise.all([fetchMyPromotions(), fetchMyProducts()]);
      setItems(promos);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const stats = useMemo(() => {
    const active = items.filter((p) => p.status === "active").length;
    const revenue = items.reduce((s, p) => s + (p.revenue || 0), 0);
    const orders = items.reduce((s, p) => s + (p.orders || 0), 0);
    return { total: items.length, active, revenue, orders };
  }, [items]);

  const openCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: SellerPromotion) => {
    const productIds = p.productIds.map((x) => (typeof x === "string" ? x : x._id));
    setForm({
      name: p.name,
      type: p.type,
      description: p.description || "",
      bannerImage: p.bannerImage || "",
      productIds,
      discountPercent: p.discountPercent,
      bundleQty: p.bundleQty,
      bogoBuy: p.bogoBuy,
      bogoGet: p.bogoGet,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      status: p.status,
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updatePromotion(editingId, form);
      } else {
        await createPromotion(form);
      }
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this promotion?")) return;
    await deletePromotion(id);
    await reload();
  };

  const toggleProduct = (id: string) => {
    const set = new Set(form.productIds || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setForm({ ...form, productIds: Array.from(set) });
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.promotions.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.promotions.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#00aeff] text-white px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db]"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> {t('pages.promotions.newPromotion')}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Promotions" value={stats.total.toString()} />
        <Stat label="Active now" value={stats.active.toString()} tone="text-emerald-700" />
        <Stat label="Orders driven" value={stats.orders.toString()} tone="text-[#00aeff]" />
        <Stat label="Revenue" value={`฿${formatMoney(stats.revenue)}`} tone="text-purple-700" />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Zap className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">No promotions yet</p>
          <p className="text-[11px] text-gray-500 mt-1">Launch a flash sale or bundle to boost sales.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div
              key={p._id}
              className="rounded-lg border border-gray-100 p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[13px] font-bold text-gray-900 truncate">{p.name}</h3>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${STATUS_BADGE[p.status]}`}
                  >
                    {p.status}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                    {TYPE_LABEL[p.type]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(p.startsAt)} → {formatDate(p.endsAt)}
                  </span>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <div className="flex items-center gap-1 text-[10px] text-gray-500 justify-end">
                  <TrendingUp className="w-3 h-3" />
                  Revenue
                </div>
                <p className="text-[13px] font-bold text-emerald-700 tabular-nums">
                  ฿{formatMoney(p.revenue)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(p)}
                  className="p-1.5 rounded hover:bg-gray-50 text-gray-400 hover:text-[#00aeff]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-gray-900">
                  {editingId ? "Edit promotion" : "New promotion"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-700 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <input
                    required
                    className="w-full border rounded px-2 py-1.5 text-xs"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Type">
                  <select
                    className="w-full border rounded px-2 py-1.5 text-xs"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as PromotionType })}
                  >
                    <option value="discount">Discount</option>
                    <option value="flash_sale">Flash sale</option>
                    <option value="bundle">Bundle</option>
                    <option value="bogo">Buy-1-Get-1</option>
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  className="w-full border rounded px-2 py-1.5 text-xs"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>

              {(form.type === "discount" || form.type === "flash_sale") && (
                <Field label="Discount %">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full border rounded px-2 py-1.5 text-xs"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                  />
                </Field>
              )}
              {form.type === "bundle" && (
                <Field label="Bundle qty (buy N for discount)">
                  <input
                    type="number"
                    min={2}
                    className="w-full border rounded px-2 py-1.5 text-xs"
                    value={form.bundleQty}
                    onChange={(e) => setForm({ ...form, bundleQty: Number(e.target.value) })}
                  />
                </Field>
              )}
              {form.type === "bogo" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Buy (qty)">
                    <input
                      type="number"
                      min={1}
                      className="w-full border rounded px-2 py-1.5 text-xs"
                      value={form.bogoBuy}
                      onChange={(e) => setForm({ ...form, bogoBuy: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Get (qty free)">
                    <input
                      type="number"
                      min={1}
                      className="w-full border rounded px-2 py-1.5 text-xs"
                      value={form.bogoGet}
                      onChange={(e) => setForm({ ...form, bogoGet: Number(e.target.value) })}
                    />
                  </Field>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts at">
                  <input
                    type="datetime-local"
                    required
                    className="w-full border rounded px-2 py-1.5 text-xs"
                    value={form.startsAt.slice(0, 16)}
                    onChange={(e) =>
                      setForm({ ...form, startsAt: new Date(e.target.value).toISOString() })
                    }
                  />
                </Field>
                <Field label="Ends at">
                  <input
                    type="datetime-local"
                    required
                    className="w-full border rounded px-2 py-1.5 text-xs"
                    value={form.endsAt.slice(0, 16)}
                    onChange={(e) =>
                      setForm({ ...form, endsAt: new Date(e.target.value).toISOString() })
                    }
                  />
                </Field>
              </div>

              <Field label="Status">
                <select
                  className="w-full border rounded px-2 py-1.5 text-xs"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PromotionStatus })}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </Field>

              <div>
                <p className="text-[10px] font-semibold text-gray-500 tracking-wide mb-1">
                  Products ({form.productIds?.length || 0} selected)
                </p>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                  {products.length === 0 ? (
                    <p className="text-[11px] text-gray-400 text-center py-2">No products yet</p>
                  ) : (
                    products.map((pr) => (
                      <label
                        key={pr._id}
                        className="flex items-center gap-2 text-[11px] py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1"
                      >
                        <input
                          type="checkbox"
                          checked={form.productIds?.includes(pr._id) || false}
                          onChange={() => toggleProduct(pr._id)}
                        />
                        <span className="truncate flex-1">{pr.name}</span>
                        <span className="text-gray-400">฿{formatMoney(pr.price)}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 rounded border text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-[#00aeff] text-white text-xs font-bold hover:bg-[#0096db] disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingId ? "Save changes" : "Launch promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[10px] font-semibold text-gray-500 tracking-wide block mb-1">
      {label}
    </span>
    {children}
  </label>
);

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default PromotionsPage;
