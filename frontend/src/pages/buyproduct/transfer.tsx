"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, Copy, CheckCircle2, Upload, X, Building2, Smartphone,
  QrCode, Loader2, AlertCircle, FileText, ArrowRight,
} from "lucide-react";
import { useRouter } from "next/router";
import { apiClient } from "@/services/apiClient";
import { uploadImage } from "@/services/uploadImage";

type MethodKind = "bank" | "promptpay" | "static_qr";

interface PaymentMethod {
  _id: string;
  kind: MethodKind;
  label: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  promptpayId?: string;
  qrImageUrl?: string;
  notes?: string;
}

interface CartItem {
  productId: string;
  qty: number;
  unitPrice: number;
  product: { _id: string; name: string; image: string | string[]; description?: string };
  seller: string;
}

interface AddressMe {
  recipientName?: string;
  phoneNumber?: string;
  village?: string;
  district?: string;
  province?: string;
}

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function TransferPage() {
  const router = useRouter();
  const { query } = router;
  const [mounted, setMounted] = useState(false);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderInitError, setOrderInitError] = useState<string | null>(null);
  const isCreatingOrderRef = useRef(false);

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  const [promptpayQr, setPromptpayQr] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipUploading, setSlipUploading] = useState(false);
  const [transferRef, setTransferRef] = useState("");
  const [buyerNote, setBuyerNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load active payment methods on mount
  useEffect(() => {
    let cancelled = false;
    setMethodsLoading(true);
    apiClient("/payment/methods")
      .then((res) => {
        if (cancelled) return;
        const list = (res?.data || []) as PaymentMethod[];
        setMethods(list);
        if (list[0]) setSelectedMethodId(list[0]._id);
      })
      .catch(() => {
        if (!cancelled) setMethods([]);
      })
      .finally(() => {
        if (!cancelled) setMethodsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute total from query (single product flow) or fetch cart (cart flow)
  const expectedTotal = useMemo(() => {
    if (query.total) return parseFloat(query.total as string);
    const price = parseFloat((query.price as string) || "0");
    const qty = parseInt((query.qty as string) || "1");
    return price * qty;
  }, [query]);

  // Create the pending order if we don't have one yet
  useEffect(() => {
    if (!mounted) return;
    if (query.orderId) {
      setOrderId(query.orderId as string);
      setOrderTotal(expectedTotal);
      return;
    }
    if (orderId || isCreatingOrderRef.current) return;

    const createOrder = async () => {
      isCreatingOrderRef.current = true;
      setOrderInitError(null);
      try {
        let orderItems: Array<{
          name: string;
          qty: number;
          image: string;
          description: string;
          price: number;
          product: string;
          seller: string;
        }> = [];

        if (query.name) {
          orderItems = [
            {
              name: String(query.name),
              qty: parseInt(String(query.qty || "1")),
              image: String(query.image || ""),
              description: String(query.description || ""),
              price: parseFloat(String(query.price || "0")),
              product: String(query.id || query._id),
              seller: String(query.seller || ""),
            },
          ];
        } else {
          try {
            const cartData = await apiClient("/cart");
            if (cartData?.success && cartData.cart?.items) {
              orderItems = cartData.cart.items.map((item: CartItem) => ({
                name: item.product.name,
                qty: item.qty,
                image: Array.isArray(item.product.image)
                  ? item.product.image[0]
                  : item.product.image,
                description: item.product.description || "",
                price: item.unitPrice,
                product: item.productId,
                seller: item.seller,
              }));
            }
          } catch {
            /* fall through */
          }
        }

        if (orderItems.length === 0) {
          setOrderInitError("No items to order. Add something to your cart first.");
          return;
        }

        let shippingAddress: { fullName: string; phone: string; address: string } = {
          fullName: "Guest",
          phone: "—",
          address: "—",
        };
        try {
          const addr: AddressMe = await apiClient("/address/me");
          if (addr) {
            shippingAddress = {
              fullName: addr.recipientName || shippingAddress.fullName,
              phone: addr.phoneNumber || shippingAddress.phone,
              address: [addr.village, addr.district, addr.province]
                .filter(Boolean)
                .join(", ") || shippingAddress.address,
            };
          }
        } catch {
          /* keep guest defaults */
        }

        const totalForOrder = expectedTotal;
        const response = await apiClient("/orders", {
          method: "POST",
          body: JSON.stringify({
            orderItems,
            shippingAddress,
            paymentMethod: "manual_transfer",
            totalPrice: totalForOrder,
          }),
        });

        if (response?.success && response.order?._id) {
          setOrderId(response.order._id);
          setOrderTotal(response.order.totalPrice || totalForOrder);
          if (!query.name) {
            // Cart-based flow — clear cart after successful order
            await apiClient("/cart", { method: "DELETE" }).catch(() => {});
          }
        } else {
          setOrderInitError(response?.message || "Failed to create order");
        }
      } catch (err) {
        setOrderInitError(err instanceof Error ? err.message : "Failed to create order");
      } finally {
        isCreatingOrderRef.current = false;
      }
    };

    void createOrder();
  }, [mounted, expectedTotal, orderId, query]);

  const selectedMethod = useMemo(
    () => methods.find((m) => m._id === selectedMethodId) || null,
    [methods, selectedMethodId]
  );

  // Fetch dynamic PromptPay QR when method/order changes
  useEffect(() => {
    if (!selectedMethod || selectedMethod.kind !== "promptpay" || !orderId) {
      setPromptpayQr(null);
      return;
    }
    let cancelled = false;
    setQrLoading(true);
    apiClient(`/payment/methods/promptpay-qr/${selectedMethod._id}/${orderId}`)
      .then((res) => {
        if (!cancelled && res?.success) setPromptpayQr(res.data?.dataUrl || null);
      })
      .catch(() => {
        if (!cancelled) setPromptpayQr(null);
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMethod, orderId]);

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSubmitError("Please pick an image file");
      return;
    }
    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
    setSubmitError(null);
  };

  const handleSubmitSlip = async () => {
    if (!orderId || !selectedMethod) return;
    if (!slipFile) {
      setSubmitError("Please attach the transfer slip image first");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Upload slip image to R2
      setSlipUploading(true);
      const slipUrl = await uploadImage(slipFile, "uploads");
      setSlipUploading(false);

      // 2. Submit slip metadata to backend
      const res = await apiClient(`/payment/orders/${orderId}/slip`, {
        method: "POST",
        body: JSON.stringify({
          paymentMethodId: selectedMethod._id,
          slipImageUrl: slipUrl,
          transferAmount: orderTotal,
          transferRef,
          transferredAt: new Date().toISOString(),
          buyerNote,
        }),
      });
      if (!res?.success) {
        throw new Error(res?.message || "Slip submission failed");
      }

      // 3. Redirect to receipt with awaiting status
      const params = new URLSearchParams();
      params.set("orderId", orderId);
      params.set("status", "awaiting_verification");
      void router.push(`/buyproduct/receipt?${params.toString()}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Slip submission failed");
    } finally {
      setSubmitting(false);
      setSlipUploading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h1 className="ml-2 text-base font-bold">Pay & upload slip</h1>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Order header */}
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            Total to pay
          </p>
          <p className="text-3xl font-black tabular-nums text-[#00aeff] mt-1">
            ฿{formatMoney(orderTotal || expectedTotal)}
          </p>
          {orderId ? (
            <p className="text-[11px] text-gray-500 mt-2">
              Order: <span className="font-mono">#{orderId.slice(-8).toUpperCase()}</span>
            </p>
          ) : orderInitError ? (
            <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-[11px] text-red-700 inline-flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" /> {orderInitError}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 mt-2 inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Creating order…
            </p>
          )}
        </div>

        {/* Payment method picker */}
        {methodsLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
          </div>
        ) : methods.length === 0 ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[12px] text-amber-800">
            No payment methods configured yet. Please contact support.
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Choose payment method
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {methods.map((m) => (
                  <MethodTile
                    key={m._id}
                    method={m}
                    selected={selectedMethodId === m._id}
                    onSelect={() => setSelectedMethodId(m._id)}
                  />
                ))}
              </div>
            </div>

            {/* Selected method detail */}
            {selectedMethod && (
              <div className="rounded-xl bg-white border border-gray-100 p-5 space-y-3">
                <h3 className="text-[13px] font-bold text-gray-900">
                  Transfer instructions
                </h3>

                {selectedMethod.kind === "bank" && (
                  <BankDetails method={selectedMethod} onCopy={handleCopy} copied={copied} />
                )}

                {selectedMethod.kind === "promptpay" && (
                  <PromptPayDetails
                    method={selectedMethod}
                    qrDataUrl={promptpayQr}
                    qrLoading={qrLoading}
                    amount={orderTotal || expectedTotal}
                  />
                )}

                {selectedMethod.kind === "static_qr" && (
                  <StaticQrDetails method={selectedMethod} />
                )}

                {selectedMethod.notes && (
                  <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-[11px] text-amber-800">
                    💡 {selectedMethod.notes}
                  </div>
                )}
              </div>
            )}

            {/* Slip upload form */}
            <div className="rounded-xl bg-white border border-gray-100 p-5 space-y-3">
              <div>
                <h3 className="text-[13px] font-bold text-gray-900">After you transfer</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Upload the bank/wallet transfer slip and the admin will verify within a few hours.
                </p>
              </div>

              {slipPreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slipPreview}
                    alt="Slip preview"
                    className="w-48 max-h-64 rounded-md border border-gray-200 object-contain bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      setSlipFile(null);
                      setSlipPreview(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-200 rounded-md hover:border-[#00aeff] hover:bg-blue-50/30 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-[12px] font-bold">Tap to upload transfer slip</span>
                  <span className="text-[10px]">PNG / JPG / WEBP</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Reference number (optional)">
                  <input
                    className={inputCls}
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="e.g. last 4 digits of slip ref"
                  />
                </Field>
                <Field label="Note for admin (optional)">
                  <input
                    className={inputCls}
                    value={buyerNote}
                    onChange={(e) => setBuyerNote(e.target.value)}
                    placeholder="anything we should know?"
                  />
                </Field>
              </div>

              {submitError && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> {submitError}
                </div>
              )}

              <button
                onClick={handleSubmitSlip}
                disabled={!orderId || !selectedMethod || !slipFile || submitting}
                className="w-full py-3.5 bg-[#00aeff] text-white rounded-2xl text-sm font-black tracking-wide inline-flex items-center justify-center gap-2 hover:bg-[#0096db] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {slipUploading ? "Uploading slip…" : "Submitting…"}
                  </>
                ) : (
                  <>
                    Submit slip <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                Your order will be marked paid once the admin verifies the slip.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

interface MethodTileProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}

const MethodTile: React.FC<MethodTileProps> = ({ method, selected, onSelect }) => {
  const Icon = method.kind === "bank" ? Building2 : method.kind === "promptpay" ? Smartphone : QrCode;
  const subtitle =
    method.kind === "bank"
      ? `${method.bankName} · ····${(method.accountNumber || "").slice(-4)}`
      : method.kind === "promptpay"
      ? `PromptPay · ${method.accountName || "—"}`
      : method.accountName || "Wallet QR";

  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-md border text-left flex items-center gap-3 transition-all ${
        selected
          ? "border-[#00aeff] bg-blue-50 ring-1 ring-[#00aeff]/30"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-[#00aeff] text-white" : "bg-gray-100 text-gray-600"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-gray-900 truncate">{method.label}</p>
        <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>
      </div>
      {selected && <CheckCircle2 className="w-4 h-4 text-[#00aeff] flex-shrink-0" />}
    </button>
  );
};

const BankDetails: React.FC<{
  method: PaymentMethod;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
}> = ({ method, onCopy, copied }) => (
  <div className="space-y-2">
    <CopyRow label="Bank" value={method.bankName || ""} keyName="bank" onCopy={onCopy} copied={copied} />
    <CopyRow
      label="Account number"
      value={method.accountNumber || ""}
      keyName="account"
      onCopy={onCopy}
      copied={copied}
      mono
    />
    <CopyRow
      label="Account name"
      value={method.accountName || ""}
      keyName="name"
      onCopy={onCopy}
      copied={copied}
    />
  </div>
);

const PromptPayDetails: React.FC<{
  method: PaymentMethod;
  qrDataUrl: string | null;
  qrLoading: boolean;
  amount: number;
}> = ({ method, qrDataUrl, qrLoading, amount }) => (
  <div className="flex flex-col items-center gap-3">
    {qrLoading ? (
      <div className="w-56 h-56 rounded-md bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    ) : qrDataUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={qrDataUrl} alt="PromptPay QR" className="w-56 h-56 rounded-md border border-gray-200 bg-white p-2" />
    ) : (
      <div className="w-56 h-56 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
        QR unavailable
      </div>
    )}
    <p className="text-[11px] text-gray-500 text-center">
      Scan with any bank app · amount <strong>฿{formatMoney(amount)}</strong> baked in
    </p>
    {method.accountName && (
      <p className="text-[12px] font-bold text-gray-900 text-center">{method.accountName}</p>
    )}
    <p className="text-[10px] font-mono text-gray-400">
      ID: {method.promptpayId}
    </p>
  </div>
);

const StaticQrDetails: React.FC<{ method: PaymentMethod }> = ({ method }) => (
  <div className="flex flex-col items-center gap-3">
    {method.qrImageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={method.qrImageUrl}
        alt="QR"
        className="w-56 h-56 rounded-md border border-gray-200 object-contain bg-white p-2"
      />
    ) : (
      <div className="w-56 h-56 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">
        QR not uploaded
      </div>
    )}
    {method.accountName && (
      <p className="text-[12px] font-bold text-gray-900 text-center">{method.accountName}</p>
    )}
    <p className="text-[11px] text-amber-700 text-center">
      ⚠ This QR is fixed — make sure you transfer the exact total above.
    </p>
  </div>
);

const CopyRow: React.FC<{
  label: string;
  value: string;
  keyName: string;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
  mono?: boolean;
}> = ({ label, value, keyName, onCopy, copied, mono }) => (
  <div className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2">
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-[13px] text-gray-900 truncate ${mono ? "font-mono font-bold" : "font-bold"}`}>
        {value || "—"}
      </p>
    </div>
    {value && (
      <button
        onClick={() => onCopy(value, keyName)}
        className="px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-white border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1 flex-shrink-0"
      >
        {copied === keyName ? (
          <>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" /> Copy
          </>
        )}
      </button>
    )}
  </div>
);

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-100 focus:border-[#00aeff] focus:bg-white focus:outline-none transition-colors";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-bold text-gray-700">{label}</label>
    {children}
  </div>
);
