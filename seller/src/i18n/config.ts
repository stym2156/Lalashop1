import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "@/locales/en/common.json";
import thCommon from "@/locales/th/common.json";
import zhCommon from "@/locales/zh/common.json";
import loCommon from "@/locales/lo/common.json";
import viCommon from "@/locales/vi/common.json";

export const LANG_STORAGE_KEY = "lalashop-seller:lang";

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
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function getStoredLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setLanguage(code: string): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }
  void i18n.changeLanguage(code);
}

export default i18n;
