import React, { useEffect, useState } from 'react';
import { Save, RotateCcw, Loader2, Lock } from 'lucide-react';
import {
  fetchAdminSettings,
  updateAdminSetting,
  type AdminSettingRow,
} from '@/services/adminApi';

const groupBadge: Record<string, string> = {
  general: 'bg-blue-50 text-blue-700',
  network: 'bg-purple-50 text-purple-700',
  system: 'bg-orange-50 text-orange-700',
  localization: 'bg-green-50 text-green-700',
  security: 'bg-red-50 text-red-700',
  finance: 'bg-amber-50 text-amber-700',
  kyc: 'bg-cyan-50 text-cyan-700',
  products: 'bg-indigo-50 text-indigo-700',
  social: 'bg-rose-50 text-rose-700',
};

const SettingsPage = () => {
  const [items, setItems] = useState<AdminSettingRow[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminSettings();
      const list = res.data ?? [];
      setItems(list);
      const initial: Record<string, string> = {};
      for (const s of list) initial[s.key] = s.value;
      setEdited(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (key: string) => {
    setBusyKey(key);
    setSavedKey(null);
    try {
      await updateAdminSetting(key, edited[key]);
      const item = items.find((s) => s.key === key);
      if (item) item.value = edited[key];
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusyKey(null);
    }
  };

  const onReset = (key: string) => {
    const item = items.find((s) => s.key === key);
    if (item) setEdited({ ...edited, [key]: item.value });
  };

  const groups = items.reduce<Record<string, AdminSettingRow[]>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg bg-blue-50 px-4 py-3 text-[12px] text-blue-700">
        Settings flagged as <span className="font-mono bg-white px-1 rounded">isPublic</span> are exposed at <code>/api/settings/public</code> for the storefront. Sensitive settings (finance, KYC) stay server-side.
      </div>

      {loading && (
        <div className="rounded-lg py-12 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      )}

      {!loading && !error && Object.entries(groups).map(([group, settings]) => (
        <div key={group} className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${groupBadge[group] ?? 'bg-gray-100 text-gray-600'}`}>
              {group}
            </span>
            <span className="text-[11px] text-gray-500">{settings.length} setting{settings.length === 1 ? '' : 's'}</span>
          </div>

          <div className="divide-y divide-gray-50">
            {settings.map((s) => {
              const dirty = edited[s.key] !== s.value;
              return (
                <div key={s.key} className="px-4 py-3 grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 md:col-span-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-gray-700">{s.key}</span>
                      {!s.isPublic && <Lock className="w-3 h-3 text-gray-300" />}
                    </div>
                    {s.description && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.description}</p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    {s.type === 'boolean' ? (
                      <select
                        value={edited[s.key] ?? 'false'}
                        onChange={(e) => setEdited({ ...edited, [s.key]: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 px-3 py-1.5 rounded outline-none focus:border-primary text-[12px]"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : s.type === 'json' ? (
                      <textarea
                        value={edited[s.key] ?? ''}
                        onChange={(e) => setEdited({ ...edited, [s.key]: e.target.value })}
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-100 px-3 py-1.5 rounded outline-none focus:border-primary text-[12px] font-mono resize-none"
                      />
                    ) : (
                      <input
                        type={s.type === 'number' ? 'number' : 'text'}
                        value={edited[s.key] ?? ''}
                        onChange={(e) => setEdited({ ...edited, [s.key]: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 px-3 py-1.5 rounded outline-none focus:border-primary text-[12px]"
                      />
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-3 flex items-center gap-1.5 justify-start md:justify-end">
                    {savedKey === s.key && (
                      <span className="text-[11px] text-green-700 font-medium">Saved</span>
                    )}
                    {dirty && busyKey !== s.key && (
                      <button
                        onClick={() => onReset(s.key)}
                        title="Reset"
                        className="px-2 py-1.5 rounded text-[11px] text-gray-600 hover:bg-gray-100"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      disabled={busyKey === s.key || !dirty}
                      onClick={() => onSave(s.key)}
                      className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900 disabled:opacity-30"
                    >
                      {busyKey === s.key ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg py-12 text-center text-gray-400 text-[12px]">
          No settings — defaults will be seeded on first load
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
