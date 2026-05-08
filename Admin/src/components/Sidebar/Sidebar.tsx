import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Store, Layers,
  ShoppingBag, Settings, LogOut, Wallet, ChevronDown, ArrowLeftRight, Bell,
  ShieldCheck, Package, FileWarning, UserCog, BadgeCheck, LifeBuoy, Banknote,
} from 'lucide-react';

const Sidebar = () => {
  const router = useRouter();
  const [openStates, setOpenStates] = useState<{ [key: string]: boolean }>({});

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      subItems: [
        { name: 'All Users', href: '/users/alluser' },
      ],
    },
    
    {
      name: 'Shop Center',
      href: '/shops/shopcenter',
      icon: Store,
      subItems: [
        { name: 'All Shops', href: '/shops/shopcenter' },
      ],
    },
    {
      name: 'Products',
      href: '/products',
      icon: Package,
      subItems: [
        { name: 'All Products', href: '/products' },
        { name: 'Pending Review', href: '/products/pending' },
        { name: 'Violations', href: '/products/violations' },
        { name: 'Banned', href: '/products/banned' },
        { name: 'Featured', href: '/products/featured' },
      ],
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
      subItems: [
        { name: 'All Orders', href: '/orders' },
        { name: 'Disputes', href: '/orders/disputes' },
        { name: 'Refunds', href: '/orders/refunds' },
        { name: 'Cancelled', href: '/orders/cancelled' },
      ],
    },
    {
      name: 'Transactions',
      href: '/withdrawpage',
      icon: Wallet,
      subItems: [
        { name: 'Seller Withdrawals', href: '/withdrawpage/Seller/SellerWithdrawals' },
        { name: 'Creator Withdrawals', href: '/withdrawpage/creator/CreatorWithdrawals' },
        { name: 'Payment', href: '/withdrawpage/payment/payment' },
      ],
    },
    {
      name: 'Payment',
      href: '/payment',
      icon: Banknote,
      subItems: [
        { name: 'Methods (banks/QR)', href: '/payment/methods' },
        { name: 'Verify slips', href: '/payment/slips' },
      ],
    },
    { name: 'Categories', href: '/categories', icon: Layers },
    { name: 'History', href: '/history/history', icon: ArrowLeftRight },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'KYC Verification', href: '/kyc', icon: BadgeCheck },
    {
      name: 'Admins',
      href: '/admins',
      icon: ShieldCheck,
      subItems: [
        { name: 'Admin Accounts', href: '/admins' },
        { name: 'Roles & Permissions', href: '/admins/roles' },
        { name: 'Audit Log', href: '/admins/audit' },
      ],
    },
    { name: 'Reports', href: '/reports', icon: FileWarning },
    { name: 'Support', href: '/support', icon: LifeBuoy },
    { name: 'Profile', href: '/profile', icon: UserCog },
    { name: 'System Settings', href: '/settings', icon: Settings },
  ];

  useEffect(() => {
    const currentPath = router.pathname;
    navItems.forEach((item) => {
      if (item.subItems?.some((sub) => currentPath === sub.href) || currentPath === item.href) {
        setOpenStates((prev) => ({ ...prev, [item.name]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  const toggleMenu = (name: string) => {
    setOpenStates((prev) => ({ ...prev, [name]: !prev[name] }));
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
            const isOpen = openStates[item.name];
            const isActive =
              router.pathname === item.href ||
              item.subItems?.some((sub) => router.pathname === sub.href);
            const Icon = item.icon;

            return (
              <div key={item.name}>
                <div
                  className={`flex items-center w-full px-4 py-3 text-sm font-semibold cursor-pointer relative transition-all rounded-lg mb-1 ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                  onClick={() => (hasSub ? toggleMenu(item.name) : router.push(item.href))}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSide"
                      className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                    />
                  )}

                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left">{item.name}</span>

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
                          key={sub.name}
                          href={sub.href}
                          className={`block py-2 px-4 text-xs font-medium transition-colors rounded-md mb-1 ${
                            router.pathname === sub.href
                              ? 'text-primary bg-primary-soft/50 font-bold'
                              : 'text-gray-500 hover:text-black hover:bg-gray-50'
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
          Logout Session
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
