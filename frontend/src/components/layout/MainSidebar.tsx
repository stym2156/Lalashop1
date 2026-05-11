import { Home, ClipboardList, UserSquare2, Globe, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useChat } from "@/components/chat/ChatContext";

export default function MainSidebar() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = router.pathname;
  const { unreadTotal } = useChat();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { icon: Home, label: t("nav.home"), href: "/", badge: 0 },
    { icon: Globe, label: t("nav.social"), href: "/Social/SocialPage", badge: unreadTotal },
    { icon: ClipboardList, label: t("nav.orders"), href: "/orders/orders", badge: 0 },
    { icon: UserSquare2, label: t("nav.creator"), href: "/creator/creator", badge: 0 },
    { icon: Store, label: t("nav.shop"), href: "/me/me", badge: 0 },
  ];

  const isCreatePost = pathname === "/posts/create-post";
  if (isCreatePost) return null;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[64px] bg-white flex-col items-center py-4 z-40 hidden md:flex shadow-sm">
      <Link href="/" className="mb-8 group">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
          <span className="text-white font-display font-bold text-xl">L</span>
        </div>
      </Link>

      <nav className="flex flex-col gap-1 w-full px-2">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 py-3 rounded-lg transition-all group ${
                isActive ? "text-primary " : "text-gray-400 hover:text-primary hover:bg-gray-50"
              }`}
            >
              <span className="relative">
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full  text-white text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-bold tracking-tight">
                {mounted ? item.label : ""}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <button className="text-gray-400 hover:text-primary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
