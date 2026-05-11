import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, MessageSquare,
  Users, Megaphone, Share2, BarChart3, LifeBuoy,
  Settings, LogOut, ChevronDown, ScanLine
} from 'lucide-react';
import { fetchUnreadSummary } from '@/services/messagesApi';

const UNREAD_POLL_MS = 20000;

const Sidebar = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [openStates, setOpenStates] = useState<{ [key: string]: boolean }>({});
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Poll unread DM count so the Messages icon badges in real-ish time.
  // Other pages can fire `messages:refresh` to force an immediate update
  // (e.g. inbox.tsx after marking a thread read).
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const summary = await fetchUnreadSummary();
        if (active) setUnreadMessages(summary.messages || 0);
      } catch {
        if (active) setUnreadMessages(0);
      }
    };
    void load();
    const handle = setInterval(load, UNREAD_POLL_MS);
    const onFocus = () => { void load(); };
    const onRefresh = () => { void load(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('messages:refresh', onRefresh);
    return () => {
      active = false;
      clearInterval(handle);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('messages:refresh', onRefresh);
    };
  }, []);

  const navItems = [
    {
      key: 'dashboard',
      name: t('sidebar.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      subItems: [
        { key: 'overview', name: t('sidebar.overview'), href: '/' },
        { key: 'revenueSummary', name: t('sidebar.revenueSummary'), href: '/dashboard/revenue' },
        { key: 'ordersSummary', name: t('sidebar.ordersSummary'), href: '/dashboard/orders' },
        { key: 'conversionMetrics', name: t('sidebar.conversionMetrics'), href: '/dashboard/conversion' },
        { key: 'trafficAnalytics', name: t('sidebar.trafficAnalytics'), href: '/dashboard/traffic' },
      ]
    },
    {
      key: 'products',
      name: t('sidebar.products'),
      href: '/products',
      icon: Package,
      subItems: [
        { key: 'productList', name: t('sidebar.productList'), href: '/products/list' },
        { key: 'categories', name: t('sidebar.categories'), href: '/products/categories' },
        { key: 'inventory', name: t('sidebar.inventory'), href: '/products/inventory' },
        { key: 'productReview', name: t('sidebar.productReview'), href: '/products/reviews' },
        { key: 'productViolations', name: t('sidebar.productViolations'), href: '/products/violations' },
      ]
    },
    {
      key: 'orders',
      name: t('sidebar.orders'),
      href: '/orders',
      icon: ShoppingBag,
    },
    {
      key: 'pos',
      name: t('sidebar.pos'),
      href: '/pos',
      icon: ScanLine,
      subItems: [
        { key: 'salesTerminal', name: t('sidebar.salesTerminal'), href: '/pos/terminal' },
        { key: 'posSales', name: t('sidebar.posSales'), href: '/pos/sales' },
        { key: 'cashierShifts', name: t('sidebar.cashierShifts'), href: '/pos/shifts' },
        { key: 'registers', name: t('sidebar.registers'), href: '/pos/registers' },
      ]
    },
    {
      key: 'finance',
      name: t('sidebar.finance'),
      href: '/finance',
      icon: Wallet,
      subItems: [
        { key: 'balance', name: t('sidebar.balance'), href: '/finance/balance' },
        { key: 'withdrawals', name: t('sidebar.withdrawals'), href: '/finance/withdrawals' },
        { key: 'settlements', name: t('sidebar.settlements'), href: '/finance/settlements' },
        { key: 'refunds', name: t('sidebar.refunds'), href: '/finance/refunds' },
        { key: 'transactions', name: t('sidebar.transactions'), href: '/finance/transactions' },
      ]
    },
    {
      key: 'messages',
      name: t('sidebar.messages'),
      href: '/messages/inbox',
      icon: MessageSquare,
    },
    {
      key: 'customers',
      name: t('sidebar.customers'),
      href: '/customers',
      icon: Users,
      subItems: [
        { key: 'customerList', name: t('sidebar.customerList'), href: '/customers/list' },
        { key: 'segments', name: t('sidebar.segments'), href: '/customers/segments' },
        { key: 'labels', name: t('sidebar.labels'), href: '/customers/labels' },
        { key: 'customerActivity', name: t('sidebar.customerActivity'), href: '/customers/activity' },
      ]
    },
    {
      key: 'marketing',
      name: t('sidebar.marketing'),
      href: '/marketing',
      icon: Megaphone,
      subItems: [
        { key: 'coupons', name: t('sidebar.coupons'), href: '/marketing/coupons' },
        { key: 'campaigns', name: t('sidebar.campaigns'), href: '/marketing/campaigns' },
        { key: 'broadcastMessages', name: t('sidebar.broadcastMessages'), href: '/marketing/broadcast' },
        { key: 'promotions', name: t('sidebar.promotions'), href: '/marketing/promotions' },
      ]
    },
    {
      key: 'affiliate',
      name: t('sidebar.affiliate'),
      href: '/affiliate',
      icon: Share2,
      subItems: [
        { key: 'creatorList', name: t('sidebar.creatorList'), href: '/affiliate/creators' },
        { key: 'campaigns', name: t('sidebar.campaigns'), href: '/affiliate/campaigns' },
        { key: 'commission', name: t('sidebar.commission'), href: '/affiliate/commission' },
        { key: 'performance', name: t('sidebar.performance'), href: '/affiliate/performance' },
      ]
    },
    {
      key: 'analytics',
      name: t('sidebar.analytics'),
      href: '/analytics',
      icon: BarChart3,
      subItems: [
        { key: 'salesAnalytics', name: t('sidebar.salesAnalytics'), href: '/analytics/sales' },
        { key: 'productAnalytics', name: t('sidebar.productAnalytics'), href: '/analytics/products' },
        { key: 'customerAnalytics', name: t('sidebar.customerAnalytics'), href: '/analytics/customers' },
        { key: 'chatAnalytics', name: t('sidebar.chatAnalytics'), href: '/analytics/chat' },
      ]
    },
    {
      key: 'support',
      name: t('sidebar.support'),
      href: '/support',
      icon: LifeBuoy,
      subItems: [
        { key: 'tickets', name: t('sidebar.tickets'), href: '/support/tickets' },
        { key: 'appeals', name: t('sidebar.appeals'), href: '/support/appeals' },
        { key: 'reports', name: t('sidebar.reports'), href: '/support/reports' },
      ]
    },
    {
      key: 'settings',
      name: t('sidebar.settings'),
      href: '/settings',
      icon: Settings,
      subItems: [
        { key: 'storeSettings', name: t('sidebar.storeSettings'), href: '/settings/store' },
        { key: 'shippingSettings', name: t('sidebar.shippingSettings'), href: '/settings/shipping' },
        { key: 'paymentSettings', name: t('sidebar.paymentSettings'), href: '/settings/payment' },
        { key: 'integrations', name: t('sidebar.integrations'), href: '/settings/integrations' },
      ]
    },
  ];

  useEffect(() => {
    const currentPath = router.pathname;
    navItems.forEach(item => {
      if (item.subItems?.some(sub => currentPath === sub.href) || currentPath === item.href) {
        setOpenStates(prev => ({ ...prev, [item.key]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  const toggleMenu = (key: string) => {
    setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col w-72 bg-white border-r border-gray-200 h-full text-black">
      {/* Brand */}
      <div className="flex items-center px-8 h-20 border-b border-gray-100">
        <Link href="/" className="flex items-center space-x-2">

          <span className="text-xl font-bold tracking-tight">lalashop <span className="text-primary">seller</span></span>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 px-4 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isOpen = openStates[item.key];
            const isActive = router.pathname === item.href || item.subItems?.some(sub => router.pathname === sub.href);
            const Icon = item.icon;

            return (
              <div key={item.key}>
                <div
                  className={`flex items-center w-full px-4 py-3 text-sm font-semibold cursor-pointer relative transition-all rounded-lg mb-1 ${
                    isActive ? 'bg-primary-soft text-primary' : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                  onClick={() => hasSub ? toggleMenu(item.key) : router.push(item.href)}
                >
                  {isActive && (
                    <motion.div layoutId="activeSide" className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                  )}

                  <span className="relative inline-flex mr-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                    {item.key === 'messages' && unreadMessages > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums leading-none ring-2 ring-white">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    )}
                  </span>
                  <span className="flex-1 text-left">{item.name}</span>

                  {hasSub && (
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                            router.pathname === sub.href ? 'text-primary bg-primary-soft/50 font-bold' : 'text-gray-500 hover:text-black hover:bg-gray-50'
                          }`}
                        >
                          {sub.name}
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
        <button className="flex items-center justify-center w-full py-3 text-xs font-bold text-red-500 rounded-xl hover:bg-red-50 transition-all">
          <LogOut className="mr-2 h-4 w-4" />
          {t('sidebar.logoutSession')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
