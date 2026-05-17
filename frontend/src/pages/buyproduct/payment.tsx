import React, { useState, useMemo, useEffect } from "react";
import MastercardImg from "@/assets/Mastercard.png";
import {
  ChevronLeft, CreditCard, QrCode, Wallet,
  ShieldCheck, CheckCircle2, MapPin, Truck, Lock,
  Pencil,
  Plus
} from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SelectAddressModal } from "./SelectAddressModal";
import { apiClient } from "@/services/apiClient";

export default function PaymentPage() {
  const { t } = useTranslation("common");
  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState("");
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);

  const router = useRouter();
  const { query } = router;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. ดึงที่อยู่จริง
        const addrData = await apiClient("/address/me");
        if (addrData) setAddress(addrData);

        // 2. ดึงตะกร้า (เฉพาะตอนที่ไม่ได้กด Buy Now มาจากหน้า Home)
        if (!query.name) {
          const cartData = await apiClient("/cart");
          if (cartData.success) {
            setCartItems(cartData.cart.items);
            setCartSubtotal(cartData.cart.subtotal);
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (mounted) fetchData();
  }, [mounted, query.name]);

  // คำนวณราคารวม — รอบเป็น 2 ตำแหน่งทศนิยมเพื่อไม่ให้เกิดเศษ floating-point
  // (0.1 * 3 = 0.30000000000000004) บนหน้าจอ
  const finalSubtotal = useMemo(() => {
    if (query.name) {
      const price = Number(query.price);
      const qty = Math.max(1, Math.floor(Number(query.qty) || 1));
      const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
      return Math.round(safePrice * qty * 100) / 100;
    }
    return cartSubtotal;
  }, [query.name, query.price, query.qty, cartSubtotal]);

  const paymentMethods = [
    {
      id: "bcel_one",
      title: t("pages.payment.method.bcelOneTitle"),
      image: "/assets/BCELone.png",
      desc: t("pages.payment.method.bcelOneDesc"),
    },
    {
      id: "ldb_trust",
      title: t("pages.payment.method.ldbTrustTitle"),
      image: "/assets/LDB.png",
      desc: t("pages.payment.method.ldbTrustDesc"),
    },
    {
      id: "jdb_yes",
      title: t("pages.payment.method.jdbYesTitle"),
      image: "/assets/JDB.png",
      desc: t("pages.payment.method.jdbYesDesc"),
    },
    {
      id: "visa_master",
      title: t("pages.payment.method.visaMasterTitle"),
      image: "/assets/Mastercard.png",
      desc: t("pages.payment.method.visaMasterDesc"),
    },
    {
      id: "cod",
      title: t("pages.payment.method.codTitle"),
      image: "/assets/cod.png",
      desc: t("pages.payment.method.codDesc"),
    }
  ];

  const handleSelectAddress = (selectedAddr: any) => {
    setAddress(selectedAddr);
    setIsSelectModalOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      {/* ── Sticky Header (เดิมเป๊ะ) ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="ml-2 text-base font-bold text-gray-900">{t("pages.checkout.title")}</h1>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <div className="flex-1 min-w-0 space-y-5">

            {/* Order Summary (หน้าตาเดิม แค่เพิ่ม Logic แยกแหล่งข้อมูล) */}
            <section className="bg-white rounded-1xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <h2 className="text-sm font-bold text-gray-700 tracking-wider">{t("pages.checkout.summary")}</h2>
              </div>
              <div className="p-5">
                <div className="space-y-4 mb-5">
                  {query.name ? (
                    /* --- กรณีซื้อจากหน้า Product/Home (Buy Now) --- */
                    <div className="flex gap-4 items-start">
                      {/* เพิ่ม Link ครอบรูปภาพ */}
                      <Link href={`/product/${query.id || query._id}`} className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-100 block">
                        <img src={query.image as string} alt="product" className="w-full h-full object-cover" />
                      </Link>

                      <div className="flex-1 min-w-0">
                        {/* เพิ่ม Link ครอบชื่อสินค้า */}
                        <Link href={`/product/${query.id || query._id}`} className="hover:text-blue-600 transition-colors">
                          <p className="text-sm font-bold text-gray-900 truncate">{query.name}</p>
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t("pages.payment.option", { color: query.color, size: query.size })}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{query.description || t("pages.payment.premiumProduct")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          ฿{finalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* --- กรณีจาก Cart (Loop รายการ) --- */
                    cartItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        {/* เพิ่ม Link ครอบรูปภาพ */}
                        <Link href={`/product/${item.productId}`} className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-100 block">
                          <img src={item.product.image} alt="product" className="w-full h-full object-cover" />
                        </Link>

                        <div className="flex-1 min-w-0">
                          {/* เพิ่ม Link ครอบชื่อสินค้า */}
                          <Link href={`/product/${item.productId}`} className="hover:text-blue-600 transition-colors">
                            <p className="text-sm font-bold text-gray-900 truncate">{item.product.name}</p>
                          </Link>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{item.product.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900">฿{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ส่วนยอดรวมคงเดิม */}
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-sm">{t("pages.checkout.total")}</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 tracking-tight">
                      ฿{finalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
              <section className="bg-white rounded-1xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500 shrink-0" />
                    {t("pages.checkout.deliveryAddress")}
                  </h2>
                  <button
                    onClick={() => setIsSelectModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:underline transition-colors"
                  >
                    {address ? <Pencil size={18} /> : <Plus size={18} />}
                  </button>
                </div>

                <div className="text-sm text-gray-600 leading-relaxed">
                  {loading ? (
                    <p className="text-gray-400 animate-pulse text-sm">{t("status.loading")}</p>
                  ) : address ? (
                    <div>
                      <p className="font-bold text-gray-900">
                        {address.recipientName}{" "}
                        <span className="font-normal text-gray-500">({address.phoneNumber})</span>
                      </p>
                      <p className="mt-0.5 text-gray-600">
                        {address.village}, {address.district}, {address.province}
                      </p>
                      {address.shippingBranch && (
                        <p className="text-xs text-gray-400 mt-1">{t("pages.payment.branch", { branch: address.shippingBranch })}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-medium">
                        <Truck size={13} />
                        {t("pages.payment.estimatedDelivery")}
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-400 text-xs ">
                      {t("pages.checkout.noAddress")}
                    </p>
                  )}
                </div>
              </section>
            </section>



            {/* Payment Method Selector (เดิมเป๊ะ) */}
            {/* Payment Method Selector */}
            <section>
              <div className="flex items-center justify-between mb-3 pl-3 border-l-[3px] border-blue-500">
                <h2 className="text-sm font-bold text-gray-900">{t("pages.checkout.selectPayment")}</h2>
              </div>
              <div className="space-y-2.5">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left bg-white ${method === pm.id
                      ? "border-blue-500 bg-blue-50/30 shadow-sm"
                      : "border-transparent hover:border-gray-200"
                      }`}
                  >
                    {/* เปลี่ยนจาก Icon เป็น Image Container */}
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center overflow-hidden border ${method === pm.id ? "bg-white border-blue-200" : "bg-gray-50 border-gray-100"
                      }`}>
                      <img
                        src={pm.image}
                        alt={pm.title}
                        className="w-full h-full object-contain p-1.5" // object-contain ช่วยให้รูปไม่เบี้ยว
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{pm.title}</p>
                      <p className="text-xs text-gray-500 truncate">{pm.desc}</p>
                    </div>

                    {/* ส่วน Radio Checkmark */}
                    <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${method === pm.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300"
                      }`}>
                      {method === pm.id && <CheckCircle2 size={12} strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* ════ RIGHT COLUMN (เดิมเป๊ะ) ════ */}
          <div className="w-full lg:w-80 xl:w-[340px] shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-gray-100">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                  <ShieldCheck size={26} />
                </div>
                <h3 className="font-bold text-sm text-gray-900">{t("pages.payment.payConfidence")}</h3>
                <p className="text-xs text-gray-500">{t("pages.payment.infoProtected")}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 my-5">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <Lock size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-600">{t("pages.payment.sslEncrypted")}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-600">{t("pages.payment.pciCompliant")}</span>
                </div>
              </div>

              <button
                disabled={!method || !address}
                className={`w-full font-bold py-3.5 rounded-xl shadow-md transition-all text-sm ${!method || !address
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                onClick={() => {
                  if (!method || !address) return;
                  const params = new URLSearchParams();
                  Object.entries(query).forEach(([key, val]) => { if (val) params.append(key, val as string); });
                  // ส่งค่าราคาสรุปรวมไปด้วยเพื่อให้หน้าถัดไปแสดงผลตรงกัน
                  params.set("total", finalSubtotal.toString());
                  router.push(`/buyproduct/transfer?${params.toString()}&method=${method}`);
                }}
              >
                {!address ? t("pages.checkout.selectAddress") : !method ? t("pages.checkout.selectPayment") : t("actions.checkout")}
              </button>
            </div>
          </div>
        </div>
      </main>

      <SelectAddressModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onSelect={handleSelectAddress}
        selectedId={address?._id}
      />
    </div>
  );
}