import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "@/locales/en/common.json";
import thCommon from "@/locales/th/common.json";
import zhCommon from "@/locales/zh/common.json";
import loCommon from "@/locales/lo/common.json";
import viCommon from "@/locales/vi/common.json";

export const SUPPORTED_LANGUAGES = [
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "lo", name: "ລາວ", flag: "🇱🇦" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const resources = {
  en: { common: enCommon },
  th: { common: thCommon },
  zh: { common: zhCommon },
  lo: { common: loCommon },
  vi: { common: viCommon },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      defaultNS: "common",
      ns: ["common"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "lalashop-seller:lang",
        caches: ["localStorage"],
      },
      react: { useSuspense: false },
    });
}

export default i18n;
