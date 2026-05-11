import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Star, Search, MessageSquare, Loader2 } from "lucide-react";
import { fetchMyReviews, type SellerReviewRow } from "@/services/sellerApi";

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

const productImage = (p?: SellerReviewRow["product"]): string => {
  if (!p) return "";
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string") return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return "";
};

const ReviewsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [reviews, setReviews] = useState<SellerReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyReviews()
      .then((data) => {
        if (!cancelled) setReviews(data);
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

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filter !== "all" && Math.round(r.rating) !== Number(filter)) return false;
      if (!q) return true;
      const haystack = [r.comment, r.product?.name, r.user?.name, r.user?.username].join(" ").toLowerCase();
      return haystack.includes(q.toLowerCase());
    });
  }, [reviews, filter, q]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((n) => ({
      n,
      count: reviews.filter((r) => Math.round(r.rating) === n).length,
    }));
    return { total, avg, dist };
  }, [reviews]);

  return (
    <div className="space-y-4 text-sm">
      <h1 className="text-[16px] font-bold text-gray-900">{t('pages.reviews.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-100 px-5 py-4 text-center">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest">Average rating</p>
          <p className="text-[36px] font-black text-amber-500 tabular-nums leading-none mt-1">
            {stats.total > 0 ? stats.avg.toFixed(1) : "—"}
          </p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={14}
                className={n <= Math.round(stats.avg) ? "text-amber-400 fill-amber-400" : "text-gray-200"}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{stats.total} review{stats.total === 1 ? "" : "s"}</p>
        </div>

        <div className="md:col-span-2 rounded-lg border border-gray-100 px-5 py-4 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-2">
            Distribution
          </p>
          {stats.dist.map((d) => {
            const pct = stats.total > 0 ? (d.count / stats.total) * 100 : 0;
            return (
              <div key={d.n} className="flex items-center gap-2 text-[11px]">
                <span className="w-3 text-gray-600 font-bold">{d.n}</span>
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500 tabular-nums">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "5", "4", "3", "2", "1"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-[11px] font-bold ${
              filter === f
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? `All (${stats.total})` : `${f}★ (${stats.dist.find((d) => d.n === Number(f))?.count ?? 0})`}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search comment, product..."
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      <div className="space-y-2">
        {loading && (
          <div className="py-12 text-center text-gray-400 text-[12px]">
            <Loader2 className="w-5 h-5 mx-auto animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-[12px]">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            No reviews match this view
          </div>
        )}
        {!loading &&
          filtered.map((r) => {
            const cover = productImage(r.product);
            return (
              <div key={r._id} className="rounded-lg border border-gray-100 p-4 flex gap-4">
                <div className="w-12 h-12 rounded bg-gray-50 overflow-hidden flex-shrink-0">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={r.product?.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.product?._id && (
                      <Link
                        href={`/products/list`}
                        className="text-[12px] font-bold text-gray-900 hover:text-[#00aeff]"
                      >
                        {r.product.name}
                      </Link>
                    )}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={11}
                          className={n <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400">·</span>
                    <span className="text-[10px] text-gray-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="text-[12px] text-gray-700 mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {r.comment || <span className="text-gray-400 italic">(no comment)</span>}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    by <strong>{r.user?.username || r.user?.name || "user"}</strong>
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ReviewsPage;
