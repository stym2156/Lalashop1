import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Search, Camera, ClipboardList, ShoppingCart, Bell, Globe, Check, LogOut, Store, DollarSign, Menu, X } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";
import { SUPPORTED_LANGUAGES, setLanguage } from "@/i18n/config";

interface UserInfo {
  name: string;
  isAdmin: boolean;
}

interface AutocompleteItem {
  _id: string;
  name: string;
  price: number;
  category?: string;
  image?: string | string[];
  images?: string[];
}

export default function Header() {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();
  const selectedLang = i18n.language?.split("-")[0] || "th";
  const switchLang = (code: string) => {
    setLanguage(code);
    setIsLangOpen(false);
  };
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [acItems, setAcItems] = useState<AutocompleteItem[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [acLoading, setAcLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const isAuthed = token && token !== "null" && token !== "undefined";

    const fetchCartCount = async () => {
      if (!isAuthed) return;
      try {
        const data = await apiClient("/cart");
        const count = data?.cart?.items?.length || 0;
        setCartCount(count);
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    };

    const fetchNotificationCount = async () => {
      if (!isAuthed) return;
      try {
        const data = await apiClient("/notifications/unread-count");
        setNotificationCount(Number(data?.data?.count) || 0);
      } catch (error) {
        // silent — unauthenticated users / server errors should not crash the header
      }
    };

    fetchCartCount();
    fetchNotificationCount();

    // Refresh when user navigates back to the tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchNotificationCount();
    };

    // Poll while tab is open so newly-issued admin notifications show up
    const intervalId = window.setInterval(fetchNotificationCount, 30_000);

    window.addEventListener("cartUpdated", fetchCartCount);
    window.addEventListener("notificationsUpdated", fetchNotificationCount);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("cartUpdated", fetchCartCount);
      window.removeEventListener("notificationsUpdated", fetchNotificationCount);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, []);

  // Debounced autocomplete fetch — only when there's at least 1 char.
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term) {
      setAcItems([]);
      return;
    }
    const handle = setTimeout(async () => {
      setAcLoading(true);
      try {
        const res = await apiClient(
          `/products/autocomplete?q=${encodeURIComponent(term)}`
        );
        if (res?.success) setAcItems(res.data || []);
      } catch {
        /* silent — header is not critical UI */
      } finally {
        setAcLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Close the dropdown when clicking outside the input/dropdown.
  useEffect(() => {
    if (!acOpen) return;
    const onClick = (e: MouseEvent) => {
      if (acRef.current && !acRef.current.contains(e.target as Node)) {
        setAcOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [acOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    setUser(null);
    setIsMenuOpen(false);
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setAcOpen(false);
      // Search-driven storefront lives at /products. The Header bar is the
      // entry point — typing here always lands on /products?q=...
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const acCover = (item: AutocompleteItem): string => {
    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (typeof item.image === "string") return item.image;
    if (Array.isArray(item.image) && item.image.length > 0) return item.image[0];
    return "";
  };

  const navItems = [
    { icon: Bell, key: "notifications", label: t("nav.notifications"), href: "/Notificatio/Notifications" },
    { icon: ClipboardList, key: "orders", label: t("nav.orders"), href: "/orders/orders" },
    { icon: ShoppingCart, key: "cart", label: t("nav.cart"), href: "/cart/cart" },
    { icon: Store, key: "shop", label: t("nav.shop"), href: "/me/me" },
  ];

  const languages = SUPPORTED_LANGUAGES;

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="w-full mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between relative">

        {/* 1. Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-4 z-10">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-1 text-slate-600 active:scale-90 transition-transform"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="cursor-pointer" onClick={() => router.push("/")}>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              LALA
            </h1>
          </div>
        </div>

        {/* 2. Search Bar (Desktop) */}
        <div
          ref={acRef}
          className="hidden sm:block absolute left-1/2 -translate-x-1/2 w-full max-w-lg md:max-w-xl lg:max-w-2xl px-4"
        >
          <form onSubmit={handleSearch} className="relative group">
            <div className="flex items-center bg-gray-100 rounded-full px-6 py-2.5 border border-transparent focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-md transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder={t("header.searchPlaceholder")}
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 px-3 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAcOpen(true);
                }}
                onFocus={() => searchQuery.trim() && setAcOpen(true)}
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-400 hover:text-primary transition-colors">
                <Camera size={20} />
              </button>
              <div className="w-[1.5px] h-4 bg-gray-300 mx-2 opacity-50" />
              <button type="submit" className="text-primary font-bold text-sm px-2 hover:scale-110 transition-transform">
                {t("actions.search")}
              </button>
            </div>
          </form>

          {/* Autocomplete dropdown — sits directly under the search bar.
              Each row navigates straight to the product page; the last row
              jumps to the full /search page with the typed query. */}
          {acOpen && searchQuery.trim() && (
            <div className="absolute left-4 right-4 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
              {acLoading && (
                <div className="px-4 py-6 text-center text-[12px] text-gray-400">
                  {t("status.loading")}
                </div>
              )}
              {!acLoading && acItems.length === 0 && (
                <div className="px-4 py-6 text-center text-[12px] text-gray-400">
                  {t("header.searchPlaceholder")}
                </div>
              )}
              {!acLoading &&
                acItems.map((item) => {
                  const cover = acCover(item);
                  return (
                    <Link
                      key={item._id}
                      href={`/product/${item._id}`}
                      onClick={() => setAcOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 line-clamp-1">
                          {item.name}
                        </p>
                        {item.category && (
                          <p className="text-[10px] text-slate-400">{item.category}</p>
                        )}
                      </div>
                      <p className="text-[12px] font-black text-sky-600 tabular-nums flex-shrink-0">
                        {mounted ? t("common.currencySymbol", "฿") : "฿"}{Number(item.price || 0).toLocaleString()}
                      </p>
                    </Link>
                  );
                })}
              {!acLoading && (
                <Link
                  href={`/products?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setAcOpen(false)}
                  className="flex items-center justify-center gap-1 px-3 py-2.5 border-t border-slate-100 bg-slate-50 text-[12px] font-bold text-sky-600 hover:bg-slate-100"
                >
                  {t("actions.viewAll")} — &ldquo;{searchQuery}&rdquo;
                </Link>
              )}
            </div>
          )}
        </div>

        {/* 3. Right Icons */}
        <div className="flex items-center gap-3 sm:gap-6 z-10">

          {/* Mobile Cart Icon (Always visible on mobile header) */}
          <Link href="/cart/cart" className="sm:hidden relative p-2 text-slate-600 active:scale-90 transition-transform">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden sm:flex items-center gap-5 md:gap-7">
            {navItems.map((item) => {
              const badgeCount =
                item.key === "cart" ? cartCount :
                item.key === "notifications" ? notificationCount : 0;
              return (
                <Link key={item.key} href={item.href} className="flex flex-col items-center gap-1 group transition-all active:scale-90 relative">
                  <item.icon size={19} strokeWidth={2} className="text-slate-500 group-hover:text-primary transition-colors" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile / Language */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block relative">
              <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex flex-col items-center gap-1 group outline-none">
                <Globe size={18} className={`${isLangOpen ? 'text-primary' : 'group-hover:text-primary'} transition-colors`} />
                <span className="text-[10px] group-hover:text-primary transition-colors font-bold">{selectedLang}</span>
              </button>
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsLangOpen(false)} />
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-[60] animate-in fade-in zoom-in duration-200">
                    {languages.map((lang) => (
                      <button key={lang.code} onClick={() => switchLang(lang.code)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 text-xs font-bold">
                          <span>{lang.flag}</span>
                          <span className={selectedLang === lang.code ? 'text-primary' : 'text-slate-600'}>{lang.name}</span>
                        </div>
                        {selectedLang === lang.code && <Check size={14} className="text-primary" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3 sm:border-l sm:pl-4 border-gray-100">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[11px] font-black text-slate-800 leading-tight">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-primary text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[40]" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 z-[45] animate-in slide-in-from-top duration-300">
            <div className="p-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const badgeCount =
                  item.key === "cart" ? cartCount :
                  item.key === "notifications" ? notificationCount : 0;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <item.icon size={20} className="text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="h-px bg-gray-100 my-2" />
              <div className="p-2 grid grid-cols-5 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => switchLang(lang.code)}
                    className={`flex flex-col items-center p-2 rounded-lg gap-1 ${selectedLang === lang.code ? 'bg-primary/10 border-primary' : 'bg-gray-50 border-transparent'} border`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-[8px] font-black">{lang.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Search Bar */}
      <div className="w-full px-4 pb-3 sm:hidden">
        <form onSubmit={handleSearch} className="relative group">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:bg-white focus-within:shadow-sm focus-within:border-primary/20 transition-all">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              className="flex-1 bg-transparent outline-none text-xs text-slate-700 px-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="text-primary font-bold text-xs px-2">{t("actions.search")}</button>
          </div>
        </form>
      </div>
    </header>
  );
}
