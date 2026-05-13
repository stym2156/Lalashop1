"use client";
import React, { useState } from "react";
import { ShieldCheck, ChevronDown, Info, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { countries, productCategories, laoBanks } from "./constants";

interface Props {
    businessType: string | null;
    shopCategory: string;
    setShopCategory: (val: string) => void;
    selectedCountry: typeof countries[0];
    setSelectedCountry: (val: typeof countries[0]) => void;
    shopAccount: string;
    setShopAccount: (val: string) => void;
    shopName: string;
    setShopName: (val: string) => void;
    bankName: string;
    setBankName: (val: string) => void;
    shopEmail: string;
    setShopEmail: (val: string) => void;
    accountEmail?: string;
    errors: Record<string, boolean>;
}

export default function Step2ShopInfo({
    businessType,
    shopCategory, setShopCategory,
    selectedCountry, setSelectedCountry,
    shopAccount, setShopAccount,
    shopName, setShopName,
    bankName, setBankName,
    shopEmail, setShopEmail,
    accountEmail,
    errors,
}: Props) {
    const { t } = useTranslation("common");
    const isIndividual = businessType === 'individual';
    const [entityName, setEntityName] = useState("");
    const [emailOption, setEmailOption] = useState<"current" | "other">("current");
    const [otherEmailInput, setOtherEmailInput] = useState("");
    const [otherEmailError, setOtherEmailError] = useState<string | null>(null);

    const fallbackEmail = accountEmail || "";

    const selectCurrentEmail = () => {
        setEmailOption("current");
        setOtherEmailError(null);
        setShopEmail(fallbackEmail);
    };

    const selectOtherEmail = () => {
        setEmailOption("other");
        if (otherEmailInput.trim()) setShopEmail(otherEmailInput.trim());
        else setShopEmail("");
    };

    const applyOtherEmail = () => {
        const value = otherEmailInput.trim();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!isValid) {
            setOtherEmailError(t("pages.openshopStep2More.invalidEmail"));
            return;
        }
        setOtherEmailError(null);
        setShopEmail(value);
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500 font-sans text-dark bg-gray-light p-1 md:p-4">

            {/* --- SECTION 1: Entity & Store Name --- */}
            <section className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm space-y-8">

                {/* Dynamic Business Entity Section */}
                {!isIndividual && (
                    <div className="space-y-6 pb-6 border-b border-gray-50">
                        <div className="flex items-center gap-2 text-primary">
                            <Info size={20} />
                            <h2 className="text-[18px] font-bold tracking-tight">{t("pages.openshopStep2.businessEntity")}</h2>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[14px] font-bold text-gray-700">
                                {businessType === 'partnership' ? t("pages.openshopStep2More.partnershipName") : t("pages.openshopStep2More.companyName")}
                            </label>
                            <input
                                type="text"
                                value={entityName}
                                onChange={(e) => setEntityName(e.target.value)}
                                placeholder={t("pages.openshopStep2More.entityPlaceholder")}
                                className="w-full border border-gray-border rounded-lg px-4 py-3 text-[15px] focus:border-primary outline-none bg-white transition-all font-bold"
                            />
                            <p className="text-[12px] text-gray-400 font-medium italic">
                                {t("pages.openshopStep2More.entityNote")}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-10">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-[20px] font-bold">{t("pages.openshopStep2.shopBankAccount")}</h2>

                        <div className="space-y-3">
                            <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                                {t("pages.openshopStep2More.bankInfoDesc")}
                            </p>

                            <input
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder={t("pages.openshopStep2.accountHolderName")}
                                className={`w-full border rounded-lg px-4 py-3 text-[15px] focus:border-primary outline-none bg-white transition-all ${errors.shopName
                                        ? "border-red-500 bg-red-50/10"
                                        : "border-gray-border"
                                    }`}
                            />

                            {/* Bank name — pick from Lao commercial banks. The */}
                            {/* "Other" entry exists for branch banks not in the */}
                            {/* canonical list. Required so admin payout sheets */}
                            {/* get a clean, normalised bank value. */}
                            <div className="relative">
                                <select
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className={`w-full border rounded-lg px-4 py-3 text-[15px] focus:border-primary outline-none appearance-none bg-white pr-10 transition-all cursor-pointer ${errors.bankName
                                            ? "border-red-500 bg-red-50/10"
                                            : "border-gray-border"
                                        } ${bankName ? "" : "text-gray-400"}`}
                                >
                                    <option value="" disabled>
                                        {t("pages.openshopStep2.selectBank")}
                                    </option>
                                    {laoBanks.map((b) => (
                                        <option key={b} value={b} className="text-dark">
                                            {b}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={18}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>

                            <input
                                type="text"
                                value={shopAccount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d+$/.test(val)) {
                                        setShopAccount(val);
                                    }
                                }}
                                placeholder={t("pages.openshopStep2.bankAccountNumber")}
                                className={`w-full border rounded-lg px-4 py-3 text-[15px] focus:border-primary outline-none bg-white transition-all ${errors.shopAccount
                                        ? "border-red-500 bg-red-50/10"
                                        : "border-gray-border"
                                    }`}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECTION 2: Main Products --- */}
            <section className="bg-white border border-gray-100 rounded-xl p-8 space-y-6 shadow-sm">
                <h2 className="text-[20px] font-bold">{t("pages.openshopStep2.mainProducts")}</h2>
                <div className="space-y-4">
                    <p className="text-[13px] text-gray-500 font-medium">
                        {t("pages.openshopStep2More.mainProductsDesc")}
                    </p>
                    <div className="relative">
                        <select
                            value={shopCategory}
                            onChange={(e) => setShopCategory(e.target.value)}
                            className={`w-full border rounded-lg px-4 py-3 text-[15px] focus:border-primary outline-none appearance-none bg-white font-medium cursor-pointer ${errors.shopCategory ? 'border-red-500 bg-red-50/10' : 'border-gray-border'}`}
                        >
                            <option value="">{t("pages.openshopStep2.selectMainCategory")}</option>
                            {productCategories.map(cat => (
                                <option key={cat.value} value={cat.value}>{t(`pages.productCategories.${cat.value}`)}</option>
                            ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </section>

            {/* --- SECTION 3: Secure Registration (Verification) --- */}
            <section className="bg-white border border-gray-100 rounded-xl p-8 space-y-8 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck size={24} />
                    <h2 className="text-[18px] font-bold">{t("pages.openshopStep2.secureRegistration")}</h2>
                </div>
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                    {t("pages.openshopStep2More.secureDesc")}
                </p>

                {/* Email Address */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-[15px] font-bold">{t("pages.openshopStep2More.emailAddress")}</h3>
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div onClick={selectCurrentEmail} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${emailOption === "current" ? "border-primary" : "border-gray-300"}`}>
                                {emailOption === "current" && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                            </div>
                            <span className="text-[14px] font-medium">{t("pages.openshopStep2More.useCurrent")}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div onClick={selectOtherEmail} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${emailOption === "other" ? "border-primary" : "border-gray-300"}`}>
                                {emailOption === "other" && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                            </div>
                            <span className="text-[14px] font-medium text-gray-500">{t("pages.openshopStep2More.useOther")}</span>
                        </label>
                    </div>

                    {emailOption === "current" ? (
                        <div className="max-w-md">
                            <div className="w-full border border-gray-200 rounded-lg px-4 py-3 text-[15px] bg-gray-50 font-bold text-gray-700 flex items-center justify-between">
                                <span className="truncate">
                                    {fallbackEmail || (
                                        <span className="text-gray-400 italic font-medium">{t("pages.openshopStep2More.noEmailOnAccount")}</span>
                                    )}
                                </span>
                            </div>
                            <p className="mt-2 text-[12px] text-gray-400">
                                {t("pages.openshopStep2More.currentEmailNote")}
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-md space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="text-[12px] font-bold text-gray-500 tracking-wide">
                                {t("pages.openshopStep2More.newEmailLabel")}
                            </label>
                            <div className={`flex items-stretch border rounded-lg overflow-hidden focus-within:border-primary transition-all ${otherEmailError ? 'border-red-500' : 'border-gray-border'}`}>
                                <input
                                    type="email"
                                    value={otherEmailInput}
                                    onChange={(e) => setOtherEmailInput(e.target.value)}
                                    placeholder={t("pages.openshopStep2More.emailPlaceholder")}
                                    className="flex-1 px-4 py-3 outline-none text-[15px] font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={applyOtherEmail}
                                    className="px-4 bg-primary text-white text-[12px] font-bold tracking-widest flex items-center gap-1 hover:bg-primary-hover transition-colors"
                                >
                                    <Plus size={14} /> {t("pages.openshopStep2More.add")}
                                </button>
                            </div>
                            {otherEmailError && (
                                <p className="text-[12px] text-red-600 font-medium">{otherEmailError}</p>
                            )}
                            {shopEmail && shopEmail !== fallbackEmail && !otherEmailError && (
                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md text-[13px]">
                                    <span className="text-gray-700 font-medium truncate">{shopEmail}</span>
                                    <button
                                        type="button"
                                        onClick={() => { setShopEmail(""); setOtherEmailInput(""); }}
                                        className="text-gray-400 hover:text-red-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
