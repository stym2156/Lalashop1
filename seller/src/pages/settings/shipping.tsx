import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Truck, MapPin,
} from "lucide-react";
import {
  fetchShopSettings,
  updateShopShipping,
  type ShopShipping,
  type ShippingZone,
} from "@/services/sellerApi";

const initial: ShopShipping = {
  enabled: true,
  freeShippingDefault: false,
  defaultRate: 50,
  defaultLeadDays: { min: 3, max: 7 },
  zones: [],
  defaultPackageWeight: 500,
  weightUnit: "g",
};

const newZone = (): ShippingZone => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  countries: [],
  rate: 0,
  freeShippingThreshold: 0,
  estimatedDays: { min: 3, max: 7 },
});

const ShippingSettings: React.FC = () => {
  const { t } = useTranslation("common");
  const [form, setForm] = useState<ShopShipping>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchShopSettings()
      .then((doc) => {
        if (cancelled || !doc) return;
        setForm({ ...initial, ...doc.shipping, zones: doc.shipping.zones || [] });
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
      await updateShopShipping(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.shippingSettings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const updateZone = (id: string, patch: Partial<ShippingZone>) => {
    setForm({
      ...form,
      zones: form.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)),
    });
  };

  const removeZone = (id: string) => {
    setForm({ ...form, zones: form.zones.filter((z) => z.id !== id) });
  };

  const addZone = () => {
    setForm({ ...form, zones: [...form.zones, newZone()] });
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
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.shippingSettings.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.shippingSettings.subtitle')}
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
          <CheckCircle2 className="w-3.5 h-3.5" /> {t("pages.shippingSettings.savedSuccessfully")}
        </div>
      )}

      <Section title={t("pages.shippingSettings.defaults")} hint={t("pages.shippingSettings.defaultsHint")}>
        <ToggleRow
          icon={Truck}
          title={t("pages.shippingSettings.enableShipping")}
          desc={t("pages.shippingSettings.enableShippingDesc")}
          checked={form.enabled}
          onChange={(v) => setForm({ ...form, enabled: v })}
        />
        <ToggleRow
          icon={CheckCircle2}
          title={t("pages.shippingSettings.freeShipDefault")}
          desc={t("pages.shippingSettings.freeShipDefaultDesc")}
          checked={form.freeShippingDefault}
          onChange={(v) => setForm({ ...form, freeShippingDefault: v })}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-7">
          <Field label={t("pages.shippingSettings.defaultRate")}>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={form.defaultRate}
              onChange={(e) => setForm({ ...form, defaultRate: Number(e.target.value) })}
            />
          </Field>
          <Field label={t("pages.shippingSettings.leadTimeDays")}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.defaultLeadDays.min}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultLeadDays: { ...form.defaultLeadDays, min: Number(e.target.value) },
                  })
                }
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.defaultLeadDays.max}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultLeadDays: { ...form.defaultLeadDays, max: Number(e.target.value) },
                  })
                }
              />
            </div>
          </Field>
          <Field label={t("pages.shippingSettings.defaultPackageWeight")}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.defaultPackageWeight}
                onChange={(e) =>
                  setForm({ ...form, defaultPackageWeight: Number(e.target.value) })
                }
              />
              <select
                className={`${inputCls} max-w-[80px]`}
                value={form.weightUnit}
                onChange={(e) =>
                  setForm({ ...form, weightUnit: e.target.value as "g" | "kg" })
                }
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </Field>
        </div>
      </Section>

      <Section
        title={t("pages.shippingSettings.shippingZones")}
        hint={t("pages.shippingSettings.shippingZonesHint")}
      >
        {form.zones.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MapPin className="w-7 h-7 mx-auto mb-2 text-gray-300" />
            <p className="text-[12px]">{t("pages.shippingSettings.noZones")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {form.zones.map((z) => (
              <div key={z.id} className="rounded-md border border-gray-100 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    className={`${inputCls} flex-1 mr-2`}
                    value={z.name}
                    onChange={(e) => updateZone(z.id, { name: e.target.value })}
                    placeholder={t("pages.shippingSettings.zoneName")}
                  />
                  <button
                    type="button"
                    onClick={() => removeZone(z.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Field label={t("pages.shippingSettings.countriesLabel")}>
                  <input
                    className={`${inputCls} font-mono`}
                    value={z.countries.join(", ")}
                    onChange={(e) =>
                      updateZone(z.id, {
                        countries: e.target.value
                          .split(",")
                          .map((c) => c.trim().toUpperCase())
                          .filter(Boolean),
                      })
                    }
                    placeholder={t("pages.shippingSettings.countriesPlaceholder")}
                  />
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label={t("pages.shippingSettings.rate")}>
                    <input
                      type="number"
                      min="0"
                      className={inputCls}
                      value={z.rate}
                      onChange={(e) => updateZone(z.id, { rate: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label={t("pages.shippingSettings.freeOver")}>
                    <input
                      type="number"
                      min="0"
                      className={inputCls}
                      value={z.freeShippingThreshold}
                      onChange={(e) =>
                        updateZone(z.id, { freeShippingThreshold: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label={t("pages.shippingSettings.daysMinMax")}>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        className={inputCls}
                        value={z.estimatedDays.min}
                        onChange={(e) =>
                          updateZone(z.id, {
                            estimatedDays: { ...z.estimatedDays, min: Number(e.target.value) },
                          })
                        }
                      />
                      <span className="text-gray-400">–</span>
                      <input
                        type="number"
                        min="0"
                        className={inputCls}
                        value={z.estimatedDays.max}
                        onChange={(e) =>
                          updateZone(z.id, {
                            estimatedDays: { ...z.estimatedDays, max: Number(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addZone}
          className="mt-2 inline-flex items-center text-[12px] font-bold text-[#00aeff] hover:underline"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> {t("pages.shippingSettings.addZone")}
        </button>
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
  icon: typeof Truck;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon: Icon, title, desc, checked, onChange }) => (
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
);

export default ShippingSettings;
