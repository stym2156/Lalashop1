"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2, Download, MapPin, CreditCard, Printer, Clock, AlertCircle,
  Package, Hash, Loader2, ArrowLeft, XCircle,
} from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

interface OrderItem {
  _id?: string;
  name: string;
  qty: number;
  image: string;
  description?: string;
  price: number;
  product?: string;
  seller?: string;
}

interface OrderResponse {
  _id: string;
  user?: string;
  orderItems: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
  };
  paymentMethod: string;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
  createdAt: string;
}

interface PaymentSlip {
  _id: string;
  slipImageUrl: string;
  transferAmount: number;
  transferRef?: string;
  transferredAt?: string;
  buyerNote?: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  reviewedAt?: string;
  paymentMethod?: {
    label?: string;
    bankName?: string;
    accountNumber?: string;
    kind?: string;
  };
  createdAt: string;
}

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const formatDateTime = (iso?: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatPaymentMethod = (key: string): string =>
  ({
    manual_transfer: "Manual Bank Transfer",
    bcel_one: "BCEL One",
    ldb_trust: "LDB Trust",
    jdb_yes: "JDB Yes",
    visa_master: "Credit / Debit Card",
    cod: "Cash on Delivery",
  } as Record<string, string>)[key] || key.replace(/_/g, " ");

export default function ReceiptPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { query } = router;
  const [mounted, setMounted] = useState(false);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [slip, setSlip] = useState<PaymentSlip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status from transfer.tsx redirect — `awaiting_verification` means a slip
  // was uploaded and is waiting on admin review. Anything else (or absent)
  // means the order is already considered paid.
  const queryStatus = (query.status as string) || "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const orderId = typeof query.orderId === "string" ? query.orderId : "";
    if (!orderId) {
      setLoading(false);
      setError("Missing order id — open this page from a checkout completion.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      apiClient(`/orders/${orderId}`).catch((e) => ({ __err: e })),
      apiClient(`/orders/${orderId}/slips`).catch(() => null),
    ])
      .then(([orderRes, slipsRes]: any) => {
        if (cancelled) return;
        if (orderRes?.__err) {
          setError(orderRes.__err.message || "Failed to load order");
          return;
        }
        if (orderRes?.success && orderRes.order) {
          setOrder(orderRes.order);
        } else {
          setError("Order not found");
        }
        // The most recent slip is what's shown on the receipt. Older slips
        // (rejected re-uploads) are kept on the slip record but not surfaced
        // here to avoid confusing the buyer.
        if (slipsRes?.success && Array.isArray(slipsRes.data) && slipsRes.data.length > 0) {
          setSlip(slipsRes.data[0]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, query.orderId]);

  const receiptRef = useRef<HTMLDivElement>(null);

  const displayId = useMemo(() => {
    const raw = order?._id || (typeof query.orderId === "string" ? query.orderId : "");
    return raw ? `#${raw.slice(-8).toUpperCase()}` : "—";
  }, [order, query.orderId]);

  const slipState = useMemo<{
    label: string;
    tone: string;
    bg: string;
    icon: React.ReactNode;
    title: string;
    blurb: string;
  }>(() => {
    if (slip?.status === "rejected") {
      return {
        label: "Slip rejected",
        tone: "text-rose-600",
        bg: "bg-rose-50 text-rose-500",
        icon: <XCircle size={48} strokeWidth={2.5} />,
        title: "Slip was rejected",
        blurb:
          slip.rejectionReason ||
          "Our team couldn't verify the transfer. Please re-upload a clear slip from the checkout page.",
      };
    }
    if (slip?.status === "verified" || order?.isPaid) {
      return {
        label: "Verified",
        tone: "text-emerald-600",
        bg: "bg-emerald-50 text-emerald-500",
        icon: <CheckCircle2 size={48} strokeWidth={2.5} />,
        title: "Payment confirmed",
        blurb: "Thank you for your purchase. Your order is now being processed.",
      };
    }
    if (slip?.status === "pending" || queryStatus === "awaiting_verification") {
      return {
        label: "Awaiting verification",
        tone: "text-amber-600",
        bg: "bg-amber-50 text-amber-500",
        icon: <Clock size={44} strokeWidth={2.5} />,
        title: "Slip submitted — awaiting verification",
        blurb:
          "Our team will review your transfer slip within a few hours. You'll get a notification once the order is confirmed.",
      };
    }
    return {
      label: "Pending payment",
      tone: "text-slate-600",
      bg: "bg-slate-100 text-slate-500",
      icon: <AlertCircle size={44} strokeWidth={2.5} />,
      title: "Order placed",
      blurb: "Complete the payment from the checkout page to confirm your order.",
    };
  }, [slip, order, queryStatus]);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      if (document.fonts) await document.fonts.ready;
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: receiptRef.current.scrollWidth,
        windowHeight: receiptRef.current.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
        compress: true,
      });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`Receipt-${displayId.replace("#", "")}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="text-primary animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center space-y-4">
        <AlertCircle size={48} className="text-rose-400" />
        <h1 className="text-xl font-bold text-slate-900">{t("status.error")}</h1>
        <p className="text-sm text-slate-500 max-w-md">{error || t("pages.receipt.orderNotFound")}</p>
        <Link
          href="/me/me"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft size={14} /> {t("pages.receipt.backToAccount")}
        </Link>
      </div>
    );
  }

  const subtotal = order.orderItems.reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.qty || 0),
    0,
  );
  const shippingFee = Math.max(0, order.totalPrice - subtotal);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans antialiased pb-12">
      {/* Hero header — colour swaps with slip status */}
      <div className="bg-white border-b border-slate-100 py-12 text-center space-y-4">
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in duration-500 ${slipState.bg}`}>
            {slipState.icon}
          </div>
        </div>
        <div className="space-y-1 max-w-xl mx-auto px-4">
          <h1 className="text-[24px] font-bold">{slipState.title}</h1>
          <p className="text-slate-500 text-[14px] font-medium">{slipState.blurb}</p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 -mt-6">
        {/* Receipt Card — captured by html2canvas for the PDF download. */}
        <section
          ref={receiptRef}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-2"
        >
          {/* Brand + meta */}
          <div className="p-8 border-b border-dashed border-slate-200 flex justify-between items-start gap-4">
            <div className="space-y-1">
              <p className="text-primary font-black text-xl tracking-tighter ">LALASHOP</p>
              <p className="text-[12px] text-slate-400 font-medium">{t("pages.checkout.receiptTitle")}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] text-slate-400 font-bold tracking-widest">
                {t("pages.receipt.orderDate")}
              </p>
              <p className="text-[13px] font-bold">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* ── Items ── */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-widest">
                <span>{t("product.description")}</span>
                <span>{t("pages.checkout.amount")}</span>
              </div>

              {order.orderItems.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="flex gap-4 items-center py-2 border-b border-slate-50 last:border-0 last:pb-0"
                >
                  <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {t("pages.receipt.qtyUnit", { qty: item.qty, price: formatMoney(item.price) })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[14px] font-bold tabular-nums">
                      ฿{formatMoney(item.price * item.qty)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Price breakdown ── */}
            <div className="pt-6 border-t border-slate-50 space-y-3">
              <div className="flex justify-between text-slate-500 text-[14px] font-medium">
                <span>{t("pages.checkout.subtotal")}</span>
                <span className="text-slate-900 tabular-nums">฿{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[14px] font-medium">
                <span>{t("pages.checkout.shippingFee")}</span>
                <span className={shippingFee > 0 ? "tabular-nums text-slate-900" : "text-emerald-500 font-bold text-[12px]"}>
                  {shippingFee > 0 ? `฿${formatMoney(shippingFee)}` : t("pages.receipt.free")}
                </span>
              </div>
              <div className="pt-4 flex justify-between items-center">
                <div>
                  <p className="text-[14px] font-bold">{t("pages.checkout.total")}</p>
                  <p className="text-[10px] text-slate-400 font-medium tracking-widest inline-flex items-center gap-1">
                    <Hash size={10} /> Order ID: {displayId}
                  </p>
                </div>
                <span className="text-[28px] font-bold text-primary tracking-tighter tabular-nums">
                  ฿{formatMoney(order.totalPrice)}
                </span>
              </div>
            </div>

            {/* ── Transfer slip with full metadata ── */}
            {slip && (
              <div className="pt-8 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest">
                    {t("pages.receipt.transferProof")}
                  </p>
                  <span
                    className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full ${
                      slip.status === "verified"
                        ? "bg-emerald-50 text-emerald-600"
                        : slip.status === "rejected"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {slip.status}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md sm:w-[180px] flex-shrink-0 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slip.slipImageUrl} alt="Transfer Slip" className="w-full h-auto" />
                  </div>
                  <div className="flex-1 text-[12px] space-y-1.5">
                    <Row label={t("pages.receipt.transferred")} value={`฿${formatMoney(slip.transferAmount)}`} bold />
                    {slip.transferRef && <Row label={t("pages.receipt.reference")} value={slip.transferRef} mono />}
                    {slip.transferredAt && (
                      <Row label={t("pages.receipt.transferredAt")} value={formatDateTime(slip.transferredAt)} />
                    )}
                    {slip.paymentMethod?.bankName && (
                      <Row
                        label={t("pages.receipt.to")}
                        value={`${slip.paymentMethod.bankName}${
                          slip.paymentMethod.accountNumber
                            ? ` ····${slip.paymentMethod.accountNumber.slice(-4)}`
                            : ""
                        }`}
                      />
                    )}
                    {slip.buyerNote && <Row label={t("pages.receipt.note")} value={slip.buyerNote} />}
                    {slip.status === "rejected" && slip.rejectionReason && (
                      <p className="mt-2 px-2 py-1.5 rounded bg-rose-50 text-rose-700 text-[11px] font-medium">
                        {slip.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Shipping address + payment method ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest">
                  <MapPin size={12} className="text-primary" /> {t("pages.receipt.shippingAddress")}
                </div>
                <div className="text-[13px] text-slate-600 leading-relaxed">
                  <p className="font-bold text-slate-900">
                    {order.shippingAddress.fullName}{" "}
                    <span className="font-normal text-slate-500">({order.shippingAddress.phone})</span>
                  </p>
                  <p>{order.shippingAddress.address}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 tracking-widest">
                  <CreditCard size={12} className="text-primary" /> {t("pages.receipt.paymentMethod")}
                </div>
                <div className="text-[13px] text-slate-600 font-medium">
                  <p className="text-slate-900">{formatPaymentMethod(order.paymentMethod)}</p>
                  <p className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${slipState.tone}`}>
                    {slip?.status === "verified" || order.isPaid ? (
                      <CheckCircle2 size={10} />
                    ) : slip?.status === "rejected" ? (
                      <XCircle size={10} />
                    ) : (
                      <Clock size={10} />
                    )}
                    {slipState.label}
                  </p>
                  {order.paidAt && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t("pages.receipt.paidAt", { date: formatDateTime(order.paidAt) })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions — excluded from PDF capture */}
          <div
            className="bg-slate-50 p-6 flex items-center justify-center gap-8"
            data-html2canvas-ignore
          >
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-[12px] font-bold text-slate-400 hover:text-primary transition-colors tracking-widest"
            >
              <Printer size={16} /> {t("pages.receipt.printReceipt")}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 text-[12px] font-bold text-slate-400 hover:text-primary transition-colors tracking-widest"
            >
              <Download size={16} /> {t("pages.receipt.saveReceipt")}
            </button>
          </div>
        </section>

        {/* Quick links */}
        <div className="text-center">
          <Link
            href="/me/me"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            <ArrowLeft size={14} /> {t("pages.receipt.backToAccount")}
          </Link>
        </div>
      </main>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}

const Row: React.FC<RowProps> = ({ label, value, mono, bold }) => (
  <div className="flex items-center justify-between gap-2 py-0.5">
    <span className="text-slate-400 font-medium">{label}</span>
    <span
      className={`text-slate-900 text-right break-all ${mono ? "font-mono" : ""} ${
        bold ? "font-bold" : "font-medium"
      }`}
    >
      {value}
    </span>
  </div>
);
