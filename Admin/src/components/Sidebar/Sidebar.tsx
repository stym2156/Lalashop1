import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Store, Layers,
  ShoppingBag, Settings, LogOut, Wallet, ChevronDown, ArrowLeftRight, Bell,
  ShieldCheck, Package, FileWarning, UserCog, BadgeCheck, LifeBuoy, Banknote,
} from 'lucide-react';

const Sidebar = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [openStates, setOpenStates] = useState<{ [key: string]: boolean }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { key: 'dashboard', name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },

    {
      key: 'users',
      name: t('nav.users'),
      href: '/users',
      icon: Users,
      subItems: [
        { key: 'allUsers', name: t('nav.allUsers'), href: '/users/alluser' },
      ],
    },

    {
      key: 'shops',
      name: t('nav.shops'),
      href: '/shops/shopcenter',
      icon: Store,
      subItems: [
        { key: 'allShops', name: t('nav.allShops'), href: '/shops/shopcenter' },
      ],
    },
    {
      key: 'products',
      name: t('nav.products'),
      href: '/products',
      icon: Package,
      subItems: [
        { key: 'allProducts', name: t('nav.allProducts'), href: '/products' },
        { key: 'pendingReview', name: t('nav.pendingReview'), href: '/products/pending' },
        { key: 'violations', name: t('nav.violations'), href: '/products/violations' },
        { key: 'banned', name: t('nav.banned'), href: '/products/banned' },
        { key: 'featured', name: t('nav.featured'), href: '/products/featured' },
      ],
    },
    {
      key: 'orders',
      name: t('nav.orders'),
      href: '/orders',
      icon: ShoppingBag,
      subItems: [
        { key: 'allOrders', name: t('nav.allOrders'), href: '/orders' },
        { key: 'disputes', name: t('nav.disputes'), href: '/orders/disputes' },
        { key: 'refunds', name: t('nav.refunds'), href: '/orders/refunds' },
        { key: 'cancelled', name: t('nav.cancelled'), href: '/orders/cancelled' },
      ],
    },
    {
      key: 'transactions',
      name: t('nav.transactions'),
      href: '/withdrawpage',
      icon: Wallet,
      subItems: [
        { key: 'sellerWithdrawals', name: t('nav.sellerWithdrawals'), href: '/withdrawpage/Seller/SellerWithdrawals' },
        { key: 'creatorWithdrawals', name: t('nav.creatorWithdrawals'), href: '/withdrawpage/creator/CreatorWithdrawals' },
        { key: 'payment', name: t('nav.payment'), href: '/withdrawpage/payment/payment' },
      ],
    },
    {
      key: 'paymentMethods',
      name: t('nav.payment'),
      href: '/payment/methods',
      icon: Banknote,
    },
    { key: 'categories', name: t('nav.categories'), href: '/categories', icon: Layers },
    { key: 'history', name: t('nav.history'), href: '/history/history', icon: ArrowLeftRight },
    { key: 'notifications', name: t('nav.notifications'), href: '/notifications', icon: Bell },
    { key: 'kyc', name: t('nav.kyc'), href: '/kyc', icon: BadgeCheck },
    {
      key: 'admins',
      name: t('nav.admins'),
      href: '/admins',
      icon: ShieldCheck,
      subItems: [
        { key: 'adminAccounts', name: t('nav.adminAccounts'), href: '/admins' },
        { key: 'rolesAndPermissions', name: t('nav.rolesAndPermissions'), href: '/admins/roles' },
        { key: 'auditLog', name: t('nav.auditLog'), href: '/admins/audit' },
      ],
    },
    { key: 'reports', name: t('nav.reports'), href: '/reports', icon: FileWarning },
    { key: 'support', name: t('nav.support'), href: '/support', icon: LifeBuoy },
    { key: 'profile', name: t('nav.profile'), href: '/profile', icon: UserCog },
    { key: 'systemSettings', name: t('nav.systemSettings'), href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    const currentPath = router.pathname;
    navItems.forEach((item) => {
      if (item.subItems?.some((sub) => currentPath === sub.href) || currentPath === item.href) {
        setOpenStates((prev) => ({ ...prev, [item.key]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  const toggleMenu = (key: string) => {
    setOpenStates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col w-72 bg-white border-r border-gray-200 h-full text-black">
      {/* Brand */}
      <div className="flex items-center px-8 h-20 border-b border-gray-100">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tight">
            lalashop <span className="text-primary">admin</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 px-4 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isOpen = openStates[item.key];
            const isActive =
              router.pathname === item.href ||
              item.subItems?.some((sub) => router.pathname === sub.href);
            const Icon = item.icon;

            return (
              <div key={item.key}>
                <div
                  className={`flex items-center w-full px-4 py-3 text-sm font-semibold cursor-pointer relative transition-all rounded-lg mb-1 ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                  onClick={() => (hasSub ? toggleMenu(item.key) : router.push(item.href))}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSide"
                      className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                    />
                  )}

                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left">{mounted ? item.name : ''}</span>

                  {hasSub && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>

                <AnimatePresence>
                  {hasSub && isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-9"
                    >
                      {item.subItems?.map((sub) => (
                        <Link
                          key={sub.key}
                          href={sub.href}
                          className={`block py-2 px-4 text-xs font-medium transition-colors rounded-md mb-1 ${
                            router.pathname === sub.href
                              ? 'text-primary bg-primary-soft/50 font-bold'
                              : 'text-gray-500 hover:text-black hover:bg-gray-50'
                          }`}
                        >
                          {mounted ? sub.name : ''}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('token');
              window.localStorage.removeItem('admin');
            }
            router.push('/login');
          }}
          className="flex items-center justify-center w-full py-3 text-xs font-bold text-red-500 rounded-xl hover:bg-red-50 transition-all"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {mounted ? t('nav.logoutSession') : ''}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
