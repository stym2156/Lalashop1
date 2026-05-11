import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ScanBarcode, Search, Plus, Minus, Trash2, ShoppingCart, Receipt,
  Loader2, AlertCircle, Package, CheckCircle2, X,
} from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useCurrentSeller } from "@/services/useCurrentSeller";

interface PosProduct {
  _id: string;
  name: string;
  price: number;
  countInStock: number;
  barcode?: string;
  image?: string | string[];
  images?: string[];
  category?: string;
}

interface CartLine {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  barcode?: string;
}

interface SellerInfo {
  _id: string;
  name?: string;
}

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const productImage = (p: PosProduct): string => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string" && p.image) return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return "";
};

const PosTerminal: React.FC = () => {
  const { t } = useTranslation("common");
  const { seller, loading: sellerLoading } = useCurrentSeller();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{ id: string; total: number; items: number } | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  const loadProducts = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ success: boolean; data?: PosProduct[] }>(
        "/products/my?channel=pos",
      );
      setProducts(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.posTerminal.errFailedLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-focus scanner input — barcode scanners type fast and hit Enter,
  // so an always-focused field captures every scan.
  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)),
    );
  }, [products, search]);

  const addToCart = (p: PosProduct, qty = 1): void => {
    if (p.countInStock <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === p._id);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = Math.min(next[idx].qty + qty, p.countInStock);
        next[idx] = { ...next[idx], qty: newQty };
        return next;
      }
      return [
        ...prev,
        {
          productId: p._id,
          name: p.name,
          price: p.price,
          qty: Math.min(qty, p.countInStock),
          image: productImage(p),
          barcode: p.barcode,
        },
      ];
    });
  };

  const updateQty = (productId: string, delta: number): void => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.productId !== productId) return line;
          const product = products.find((p) => p._id === productId);
          const max = product?.countInStock ?? line.qty;
          const newQty = Math.max(0, Math.min(line.qty + delta, max));
          return { ...line, qty: newQty };
        })
        .filter((line) => line.qty > 0),
    );
  };

  const removeFromCart = (productId: string): void => {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  };

  const clearCart = (): void => setCart([]);

  // Handle barcode scanner input. Most USB scanners act as a HID keyboard
  // — type all digits then press Enter. Capturing Enter triggers add-to-cart.
  const onScanSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const code = scanInput.trim();
    if (!code) return;
    const product = products.find((p) => p.barcode === code);
    if (product) {
      addToCart(product);
      setScanInput("");
    } else {
      setError(t("pages.posTerminal.errBarcode", { code }));
      setTimeout(() => setError(null), 2500);
      setScanInput("");
    }
    scanRef.current?.focus();
  };

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const totalQty = cart.reduce((s, l) => s + l.qty, 0);

  const checkout = async (): Promise<void> => {
    if (cart.length === 0 || !seller?._id) return;
    setSubmitting(true);
    setError(null);
    try {
      const orderItems = cart.map((line) => ({
        product: line.productId,
        seller: seller._id,
        name: line.name,
        qty: line.qty,
        price: line.price,
        image: line.image,
      }));

      const res = await apiClient<{ success: boolean; order?: { _id: string } }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify({
            orderItems,
            shippingAddress: {
              fullName: seller.name || t("pages.posTerminal.posCustomer"),
              phone: t("pages.posTerminal.posInStorePhone"),
              address: t("pages.posTerminal.posInStoreSale"),
            },
            paymentMethod: t("pages.posTerminal.posCash"),
            totalPrice: subtotal,
            channel: "pos",
            posTerminal: "terminal-1",
          }),
        },
      );

      const order = res.order;
      if (order) {
        setLastReceipt({ id: order._id, total: subtotal, items: totalQty });
        clearCart();
        // Refresh stock counts
        await loadProducts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.posTerminal.errCheckout"));
    } finally {
      setSubmitting(false);
    }
  };

  if (sellerLoading || loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[18px] font-bold text-gray-900">{t('pages.posTerminal.title')}</h1>
          <p className="text-[11px] text-gray-500">
            {t('pages.posTerminal.subtitle', { count: products.length })}
          </p>
        </div>
        <Link
          href="/products/add"
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-emerald-700"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('pages.posTerminal.addPosProduct')}
        </Link>
      </div>

      <form onSubmit={onScanSubmit} className="rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-3">
        <label className="text-[10px] font-black text-emerald-800 tracking-widest block mb-1">
          {t('pages.posTerminal.scannerLabel')}
        </label>
        <div className="flex items-center gap-3">
          <ScanBarcode className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <input
            ref={scanRef}
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder={t('pages.posTerminal.scanPlaceholder')}
            className="flex-1 bg-white border border-emerald-200 rounded-md px-3 py-2 text-sm font-mono outline-none focus:border-emerald-500"
            autoFocus
          />
          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-emerald-700"
          >
            {t('actions.add')}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {lastReceipt && (
        <div className="rounded-md bg-green-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
            <p className="text-[12px] text-green-800">
              <strong>{t('pages.posTerminal.saleCompleted')}</strong> — {t('pages.posTerminal.saleSummary', { id: lastReceipt.id.slice(-6).toUpperCase(), items: lastReceipt.items, total: formatMoney(lastReceipt.total) })}
            </p>
          </div>
          <button
            onClick={() => setLastReceipt(null)}
            className="text-[11px] text-green-700 font-bold hover:underline"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* ─── Catalog ─── */}
        <div className="lg:col-span-2 rounded-lg border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('pages.posTerminal.searchPlaceholder')}
              className="flex-1 outline-none text-sm placeholder:text-gray-400"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-[12px]">
                <Package className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                {products.length === 0
                  ? t('pages.posTerminal.noPosProducts')
                  : t('pages.posTerminal.noProductsMatch')}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filtered.map((p) => {
                  const cover = productImage(p);
                  const outOfStock = p.countInStock <= 0;
                  return (
                    <button
                      key={p._id}
                      onClick={() => addToCart(p)}
                      disabled={outOfStock}
                      className={`text-left bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md hover:border-emerald-300 active:scale-[0.97] transition-all ${
                        outOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <div className="aspect-square bg-gray-50 relative">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        {outOfStock && (
                          <span className="absolute inset-0 bg-black/40 text-white text-[11px] font-bold flex items-center justify-center">
                            {t('pages.posTerminal.outOfStock')}
                          </span>
                        )}
                      </div>
                      <div className="p-2 space-y-0.5">
                        <p className="text-[11px] font-bold text-gray-900 line-clamp-2 min-h-[28px]">
                          {p.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-black text-emerald-700">
                            ฿{formatMoney(p.price)}
                          </p>
                          <p className="text-[9px] text-gray-400">{t('pages.posTerminal.stockShort', { count: p.countInStock })}</p>
                        </div>
                        {p.barcode && (
                          <p className="text-[9px] font-mono text-gray-400 truncate">{p.barcode}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Cart ─── */}
        <div className="rounded-lg border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h3 className="text-[13px] font-bold text-gray-900">{t('pages.posTerminal.cart')}</h3>
              {cart.length > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                  {totalQty}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-red-600 hover:underline font-bold"
              >
                {t('actions.clear')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-[12px]">
                {t('pages.posTerminal.cartEmpty')}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map((line) => (
                  <div key={line.productId} className="px-3 py-2.5 flex items-center gap-2">
                    <div className="w-10 h-10 rounded bg-gray-50 flex-shrink-0 overflow-hidden">
                      {line.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.image} alt={line.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-900 truncate">{line.name}</p>
                      <p className="text-[10px] text-gray-500">
                        ฿{formatMoney(line.price)} × {line.qty}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-0.5">
                      <button
                        onClick={() => updateQty(line.productId, -1)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-bold w-5 text-center tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        onClick={() => updateQty(line.productId, 1)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(line.productId)}
                        className="p-1 rounded hover:bg-red-50 text-red-500 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-4 space-y-2 bg-gray-50/50">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-600">{t('pages.posTerminal.subtotal')}</span>
              <span className="font-bold text-gray-900">฿{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[14px] pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900">{t('pages.posTerminal.total')}</span>
              <span className="font-black text-emerald-700 text-[18px]">
                ฿{formatMoney(subtotal)}
              </span>
            </div>
            <button
              onClick={checkout}
              disabled={cart.length === 0 || submitting}
              className="w-full mt-2 bg-emerald-600 text-white py-3 rounded-lg font-black tracking-wider text-[12px] inline-flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              {submitting ? t('pages.posTerminal.processing') : `${t('pages.posTerminal.checkout')} ${cart.length > 0 ? `(${totalQty})` : ""}`}
            </button>
            <p className="text-[10px] text-center text-gray-400 leading-tight">
              {t('pages.posTerminal.posSaleNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosTerminal;
