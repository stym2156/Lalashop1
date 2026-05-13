import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2, CheckCircle2, AlertCircle, Music2, Hash, Camera,
  MessageCircle, ShoppingBag,
} from "lucide-react";
import {
  fetchShopSettings,
  toggleIntegration,
  type IntegrationKey,
  type ShopIntegration,
} from "@/services/sellerApi";

interface IntegrationDef {
  key: IntegrationKey;
  name: string;
  desc: string;
  icon: typeof Music2;
  color: string;
  fieldLabel?: string;
  fieldPlaceholder?: string;
}

const IntegrationsPage: React.FC = () => {
  const { t } = useTranslation("common");

  const INTEGRATIONS: IntegrationDef[] = [
    {
      key: "tiktok",
      name: t("pages.integrations.tiktokName"),
      desc: t("pages.integrations.tiktokDesc"),
      icon: Music2,
      color: "from-black to-rose-600",
      fieldLabel: t("pages.integrations.tiktokField"),
      fieldPlaceholder: "@yourshop",
    },
    {
      key: "facebook",
      name: t("pages.integrations.facebookName"),
      desc: t("pages.integrations.facebookDesc"),
      icon: Hash,
      color: "from-blue-500 to-blue-700",
      fieldLabel: t("pages.integrations.facebookField"),
      fieldPlaceholder: "facebook.com/yourpage",
    },
    {
      key: "instagram",
      name: t("pages.integrations.instagramName"),
      desc: t("pages.integrations.instagramDesc"),
      icon: Camera,
      color: "from-pink-500 via-rose-500 to-amber-500",
      fieldLabel: t("pages.integrations.instagramField"),
      fieldPlaceholder: "@yourshop",
    },
    {
      key: "line",
      name: t("pages.integrations.lineName"),
      desc: t("pages.integrations.lineDesc"),
      icon: MessageCircle,
      color: "from-emerald-500 to-emerald-700",
      fieldLabel: t("pages.integrations.lineField"),
      fieldPlaceholder: "@your-oa-id",
    },
    {
      key: "shopify",
      name: t("pages.integrations.shopifyName"),
      desc: t("pages.integrations.shopifyDesc"),
      icon: ShoppingBag,
      color: "from-emerald-600 to-green-700",
      fieldLabel: t("pages.integrations.shopifyField"),
      fieldPlaceholder: "yourshop.myshopify.com",
    },
  ];
  const [items, setItems] = useState<ShopIntegration[]>([]);
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchShopSettings()
      .then((doc) => {
        if (cancelled || !doc) return;
        setItems(doc.integrations || []);
        const map: Record<string, string> = {};
        for (const i of doc.integrations || []) map[i.key] = i.account || "";
        setAccounts(map);
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

  const status = (key: IntegrationKey): boolean =>
    items.find((i) => i.key === key)?.enabled || false;

  const handleToggle = async (key: IntegrationKey, enabled: boolean) => {
    setSavingKey(key);
    setError(null);
    setSuccess(null);
    try {
      const updated = await toggleIntegration(key, enabled, accounts[key]);
      if (updated) {
        setItems(updated);
        setSuccess(t(enabled ? "pages.integrations.successConnected" : "pages.integrations.successDisconnected", { key }));
        setTimeout(() => setSuccess(null), 2500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.integrations.errUpdate"));
    } finally {
      setSavingKey(null);
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
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.integrations.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.integrations.subtitle')}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 inline-flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> {success}
        </div>
      )}

      <div className="space-y-3">
        {INTEGRATIONS.map((def) => {
          const Icon = def.icon;
          const enabled = status(def.key);
          const item = items.find((i) => i.key === def.key);
          return (
            <div key={def.key} className="rounded-lg border border-gray-100 p-4 flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-md bg-gradient-to-br ${def.color} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[13px] font-bold text-gray-900">{def.name}</h3>
                  {enabled ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide bg-emerald-100 text-emerald-700">
                      {t('pages.integrations.connected')}
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide bg-gray-100 text-gray-600">
                      {t('pages.integrations.disconnected')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{def.desc}</p>
                {def.fieldLabel && (
                  <input
                    className="mt-2 w-full max-w-sm px-3 py-1.5 rounded-md text-xs bg-gray-50 border border-gray-100 focus:border-[#00aeff] focus:bg-white focus:outline-none"
                    placeholder={def.fieldPlaceholder}
                    value={accounts[def.key] || ""}
                    onChange={(e) =>
                      setAccounts({ ...accounts, [def.key]: e.target.value })
                    }
                  />
                )}
                {item?.connectedAt && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t("pages.integrations.connectedAt", { date: new Date(item.connectedAt).toLocaleDateString() })}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggle(def.key, !enabled)}
                disabled={savingKey === def.key}
                className={`px-4 py-1.5 rounded-md text-xs font-bold inline-flex items-center disabled:opacity-50 ${
                  enabled
                    ? "border border-gray-200 text-gray-700 hover:bg-gray-50"
                    : "bg-[#00aeff] text-white hover:bg-[#0096db]"
                }`}
              >
                {savingKey === def.key ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : enabled ? (
                  t('actions.disconnect')
                ) : (
                  t('actions.connect')
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-gray-50 px-4 py-3 text-[11px] text-gray-500">
        {t("pages.integrations.footnote")}
      </div>
    </div>
  );
};

export default IntegrationsPage;
