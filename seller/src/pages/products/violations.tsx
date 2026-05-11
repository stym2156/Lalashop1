import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2, Package, Shield } from "lucide-react";
import { fetchMyProducts, type SellerProductRow } from "@/services/sellerApi";

const productImage = (p: SellerProductRow): string => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string") return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return "";
};

const ViolationsPage: React.FC = () => {
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
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

  const flagged = useMemo(() => {
    return products.filter((p) => {
      const tags = p.tags || [];
      return tags.includes("violation") || tags.includes("reported") || tags.includes("banned");
    });
  }, [products]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">Policy violations</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          Products flagged by admin for policy issues. Review and remediate, or appeal via Support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI
          label="Banned"
          value={products.filter((p) => p.tags?.includes("banned")).length}
          tone="text-red-700"
        />
        <KPI
          label="Violations"
          value={products.filter((p) => p.tags?.includes("violation")).length}
          tone="text-amber-700"
        />
        <KPI
          label="Reported"
          value={products.filter((p) => p.tags?.includes("reported")).length}
          tone="text-orange-700"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      ) : flagged.length === 0 ? (
        <div className="py-16 text-center">
          <Shield className="w-8 h-8 mx-auto mb-3 text-emerald-300" />
          <p className="text-[13px] font-bold text-emerald-700">No violations 🎉</p>
          <p className="text-[11px] text-gray-500 mt-1">Your shop is in good standing.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {flagged.map((p) => {
            const cover = productImage(p);
            const reasons = (p.tags || []).filter((t) =>
              ["banned", "violation", "reported"].includes(t),
            );
            return (
              <div key={p._id} className="rounded-lg border border-amber-100 bg-amber-50/30 p-4 flex gap-4">
                <div className="w-12 h-12 rounded bg-white overflow-hidden flex-shrink-0">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={p.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12px] font-bold text-gray-900">{p.name}</p>
                    {reasons.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 capitalize"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Status: <span className="capitalize font-medium">{p.status}</span> · Stock {p.countInStock}
                  </p>
                </div>
                <Link
                  href="/support/tickets"
                  className="self-center text-[11px] font-bold text-[#00aeff] hover:underline inline-flex items-center"
                >
                  Appeal <AlertTriangle className="w-3 h-3 ml-1" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const KPI: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default ViolationsPage;
