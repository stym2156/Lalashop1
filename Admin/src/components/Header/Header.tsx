import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Bell, Search, User as UserIcon, MessageSquare, ChevronDown, LogOut, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminMe } from '@/services/authApi';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface AdminMe {
  _id?: string;
  name?: string;
  email?: string;
  customId?: string;
  adminRole?: string;
}

const Header = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const roleLabel: Record<string, string> = {
    super: t('roles.super'),
    finance: t('roles.finance'),
    support: t('roles.support'),
    content: t('roles.content'),
  };
  const [me, setMe] = useState<AdminMe | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') return;
    let cancelled = false;
    adminMe()
      .then((res) => {
        if (cancelled) return;
        if (res?._id) {
          setMe({
            _id: res._id,
            name: res.name,
            email: res.email,
            customId: res.customId,
            adminRole: (res as any).adminRole,
          });
        }
      })
      .catch(() => {
        // unauthenticated — leave me as null
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('admin');
    }
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/users/alluser?search=${encodeURIComponent(q)}`);
  };

  const displayName = me?.name || me?.email || 'Admin';
  const role = me?.adminRole ? roleLabel[me.adminRole] : me ? t('common.admin') : '—';
  const initial = (displayName || 'A').slice(0, 1).toUpperCase();

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
      <form onSubmit={handleSearch} className="flex items-center bg-gray-50 px-4 py-2 rounded-xl w-96 border border-gray-100 focus-within:border-primary transition-colors">
        <Search className="h-4 w-4 text-gray-400 mr-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('actions.search')}
          className="bg-transparent border-none outline-none text-sm w-full text-black placeholder:text-gray-400"
        />
      </form>

      <div className="flex items-center space-x-6">
        <LanguageSwitcher compact />

        <Link
          href="/notifications"
          className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-gray-600 relative"
          title={t('nav.dashboard')}
        >
          <Bell className="h-5 w-5" />
        </Link>

        <Link
          href="/reports"
          className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-gray-600 relative"
          title={t('nav.reports')}
        >
          <MessageSquare className="h-5 w-5" />
        </Link>

        <div className="h-10 w-[1px] bg-gray-100"></div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="text-right">
              <p className="text-sm font-bold text-black group-hover:text-primary transition-colors">
                {displayName}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">{role}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-primary-soft transition-all overflow-hidden border border-gray-100">
              {me ? (
                <span className="text-sm font-bold text-gray-700 group-hover:text-primary">{initial}</span>
              ) : (
                <UserIcon className="h-6 w-6 text-gray-400 group-hover:text-primary" />
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[200px] z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-[11px] text-gray-400">{t('auth.email')}</p>
                <p className="text-[12px] font-bold text-gray-900 truncate">{me?.email || '—'}</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
              >
                <UserCog className="w-3.5 h-3.5 text-gray-400" /> {t('nav.settings')}
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5" /> {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
