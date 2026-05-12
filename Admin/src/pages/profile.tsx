import React, { useEffect, useState } from 'react';
import { ShieldCheck, Key, Smartphone, Mail, Save, User, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminMe, type MeResponse } from '@/services/authApi';
import { updateUser as updateAdminUser } from '@/services/adminApi';

type Tab = 'profile' | 'security' | 'sessions';

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const ProfilePage = () => {
  const { t } = useTranslation('common');
  const [tab, setTab] = useState<Tab>('profile');
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminMe()
      .then((res) => {
        if (cancelled) return;
        setMe(res);
        setEditName(res.name || '');
        setEditEmail(res.email || '');
        setEditPhone(res.phone || '');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!me?._id) return;
    setSaving(true);
    setSavedMessage(null);
    try {
      await updateAdminUser(me._id, { name: editName, email: editEmail, phone: editPhone });
      setSavedMessage(t('pages.profile.savedShort'));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('pages.profile.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-[13px] text-gray-400 py-12 text-center">{t('pages.profile.loadingProfile')}</div>;
  }

  if (error || !me) {
    return <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">{error || t('pages.profile.notAvailable')}</div>;
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex border-b border-gray-100 text-[12px]">
        {([
          { id: 'profile', label: t('pages.profile.tabProfile'), icon: User },
          { id: 'security', label: t('pages.profile.tabSecurity'), icon: ShieldCheck },
          { id: 'sessions', label: t('pages.profile.tabSessions'), icon: Activity },
        ] as { id: Tab; label: string; icon: typeof User }[]).map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`px-4 py-2.5 inline-flex items-center gap-2 -mb-px font-medium transition-colors ${
              tab === tabItem.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-black border-b-2 border-transparent'
            }`}
          >
            <tabItem.icon className="w-3.5 h-3.5" />
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('pages.profile.adminId')} value={me.customId || me._id || ''} readOnly />
            <Field label={t('pages.profile.role')} value={me.isAdmin ? t('pages.profile.roleAdmin') : t('pages.profile.roleUser')} readOnly />
            <Field label={t('pages.profile.fullName')} value={editName} onChange={setEditName} />
            <Field label={t('pages.profile.email')} value={editEmail} onChange={setEditEmail} />
            <Field label={t('pages.profile.phone')} value={editPhone} onChange={setEditPhone} />
            <Field label={t('pages.profile.username')} value={me.username || ''} readOnly />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? t('pages.profile.saving') : t('pages.profile.saveChanges')}
            </button>
            {savedMessage && (
              <span className="text-[12px] text-green-700 font-medium">{savedMessage}</span>
            )}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="max-w-2xl space-y-3">
          <SecurityRow icon={Key} title={t('pages.profile.secPasswordTitle')} description={t('pages.profile.secPasswordDesc')} actionLabel={t('pages.profile.secChange')} />
          <SecurityRow
            icon={Smartphone}
            title={t('pages.profile.secTwoFactorTitle')}
            description={t('pages.profile.secTwoFactorDesc')}
            actionLabel={t('pages.profile.secManage')}
          />
          <SecurityRow icon={Mail} title={t('pages.profile.secEmailTitle')} description={me.email || '—'} actionLabel={t('pages.profile.secUpdate')} />
          <SecurityRow icon={ShieldCheck} title={t('pages.profile.secBackupTitle')} description={t('pages.profile.secBackupDesc')} actionLabel={t('pages.profile.secSetup')} />
        </div>
      )}

      {tab === 'sessions' && (
        <div className="rounded-lg py-12 text-center text-gray-400 text-[12px]">
          {t('pages.profile.sessionsNotImpl')} <span className="font-mono">{(me as any).lastKnownIp || '—'}</span>
        </div>
      )}
    </div>
  );
};

const Field = ({
  label,
  value,
  readOnly,
  onChange,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange?: (v: string) => void;
}) => (
  <label className="block">
    <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</span>
    <input
      value={value}
      readOnly={readOnly}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={`w-full mt-1 py-2 px-3 rounded-md outline-none text-[12px] ${
        readOnly
          ? 'bg-gray-100 text-gray-500'
          : 'bg-gray-50 border border-gray-100 focus:border-primary text-gray-900'
      } transition-colors`}
    />
  </label>
);

const SecurityRow = ({
  icon: Icon,
  title,
  description,
  actionLabel,
}: {
  icon: typeof Key;
  title: string;
  description: string;
  actionLabel: string;
}) => (
  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-5 py-4">
    <div className="flex items-center gap-4">
      <Icon className="w-4 h-4 text-gray-400" />
      <div>
        <div className="font-semibold text-gray-900 text-[13px]">{title}</div>
        <div className="text-gray-500 text-[12px] mt-0.5">{description}</div>
      </div>
    </div>
    <button className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-100">
      {actionLabel}
    </button>
  </div>
);

export default ProfilePage;
