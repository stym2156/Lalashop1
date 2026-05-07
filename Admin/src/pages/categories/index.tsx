import React, { useEffect, useState } from 'react';
import {
  Search, Plus, Edit, Trash2, X, Save, Loader2, ToggleLeft, ToggleRight,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type AdminCategoryRow,
  type CategoryPayload,
} from '@/services/adminApi';

interface FormState {
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  icon: '',
  displayOrder: 0,
  isActive: true,
});

const CategoriesPage = () => {
  const [items, setItems] = useState<AdminCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminCategories();
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((c) =>
    !q ||
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.slug.toLowerCase().includes(q.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm({
      ...emptyForm(),
      displayOrder: items.length > 0 ? Math.max(...items.map((c) => c.displayOrder)) + 1 : 0,
    });
  };

  const openEdit = (c: AdminCategoryRow) => {
    setEditing(c);
    setCreating(false);
    setForm({
      name: c.name,
      description: c.description ?? '',
      icon: c.icon ?? '',
      displayOrder: c.displayOrder,
      isActive: c.isActive,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm());
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload: CategoryPayload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon.trim(),
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      };
      if (creating) {
        await createAdminCategory(payload);
      } else if (editing) {
        await updateAdminCategory(editing._id, payload);
      }
      await load();
      closeForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (c: AdminCategoryRow) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setBusyId(c._id);
    try {
      await deleteAdminCategory(c._id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const onToggleActive = async (c: AdminCategoryRow) => {
    setBusyId(c._id);
    try {
      await updateAdminCategory(c._id, { isActive: !c.isActive });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setBusyId(null);
    }
  };

  const onMove = async (c: AdminCategoryRow, dir: 'up' | 'down') => {
    setBusyId(c._id);
    try {
      const newOrder = dir === 'up' ? c.displayOrder - 1 : c.displayOrder + 1;
      await updateAdminCategory(c._id, { displayOrder: newOrder });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Reorder failed');
    } finally {
      setBusyId(null);
    }
  };

  const formOpen = creating || editing !== null;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={openCreate}
          className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Category
        </button>
        <span className="text-[11px] text-gray-400">
          {items.length} categor{items.length === 1 ? 'y' : 'ies'} · {items.filter((c) => c.isActive).length} active
        </span>
      </div>

      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Search category..."
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold w-16">Order</th>
                <th className="px-4 py-2 text-left font-semibold">Category Name</th>
                <th className="px-4 py-2 text-left font-semibold">Slug</th>
                <th className="px-4 py-2 text-left font-semibold">Description</th>
                <th className="px-4 py-2 text-right font-semibold">Products</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    Loading categories...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td>
                </tr>
              )}
              {!loading && !error && filtered.map((c) => (
                <tr key={c._id} className={!c.isActive ? 'opacity-60' : ''}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[11px] text-gray-600 w-4">{c.displayOrder}</span>
                      <button
                        disabled={busyId === c._id}
                        onClick={() => onMove(c, 'up')}
                        title="Move up"
                        className="text-gray-300 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={busyId === c._id}
                        onClick={() => onMove(c, 'down')}
                        title="Move down"
                        className="text-gray-300 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-500">/{c.slug}</td>
                  <td className="px-4 py-2 text-gray-700">
                    <p className="line-clamp-1 max-w-xs">{c.description || <span className="text-gray-300">—</span>}</p>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">{c.productCount.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <button
                      disabled={busyId === c._id}
                      onClick={() => onToggleActive(c)}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                        c.isActive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      {c.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {c.isActive ? 'active' : 'inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => openEdit(c)}
                        title="Edit"
                        className="text-gray-500 hover:text-black hover:bg-gray-100 rounded p-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={busyId === c._id || c.productCount > 0}
                        onClick={() => onDelete(c)}
                        title={c.productCount > 0 ? `${c.productCount} product(s) use this — cannot delete` : 'Delete'}
                        className="text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {q ? 'No categories match your search' : 'No categories yet — click "Create Category" to add one'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={closeForm} />
          <form
            onSubmit={onSubmit}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-base text-gray-900">
                {creating ? 'Create category' : `Edit "${editing?.name}"`}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">NAME</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Electronics"
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-[12px] outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">DESCRIPTION</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Optional description..."
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-[12px] outline-none focus:border-primary resize-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-semibold text-gray-500 tracking-wide">ICON (lucide name)</span>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="e.g. Monitor"
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-[12px] outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold text-gray-500 tracking-wide">DISPLAY ORDER</span>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-[12px] outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded accent-primary"
                />
                <span>Active (show on storefront)</span>
              </label>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                {creating ? 'Create' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
