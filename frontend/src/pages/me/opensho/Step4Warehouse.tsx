"use client";
import React from "react";
import {
  Check, FileImage, Building2, Store, UserCircle2, FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  agreed: boolean;
  setAgreed: (val: boolean) => void;
  businessType: string | null;
  shopName: string;
  shopAccount: string;
  shopCategory: string;
  bankName: string;
  email: string;
  country: string;
  identityData: any;
  error?: boolean;
}

interface UploadedDoc {
  label: string;
  url: string;
  isImage: boolean;
}

interface Field {
  label: string;
  value: string;
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  fields: Field[];
}

const isImageFile = (file: File | null | undefined): boolean => {
  if (!file) return false;
  return file.type.startsWith("image/");
};

// Birth/expiry dates are stored as separate Y/M/D fields. Only emit a value
// when all three are filled, otherwise the user sees a misleading partial date.
const formatDate = (y: string, m: string, d: string): string => {
  if (!y || !m || !d) return "-";
  return `${y}-${m}-${d}`;
};

export default function Step4FinalReview({
  agreed, setAgreed, error,
  businessType, shopName, shopAccount, shopCategory, bankName,
  email, country, identityData,
}: Props) {
  const { t } = useTranslation("common");

  const businessTypeMap: Record<string, string> = {
    individual: t("openshopStep4More.businessTypeNames.individual"),
    sole_proprietor: t("openshopStep4More.businessTypeNames.sole_proprietor"),
    corporate: t("openshopStep4More.businessTypeNames.corporate"),
    partnership: t("openshopStep4More.businessTypeNames.partnership"),
  };

  const isIndividual = businessType === "individual";

  const fullName =
    [identityData.firstName, identityData.middleName, identityData.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "-";

  const fullAddress = [
    identityData.resAddress,
    identityData.apartment,
    identityData.resCity,
    identityData.resState,
    identityData.resZip,
    country,
  ]
    .filter((s: string) => s && String(s).trim() !== "")
    .join(", ");

  const birthDate = formatDate(
    identityData.birthYear,
    identityData.birthMonth,
    identityData.birthDay
  );
  const expiryDate = formatDate(
    identityData.expiryYear,
    identityData.expiryMonth,
    identityData.expiryDay
  );

  const idTypeLabel =
    identityData.idType === "passport"
      ? t("openshopStep4More.docLabels.passport")
      : t("openshopStep4More.docLabels.nationalId");

  const businessDocLabel = (() => {
    switch (businessType) {
      case "sole_proprietor":
        return t("openshopStep4More.docLabels.businessRegCert");
      case "corporate":
        return t("openshopStep4More.docLabels.companyBusinessLicense");
      case "partnership":
        return t("openshopStep4More.docLabels.partnershipAgreement");
      default:
        return t("openshopStep4More.docLabels.businessLicense");
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
          label: idTypeLabel,
          url: identityData.idPreview as string,
          isImage: isImageFile(identityData.idFile),
        }]
      : []),
  ];

  const businessTypeFields: Field[] = [
    {
      label: t("pages.openshopStep4.fieldBusinessType"),
      value: businessType ? businessTypeMap[businessType] : "-",
    },
  ];

  const shopFields: Field[] = [
    { label: t("pages.openshopStep4.fieldName"), value: shopName || "-" },
    { label: t("pages.openshopStep4.fieldCategory"), value: shopCategory || "-" },
    { label: t("pages.openshopStep4.fieldEmail"), value: email || "-" },
    { label: t("pages.openshopStep4.fieldBankName", "Bank Name"), value: bankName || "-" },
    { label: t("pages.openshopStep4.fieldAccountNumber", "Account Number"), value: shopAccount || "-" },
  ];

  const identityFields: Field[] = [
    { label: t("pages.openshopStep4.fieldIdType", "ID Type"), value: idTypeLabel },
    { label: t("pages.openshopStep4.fieldRepresentative"), value: fullName },
    { label: t("pages.openshopStep4.fieldIdPassport"), value: identityData.idNumber || "-" },
    { label: t("pages.openshopStep4.fieldBirthDate", "Date of Birth"), value: birthDate },
    { label: t("pages.openshopStep4.fieldExpiryDate", "ID Expiry Date"), value: expiryDate },
    ...(!isIndividual
      ? [{ label: t("pages.openshopStep4.fieldTinTax"), value: identityData.tinNumber || "-" }]
      : []),
    { label: t("pages.openshopStep4.fieldCountry", "Country"), value: country || "-" },
    {
      label: t("pages.openshopStep4.fieldAddress"),
      value: fullAddress || t("openshopStep4More.addressNotSpecified"),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 font-sans text-dark">
      <div className="space-y-2">
        <h2 className="text-[28px] font-bold tracking-tight text-dark">
          {t("pages.openshopStep4.reviewAndSubmit")}
        </h2>
        <p className="text-[12px] text-gray-500 font-medium">
          {t("pages.openshopStep4.reviewIntro")}
        </p>
      </div>

      <Section
        icon={<Building2 size={18} className="text-primary" />}
        title={t("pages.openshopPanel.businessType")}
        fields={businessTypeFields}
      />

      <Section
        icon={<Store size={18} className="text-primary" />}
        title={t("pages.openshopPanel.storeInformation")}
        fields={shopFields}
      />

      <Section
        icon={<UserCircle2 size={18} className="text-primary" />}
        title={t("pages.openshopPanel.identityVerification")}
        fields={identityFields}
      />

      <section className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 shadow-sm space-y-5">
        <h3 className="text-[18px] font-bold flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <FileText size={18} className="text-primary" />
          {t("pages.openshopStep4.uploadedDocs", "Uploaded Documents")}
        </h3>

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
                        {t("pages.openshopStep4.viewDoc")}
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
      </section>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-3">
        <p className="text-[14px] font-bold text-gray-800 tracking-tight">
          {t("pages.openshopStep4.confirmation")}
        </p>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              agreed ? "border-[#00a699] bg-[#00a699]" : "border-gray-300 bg-white"
            } ${error && !agreed ? "ring-2 ring-red-500/20" : ""}`}
          >
            {agreed && <Check size={14} className="text-white" strokeWidth={4} />}
          </div>
          <span className="text-[13px] font-medium text-gray-600 leading-relaxed">
            {t("pages.openshopStep4.termsAccept")}{" "}
            <span className="text-[#00a699] underline cursor-pointer">
              {t("pages.openshopStep4.termsOfService")}
            </span>
            .
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <h3 className="text-[16px] font-bold text-[#111111]">
          {t("pages.openshopStep1.whatToExpect")}
        </h3>
        <p className="text-[14px] text-gray-600 leading-relaxed font-medium">
          {t("pages.openshopStep4.reviewWithin23Days")}
        </p>
      </div>
    </div>
  );
}

function Section({ icon, title, fields }: SectionProps) {
  return (
    <section className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 shadow-sm space-y-5">
      <h3 className="text-[18px] font-bold flex items-center gap-2.5 pb-3 border-b border-gray-100">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {fields.map((f, i) => (
          <div key={i} className="space-y-1">
            <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400">
              {f.label}
            </p>
            <p className="text-[15px] font-medium text-gray-800 break-words">
              {f.value || "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
