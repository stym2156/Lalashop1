"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Search as SearchIcon, X, SlidersHorizontal, ChevronDown, Loader2,
  TrendingUp, Clock, ArrowRight, Package, Star, AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import MainSidebar from "@/components/layout/MainSidebar";
import { apiClient } from "@/services/apiClient";

// Single product as returned by /api/products/search.
interface SearchProduct {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  image?: string | string[];
  images?: string[];
  countInStock?: number;
  rating?: number;
  numReviews?: number;
  soldCount?: number;
  freeShipping?: boolean;
}

interface CategoryFacet {
  _id: string;
  count: number;
}

interface SearchResponse {
  success: boolean;
  data: {
    items: SearchProduct[];
    total: number;
    page: number;
    pages: number;
    hasMore: boolean;
    facets: {
      categories: CategoryFacet[];
      priceBounds: { minPrice: number; maxPrice: number };
    };
    suggestions: SearchProduct[];
    query: string;
  };
}

interface TrendingTerm {
  term: string;
  hits: number;
}

type SortKey = "relevance" | "newest" | "priceAsc" | "priceDesc" | "popular";

const SORT_KEYS: SortKey[] = ["relevance", "popular", "newest", "priceAsc", "priceDesc"];

const HISTORY_KEY = "lalashop:recentSearches";
const HISTORY_MAX = 10;

const formatPrice = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const productCover = (p: SearchProduct): string => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string") return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return "";
};

