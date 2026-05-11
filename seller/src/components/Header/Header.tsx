import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, Search, User, LogOut, Settings, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentSeller } from '@/services/useCurrentSeller';
import { sellerLogout } from '@/services/authApi';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Header = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { seller } = useCurrentSeller();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = (): void => {
    sellerLogout();
    router.push('/login');
  };

  const shopName = seller?.name || seller?.username || seller?.email || 'My Shop';
  const sellerType = seller?.seller_type || 'Seller';

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
      <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl w-96 border border-gray-100">
        <Search className="h-4 w-4 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder={t('actions.search')}
          className="bg-transparent border-none outline-none text-sm w-full text-black placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center space-x-6">
        <LanguageSwitcher compact />

        <button className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all text-gray-600 relative">
          <Bell className="h-5 w-5" />
        </button>

        <div className="h-10 w-[1px] bg-gray-100"></div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="text-right">
              <p className="text-sm font-bold text-black group-hover:text-[#00aeff] transition-colors tracking-tight">
                {shopName}
              </p>
              <p className="text-[10px] text-gray-400 font-medium capitalize">{sellerType}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-[#00aeff]/10 transition-all overflow-hidden border border-gray-100">
              {seller?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={seller.profileImage}
                  alt={shopName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-gray-400 group-hover:text-[#00aeff]" />
              )}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[200px] z-40">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-[12px] font-bold text-black truncate">{shopName}</p>
                {seller?.email && (
                  <p className="text-[11px] text-gray-500 truncate">{seller.email}</p>
                )}
                {seller?.customId && (
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{seller.customId}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/settings/store');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Store className="w-3.5 h-3.5" /> {t('nav.shopProfile')}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/settings/integrations');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> {t('nav.settings')}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
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
