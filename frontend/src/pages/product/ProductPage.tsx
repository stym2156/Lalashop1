"use client";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, ShieldCheck, Truck,
  RefreshCw, Zap, ArrowRight, MessageCircle, ShoppingCart, CreditCard,
  Store, Flag,
} from "lucide-react";

import Header from "@/components/layout/Header";
import BuyPopup from "../buyproduct/buy";
import ReportModal from "@/components/ReportModal";
import { ImageGallery } from "./ImageGallery";
import { PriceTierCard, QuantityStepper } from "./ProductControls";
import { SpecRow, TrustPill, Stars } from "./ProductUIPrimitives";
import { ProductTabs } from "./ProductTabs";
import { PriceTier, ProductData } from "./types";
import { Product } from "@/types";
import { apiClient } from "@/services/apiClient";
import { useChat } from "@/components/chat/ChatContext";
import { trackPageView } from "@/services/pageViewTracker";

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`
        fixed top-6 right-6 z-50 flex items-center gap-3
        bg-gray-900 text-white text-sm font-semibold
        px-5 py-3 rounded-2xl shadow-xl
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
      `}
    >
      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <polyline points="2,5 4,7 8,3" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      {message}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 py-6 pb-32 md:pb-16">
        <nav className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
        </nav>
        <div className="bg-white rounded-3xl overflow-hidden">
          <div className="flex flex-wrap">
            <div className="flex-1 basis-96 aspect-square bg-gray-100 animate-pulse" />
            <div className="flex-1 basis-96 p-10 space-y-4">
              <div className="h-8 bg-gray-200 rounded-xl w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="flex gap-3 pt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 w-24 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="h-14 bg-gray-200 rounded-2xl animate-pulse mt-6" />
              <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { openWithProduct } = useChat();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("specs");
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [showBuyPopup, setShowBuyPopup] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = JSON.parse(localStorage.getItem("userInfo") || "null");
      if (cached?._id) setCurrentUserId(cached._id);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    if (router.isReady && id) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await apiClient(`/products/${id}`);
          if (response.success && response.data) {
            setProduct(response.data);
            const productData = response.data;

            // Fetch recommended products
            const recResponse = await apiClient("/products");
            if (recResponse.success && Array.isArray(recResponse.data)) {
              // Filter products in the same category, excluding the current one
              const filtered = recResponse.data
                .filter((p: any) => p._id !== id && (p.category === productData.category || (productData.category && p.category?.includes(productData.category))))
                .slice(0, 7);
              setRecommendedProducts(filtered);
            }
          } else {
            throw new Error("Product not found");
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          setProduct(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [router.isReady, id]);

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2500);
  }, []);

  // Calculate prices early so they can be used in handleAddToCart
  const displayPrices: PriceTier[] = useMemo(() => {
    if (!product) return [];
    return Array.isArray(product.prices)
      ? product.prices
      : [{ range: "1+", price: typeof product.price === "number" ? product.price : 0 }];
  }, [product]);

  const selectedPrice = useMemo(() => {
    return displayPrices[activeTier]?.price ?? 0;
  }, [displayPrices, activeTier]);

  const handleAddToCart = useCallback(async () => {
    if (cartLoading || !product) return;
    setCartLoading(true);
    try {
      const response = await apiClient("/cart/items", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id || product.id,
          qty: qty,
          unitPrice: selectedPrice
        }),
      });

      if (!response.success) throw new Error("Failed to add to cart");

      showToast(`Added ${product?.name} to cart`);
      // ส่ง event เพื่อบอก Header ให้อัปเดตตัวเลข
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error: any) {
      console.error("Cart Error:", error);
      showToast("Error adding to cart");
    } finally {
      setCartLoading(false);
    }
  }, [cartLoading, product, qty, selectedPrice, showToast]);

  const handleBuy = useCallback(async () => {
    setShowBuyPopup(true);
  }, []);

  const sellerId = useMemo(() => {
    const seller: any = (product as any)?.seller;
    if (!seller) return null;
    return typeof seller === "string" ? seller : seller._id || seller.id || null;
  }, [product]);

  const isOwnProduct = !!(currentUserId && sellerId && currentUserId === sellerId);
  const viewShopHref = isOwnProduct ? "/me/me" : `/u/${sellerId || ""}`;

  // Track this product view against the owning shop once we know its id.
  // Fires when product or sellerId changes so navigating between products
  // re-attributes correctly.
  useEffect(() => {
    if (!product || !sellerId) return;
    const productId = String(product._id || product.id || "");
    if (!productId) return;
    trackPageView({
      path: `/product/${productId}`,
      pageType: "product",
      productId,
      shopId: sellerId,
    });
  }, [product, sellerId]);

  // Open the chat panel with the seller and auto-attach this product as context
  // so the seller's inbox shows which product the buyer is asking about.
  const handleChatSeller = useCallback(() => {
    if (!product) return;
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    if (isOwnProduct) {
      showToast("This is your own product");
      return;
    }
    const seller: any = (product as any)?.seller;
    if (!seller || !sellerId) {
      showToast("Seller info unavailable");
      return;
    }
    const cover = Array.isArray((product as any).images)
      ? (product as any).images[0]
      : (product as any).image;
    void openWithProduct(
      {
        _id: sellerId,
        name: seller.name,
        username: seller.username,
        profileImage: seller.profileImage,
      },
      {
        productId: String(product._id || product.id),
        name: product.name || "",
        image: typeof cover === "string" ? cover : "",
        price: typeof product.price === "number" ? product.price : selectedPrice || 0,
        slug: (product as any).slug,
      }
    );
  }, [product, currentUserId, isOwnProduct, sellerId, openWithProduct, router, showToast, selectedPrice]);

  const shipsFromText = useMemo(() => {
    const sf: any = (product as any)?.shipsFrom;
    if (sf && (sf.province || sf.district)) {
      return [sf.province, sf.district].filter(Boolean).join(", ");
    }
    return product?.location || "Bangkok, Thailand";
  }, [product]);

  const leadTimeText = useMemo(() => {
    const lt: any = (product as any)?.leadTime;
    if (lt && (lt.min || lt.max)) {
      const unitLabel =
        lt.unit === "hours" ? "Hours" : lt.unit === "weeks" ? "Weeks" : "Business Days";
      const min = Number(lt.min) || 0;
      const max = Number(lt.max) || min;
      return min === max ? `${min} ${unitLabel}` : `${min}–${max} ${unitLabel}`;
    }
    return "3–7 Business Days";
  }, [product]);

  const returnPolicy: any = (product as any)?.returnPolicy;
  const returnsValue = returnPolicy?.accepts === false
    ? "No returns"
    : `Easy ${Number(returnPolicy?.days) || 7} Days`;

  const ratingValue = Number((product as any)?.rating) || 0;
  const numReviews = Number((product as any)?.numReviews) || 0;
  const soldCount = Number((product as any)?.soldCount) || 0;

  if (loading) return <ProductPageSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-black text-slate-900 mb-3">Product Not Found</p>
            <Link href="/" className="text-sky-500 font-bold hover:underline">
              ← Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-enter { animation: fadeSlideUp 0.4s ease both; }
        .btn-hover:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-hover:active:not(:disabled) { transform: scale(0.98); }
      `}</style>

      <Toast message={toast.message} visible={toast.visible} />

      <Head>
        <title>{product.name} | lalashop</title>
        <meta name="description" content={product.description || `Buy ${product.name} at the best price on lalashop.`} />
      </Head>

      <Header />

      {/* ── Report Modal ── */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="product"
        targetId={String((product as any)._id ?? "")}
        targetLabel={product.name}
      />

      {/* ── Buy Popup ── */}
      <BuyPopup
        product={product}
        isOpen={showBuyPopup}
        onClose={() => setShowBuyPopup(false)}
        initialQty={qty}
        selectedPrice={selectedPrice}
      />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 py-6 pb-32 md:pb-16">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2.5 mb-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all duration-200"
          >
            <ChevronLeft size={14} />
          </Link>
          <Link href="/" className="hover:text-sky-500 transition-colors">Home</Link>
          <ChevronRight size={10} />
          <span className="text-gray-600">{product.category}</span>
          <ChevronRight size={10} />
          <span className="text-gray-300 max-w-[200px] truncate">{product.name}</span>
          <button
            onClick={() => setReportOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-red-500 px-2 py-1 rounded-full transition-colors"
            title="Report this product"
          >
            <Flag size={12} /> Report
          </button>
        </nav>

        {/* ── Hero Card ── */}
        <div className="page-enter bg-white rounded-3xl overflow-hidden">
          <div className="flex flex-wrap">

            {/* LEFT – Gallery */}
            <div className="w-full lg:flex-1 lg:basis-96 border-b lg:border-b-0 lg:border-r border-slate-50">
              <ImageGallery
                images={
                  Array.isArray((product as any).images) && (product as any).images.length
                    ? ((product as any).images as string[])
                    : Array.isArray(product.image)
                      ? (product.image as unknown as string[])
                      : product.image
                        ? [product.image as string]
                        : []
                }
                name={product.name}
                badge={product.badge}
                freeShipping={Boolean((product as any).freeShipping)}
              />
            </div>

            {/* RIGHT – Info */}
            <div className="flex-1 basis-96 p-8 md:p-10 flex flex-col">

              <h1 className="text-[clamp(22px,3.5vw,34px)] font-black text-slate-900 leading-tight mb-4 tracking-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-7 flex-wrap">
                <Stars filled={Math.round(ratingValue)} />
                <span className="font-black text-slate-900 text-sm">
                  {ratingValue > 0 ? ratingValue.toFixed(1) : "—"}
                </span>
                <div className="w-px h-4 bg-sky-600" />
                <span className="text-xs text-gray-400 font-bold">
                  {numReviews} Review{numReviews === 1 ? "" : "s"}
                </span>
                <span className="text-xs text-gray-400 font-bold">
                  {soldCount.toLocaleString()} Sold
                </span>
              </div>




              {/* Total preview */}
              {qty > 1 && (
                <div className="flex   px-4 py-3  mb-5">
                  <span className="text-sm font-bold text-white">
                    <Zap size={13} className="inline mr-1.5 align-middle" />
                    {qty} pcs × ฿{selectedPrice.toLocaleString()}
                  </span>
                  <span className="font-black text-white text-base">
                    = ฿{(qty * selectedPrice).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Meta rows */}
              <div className="mb-6">
                <SpecRow label="Ships From" value={`📍 ${shipsFromText}`} />
                <SpecRow label="Lead Time" value={leadTimeText} />
                {(product as any).freeShipping ? (
                  <SpecRow label="Shipping" value="🚚 Free" highlight />
                ) : null}
              </div>

              {/* Tier price preview (with discount %) */}
              {Array.isArray((product as any).tiers) && (product as any).tiers.length > 0 && (
                <div className="mb-6 p-3 rounded-xl border border-sky-100 bg-sky-50/40">
                  <p className="text-[10px] font-black tracking-widest text-sky-700 mb-2">
                    BULK SAVINGS
                  </p>
                  <div className="space-y-1.5">
                    {(product as any).tiers.map((t: any, i: number) => {
                      const base = Number(product.price) || 0;
                      const tierPrice = Number(t.price) || base;
                      const pct =
                        Number(t.discountPercent) ||
                        (base > 0 ? Math.max(0, Math.round(((base - tierPrice) / base) * 100)) : 0);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs font-semibold text-slate-700"
                        >
                          <span>{t.minQty}+ pcs</span>
                          <span className="flex items-center gap-2">
                            {base > 0 && tierPrice < base && (
                              <span className="line-through text-gray-400 font-medium">
                                ฿{base.toLocaleString()}
                              </span>
                            )}
                            <span className="text-sky-700 font-black">
                              ฿{tierPrice.toLocaleString()}
                            </span>
                            {pct > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-600 text-white text-[10px] font-bold">
                                -{pct}%
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              <button
                onClick={handleBuy}
                disabled={buyLoading}
                className="btn-hover w-full bg-slate-900 text-white font-bold text-sm rounded-2xl py-3.5 mb-3 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {buyLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CreditCard size={15} />
                )}
                {buyLoading ? "Processing..." : "Buy"}
              </button>

              {/* Secondary: Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className="btn-hover w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-2xl py-3.5 mb-3 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cartLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingCart size={15} />
                )}
                {cartLoading ? "Adding..." : "Add to Cart"}
              </button>

              {/* Ghost: Message */}
              <button
                onClick={handleChatSeller}
                className="btn-hover w-full bg-transparent text-slate-600 hover:bg-slate-100 border border-gray-200 font-bold text-sm rounded-2xl py-3.5 mb-6 flex items-center justify-center gap-2 transition-all duration-200"
              >
                <MessageCircle size={15} />
                Chat with seller
              </button>

              {/* Trust Pills */}
              <div className="flex gap-2.5 flex-wrap">
                <TrustPill icon={ShieldCheck} label="Guaranteed" value="100% Secure" color="#3b82f6" />
                <TrustPill icon={Truck} label="Logistics" value="Fast Shipping" color="#0077b6" />
                <TrustPill
                  icon={RefreshCw}
                  label="Returns"
                  value={returnsValue}
                  color={returnPolicy?.accepts === false ? "#ef4444" : "#22c55e"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Shop Section ── */}
        <div className="page-enter bg-white rounded-3xl p-2 md:p-1 mb-1 t-1  shadow-sm shadow-blue-900/[0.02]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link href={viewShopHref} className="flex items-center gap-4 group">
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden  bg-gray-50 flex-shrink-0">
                  <img
                    src={(product.seller as any)?.profileImage || "/assets/default-avatar.png"}
                    alt={(product.seller as any)?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 truncate">
                      {(product.seller as any)?.name || "Lala Shop Partner"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                    <span className="text-slate-600">@{(product.seller as any)?.username || "factory_direct"}</span>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-1 max-w-md ">
                    {(product.seller as any)?.bio || "Reliable high-quality wholesale factory partner."}
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex gap-3">
              <Link
                href={viewShopHref}
                className="flex-1 md:flex-none px-6 py-3 bg-white  text-slate-700 font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Store size={16} />
                View Shop
              </Link>
              <button
                onClick={handleChatSeller}
                className="flex-1 md:flex-none px-6 py-3 text-black font-bold text-sm duration-200 inline-flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                Chat
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <ProductTabs tab={tab} setTab={setTab} product={product} />

        {/* ── Related Products ── */}
        <div className="animate-[fadeSlideUp_0.7s_0.25s_ease_both]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-slate-900">Recommended Products</h2>

          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-20">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="aspect-[4/5] bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-1">
              {recommendedProducts.length > 0 ? (
                recommendedProducts.map((p) => (
                  <Link
                    key={p._id}
                    href={`/product/${p._id}`}
                    className="block text-inherit hover:no-underline group"
                  >
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all h-full flex flex-col">
                      <div className="aspect-square relative overflow-hidden bg-gray-50">
                        <img
                          src={Array.isArray(p.image) ? p.image[0] : p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px] group-hover:text-primary transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                          {p.description}
                        </p>
                        <div className="mt-auto pt-2 flex items-baseline gap-0.5">
                          <span className="text-[10px] font-bold text-primary">฿</span>
                          <span className="text-base font-black text-primary">
                            {p.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-gray-400 font-medium bg-white rounded-2xl border border-dashed">
                  No similar products found.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky Bottom Bar (Mobile only) ── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-100 px-4 py-3 z-40">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={handleAddToCart}
            disabled={cartLoading}
            className="flex-1 bg-sky-500 text-white font-bold text-sm rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
          >
            <ShoppingCart size={15} />
            To Cart
          </button>
          <button
            onClick={handleBuy}
            disabled={buyLoading}
            className="flex-1 bg-slate-900 text-white font-bold text-sm rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
          >
            <CreditCard size={15} />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
