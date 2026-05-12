"use client";
import React, { useEffect, useState } from "react";
import {
  Loader2, Store, CreditCard, MapPin, Building2, FileText, ExternalLink,
  CheckCircle2, Clock, XCircle, AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

// Read-only mirror of the seller's KYC submission. Sellers can review what
// they entered when opening their shop without leaving the settings page —
// edits still go through the KYC flow itself.
interface KycShopInfo {
  shopName?: string;
  shopAccount?: string;
  bankName?: string;
  shopCategory?: string;
  shopEmail?: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  entityName?: string;
}

interface KycIdentity {
  idType?: string;
  idNumber?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  birthDate?: string;
  expiryDate?: string;
  tinNumber?: string;
  businessLicenseUrl?: string;
  idDocumentUrl?: string;
  documents?: Array<{ url?: string; label?: string; uploadedAt?: string }>;
  address?: {
    street?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

interface KycSubmission {
  _id?: string;
  status?: "pending" | "approved" | "rejected";
  businessType?: string;
  shopInfo?: KycShopInfo;
  identity?: KycIdentity;
  warehouse?: { fullAddress?: string };
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

const buildAddress = (a?: KycIdentity["address"]): string => {
  if (!a) return "—";
  return (
    [a.street, a.apartment, a.city, a.state, a.zip, a.country]
      .filter((p) => p && String(p).trim())
      .join(", ") || "—"
  );
};

const STATUS_BANNER: Record<
  NonNullable<KycSubmission["status"]>,
  { icon: React.ReactNode; tone: string; label: string; blurb: string }
> = {
  approved: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    tone: "bg-emerald-50 border-emerald-100 text-emerald-900",
    label: "Approved",
    blurb: "Your shop is verified and live.",
  },
  pending: {
    icon: <Clock className="w-4 h-4 text-amber-600" />,
    tone: "bg-amber-50 border-amber-100 text-amber-900",
    label: "Pending review",
    blurb: "Our team is reviewing your submission. You'll be notified once approved.",
  },
  rejected: {
    icon: <XCircle className="w-4 h-4 text-rose-600" />,
    tone: "bg-rose-50 border-rose-100 text-rose-900",
    label: "Rejected",
    blurb: "Your KYC submission was rejected. See the reviewer note below.",
  },
};
// Note: STATUS_BANNER labels above are template-only and overridden below via t() lookups.

export const ShopDetailSection: React.FC = () => {
  const { t } = useTranslation("common");
  const [kyc, setKyc] = useState<KycSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient("/kyc/me")
      .then((res) => {
        if (cancelled) return;
        setKyc(res?.data ?? null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
    );
  }

  if (!kyc) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center space-y-3">
        <Store className="w-8 h-8 text-gray-300 mx-auto" />
        <p className="text-[13px] font-bold text-gray-700">{t("pages.shopDetailPanel.noSubmission")}</p>
        <p className="text-[11px] text-gray-500">
          {t("pages.shopDetailPanel2.openShopHint")}
        </p>
      </div>
    );
  }

  const banner = kyc.status ? STATUS_BANNER[kyc.status] : null;
  const fullName = [kyc.identity?.firstName, kyc.identity?.middleName, kyc.identity?.lastName]
    .filter((p) => p && String(p).trim())
    .join(" ") || "—";

  const docs: Array<{ label: string; url?: string }> = [];
  if (kyc.identity?.idDocumentUrl) {
    docs.push({
      label: `${kyc.identity.idType || "ID"} document`,
      url: kyc.identity.idDocumentUrl,
    });
  }
  if (kyc.identity?.businessLicenseUrl) {
    docs.push({ label: "Business license", url: kyc.identity.businessLicenseUrl });
  }
  (kyc.identity?.documents || []).forEach((d) => {
    docs.push({ label: d.label || "Supporting document", url: d.url });
  });

  return (
    <div className="space-y-5">
      {banner && (
        <div className={`rounded-xl border px-4 py-3 ${banner.tone}`}>
          <div className="flex items-start gap-2">
            {banner.icon}
            <div>
              <p className="text-[13px] font-bold">{banner.label}</p>
              <p className="text-[11px] mt-0.5">{banner.blurb}</p>
              {kyc.status === "rejected" && kyc.reviewNote && (
                <p className="text-[11px] font-bold mt-2">Reason: {kyc.reviewNote}</p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 inline-flex items-center gap-1">
            Submitted {formatDate(kyc.submittedAt)}
            {kyc.reviewedAt && <> · reviewed {formatDate(kyc.reviewedAt)}</>}
          </p>
        </div>
      )}

      <Section title={t("pages.shopDetailPanel2.shopInfo")} icon={Store}>
        <Row label={t("pages.shopDetailPanel2.accountHolderName")} value={kyc.shopInfo?.shopName} bold />
        <Row label={t("pages.shopDetailPanel2.bankName")} value={kyc.shopInfo?.bankName} />
        <Row label={t("pages.shopDetailPanel2.bankAccountNumber")} value={kyc.shopInfo?.shopAccount} mono />
        <Row label={t("pages.shopDetailPanel2.category")} value={kyc.shopInfo?.shopCategory} />
        <Row label={t("pages.shopDetailPanel2.businessType")} value={kyc.businessType} />
        <Row label={t("pages.shopDetailPanel2.entityName")} value={kyc.shopInfo?.entityName} />
        <Row
          label={t("pages.shopDetailPanel2.shopEmail")}
          value={kyc.shopInfo?.shopEmail}
          suffix={
            kyc.shopInfo?.isEmailVerified ? (
              <Badge tone="emerald">{t("pages.shopDetailPanel2.verifiedTag")}</Badge>
            ) : (
              <Badge tone="gray">{t("pages.shopDetailPanel2.unverifiedTag")}</Badge>
            )
          }
        />
        <Row
          label={t("pages.shopDetailPanel2.phone")}
          value={kyc.shopInfo?.phoneNumber}
          suffix={
            kyc.shopInfo?.isPhoneVerified ? (
              <Badge tone="emerald">{t("pages.shopDetailPanel2.verifiedTag")}</Badge>
            ) : (
              <Badge tone="gray">{t("pages.shopDetailPanel2.unverifiedTag")}</Badge>
            )
          }
        />
      </Section>

      <Section title={t("pages.shopDetailPanel2.ownerIdentity")} icon={CreditCard}>
        <Row label={t("pages.shopDetailPanel2.fullName")} value={fullName} bold />
        <Row label={t("pages.shopDetailPanel2.idType")} value={kyc.identity?.idType} />
        <Row label={t("pages.shopDetailPanel2.idNumber")} value={kyc.identity?.idNumber} mono />
        <Row label={t("pages.shopDetailPanel2.birthDate")} value={formatDate(kyc.identity?.birthDate)} />
        <Row label={t("pages.shopDetailPanel2.idExpiry")} value={formatDate(kyc.identity?.expiryDate)} />
        <Row label={t("pages.shopDetailPanel2.tinNumber")} value={kyc.identity?.tinNumber} mono />
      </Section>

      <Section title={t("pages.shopDetailPanel2.address")} icon={MapPin}>
        <p className="text-[12px] text-gray-700 leading-relaxed">{buildAddress(kyc.identity?.address)}</p>
      </Section>

      {kyc.warehouse?.fullAddress && (
        <Section title={t("pages.shopDetailPanel2.warehouse")} icon={Building2}>
          <p className="text-[12px] text-gray-700 leading-relaxed">{kyc.warehouse.fullAddress}</p>
        </Section>
      )}

      <Section title={t("pages.shopDetailPanel2.documents")} icon={FileText}>
        {docs.length === 0 ? (
          <p className="text-[12px] text-gray-400">{t("pages.shopDetailPanel.noDocs")}</p>
        ) : (
          <div className="space-y-2">
            {docs.map((d, i) => (
              <a
                key={`${d.label}-${i}`}
                href={d.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-gray-100 px-3 py-2 hover:bg-gray-50 inline-flex items-center justify-between gap-2 w-full text-[12px]"
              >
                <span className="font-bold text-gray-900">{d.label}</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            ))}
          </div>
        )}
      </Section>

      <div className="rounded-md bg-gray-50 px-4 py-3 inline-flex items-start gap-2 text-[11px] text-gray-600">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <p>
          {t("pages.shopDetailPanel2.lockedInfo")}
        </p>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: typeof Store;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, children }) => (
  <div className="rounded-lg border border-gray-100">
    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      <h3 className="text-[12px] font-bold text-gray-900">{title}</h3>
    </div>
    <div className="p-4 space-y-2">{children}</div>
  </div>
);

interface RowProps {
  label: string;
  value?: string;
  mono?: boolean;
  bold?: boolean;
  suffix?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ label, value, mono, bold, suffix }) => (
  <div className="flex items-center justify-between gap-3 py-1 border-b border-gray-50 last:border-b-0">
    <span className="text-[11px] text-gray-500">{label}</span>
    <span className="flex items-center gap-2 text-right">
      <span
        className={`text-[12px] text-gray-900 break-all ${mono ? "font-mono" : ""} ${
          bold ? "font-bold" : ""
        }`}
      >
        {value || "—"}
      </span>
      {suffix}
    </span>
  </div>
);

const Badge: React.FC<{ tone: "emerald" | "gray"; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <span
    className={`text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded ${
      tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
    }`}
  >
    {children}
  </span>
);
