import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle2, AlertCircle, CreditCard, Wallet, Banknote, Smartphone } from "lucide-react";
import {
  fetchShopSettings,
  updateShopPayment,
  type ShopPayment,
} from "@/services/sellerApi";

const initial: ShopPayment = {
  acceptCash: true,
  acceptBankTransfer: true,
  acceptCreditCard: false,
  acceptPromptPay: true,
  promptPayId: "",
  vatRegistered: false,
  vatNumber: "",
  vatPercent: 7,
  payoutSchedule: "weekly",
};

const PaymentSettings: React.FC = () => {
  const { t } = useTranslation("common");
  const [form, setForm] = useState<ShopPayment>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchShopSettings()
      .then((doc) => {
        if (cancelled || !doc) return;
        setForm({ ...initial, ...doc.payment });
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

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateShopPayment(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.paymentSettings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.paymentSettings.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.paymentSettings.subtitle')}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#00aeff] text-white px-4 py-2 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db] disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
          {saving ? t('actions.saving') : t('actions.saveChanges')}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 inline-flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> {t("pages.paymentSettings.savedSuccessfully")}
        </div>
      )}

      <Section title={t("pages.paymentSettings.acceptedMethods")}>
        <ToggleRow
          icon={Banknote}
          title={t("pages.paymentSettings.cod")}
          desc={t("pages.paymentSettings.codDesc")}
          checked={form.acceptCash}
          onChange={(v) => setForm({ ...form, acceptCash: v })}
        />
        <ToggleRow
          icon={Wallet}
          title={t("pages.paymentSettings.bankTransfer")}
          desc={t("pages.paymentSettings.bankTransferDesc")}
          checked={form.acceptBankTransfer}
          onChange={(v) => setForm({ ...form, acceptBankTransfer: v })}
        />
        <ToggleRow
          icon={CreditCard}
          title={t("pages.paymentSettings.creditCard")}
          desc={t("pages.paymentSettings.creditCardDesc")}
          checked={form.acceptCreditCard}
          onChange={(v) => setForm({ ...form, acceptCreditCard: v })}
        />
        <ToggleRow
          icon={Smartphone}
          title={t("pages.paymentSettings.promptPay")}
          desc={t("pages.paymentSettings.promptPayDesc")}
          checked={form.acceptPromptPay}
          onChange={(v) => setForm({ ...form, acceptPromptPay: v })}
        >
          {form.acceptPromptPay && (
            <div className="mt-2 pl-9">
              <input
                className={inputCls}
                value={form.promptPayId}
                onChange={(e) => setForm({ ...form, promptPayId: e.target.value })}
                placeholder={t("pages.paymentSettings.promptPayPlaceholder")}
              />
            </div>
          )}
        </ToggleRow>
      </Section>

      <Section title={t("pages.paymentSettings.vat")} hint={t("pages.paymentSettings.vatHint")}>
        <ToggleRow
          icon={CheckCircle2}
          title={t("pages.paymentSettings.vatRegistered")}
          desc={t("pages.paymentSettings.vatRegisteredDesc")}
          checked={form.vatRegistered}
          onChange={(v) => setForm({ ...form, vatRegistered: v })}
        />
        {form.vatRegistered && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
            <Field label={t("pages.paymentSettings.vatNumber")}>
              <input
                className={`${inputCls} font-mono`}
                value={form.vatNumber}
                onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                placeholder="0123456789012"
              />
            </Field>
            <Field label={t("pages.paymentSettings.vatRate")}>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className={inputCls}
                value={form.vatPercent}
                onChange={(e) => setForm({ ...form, vatPercent: Number(e.target.value) })}
              />
            </Field>
          </div>
        )}
      </Section>

      <Section title={t("pages.paymentSettings.payoutSchedule")} hint={t("pages.paymentSettings.payoutScheduleHint")}>
        <div className="grid grid-cols-3 gap-2">
          {(["weekly", "biweekly", "monthly"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm({ ...form, payoutSchedule: s })}
              className={`p-3 rounded-md border text-xs font-bold transition-colors ${
                form.payoutSchedule === s
                  ? "border-[#00aeff] bg-blue-50 text-[#00aeff]"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {t(`pages.paymentSettings.${s}`)}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
};

const inputCls =
  "w-full px-3 py-2 rounded-md text-sm bg-gray-50 border border-gray-100 focus:border-[#00aeff] focus:bg-white focus:outline-none transition-colors";

const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({
  title,
  hint,
  children,
}) => (
  <div className="rounded-lg bg-white border border-gray-100">
    <div className="px-4 py-3 border-b border-gray-100">
      <h3 className="text-sm font-bold text-black">{title}</h3>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-semibold text-gray-700">{label}</label>
    {children}
  </div>
);

interface ToggleRowProps {
  icon: typeof CreditCard;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  children?: React.ReactNode;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon: Icon, title, desc, checked, onChange, children }) => (
  <div>
    <label className="flex items-start gap-3 cursor-pointer">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-[12px] font-bold text-gray-900">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-[#00aeff]" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
    {children}
  </div>
);

export default PaymentSettings;