// Wrap matched terms in <mark> for the highlight effect. Splits on the
// query (case-insensitive) so we keep the surrounding text's casing.
const highlight = (text: string, q: string): React.ReactNode => {
  if (!q) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-yellow-100 text-slate-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

export default function ProductListingPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const initialQ = typeof router.query.q === "string" ? router.query.q : "";

  const SORT_OPTIONS: { key: SortKey; label: string }[] = SORT_KEYS.map((key) => ({
    key,
    label: t(`pages.search.sort.${key}`),
  }));

  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [category, setCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [data, setData] = useState<SearchResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [trending, setTrending] = useState<TrendingTerm[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync URL ?q= → input on direct navigation / back-forward.
  useEffect(() => {
    if (typeof router.query.q === "string" && router.query.q !== q) {
      setQ(router.query.q);
      setDebouncedQ(router.query.q);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.q]);

  // Debounce typing → 300ms.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  // Load trending + history on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    apiClient("/products/trending-searches")
      .then((res) => {
        if (res?.success) setTrending(res.data || []);
      })
      .catch(() => {
        /* trending is best-effort */
      });
  }, []);

  // Persist successful search terms to localStorage.
  const pushHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    setHistory((prev) => {
      const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(
        0,
        HISTORY_MAX,
      );
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* quota — ignore */
      }
      return next;
    });
  }, []);

  // Fire search on any param change. Empty q is allowed — backend returns
  // the full catalog sorted by popularity, which doubles as the storefront.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "24");

    apiClient(`/products/search?${params.toString()}`)
      .then((raw: unknown) => {
        if (cancelled) return;
        const res = raw as SearchResponse;
        if (res?.success) {
          setData(res.data);
          if (debouncedQ) pushHistory(debouncedQ);
        } else {
          setError(t("status.error"));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("status.error"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQ, category, minPrice, maxPrice, sort, page, pushHistory]);

  // Mirror the active query in the URL (shallow) so links are shareable
  // and back/forward works.
  useEffect(() => {
    if (!router.isReady) return;
    const next = debouncedQ || undefined;
    const cur = typeof router.query.q === "string" ? router.query.q : "";
    if ((next || "") !== cur) {
      router.replace(
        { pathname: "/products", query: next ? { q: next } : {} },
        undefined,
        { shallow: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const clearAllFilters = () => {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("relevance");
    setPage(1);
  };

  const removeHistoryEntry = (term: string) => {
    setHistory((prev) => {
      const next = prev.filter((t) => t !== term);
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const items = data?.items || [];
  const total = data?.total ?? 0;
  const facets = data?.facets;
  const suggestions = data?.suggestions || [];

  // Discovery panel (history + trending) appears only when the user hasn't
  // typed anything AND no filters are applied. Once they search or filter,
  // we switch fully to results mode.
  const showDiscovery =
    !debouncedQ && !category && !minPrice && !maxPrice && (history.length > 0 || trending.length > 0);
  const noResults = !loading && !error && items.length === 0 && (debouncedQ || category || minPrice || maxPrice);

  const activeFilterCount = useMemo(
    () => [category, minPrice, maxPrice].filter(Boolean).length,
    [category, minPrice, maxPrice],
  );

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <MainSidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-16">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {/* ── Inline search input ── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
            <div className="relative">
              <SearchIcon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("pages.search.inputPlaceholder")}
                className="w-full pl-12 pr-12 py-3 text-[15px] bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-sky-300 outline-none transition-colors"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400"
                  aria-label={t("pages.search.clearSearch")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* ── Discovery panel (recent + trending) ── shown above results when
              the input is empty and no filters are active. */}
          {showDiscovery && (
            <div className="space-y-3 mb-4">
              {history.length > 0 && (
                <Section title={t("pages.search.recentSearches")} icon={Clock}>
                  <div className="flex flex-wrap gap-2">
                    {history.map((term) => (
                      <button
                        key={term}
                        onClick={() => setQ(term)}
                        className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[12px] font-medium text-slate-700"
                      >
                        {term}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            removeHistoryEntry(term);
                          }}
                          role="button"
                          tabIndex={0}
                          className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-slate-300/60 text-slate-400"
                        >
                          <X size={11} />
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>
              )}
              {trending.length > 0 && (
                <Section title={t("pages.search.trendingSearches")} icon={TrendingUp}>
                  <div className="flex flex-wrap gap-2">
                    {trending.map((t, i) => (
                      <button
                        key={t.term}
                        onClick={() => setQ(t.term)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-[12px] font-bold text-sky-700"
                      >
                        <span className="text-[10px] font-black text-sky-400">#{i + 1}</span>
                        {t.term}
                      </button>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* ── Results layout ── */}
          <div className="flex gap-4">
            <aside
              className={`${filtersOpen ? "block" : "hidden"} md:block md:w-64 flex-shrink-0`}
            >
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sticky top-4 space-y-5 max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-black tracking-wide text-slate-900">{t("pages.search.filtersUpper")}</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      {t("pages.search.clearAll")}
                    </button>
                  )}
                </div>

                {facets?.categories && facets.categories.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 mb-2 tracking-wide">
                      {t("pages.search.category")}
                    </p>
                    <div className="space-y-1">
                      {facets.categories.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => {
                            setCategory((prev) => (prev === c._id ? "" : c._id));
                            setPage(1);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[12px] transition-colors ${
                            category === c._id
                              ? "bg-sky-50 text-sky-700 font-bold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{c._id || t("product.uncategorized")}</span>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {c.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-black text-slate-400 mb-2 tracking-wide">
                    {t("pages.search.priceRange")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setPage(1);
                      }}
                      placeholder={t("pages.search.min")}
                      className="w-full px-2 py-1.5 rounded-md text-[12px] bg-slate-50 border border-transparent focus:border-sky-300 outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setPage(1);
                      }}
                      placeholder={t("pages.search.max")}
                      className="w-full px-2 py-1.5 rounded-md text-[12px] bg-slate-50 border border-transparent focus:border-sky-300 outline-none"
                    />
                  </div>
                  {facets?.priceBounds && facets.priceBounds.maxPrice > 0 && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      {t("pages.search.inResults", { min: formatPrice(facets.priceBounds.minPrice), max: formatPrice(facets.priceBounds.maxPrice) })}
                    </p>
                  )}
                </div>
              </div>
            </aside>

            {/* Results column */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 mb-3 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="md:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[12px] font-bold text-slate-700"
                >
                  <SlidersHorizontal size={14} />
                  {t("pages.search.filters")}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <p className="text-[12px] text-slate-500">
                  {loading ? (
                    t("pages.search.searching")
                  ) : (
                    <>
                      <strong className="text-slate-900 tabular-nums">{total.toLocaleString()}</strong>{" "}
                      {debouncedQ ? t("pages.search.result", { count: total }) : t("pages.search.product", { count: total })}
                      {debouncedQ && (
                        <>
                          {" "}{t("pages.search.for")} <strong className="text-slate-900">&ldquo;{debouncedQ}&rdquo;</strong>
                        </>
                      )}
                    </>
                  )}
                </p>

                <div className="ml-auto relative inline-block">
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as SortKey);
                      setPage(1);
                    }}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[12px] font-bold text-slate-700 cursor-pointer outline-none"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
                </div>
              ) : error ? (
                <div className="rounded-2xl bg-white border border-rose-100 px-4 py-12 text-center text-rose-600 text-sm">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  {error}
                </div>
              ) : noResults ? (
                <NoResults
                  query={debouncedQ}
                  suggestions={suggestions}
                  t={t}
                  onClear={() => {
                    setQ("");
                    clearAllFilters();
                  }}
                />
              ) : items.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-100 px-6 py-16 text-center">
                  <Package className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-700">{t("product.noProductsAvailable")}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((p) => (
                      <ProductCard key={p._id} product={p} q={debouncedQ} />
                    ))}
                  </div>

                  {data && data.pages > 1 && (
                    <Pagination
                      page={page}
                      pages={data.pages}
                      onChange={(n) => {
                        setPage(n);
                        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: typeof Clock;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-slate-400" />
      <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
    </div>
    {children}
  </div>
);

interface ProductCardProps {
  product: SearchProduct;
  q: string;
}
const ProductCard: React.FC<ProductCardProps> = ({ product, q }) => {
  const { t } = useTranslation("common");
  const cover = productCover(product);
  const stock = Number(product.countInStock || 0);
  const outOfStock = stock <= 0;
  return (
    <Link
      href={`/product/${product._id}`}
      className={`group block bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow ${
        outOfStock ? "opacity-60" : ""
      }`}
    >
      <div className="aspect-square relative bg-slate-50 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Package size={32} />
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-2 py-1 rounded bg-white text-[10px] font-black tracking-wide text-slate-900">
              {t("product.outOfStock")}
            </span>
          </div>
        )}
        {product.freeShipping && !outOfStock && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold">
            {t("product.freeShipping")}
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-[12px] font-bold text-slate-800 line-clamp-2 leading-snug min-h-[2.5em]">
          {highlight(product.name, q)}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-black text-sky-600 tabular-nums">
            ฿{formatPrice(product.price)}
          </p>
          {(product.rating ?? 0) > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
              <Star size={10} fill="currentColor" />
              {(product.rating ?? 0).toFixed(1)}
            </span>
          )}
        </div>
        {product.soldCount && product.soldCount > 0 ? (
          <p className="text-[10px] text-slate-400">{t("product.soldCount", { count: product.soldCount })}</p>
        ) : null}
      </div>
    </Link>
  );
};

interface NoResultsProps {
  query: string;
  suggestions: SearchProduct[];
  onClear: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}
const NoResults: React.FC<NoResultsProps> = ({ query, suggestions, onClear, t }) => (
  <div className="space-y-4">
    <div className="rounded-2xl bg-white border border-slate-100 px-6 py-12 text-center">
      <SearchIcon className="w-8 h-8 mx-auto text-slate-300 mb-3" />
      <p className="text-sm font-bold text-slate-900">
        {query ? t("pages.search.noResultsTitle", { query }) : t("pages.search.noResultsFilters")}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        {t("pages.search.noResultsHint")}
      </p>
      <button
        onClick={onClear}
        className="mt-4 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800"
      >
        {t("pages.search.clearSearchAndFilters")}
        <ArrowRight size={12} />
      </button>
    </div>
    {suggestions.length > 0 && (
      <div>
        <p className="text-[12px] font-bold text-slate-700 mb-2">{t("pages.search.youMightLike")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {suggestions.map((p) => (
            <ProductCard key={p._id} product={p} q="" />
          ))}
        </div>
      </div>
    )}
  </div>
);

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (n: number) => void;
}
const Pagination: React.FC<PaginationProps> = ({ page, pages, onChange }) => {
  // Compact range — first, last, current, and neighbours.
  const items: (number | "…")[] = [];
  const add = (n: number) => {
    if (!items.includes(n)) items.push(n);
  };
  add(1);
  for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
    if (items[items.length - 1] !== "…" && i - (items[items.length - 1] as number) > 1) {
      items.push("…");
    }
    add(i);
  }
  if (pages > 1) {
    if (items[items.length - 1] !== "…" && pages - (items[items.length - 1] as number) > 1) {
      items.push("…");
    }
    add(pages);
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button
        onClick={() => page > 1 && onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-md text-[12px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Prev
      </button>
      {items.map((it, i) =>
        it === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-slate-400 text-[12px]">
            …
          </span>
        ) : (
          <button
            key={it}
            onClick={() => onChange(it)}
            className={`min-w-[32px] h-8 rounded-md text-[12px] font-bold tabular-nums transition-colors ${
              it === page
                ? "bg-sky-500 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {it}
          </button>
        )
      )}
      <button
        onClick={() => page < pages && onChange(page + 1)}
        disabled={page >= pages}
        className="px-3 py-1.5 rounded-md text-[12px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};
