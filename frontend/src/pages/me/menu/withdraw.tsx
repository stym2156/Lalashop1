import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  Info,
  ChevronRight,
  HelpCircle,
  History,
  Shield,
  Scan,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

interface WithdrawProps {
  onBack: () => void;
}

interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
}

interface Transaction {
  _id: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: "pending" | "approved" | "completed" | "rejected" | "failed";
  bankAccount: BankAccount;
  createdAt: string;
}

interface WithdrawRules {
  minAmount: number;
  maxAmount: number;
  feePercent: number;
  flatFee: number;
  processingDays: number;
  currency: string;
}

// Subset of the KYC submission we actually render. shopName here is the
// account holder name (per Step 2 form), shopAccount is the bank account
// number (digits-only), and bankName is the new bank-name field.
interface KycShopInfo {
  shopName?: string;
  shopAccount?: string;
  bankName?: string;
  shopCategory?: string;
  shopEmail?: string;
}

const PENDING_STATUSES = new Set(["pending", "approved"]);

export default function ShopWithdraw({ onBack }: WithdrawProps) {
  const { t } = useTranslation("common");
  // Withdraw is shop-bound — sellers can only payout to the bank account
  // tied to their KYC. Adding ad-hoc accounts here was removed; that lives
  // in profile settings → Bank Account / Finance instead.
  const [view, setView] = useState<"main" | "history">("main");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [posRevenue, setPosRevenue] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasWithdrawPin, setHasWithdrawPin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [rules, setRules] = useState<WithdrawRules | null>(null);
  const [historyTab, setHistoryTab] = useState<"pending" | "history">("pending");
  const [shopInfo, setShopInfo] = useState<KycShopInfo | null>(null);

  const fetchWithdrawals = async () => {
    try {
      const data = await apiClient("/withdraw/me");
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await apiClient("/auth/me");
      // /auth/me returns a flat envelope: { success, _id, name, balance, ... }
      // The previous resolver chain (`data?.data || data?.user || ...`) returned
      // undefined because none of those keys exist at the top level, so balance
      // stayed at 0. Pick the user fields directly from `data` if present.
      const profileData = data?.data || data?.user || data;
      if (profileData && (profileData._id || profileData.email)) {
        setBalance(Number(profileData.balance) || 0);
        setPosRevenue(Number(profileData.posRevenue) || 0);
        setHasWithdrawPin(!!profileData.hasWithdrawPin);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchRules = async () => {
    try {
      const data = await apiClient("/withdraw/rules");
      if (data.success) setRules(data.data);
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    }
  };

  const fetchKyc = async () => {
    // Pull the seller's KYC submission so we can show the registered shop
    // name + shop account on the withdrawal screens. If the user hasn't
    // completed KYC yet, the response is `{ data: null }` and we leave
    // shopInfo unset (the UI hides the shop card in that case).
    try {
      const data = await apiClient("/kyc/me");
      if (data?.success && data.data?.shopInfo) {
        setShopInfo(data.data.shopInfo);
      }
    } catch (error) {
      console.error("Failed to fetch KYC:", error);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchProfile();
    fetchRules();
    fetchKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingTxs = useMemo(
    () => transactions.filter((t) => PENDING_STATUSES.has(t.status)),
    [transactions]
  );
  const historyTxs = useMemo(
    () => transactions.filter((t) => !PENDING_STATUSES.has(t.status)),
    [transactions]
  );

  const initiateWithdrawal = () => {
    if (!hasWithdrawPin) {
      alert(t("pages.creatorWithdraw2.setPinAlert"));
      return;
    }
    if (!shopInfo?.shopAccount) {
      alert(t("pages.withdrawShop.noShopAccount"));
      return;
    }
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(t("pages.creatorWithdraw2.validAmount"));
      return;
    }
    if (rules && amount < rules.minAmount) {
      alert(t("pages.creatorWithdraw2.minWithdraw", { amount: rules.minAmount, currency: rules.currency }));
      return;
    }
    if (amount > balance) {
      alert(t("pages.creatorWithdraw2.insufficientBalance"));
      return;
    }
    setShowPinModal(true);
  };

  const handleWithdraw = async () => {
    if (pinInput.length !== 6) {
      alert(t("pages.creatorWithdraw2.enter6Pin"));
      return;
    }
    setLoading(true);
    try {
      // Backend snapshots bank info from the seller's KYC; we no longer pass
      // a bankId from the client.
      const response = await apiClient("/withdraw/create", {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          pin: pinInput,
        }),
      });

      if (response.success) {
        alert(t("pages.creatorWithdraw2.withdrawSuccess"));
        setWithdrawAmount("");
        setPinInput("");
        setShowPinModal(false);
        await Promise.all([fetchWithdrawals(), fetchProfile()]);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("pages.creatorWithdraw2.failedWithdraw");
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelTransaction = async (id: string) => {
    if (!confirm(t("pages.creatorWithdraw2.cancelConfirm"))) return;
    try {
      await apiClient(`/withdraw/${id}/cancel`, { method: "PUT" });
      await Promise.all([fetchWithdrawals(), fetchProfile()]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("pages.creatorWithdraw2.failedCancel");
      alert(message);
    }
  };

  if (view === "history") {
    const list = historyTab === "pending" ? pendingTxs : historyTxs;
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <div className="sticky top-0 z-50 bg-white flex items-center h-[56px] px-5 border-b border-[#EEEEEE]">
          <button onClick={() => setView("main")} className="active:opacity-50 transition-opacity -ml-1">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="ml-3 text-[16px] font-bold tracking-tight">{t("pages.withdrawShop.withdrawals")}</h1>
        </div>

        <div className="bg-white border-b border-[#EEEEEE] flex">
          {(["pending", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setHistoryTab(tab)}
              className={`flex-1 py-3 text-[13px] font-bold tracking-wide transition-colors relative ${
                historyTab === tab ? "text-[#121212]" : "text-[#86878B]"
              }`}
            >
              {tab === "pending" ? t("pages.withdrawShop.pendingCount", { count: pendingTxs.length }) : t("pages.withdrawShop.historyCount", { count: historyTxs.length })}
              {historyTab === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#121212] rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="divide-y divide-[#EEEEEE] bg-white">
          {list.length > 0 ? (
            list.map((tx) => (
              <div key={tx._id} className="p-5 flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">฿{tx.amount.toLocaleString()}</p>
                  <p className="text-[11px] text-[#86878B]">
                    {new Date(tx.createdAt).toLocaleString()} • {tx.bankAccount?.bankName}
                  </p>
                  {tx.fee > 0 && (
                    <p className="text-[10px] text-[#86878B] mt-0.5">
                      {t("pages.withdrawShop.feeNet", { fee: tx.fee.toFixed(2), net: tx.netAmount.toLocaleString() })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full tracking-wider ${
                      tx.status === "completed"
                        ? "bg-emerald-50 text-emerald-600"
                        : tx.status === "pending" || tx.status === "approved"
                        ? "text-green-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {tx.status}
                  </span>
                  {tx.status === "pending" && (
                    <button
                      onClick={() => cancelTransaction(tx._id)}
                      className="text-[10px] font-bold text-[#FE2C55] active:opacity-60"
                    >
                      {t("actions.cancel")}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-[#86878B]">
              <History size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-[13px] font-bold tracking-widest">
                {historyTab === "pending" ? t("pages.withdrawShop.noPending") : t("pages.withdrawShop.noHistoryYet")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#121212] antialiased font-sans">
      <div className="sticky top-0 z-50 bg-white flex items-center justify-between h-[56px] px-5 border-b border-[#EEEEEE]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="active:opacity-50 transition-opacity -ml-1">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="text-[16px] font-bold tracking-tight">{t("pages.withdrawShop.title")}</h1>
        </div>
        {/* Hover-only tooltip — no click. Group exposes the inner panel on
            hover/focus; keyboard users can still tab to it. */}
        <div className="relative group">
          <button
            type="button"
            className="text-[#121212] active:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#00aeff] rounded-full"
            aria-label={t("pages.withdrawShop.tooltipRules")}
            aria-describedby="shop-withdraw-rules-tip"
          >
            <HelpCircle size={20} strokeWidth={2} />
          </button>
          <div
            id="shop-withdraw-rules-tip"
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full mt-2 w-[300px] bg-white border border-slate-100 rounded-2xl shadow-xl p-4 text-[12px] text-slate-700 leading-relaxed opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:visible transition-all duration-150 z-50"
          >
            <p className="text-[11px] font-black text-slate-900 mb-2 tracking-wide">
              {t("pages.creatorWithdraw2.withdrawalRules")}
            </p>
            {rules ? (
              <>
                <div className="space-y-1.5 pb-2 border-b border-slate-50">
                  <RuleRow label={t("pages.creatorWithdraw2.minimum")} value={`฿${rules.minAmount.toLocaleString()}`} />
                  <RuleRow label={t("pages.creatorWithdraw2.maxPerRequest")} value={`฿${rules.maxAmount.toLocaleString()}`} />
                  <RuleRow
                    label={t("pages.creatorWithdraw2.fee")}
                    value={`${rules.feePercent}%${rules.flatFee > 0 ? ` + ฿${rules.flatFee}` : ""}`}
                  />
                  <RuleRow label={t("pages.creatorWithdraw2.processing")} value={t("pages.creatorWithdraw2.businessDays", { days: rules.processingDays })} />
                </div>
                <ul className="text-[10.5px] text-slate-500 list-disc pl-4 space-y-1 pt-2">
                  <li>{t("pages.withdrawShop.webSalesOnly")}</li>
                  <li>{t("pages.withdrawShop.buyerConfirms")}</li>
                  <li>{t("pages.withdrawShop.verifyBank")}</li>
                  <li>{t("pages.withdrawShop.pendingCancel")}</li>
                  <li>{t("pages.withdrawShop.setPinFirst")}</li>
                </ul>
              </>
            ) : (
              <p className="text-slate-400 text-[11px]">{t("pages.creatorWithdraw2.loadingRules")}</p>
            )}
          </div>
        </div>
      </div>

      <main className="w-full">
        <div className="bg-white px-6 py-10 border-b border-[#EEEEEE]">
          <div className="flex justify-between items-baseline mb-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">฿</span>
              <h2 className="text-[48px] font-bold leading-none tracking-tighter">{balance.toFixed(2)}</h2>
            </div>
          </div>

          {posRevenue > 0 && (
            <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
              <Scan size={12} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 tracking-wider">
                {t("pages.withdrawShop.posRevenueLabel", { amount: posRevenue.toLocaleString() })}
              </span>
            </div>
          )}
          {posRevenue === 0 && <div className="mb-8" />}

          <div className="mb-6">
            <label className="text-[10px] font-bold text-[#86878B] tracking-widest block mb-2">{t("pages.withdraw.amount")}</label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold">฿</span>
              <input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-6 py-3 text-3xl font-bold border-b-2 border-[#EEEEEE] focus:border-[#00aeff] outline-none transition-colors placeholder:text-[#EEEEEE]"
              />
              <button
                onClick={() => setWithdrawAmount(balance.toString())}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#00aeff]"
              >
                {t("pages.withdrawShop.maxBtn")}
              </button>
            </div>
            {rules && (
              <p className="mt-2 text-[10px] text-[#86878B] font-medium">
                {t("pages.withdrawShop.minMaxFeeShort", { min: rules.minAmount.toLocaleString(), max: rules.maxAmount.toLocaleString(), fee: rules.feePercent })}
              </p>
            )}
          </div>

          <button
            onClick={initiateWithdrawal}
            disabled={loading || !shopInfo?.shopAccount || !withdrawAmount}
            className={`w-full rounded-2xl px-12 font-bold py-4 text-[13px] tracking-[0.1em] transition-all ${
              loading || !shopInfo?.shopAccount || !withdrawAmount
                ? "bg-[#EEEEEE] text-[#C8C9CC] cursor-not-allowed"
                : "bg-[#00aeff] text-white active:opacity-80"
            }`}
          >
            {loading ? t("pages.withdrawShop.processingBtn") : t("pages.withdrawShop.withdrawNowBtn")}
          </button>
        </div>

        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 space-y-6 text-center">
                <div className="w-16 h-16 bg-blue-50 text-[#00aeff] rounded-full flex items-center justify-center mx-auto">
                  <Shield size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-800">{t("actions.verify")}</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {t("pages.withdrawShop.pinDescAmount", { amount: parseFloat(withdrawAmount || "0").toLocaleString() })}
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    className="w-full text-3xl font-black text-center tracking-[0.6em] py-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-[#00aeff] focus:bg-white transition-all outline-none"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput("");
                    }}
                    className="flex-1 py-4 text-xs font-black tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {t("actions.cancel")}
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={loading || pinInput.length !== 6}
                    className="flex-[2] py-4 bg-[#00aeff] text-white rounded-2xl text-xs font-black tracking-widest shadow-lg shadow-[#00aeff]/20 active:scale-95 transition-all disabled:opacity-30"
                  >
                    {loading ? t("pages.withdrawShop.verifying") : t("actions.confirm")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 bg-white border-y border-[#EEEEEE]">
          <div className="px-6 py-4 border-b border-[#F8F8F8]">
            <h3 className="text-[11px] font-bold text-[#121212] tracking-[0.15em]">{t("pages.withdrawShop.withdrawalDestination")}</h3>
          </div>

          <div className="divide-y divide-[#F8F8F8]">
            {/* Read-only — withdrawals are locked to the shop's KYC bank account.
                No click target, no navigation; the seller can only see where
                the payout will land. To change the bank, they must update KYC. */}
            <div className="w-full px-6 py-6">
              <span className="text-[14px] font-bold tracking-tight block">{t("pages.withdrawShop.paymentMethodsHdr")}</span>
              {shopInfo?.bankName && (
                <span className="text-[10px] font-black tracking-widest text-[#86878B] block mt-1">
                  {shopInfo.bankName}
                </span>
              )}
              <span className="text-[11px] font-bold text-[#00aeff] tracking-wider block mt-0.5 break-words">
                {shopInfo?.shopName || "—"}
              </span>
              {shopInfo?.shopAccount && (
                <span className="text-[11px] font-mono text-[#86878B] block mt-0.5 break-all">
                  {shopInfo.shopAccount}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setHistoryTab("pending");
                setView("history");
              }}
              className="w-full px-6 py-6 flex items-center justify-between active:bg-[#F9F9F9]"
            >
              <span className="text-[14px] font-bold tracking-tight">
                {t("pages.withdrawShop.pendingHistoryBtn")}
                {pendingTxs.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center text-[10px] bg-[#FE2C55] text-white px-1.5 rounded-full font-black">
                    {pendingTxs.length}
                  </span>
                )}
              </span>
              <ChevronRight size={18} strokeWidth={1.5} className="text-[#C8C9CC]" />
            </button>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="flex gap-3">
            <Info size={14} className="text-[#C8C9CC] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#86878B] leading-[1.8] font-medium">
              {t("pages.withdrawShop.afterReceipt")}{" "}
              <span className="text-[#121212]">{t("pages.withdrawShop.businessDaysSuffix", { days: rules?.processingDays ?? 7 })}</span>
              <br />
              {t("pages.withdrawShop.verifyBankInfo")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// One label-value row inside the rules tooltip. Tight spacing so the
// hover panel fits on small screens.
const RuleRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-baseline gap-2 text-[11px]">
    <span className="font-medium text-slate-500">{label}</span>
    <span className="font-bold text-slate-900 tabular-nums">{value}</span>
  </div>
);
