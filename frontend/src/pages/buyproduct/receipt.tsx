"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { CheckCircle2, Download, MapPin, CreditCard, Printer, Clock } from "lucide-react";
import { useRouter } from "next/router";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { apiClient } from "@/services/apiClient";

interface Address {
  recipientName?: string;
  phoneNumber?: string;
  village?: string;
  district?: string;
  province?: string;
}

interface CartProduct {
  _id: string;
  name: string;
  image: string | string[];
}

interface CartItem {
  product: CartProduct;
  qty: number;
  unitPrice: number;
  total: number;
}

export default function ReceiptPage() {
  const router = useRouter();
  const { query } = router;
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [address, setAddress] = useState<Address | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Status from transfer.tsx redirect — `awaiting_verification` means a slip
  // was uploaded and is waiting on admin review. Anything else (or absent)
  // means the order is already considered paid.
  const status = (query.status as string) || "paid";
  const isAwaiting = status === "awaiting_verification";

  useEffect(() => {
    setMounted(true);
    // Prefer the real order id passed from transfer.tsx; fall back to a
    // synthetic display id so old direct visits still render.
    if (query.orderId && typeof query.orderId === "string") {
      setOrderId("#" + query.orderId.slice(-8).toUpperCase());
    } else {
      setOrderId("SN-" + Math.floor(100000 + Math.random() * 900000));
    }
    setCurrentDate(new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }));

    const fetchData = async () => {
      try {
        // ดึงที่อยู่จริง
        const addrData = await apiClient("/address/me");
        if (addrData) setAddress(addrData);

        if (!query.name) {
          const response = await apiClient("/cart");
          if (response.success) {
            setCartItems(response.cart.items);
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };
    fetchData();
  }, [query.name]);

  const orderSummary = useMemo(() => {
    const isBuyNow = !!query.name;
    const total = parseFloat((query.total as string) || (query.price as string) || "0");
    
    return {
      isBuyNow,
      total,
      slip: (query.slip as string) || null,
      method: (query.method as string) || "Bank Transfer",
      singleItem: {
        name: (query.name as string) || "",
        image: (query.image as string) || "",
        qty: parseInt((query.qty as string) || "1"),
        color: (query.color as string) || "Default",
        size: (query.size as string) || "Default",
        price: parseFloat((query.price as string) || "0"),
      }
    };
  }, [query]);

  const receiptRef = useRef<HTMLDivElement>(null);

  if (!mounted) return null;

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Wait for all fonts on the page to fully load before starting the capture
      if (document.fonts) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, // Increase resolution by 3x for sharper fonts
        useCORS: true, // Support images loaded from other domains
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: receiptRef.current.scrollWidth,
        windowHeight: receiptRef.current.scrollHeight
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 210; // A4 Width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Create PDF based on the actual height of the receipt to prevent data loss
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
        compress: true // Compress file to keep size manageable while maintaining clarity
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Receipt-${orderId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light text-dark font-sans antialiased pb-12">
      {/* Header — colors swap based on whether the slip still needs admin review */}
      <div className="bg-white border-b border-gray-border py-12 text-center space-y-4">
        <div className="flex justify-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in duration-500 ${
              isAwaiting
                ? "bg-amber-50 text-amber-500"
                : "bg-emerald-50 text-emerald-500"
            }`}
          >
            {isAwaiting ? (
              <Clock size={44} strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={48} strokeWidth={2.5} />
            )}
          </div>
        </div>
        <div className="space-y-1 max-w-xl mx-auto px-4">
          {isAwaiting ? (
            <>
              <h1 className="text-[24px] font-bold text-dark">Slip submitted — awaiting verification</h1>
              <p className="text-gray-500 text-[14px] font-medium">
                Our team will review your transfer slip within a few hours. You&apos;ll get a
                notification once the order is confirmed.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[24px] font-bold text-dark">Payment Successful!</h1>
              <p className="text-gray-400 text-[14px] font-medium">
                Thank you for your purchase. Your receipt is ready.
              </p>
            </>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 -mt-6">

        {/* Receipt Card */}
        <section ref={receiptRef} className="bg-white rounded-3xl border border-gray-border shadow-xl overflow-hidden p-2">
          {/* Store Info */}
          <div className="p-8 border-b border-dashed border-gray-200 flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-primary font-black text-xl tracking-tighter italic">LALASHOP</p>
              <p className="text-[12px] text-gray-400 font-medium">International Supply Chain Solution</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[12px] text-gray-400 font-bold tracking-widest">Order Date</p>
              <p className="text-[13px] font-bold text-dark">{currentDate}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Item Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 tracking-widest">
                <span>Item Description</span>
                <span>Amount</span>
              </div>

              {orderSummary.isBuyNow ? (
                /* --- Single Item --- */
                <div className="flex gap-4 items-center py-2">
                  <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                    <img src={orderSummary.singleItem.image} alt="product" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-bold text-dark line-clamp-1">{orderSummary.singleItem.name}</h4>
                    <p className="text-[11px] text-gray-400 font-medium">Color: {orderSummary.singleItem.color} | Qty: {orderSummary.singleItem.qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-bold text-dark">฿{(orderSummary.singleItem.price * orderSummary.singleItem.qty).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                /* --- Multiple Items from Cart --- */
                cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center py-2 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                      <img
                        src={Array.isArray(item.product.image) ? item.product.image[0] : item.product.image}
                        alt="product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14px] font-bold text-dark line-clamp-1">{item.product.name}</h4>
                      <p className="text-[11px] text-gray-400 font-medium">Qty: {item.qty} | Price: ฿{item.unitPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-bold text-dark">฿{item.total.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-6 border-t border-gray-50 space-y-3">
              <div className="flex justify-between text-gray-500 text-[14px] font-medium">
                <span>Subtotal</span>
                <span className="text-dark">฿{orderSummary.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[14px] font-medium">
                <span>Shipping Fee</span>
                <span className="text-emerald-500 font-bold text-[12px]">Free</span>
              </div>
              <div className="pt-4 flex justify-between items-center">
                <div>
                  <p className="text-[14px] font-bold text-dark">Grand Total</p>
                  <p className="text-[10px] text-gray-400 font-medium tracking-widest">Order ID: {orderId}</p>
                </div>
                <span className="text-[28px] font-bold text-primary tracking-tighter">฿{orderSummary.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Proof (Transfer Slip) */}
            {orderSummary.slip && (
              <div className="pt-8 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-3">Transfer Proof</p>
                <div className="inline-block relative rounded-xl overflow-hidden border border-gray-200 shadow-md max-w-[240px]">
                  <img src={orderSummary.slip} alt="Transfer Slip" className="w-full h-auto" />
                </div>
              </div>
            )}

            {/* Address Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <MapPin size={12} className="text-primary" /> Shipping Address
                </div>
                <div className="text-[13px] text-gray-600 leading-relaxed">
                  {address ? (
                    <>
                      <p className="font-bold text-dark">{address.recipientName} ({address.phoneNumber})</p>
                      <p>{address.village}, {address.district}, {address.province}</p>
                    </>
                  ) : (
                    <p className="italic text-gray-400">Loading address...</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  <CreditCard size={12} className="text-primary" /> Payment Method
                </div>
                <div className="text-[13px] text-gray-600 font-medium">
                  <p className="text-dark">{orderSummary.method.replace(/_/g, ' ')}</p>
                  {isAwaiting ? (
                    <p className="text-amber-600 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <Clock size={10} /> Awaiting verification
                    </p>
                  ) : (
                    <p className="text-emerald-500 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Verified
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer of Receipt */}
          <div className="bg-gray-50 p-6 flex items-center justify-center gap-8" data-html2canvas-ignore>
            <button className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-primary transition-colors tracking-widest">
              <Printer size={16} /> Print Receipt
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 text-[12px] font-bold text-gray-400 hover:text-primary transition-colors tracking-widest"
            >
              <Download size={16} /> Save Receipt
            </button>
          </div>
        </section>


      </main>
    </div>
  );
}