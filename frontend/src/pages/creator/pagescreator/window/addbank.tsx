import React, { useState } from "react";
import {
  ChevronLeft, Info, ChevronDown, Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";
import { laoBanks } from "@/pages/me/opensho/constants";

interface AddAccountProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AddBankAccount({ onBack, onSuccess }: AddAccountProps): JSX.Element {
  const { t } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Same canonical Lao bank list used by the shop opening Step 2 form so
  // creator and seller flows produce consistent bankName values across the
  // platform.
  const banks = laoBanks;

  const handleSubmit = async (): Promise<void> => {
    if (!selectedBank || !accountName || !accountNumber) {
      alert(t("pages.addBank.fillAll"));
      return;
    }

    setLoading(true);
    try {
      await apiClient("/bank/add", {
        method: "POST",
        body: JSON.stringify({
          bankName: selectedBank,
          accountNumber,
          accountName,
        }),
      });

      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("pages.addBank.cannotConnect");
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#121212] antialiased">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#EEEEEE] flex items-center h-[52px] px-4">
        <button onClick={onBack} className="active:opacity-50 transition-opacity -ml-1">
          <ChevronLeft size={26} strokeWidth={2.5} />
        </button>
        <h1 className="ml-3 text-[17px] font-bold tracking-tight">{t("pages.addBank.title")}</h1>
      </nav>

      <main className="w-full">
        <div className="px-5 py-3 bg-[#FFFBE6] border-b border-[#FFE58F] flex gap-2">
          <Info size={16} className="text-[#FAAD14] mt-0.5 shrink-0" />
          <p className="text-[12px] text-[#856404] leading-relaxed">
            {t("pages.addBank.nameMatchWarning")}
          </p>
        </div>

        <div className="mt-2 bg-white border-y border-[#EEEEEE]">
          {/* Full Name Input */}
          <div className="px-5 py-4 border-b border-[#F8F8F8]">
            <label className="text-[12px] font-bold text-[#86878B] tracking-wider block mb-2 ">
              {t("pages.addBank.fullNameEnglish")}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={t("pages.addBank.accountNamePlaceholder")}
                className="w-full py-1 text-[15px] font-medium outline-none placeholder:text-[#C8C9CC]"
              />
            </div>
          </div>

          {/* Bank Selection */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-5 py-5 flex items-center justify-between active:bg-[#FAFAFA] border-b border-[#F8F8F8]"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start text-left">
                <span className="text-[12px] font-bold text-[#86878B] tracking-wider ">{t("pages.addBank.bank")}</span>
                <span className={`text-[15px] font-medium text-left ${selectedBank ? "text-[#121212]" : "text-[#C8C9CC]"}`}>
                  {selectedBank || t("pages.addBank.selectBank")}
                </span>
              </div>
            </div>
            <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Bank List — scrollable since the canonical list has 25 entries */}
          {isOpen && (
            <div className="bg-[#FBFBFB] border-b border-[#F8F8F8] animate-in slide-in-from-top-2 duration-200 max-h-[320px] overflow-y-auto">
              {banks.map((bank) => (
                <div
                  key={bank}
                  onClick={() => {
                    setSelectedBank(bank);
                    setIsOpen(false);
                  }}
                  className="px-14 py-4 flex items-center justify-between active:bg-[#F0F7FF] cursor-pointer border-b border-[#F5F5F5] last:border-none"
                >
                  <span className={`text-[14px] font-medium ${selectedBank === bank ? "text-[#0077b6]" : "text-[#555555]"}`}>
                    {bank}
                  </span>
                  {selectedBank === bank && <Check size={18} className="text-[#0077b6]" />}
                </div>
              ))}
            </div>
          )}

          {/* Account Number Input */}
          <div className="px-5 py-4">
            <label className="text-[12px] font-bold text-[#86878B] tracking-wider block mb-2 ">
              {t("pages.addBank.bankAccountNumber")}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={t("pages.addBank.accountNumberPlaceholder")}
                className="w-full py-1 text-[16px] font-bold outline-none placeholder:font-normal placeholder:text-[#C8C9CC]"
              />
            </div>
          </div>
        </div>

        {/* Confirmation Button */}
        <div className="px-5 mt-10 pb-10">
          <button
            disabled={loading}
            onClick={handleSubmit}
            className={`w-full ${loading ? "bg-gray-400" : "bg-[#0077b6]"} text-white font-bold py-3.5 text-[15px] active:opacity-90 transition-all shadow-lg shadow-blue-100`}
          >
            {loading ? t("status.saving") : t("pages.addBank.submitAndSave")}
          </button>
          <p className="mt-4 text-[11px] text-[#86878B] text-center leading-relaxed px-4">
            {t("pages.addBank.consentBefore")} <span className="text-[#121212] font-bold">{t("pages.addBank.transferTerms")}</span> {t("pages.addBank.consentAfter")}
          </p>
        </div>
      </main>
    </div>
  );
}