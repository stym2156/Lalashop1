import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Tag, X, Plus, Search } from "lucide-react";
import {
  fetchCustomers,
  updateCustomerLabel,
  type SellerCustomer,
  type CustomerSegment,
} from "@/services/sellerApi";

const SEGMENT_OPTIONS: Array<{ value: CustomerSegment; label: string }> = [
  { value: "", label: "None" },
  { value: "vip", label: "VIP" },
  { value: "regular", label: "Regular" },
  { value: "new", label: "New" },
  { value: "inactive", label: "Inactive" },
  { value: "blocked", label: "Blocked" },
];

const SEGMENT_BADGE: Record<CustomerSegment, string> = {
  vip: "bg-amber-100 text-amber-700",
  regular: "bg-blue-100 text-blue-700",
  new: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  blocked: "bg-red-100 text-red-700",
  "": "",
};

const initial = (name?: string): string =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

const LabelsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [items, setItems] = useState<SellerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const list = await fetchCustomers();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [items]);

  const updateLocal = (id: string, patch: Partial<SellerCustomer>) => {
    setItems((prev) => prev.map((c) => (c._id === id ? { ...c, ...patch } : c)));
  };

  const handleAddTag = async (c: SellerCustomer, tag: string) => {
    const t = tag.trim();
    if (!t || c.tags.includes(t)) return;
    const newTags = [...c.tags, t];
    updateLocal(c._id, { tags: newTags });
    setSavingId(c._id);
    try {
      await updateCustomerLabel(c._id, { tags: newTags });
    } catch {
      updateLocal(c._id, { tags: c.tags });
    } finally {
      setSavingId(null);
    }
  };

  const handleRemoveTag = async (c: SellerCustomer, tag: string) => {
    const newTags = c.tags.filter((x) => x !== tag);
    updateLocal(c._id, { tags: newTags });
    setSavingId(c._id);
    try {
      await updateCustomerLabel(c._id, { tags: newTags });
    } catch {
      updateLocal(c._id, { tags: c.tags });
    } finally {
      setSavingId(null);
    }
  };

  const handleSegmentChange = async (c: SellerCustomer, segment: CustomerSegment) => {
    updateLocal(c._id, { segment });
    setSavingId(c._id);
    try {
      await updateCustomerLabel(c._id, { segment });
    } catch {
      updateLocal(c._id, { segment: c.segment });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.labels.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.labels.subtitle')}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers…"
            className="bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-md pl-8 pr-3 py-1.5 text-xs w-64"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-gray-500 tracking-wide">
              All tags:
            </span>
            {allTags.map((t) => (
              <span
                key={t}
                className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Tag className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">
            {items.length === 0 ? "No customers yet" : "No matches"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <CustomerRow
              key={c._id}
              customer={c}
              saving={savingId === c._id}
              onAddTag={(tag) => handleAddTag(c, tag)}
              onRemoveTag={(tag) => handleRemoveTag(c, tag)}
              onSegmentChange={(segment) => handleSegmentChange(c, segment)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CustomerRowProps {
  customer: SellerCustomer;
  saving: boolean;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onSegmentChange: (segment: CustomerSegment) => void;
}

const CustomerRow: React.FC<CustomerRowProps> = ({
  customer,
  saving,
  onAddTag,
  onRemoveTag,
  onSegmentChange,
}) => {
  const [tagInput, setTagInput] = useState("");

  const submitTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    onAddTag(tagInput);
    setTagInput("");
  };

  return (
    <div className="rounded-lg border border-gray-100 p-3 flex items-center gap-3 bg-white">
      {customer.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={customer.profileImage}
          alt=""
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {initial(customer.name || customer.username)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 truncate">
          {customer.name || customer.username || "Customer"}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {customer.tags.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700`}
            >
              {t}
              <button
                onClick={() => onRemoveTag(t)}
                className="text-blue-400 hover:text-red-600"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <form onSubmit={submitTag} className="inline-flex">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="+ tag"
              className="text-[10px] bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white outline-none rounded px-1.5 py-0.5 w-20"
            />
          </form>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <select
          value={customer.segment || ""}
          onChange={(e) => onSegmentChange(e.target.value as CustomerSegment)}
          className={`text-[10px] font-bold px-2 py-1 rounded border outline-none ${
            customer.segment ? SEGMENT_BADGE[customer.segment] + " border-transparent" : "border-gray-200"
          }`}
        >
          {SEGMENT_OPTIONS.map((o) => (
            <option key={o.value || "none"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {saving && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
      </div>
    </div>
  );
};

export default LabelsPage;
