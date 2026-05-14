import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchDashboardStats } from "@/services/adminApi";

interface AdminAlerts {
  pendingKyc: number;
  pendingWithdrawals: number;
  openReports: number;
  openTickets: number;
  pendingOrders: number;
  total: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const EMPTY: Omit<AdminAlerts, "refresh"> = {
  pendingKyc: 0,
  pendingWithdrawals: 0,
  openReports: 0,
  openTickets: 0,
  pendingOrders: 0,
  total: 0,
  loading: false,
};

const AdminAlertsContext = createContext<AdminAlerts>({
  ...EMPTY,
  refresh: async () => {
    /* default no-op when used outside provider */
  },
});

const POLL_MS = 30_000;

export const AdminAlertsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [counts, setCounts] = useState(EMPTY);
  const cancelledRef = useRef(false);

  const refresh = useCallback(async () => {
    // Skip when no admin token — avoids hammering /admin/dashboard/stats with 401
    // on the public login screen and noisy network panels.
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("token");
      if (!token || token === "null" || token === "undefined") return;
    }

    setCounts((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetchDashboardStats();
      const q = res.data?.queues;
      if (cancelledRef.current) return;
      const pendingKyc = q?.pendingKyc ?? 0;
      const pendingWithdrawals = q?.pendingWithdrawals ?? 0;
      const openReports = q?.openReports ?? 0;
      const openTickets = q?.openTickets ?? 0;
      const pendingOrders = q?.pendingOrders ?? 0;
      setCounts({
        pendingKyc,
        pendingWithdrawals,
        openReports,
        openTickets,
        pendingOrders,
        total:
          pendingKyc +
          pendingWithdrawals +
          openReports +
          openTickets +
          pendingOrders,
        loading: false,
      });
    } catch {
      // Silent fail — leave previous counts in place rather than zeroing them out
      // on a transient network blip.
      if (cancelledRef.current) return;
      setCounts((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => {
      cancelledRef.current = true;
      window.clearInterval(id);
    };
  }, [refresh]);

  const value = useMemo<AdminAlerts>(
    () => ({ ...counts, refresh }),
    [counts, refresh],
  );

  return (
    <AdminAlertsContext.Provider value={value}>
      {children}
    </AdminAlertsContext.Provider>
  );
};

export const useAdminAlerts = (): AdminAlerts => useContext(AdminAlertsContext);
