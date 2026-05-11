
import Header from "@/components/layout/Header";
import { ShoppingCart, Trash2, Plus, Minus, ShieldCheck, Truck, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

type CartItem = {
  productId: string;
  qty: number;
  unitPrice: number;
  total: number;
  product: {
    id: string;
    name: string;
    image: string;
    description?: string;
  };
};

export default function CartPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsCount = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  async function loadCart() {
    setLoading(true);
    try {
      const response = await apiClient("/cart");
      if (response.success && response.cart) {
        setItems(response.cart.items ?? []);
        setSubtotal(response.cart.subtotal ?? 0);
      }
    } catch (error: any) {
      console.error("Load Cart Error:", error);
      setError(t("cart.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCart(); }, []);

  async function updateQty(productId: string, qty: number) {
    if (qty < 1) { await removeItem(productId); return; }
    setLoading(true);
    try {
      const response = await apiClient("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, qty }),
      });
      if (response.success) {
        await loadCart();
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error("Update Qty Error:", error);
    } finally { setLoading(false); }
  }

  async function removeItem(productId: string) {
    setLoading(true);
    try {
      const response = await apiClient("/cart/items", {
        method: "DELETE",
        body: JSON.stringify({ productId }),
      });
      if (response.success) {
        await loadCart();
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error("Remove Item Error:", error);
    } finally { setLoading(false); }
  }

  // ... (ส่วนบนเหมือนเดิม)

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8F8] text-[#121212] antialiased overflow-x-hidden w-full">
      <Header />
      <main className="w-full pb-32">
        {error && (
          <div className="bg-red-50 text-red-600 px-5 py-3 text-[12px] font-bold border-b border-red-100 w-full">{error}</div>
        )}

        {loading && items.length === 0 ? (
          <div className="py-20 flex justify-center w-full">
            <div className="w-6 h-6 border-2 border-[#EEEEEE] border-t-[#0077b6] animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-32 flex flex-col items-center opacity-30 px-10 text-center w-full">
            <ShoppingCart size={48} strokeWidth={1} />
            <p className="mt-4 text-[13px] font-bold tracking-widest">{t("cart.emptyHint")}</p>
            <Link href="/" className="mt-6 text-[#0077b6] border-b border-[#0077b6] pb-1 text-sm font-bold">{t("actions.shopNow")}</Link>
          </div>
        ) : (
          <div className="w-full">
            <div className="divide-y divide-[#F5F5F5] bg-white border-b border-[#EEEEEE] w-full">
              {items.map((item) => (
                <div key={item.productId} className="p-4 flex gap-4 active:bg-[#FAFAFA] transition-colors relative w-full">
                  <Link href={`/product/${item.productId}`} className="w-24 h-24 bg-[#F5F5F5] flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer shadow-sm">
                    <img
                      src={item.product.image}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      alt={item.product.name}
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link href={`/product/${item.productId}`} className="hover:text-[#0077b6] transition-colors">
                          <h3 className="text-[14px] font-bold leading-tight line-clamp-2">{item.product.name.toLowerCase()}</h3>
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-[#BBBBBB] hover:text-red-500 active:scale-90 transition-all p-1"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#86878B] mt-1 line-clamp-1">{item.product.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-x-5">
                        <button
                          onClick={() => updateQty(item.productId, item.qty - 1)}
                          disabled={loading}
                          className="text-[#86878B] hover:text-[#121212] active:scale-125 transition-transform disabled:opacity-30"
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>

                        <span className="text-[15px] font-black min-w-[20px] text-center">
                          {item.qty}
                        </span>

                        <button
                          onClick={() => updateQty(item.productId, item.qty + 1)}
                          disabled={loading}
                          className="text-[#86878B] hover:text-[#121212] active:scale-125 transition-transform disabled:opacity-30"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[15px] font-black text-[#0077b6]">฿{item.total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-[70px] md:bottom-0 left-0 md:left-[64px] right-0 bg-white border-t border-[#EEEEEE] px-5 py-4 flex items-center justify-between z-[110] shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#86878B] font-bold tracking-widest">{t("cart.totalAmount")}</span>
            <span className="text-[22px] font-black text-[#FE2C55] leading-none mt-1">฿{subtotal.toLocaleString()}</span>
          </div>
          <button
            onClick={() => router.push('/buyproduct/payment')}
            disabled={loading}
            className="bg-[#0077b6] text-white px-10 py-3.5 rounded-2xl font-black text-[15px] active:scale-95 transition-all shadow-lg shadow-[#0077b6]/25 disabled:bg-gray-400"
          >
            {loading ? t("status.updating") : t("actions.checkout")}
          </button>
        </div>
      )}
    </div>
  );
}

