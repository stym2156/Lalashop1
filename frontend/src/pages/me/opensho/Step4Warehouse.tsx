"use client";
import React from "react";
import {
  Check, ClipboardCheck, MapPin, FileImage,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  agreed: boolean;
  setAgreed: (val: boolean) => void;
  businessType: string | null;
  shopName: string;
  shopAccount: string;
  shopCategory: string;
  email: string;
  phone: string;
  identityData: any;
  error?: boolean;
}

interface UploadedDoc {
  label: string;
  url: string;
  isImage: boolean;
}

const isImageFile = (file: File | null | undefined): boolean => {
  if (!file) return false;
  return file.type.startsWith("image/");
};

export default function Step4FinalReview({
  agreed, setAgreed, error,
  businessType, shopName, shopAccount, shopCategory, email, phone, identityData,
}: Props) {
  const { t } = useTranslation("common");

  const businessTypeMap: Record<string, string> = {
    individual: "Individual",
    sole_proprietor: "Sole Proprietor",
    corporate: "Corporate",
    partnership: "Partnership",
  };

  const fullAddress = [
    identityData.resAddress,
    identityData.apartment,
    identityData.resCity,
    identityData.resState,
    identityData.resZip,
    identityData.country,
  ]
    .filter((s: string) => s && String(s).trim() !== "")
    .join(", ");

  const isIndividual = businessType === 'individual';

  const summaryData = {
    businessType: businessType ? businessTypeMap[businessType] : "-",
    shopName: shopName || "-",
    shopAccount: shopAccount || "-",
    shopCategory: shopCategory || "-",
    phone: phone || "-",
    email: email || "-",
    idNumber: identityData.idNumber || "-",
    tin: identityData.tinNumber || "-",
    applicantName: `${identityData.firstName || ""} ${identityData.lastName || ""}`.trim() || "-",
    address: fullAddress || "Address not specified",
  };

  const idDocLabel =
    identityData.idType === "passport" ? "Passport" : "National ID Card";

  const businessDocLabel = (() => {
    switch (businessType) {
      case "sole_proprietor": return "Business Registration Certificate";
      case "corporate": return "Company Business License";
      case "partnership": return "Partnership Agreement";
      default: return "Business License";
    }
  })();

  const uploadedDocs: UploadedDoc[] = [
    ...(identityData.licensePreview && identityData.licenseFile
      ? [{
          label: businessDocLabel,
          url: identityData.licensePreview as string,
          isImage: isImageFile(identityData.licenseFile),
        }]
      : []),
    ...(identityData.idPreview && identityData.idFile
      ? [{
          label: idDocLabel,
          url: identityData.idPreview as string,
          isImage: isImageFile(identityData.idFile),
        }]
      : []),
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300 font-sans text-dark">
      <div className="space-y-2">
        <h2 className="text-[28px] font-bold tracking-tight text-dark">{t("pages.openshopStep4.reviewAndSubmit")}</h2>
        <p className="text-[12px] text-gray-500 font-medium">
          {t("pages.openshopStep4.reviewIntro")}
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-white  border-gray-100 rounded-xl p-8 space-y-6 shadow-sm">
          <h3 className="text-[20px] font-bold flex items-center gap-2">
            <ClipboardCheck size={20} className="text-primary" /> {t("pages.openshopStep4.registrationSummary")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {[
              { label: "Business Type", value: summaryData.businessType },
              { label: "Name", value: summaryData.shopName },
              { label: "Category", value: summaryData.shopCategory },
              { label: "Email ", value: summaryData.email },
              { label: "Phone", value: summaryData.phone },
              ...(!isIndividual ? [{ label: "Tax ID (TIN)", value: summaryData.tin }] : []),
              { label: "ID / Passport", value: summaryData.idNumber },
              { label: "Representative", value: summaryData.applicantName },
              { label: "Address", value: summaryData.address },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[14px] font-bold text-dark">{item.label}</p>
                <p className="text-[15px] font-medium text-gray-600">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Uploaded Documents */}
          <div className="pt-6 border-t border-gray-100">
            
            {uploadedDocs.length === 0 ? (
              <div className="text-[13px] text-gray-400 italic font-medium px-4 py-6 bg-gray-50 rounded-lg text-center">
                {t("pages.openshopStep4.noDocs")}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedDocs.map((doc, i) => (
                  <div
                    key={`${doc.label}-${i}`}
                    className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50 flex flex-col"
                  >
                    <div className="aspect-[3/4] bg-white flex items-center justify-center overflow-hidden">
                      {doc.isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={doc.url}
                          alt={doc.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 px-2 text-center">
                          <FileImage size={32} strokeWidth={1.5} />
                          <p className="mt-1 text-[10px] font-bold tracking-widest">PDF</p>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 text-[10px] text-primary underline font-bold"
                          >
                            View
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2 bg-white border-t border-gray-100">
                      <p className="text-[11px] font-bold text-gray-500 tracking-wide truncate">
                        {doc.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className={`p-6  ${error ? '' : ''}`}>
          <p className="text-[14px] font-bold text-gray-800  tracking-tight">{t("pages.openshopStep4.confirmation")}</p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setAgreed(!agreed)}
              className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${agreed ? "border-[#00a699] bg-[#00a699]" : "border-gray-300 bg-white"
                } ${error && !agreed ? 'ring-2 ring-red-500/20' : ''}`}
            >
              {agreed && <Check size={14} className="text-white" strokeWidth={4} />}
            </div>
            <span className="text-[13px] font-medium text-gray-600 leading-relaxed">
              {t("pages.openshopStep4.termsAccept")} <span className="text-[#00a699] underline cursor-pointer">{t("pages.openshopStep4.termsOfService")}</span>.
            </span>
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="text-[16px] font-bold text-[#111111]">{t("pages.openshopStep1.whatToExpect")}</h3>
          <p className="text-[14px] text-gray-600 leading-relaxed font-medium">
            We will review your information within 2-3 business days. If we need more information or have questions, we will contact you via your registered email or phone number.
          </p>
        </div>
      </div>
    </div>
  );
}
