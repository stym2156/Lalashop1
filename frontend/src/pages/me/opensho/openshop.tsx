"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { countries } from "./constants";
import Step1BusinessType from "./Step1BusinessType";
import Step2ShopInfo from "./Step2ShopInfo";
import Step3Identity from "./Step3Identity";
import Step4Warehouse from "./Step4Warehouse";
import { apiClient } from "@/services/apiClient";

interface OnboardingProps {
  onBack?: () => void;
  onComplete?: () => void;
}

export default function ShopOnboarding({ onBack, onComplete }: OnboardingProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [shopCategory, setShopCategory] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [agreed, setAgreed] = useState(false);

  // Load profile so we can pre-fill email + display the right account
  const [accountEmail, setAccountEmail] = useState("");

  useEffect(() => {
    let cached: any = {};
    try {
      cached = JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch {
      cached = {};
    }
    if (cached?.email) {
      setAccountEmail(cached.email);
      setShopEmail(cached.email);
    }
    apiClient("/auth/me")
      .then((res) => {
        const profile = res?.data || res;
        if (profile?.email) {
          setAccountEmail(profile.email);
          setShopEmail((prev) => prev || profile.email);
        }
      })
      .catch(() => {
        /* fall back to cached info */
      });
  }, []);

  // Step 2 state
  const [shopName, setShopName] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopAccount, setShopAccount] = useState("");
  // Bank name for the shop's payout account (free text — supports any local
  // bank). Stored in KycSubmission.shopInfo.bankName and snapshotted into
  // every Withdraw record at create time.
  const [bankName, setBankName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 3 state
  const [identityData, setIdentityData] = useState<any>({
    idType: "passport",
    firstName: "",
    middleName: "",
    lastName: "",
    idNumber: "",
    birthMonth: "",
    birthDay: "",
    birthYear: "",
    expiryMonth: "",
    expiryDay: "",
    expiryYear: "",
    resAddress: "",
    apartment: "",
    resCity: "",
    resState: "",
    resZip: "",
    addressOption: "business",
    tinNumber: "",
    licenseFile: null,
    licensePreview: null,
    idFile: null,
    idPreview: null,
  });

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const submitApplication = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fullAddress = [
        identityData.resAddress,
        identityData.apartment,
        identityData.resCity,
        identityData.resState,
        identityData.resZip,
        selectedCountry?.name,
      ]
        .filter((s) => s && String(s).trim() !== "")
        .join(", ");

      const birthDate = [identityData.birthYear, identityData.birthMonth, identityData.birthDay]
        .filter(Boolean)
        .join("-");
      const expiryDate = [identityData.expiryYear, identityData.expiryMonth, identityData.expiryDay]
        .filter(Boolean)
        .join("-");

      const payload = {
        businessType,
        shopInfo: {
          shopName,
          shopAccount,
          bankName,
          shopCategory,
          shopEmail,
          phoneNumber,
          isEmailVerified: false,
          isPhoneVerified: Boolean(verificationCode.trim()),
        },
        identity: {
          idType: identityData.idType,
          idNumber: identityData.idNumber,
          firstName: identityData.firstName,
          middleName: identityData.middleName,
          lastName: identityData.lastName,
          birthDate,
          expiryDate,
          tinNumber: identityData.tinNumber || "",
          address: {
            street: identityData.resAddress,
            apartment: identityData.apartment || "",
            city: identityData.resCity,
            state: identityData.resState,
            zip: identityData.resZip,
            country: selectedCountry?.name || "",
          },
        },
        warehouse: { fullAddress },
      };

      const formData = new FormData();
      formData.append("businessType", String(businessType || ""));
      formData.append("shopInfo", JSON.stringify(payload.shopInfo));
      formData.append("identity", JSON.stringify(payload.identity));
      formData.append("warehouse", JSON.stringify(payload.warehouse));
      if (identityData.licenseFile instanceof File) {
        formData.append("licenseFile", identityData.licenseFile);
      }
      if (identityData.idFile instanceof File) {
        formData.append("idFile", identityData.idFile);
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formData,
        headers: token && token !== "null" && token !== "undefined"
          ? { Authorization: `Bearer ${token}` }
          : undefined,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || t("pages.openshopPanel.failedSubmit"));
      }

      setIsSubmitted(true);
      if (onComplete) onComplete();
    } catch (err: any) {
      setSubmitError(err?.message || t("pages.openshopPanel.failedSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    const newErrors: Record<string, boolean> = {};

    if (step === 1 && !businessType) newErrors.businessType = true;

    if (step === 2) {
      if (!shopName.trim()) newErrors.shopName = true;
      if (!shopAccount.trim()) newErrors.shopAccount = true;
      if (!bankName.trim()) newErrors.bankName = true;
      if (!shopCategory) newErrors.shopCategory = true;
      // phoneNumber + verificationCode were removed from the Step 2 form,
      // so we no longer require them here. Phone is now optional and is
      // captured at registration / from the user's account profile.
    }

    if (step === 3) {
      if (!identityData.firstName.trim()) newErrors.firstName = true;
      if (!identityData.lastName.trim()) newErrors.lastName = true;
      if (!identityData.idNumber.trim()) newErrors.idNumber = true;
      if (!identityData.birthMonth || !identityData.birthDay || !identityData.birthYear) newErrors.birthDate = true;
      if (!identityData.expiryMonth || !identityData.expiryDay || !identityData.expiryYear) newErrors.expiryDate = true;
      if (!identityData.resAddress.trim()) newErrors.resAddress = true;
      if (!identityData.resCity.trim()) newErrors.resCity = true;
      if (!identityData.resState) newErrors.resState = true;
      if (!identityData.resZip.trim()) newErrors.resZip = true;
      if (!identityData.idFile) newErrors.idFile = true;
      if (businessType && businessType !== "individual" && !identityData.licenseFile) {
        newErrors.licenseFile = true;
      }
    }

    if (step === 4 && !agreed) newErrors.agreed = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (step < 4) {
      setStep(step + 1);
    } else {
      void submitApplication();
    }
  };

  const steps = [
    { id: 1, label: t("pages.openshopPanel.businessType") },
    { id: 2, label: t("pages.openshopPanel.storeInformation") },
    { id: 3, label: t("pages.openshopPanel.identityVerification") },
    { id: 4, label: t("pages.openshopPanel.warehouse") },
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-sm">
          <CheckCircle2 size={56} strokeWidth={2.5} />
        </div>
        <h2 className="text-[32px] font-bold text-dark mb-4">{t("pages.openshop.submitSuccess")}</h2>
        <p className="text-[16px] text-gray-500 max-w-md leading-relaxed mb-10 font-medium">
          {t("pages.openshopPanel.applicationReviewing")}
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-12 py-4 bg-primary text-white rounded-xl font-bold text-[15px] hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
        >
          {t("pages.openshopPanel.backToHome")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-dark antialiased w-full flex flex-col font-sans selection:bg-primary-soft">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#EEEEEE] flex items-center justify-between h-[56px] px-4 w-full">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="active:opacity-50 -ml-1 hover:bg-gray-50 p-1 rounded-full transition-colors">
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight text-dark">{t("pages.openshop.title")}</h1>
        </div>
      </nav>

      <div className="w-full h-[3px] bg-[#F4F5F7] flex">
        {steps.map((s) => (
          <div
            key={s.id}
            className={`flex-1 h-full transition-all duration-500 ${s.id <= step ? "bg-primary" : ""}`}
          />
        ))}
      </div>

      <main className="flex-1 w-full p-6 md:p-12 max-w-4xl mx-auto">
        {step === 1 && (
          <Step1BusinessType
            businessType={businessType}
            setBusinessType={(val) => { setBusinessType(val); setErrors({}); }}
            error={errors.businessType}
          />
        )}
        {step === 2 && (
          <Step2ShopInfo
            businessType={businessType}
            shopCategory={shopCategory} setShopCategory={setShopCategory}
            selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry}
            shopName={shopName} setShopName={setShopName}
            shopAccount={shopAccount} setShopAccount={setShopAccount}
            bankName={bankName} setBankName={setBankName}
            shopEmail={shopEmail} setShopEmail={setShopEmail}
            accountEmail={accountEmail}
            errors={errors}
          />
        )}
        {step === 3 && (
          <Step3Identity
            businessType={businessType}
            data={identityData}
            setData={setIdentityData}
            errors={errors}
          />
        )}
        {step === 4 && (
          <Step4Warehouse
            agreed={agreed}
            setAgreed={setAgreed}
            businessType={businessType}
            shopName={shopName}
            shopAccount={shopAccount}
            shopCategory={shopCategory}
            email={shopEmail}
            phone={phoneNumber}
            identityData={identityData}
            error={errors.agreed}
          />
        )}

        <div className="mt-12 flex flex-col items-end gap-3 pt-8 border-t border-gray-100">
          {submitError && (
            <div className="text-[13px] text-red-600 bg-red-50 px-4 py-2 rounded-md w-full text-center">
              {submitError}
            </div>
          )}
          <button
            onClick={nextStep}
            disabled={(step === 4 && !agreed) || submitting}
            className={`px-10 py-4 rounded-xl font-bold text-[15px] flex items-center gap-2 transition-all  tracking-widest ${((step === 4 && !agreed) || submitting)
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] active:scale-95"
              }`}
          >
            {step === 4 ? (submitting ? t("pages.openshopPanel.submittingApplication") : t("pages.openshopPanel.submitApplication")) : t("pages.openshopPanel.nextBtn")}
            {step === 4 ? <ChevronRight size={18} strokeWidth={3} /> : <ArrowRight size={18} strokeWidth={2.5} />}
          </button>
        </div>
      </main>
    </div>
  );
}
