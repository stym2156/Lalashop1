import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, Package, Wallet, MessageSquare,
  Users, Megaphone, Share2, BarChart3, LifeBuoy,
  Settings, LogOut, ChevronDown, Bell, Search, User, ScanLine
} from 'lucide-react';
import { fetchUnreadSummary } from '@/services/messagesApi';

const UNREAD_POLL_MS = 20000;

const Sidebar = () => {
  const router = useRouter();
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
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      subItems: [
        { name: 'Overview', href: '/' },
        { name: 'Revenue Summary', href: '/dashboard/revenue' },
        { name: 'Orders Summary', href: '/dashboard/orders' },
        { name: 'Conversion Metrics', href: '/dashboard/conversion' },
        { name: 'Traffic Analytics', href: '/dashboard/traffic' },
      ]
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      subItems: [
        { name: 'Product List', href: '/products/list' },
        { name: 'Categories', href: '/products/categories' },
        { name: 'Inventory', href: '/products/inventory' },
        { name: 'Product Review', href: '/products/reviews' },
        { name: 'Product Violations', href: '/products/violations' },
      ]
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
    },
    {
      name: 'POS',
      href: '/pos',
      icon: ScanLine,
      subItems: [
        { name: 'Sales Terminal', href: '/pos/terminal' },
        { name: 'POS Sales', href: '/pos/sales' },
        { name: 'Cashier Shifts', href: '/pos/shifts' },
        { name: 'Registers', href: '/pos/registers' },
      ]
    },
    {
      name: 'Finance',
      href: '/finance',
      icon: Wallet,
      subItems: [
        { name: 'Balance', href: '/finance/balance' },
        { name: 'Withdrawals', href: '/finance/withdrawals' },
        { name: 'Settlements', href: '/finance/settlements' },
        { name: 'Refunds', href: '/finance/refunds' },
        { name: 'Transactions', href: '/finance/transactions' },
      ]
    },
    {
      name: 'Messages',
      href: '/messages/inbox',
      icon: MessageSquare,
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      subItems: [
        { name: 'Customer List', href: '/customers/list' },
        { name: 'Segments', href: '/customers/segments' },
        { name: 'Labels', href: '/customers/labels' },
        { name: 'Customer Activity', href: '/customers/activity' },
      ]
    },
    {
      name: 'Marketing',
      href: '/marketing',
      icon: Megaphone,
      subItems: [
        { name: 'Coupons', href: '/marketing/coupons' },
        { name: 'Campaigns', href: '/marketing/campaigns' },
        { name: 'Broadcast Messages', href: '/marketing/broadcast' },
        { name: 'Promotions', href: '/marketing/promotions' },
      ]
    },
    {
      name: 'Affiliate',
      href: '/affiliate',
      icon: Share2,
      subItems: [
        { name: 'Creator List', href: '/affiliate/creators' },
        { name: 'Campaigns', href: '/affiliate/campaigns' },
        { name: 'Commission', href: '/affiliate/commission' },
        { name: 'Performance', href: '/affiliate/performance' },
      ]
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      subItems: [
        { name: 'Sales Analytics', href: '/analytics/sales' },
        { name: 'Product Analytics', href: '/analytics/products' },
        { name: 'Customer Analytics', href: '/analytics/customers' },
        { name: 'Chat Analytics', href: '/analytics/chat' },
      ]
    },
    {
      name: 'Support',
      href: '/support',
      icon: LifeBuoy,
      subItems: [
        { name: 'Tickets', href: '/support/tickets' },
        { name: 'Appeals', href: '/support/appeals' },
        { name: 'Reports', href: '/support/reports' },
      ]
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      subItems: [
        { name: 'Store Settings', href: '/settings/store' },
        { name: 'Shipping Settings', href: '/settings/shipping' },
        { name: 'Payment Settings', href: '/settings/payment' },
        { name: 'Integrations', href: '/settings/integrations' },
      ]
    },
  ];

  useEffect(() => {
    const currentPath = router.pathname;
    navItems.forEach(item => {
      if (item.subItems?.some(sub => currentPath === sub.href) || currentPath === item.href) {
        setOpenStates(prev => ({ ...prev, [item.name]: true }));
      }
    });
  }, [router.pathname]);

  const toggleMenu = (name: string) => {
    setOpenStates(prev => ({ ...prev, [name]: !prev[name] }));
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
            const isOpen = openStates[item.name];
            const isActive = router.pathname === item.href || item.subItems?.some(sub => router.pathname === sub.href);
            const Icon = item.icon;

            return (
              <div key={item.name}>
                <div
                  className={`flex items-center w-full px-4 py-3 text-sm font-semibold cursor-pointer relative transition-all rounded-lg mb-1 ${
                    isActive ? 'bg-primary-soft text-primary' : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                  onClick={() => hasSub ? toggleMenu(item.name) : router.push(item.href)}
                >
                  {isActive && (
                    <motion.div layoutId="activeSide" className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                  )}

                  <span className="relative inline-flex mr-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                    {item.name === 'Messages' && unreadMessages > 0 && (
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
                          key={sub.name}
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
          Logout Session
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
