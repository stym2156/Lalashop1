import { apiClient } from "./apiClient";

export interface DashboardTopShop {
  _id: string;
  name?: string;
  email?: string;
  customId?: string;
  profileImage?: string;
  revenue: number;
  orderCount: number;
}

export interface DashboardRecentOrder {
  _id: string;
  status: string;
  totalPrice: number;
  isPaid: boolean;
  createdAt: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
    customId?: string;
    profileImage?: string;
  };
}

export interface DashboardStats {
  totals: {
    users: number;
    activeShops: number;
    products: number;
    posts: number;
    revenue: number;
  };
  secondary: {
    pendingOrders: number;
    completedOrders: number;
    activeUsersToday: number;
    pendingShopApprovals: number;
  };
  queues?: {
    pendingKyc: number;
    pendingWithdrawals: number;
    openReports: number;
    openTickets: number;
    pendingOrders: number;
  };
  period?: {
    revenue30: number;
    revenuePrev30: number;
    revenueChangePct: number;
    newUsers30: number;
    newUsers60: number;
    newUsersChangePct: number;
  };
  revenueTrend?: Array<{ date: string; revenue: number; orders: number }>;
  topShops?: DashboardTopShop[];
  recentOrders?: DashboardRecentOrder[];
}

export interface RecentActivity {
  id: string;
  text: string;
  type: "shop" | "finance" | "user" | "system";
  at: string;
}

export interface AdminUser {
  _id: string;
  customId?: string;
  name?: string;
  username?: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
  isSeller: boolean;
  seller_type?: string;
  balance: number;
  profileImage?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  twoFactorEnabled: boolean;
  twoFactorType?: "email" | "authenticator" | "none";
  googleId?: string;
  facebookId?: string;
  bank?: AdminBank | null;
  lastKnownIp?: string;
  shopName?: string;
  shopCategory?: string;
  kycStatus?: KycStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "seller" | "buyer" | "admin";
  status?: string;
}

export interface AdminBank {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
}

export interface AdminUserStats {
  orderCount: number;
  productCount: number;
  postCount: number;
  pendingWithdrawals: number;
  lastOrderAt: string | null;
  lastOrderTotal: number;
  lastOrderStatus: string | null;
}

export interface AdminUserKyc {
  status: "pending" | "approved" | "rejected";
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  shopInfo?: { shopName?: string; shopCategory?: string };
}

export interface AdminUserFinance {
  withdrawals: {
    byStatus: Record<
      string,
      { count: number; totalAmount: number; totalNet: number; totalFee: number }
    >;
    totalCount: number;
    totalAmount: number;
    totalNet: number;
    last: {
      amount: number;
      netAmount: number;
      fee: number;
      status: string;
      createdAt: string;
      processedAt?: string;
      bank?: { bankName?: string; accountNumber?: string } | null;
    } | null;
  };
  income: {
    sellerWebSales: { total: number; orders: number; itemsSold: number };
    creatorEarnings: {
      byStatus: Record<string, { count: number; total: number }>;
      settledTotal: number;
    };
    posRevenue: number;
    currentBalance: number;
  };
  outgoing: {
    refundsIssued: { count: number; total: number };
  };
  buyerActivity: {
    paidCount: number;
    paidTotal: number;
    unpaidCount: number;
    lastPaidAt: string | null;
    lastPaidAmount: number;
  };
  sellerActivity: {
    ordersReceived: number;
    grossRevenue: number;
    itemsSold: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  hasPassword?: boolean;
  hasSellerPassword?: boolean;
  hasPin?: boolean;
  bank?: AdminBank | null;
  stats?: AdminUserStats;
  kyc?: AdminUserKyc | null;
  finance?: AdminUserFinance;
  posRevenue?: number;
  isSuspended?: boolean;
  suspendedReason?: string;
  suspendedAt?: string;
  adminRole?: "super" | "finance" | "support" | "content";
  googleId?: string;
  facebookId?: string;
}

export const suspendUser = (
  id: string,
  payload: { suspended: boolean; reason?: string }
) =>
  apiClient<{
    _id: string;
    isSuspended: boolean;
    suspendedReason?: string;
    suspendedAt?: string;
  }>(`/admin/users/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  balance?: number;
  password?: string;
  pin?: string;
}

export interface UpdateUserBankPayload {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified?: boolean;
}

const buildQuery = (params: Record<string, string | number | undefined>): string => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) return "";
  const search = new URLSearchParams();
  entries.forEach(([k, v]) => search.append(k, String(v)));
  return `?${search.toString()}`;
};

export const fetchDashboardStats = () =>
  apiClient<DashboardStats>("/admin/dashboard/stats");

export const fetchRecentActivity = () =>
  apiClient<RecentActivity[]>("/admin/dashboard/activity");

export const fetchUsers = (params: ListUsersParams = {}) =>
  apiClient<AdminUser[]>(`/admin/users${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchUserById = (id: string) =>
  apiClient<AdminUserDetail>(`/admin/users/${id}`);

export const updateUser = (id: string, payload: UpdateUserPayload) =>
  apiClient<AdminUserDetail>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const updateUserBank = (id: string, payload: UpdateUserBankPayload) =>
  apiClient<AdminBank>(`/admin/users/${id}/bank`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export interface IssueSellerCredentialsResponse {
  userId: string;
  email: string;
  password: string;
  loginUrl: string;
}

export const issueSellerCredentials = (id: string) =>
  apiClient<IssueSellerCredentialsResponse>(
    `/admin/users/${id}/issue-seller-credentials`,
    { method: "POST" },
  );

export type KycStatus = "pending" | "approved" | "rejected";

export interface AdminKycSubmission {
  _id: string;
  status: KycStatus;
  businessType: string;
  shopInfo: {
    shopName: string;
    shopAccount: string;
    shopCategory: string;
    shopEmail: string;
    phoneNumber: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    entityName?: string;
  };
  identity: {
    idType: string;
    idNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    birthDate?: string;
    expiryDate?: string;
    tinNumber?: string;
    businessLicenseUrl?: string;
    idDocumentUrl?: string;
    documents?: Array<{
      url: string;
      label?: string;
      mimeType?: string;
      uploadedAt?: string;
    }>;
    address: {
      street: string;
      apartment?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  warehouse: { fullAddress: string };
  user: {
    _id: string;
    name?: string;
    username?: string;
    email: string;
    customId?: string;
    phone?: string;
    profileImage?: string;
  };
  reviewedAt?: string;
  reviewedBy?: { _id: string; name?: string; email?: string } | null;
  reviewNote?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListKycParams {
  status?: KycStatus;
  search?: string;
  user?: string;
}

export const fetchKycSubmissions = (params: ListKycParams = {}) =>
  apiClient<AdminKycSubmission[]>(`/admin/kyc${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchKycSubmission = (id: string) =>
  apiClient<AdminKycSubmission>(`/admin/kyc/${id}`);

export const fetchShopKycByUserId = async (
  userId: string,
): Promise<AdminKycSubmission | null> => {
  const res = await fetchKycSubmissions({ user: userId });
  const list = res.data ?? [];
  if (list.length === 0) return null;
  const approved = list.find((k) => k.status === "approved");
  return approved ?? list[0];
};

export const reviewKycSubmission = (
  id: string,
  payload: { decision: "approved" | "rejected"; note: string },
) =>
  apiClient<AdminKycSubmission>(`/admin/kyc/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

// ─── Orders ─────────────────────────────────────────────────────────

export type AdminOrderStatus =
  | "paid"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "disputed"
  | "pending_payment";

export interface AdminOrderRowSlip {
  _id: string;
  slipImageUrl: string;
  transferAmount: number;
  transferRef?: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  createdAt: string;
}

export interface AdminOrderRow {
  _id: string;
  id: string;
  customer: string;
  customerId: string;
  customerUserId?: string;
  username: string;
  shop: string;
  shopId: string;
  itemCount: number;
  amount: number;
  paymentMethod: string;
  isPaid: boolean;
  isDelivered: boolean;
  rawStatus: "pending" | "processing" | "shipped" | "delivered" | "canceled";
  status: AdminOrderStatus;
  createdAt: string;
  updatedAt: string;
  // The latest payment slip submitted for this order. Surfaced on the Orders
  // table so admins can view + approve/reject slips inline.
  slip?: AdminOrderRowSlip | null;
}

export interface AdminOrderItem {
  _id: string;
  name: string;
  qty: number;
  image: string;
  price: number;
  product?: { _id: string; name?: string; image?: string };
  seller?: { _id: string; name?: string; email?: string; customId?: string };
  creator?: { _id: string; name?: string; username?: string; customId?: string };
  commission?: number;
}

export interface AdminOrderSlip {
  _id: string;
  slipImageUrl: string;
  transferAmount: number;
  transferRef?: string;
  transferredAt?: string;
  buyerNote?: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: { _id: string; name?: string; email?: string } | null;
  paymentMethod?: {
    _id: string;
    label?: string;
    kind?: "bank" | "promptpay" | "static_qr";
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    promptpayId?: string;
  } | null;
  createdAt: string;
}

export interface AdminOrderDetail {
  _id: string;
  user?: { _id: string; name?: string; email?: string; phone?: string; customId?: string } | null;
  orderItems: AdminOrderItem[];
  shippingAddress: { fullName: string; phone: string; address: string };
  paymentMethod: string;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: AdminOrderStatus;
  rawStatus: string;
  createdAt: string;
  updatedAt: string;
  slip?: AdminOrderSlip | null;
}

export interface AdminOrderStats {
  totalOrders: number;
  todayOrders: number;
  cancelled: number;
  refunded: number;
  disputes: number;
  totalRevenue: number;
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminOrderStatus | "all";
  startDate?: string;
  endDate?: string;
  seller?: string;
}

export const fetchAdminOrders = (params: ListOrdersParams = {}) =>
  apiClient<AdminOrderRow[]>(
    `/admin/orders${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const fetchAdminOrder = (id: string) =>
  apiClient<AdminOrderDetail>(`/admin/orders/${id}`);

export const updateAdminOrder = (
  id: string,
  payload: { status?: string; isPaid?: boolean; isDelivered?: boolean },
) =>
  apiClient<AdminOrderDetail>(`/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const fetchAdminOrderStats = () =>
  apiClient<AdminOrderStats>("/admin/orders/stats");

// ─── Products ────────────────────────────────────────────────────────

export interface AdminProductRow {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string | string[];
  images?: string[];
  category: string;
  countInStock: number;
  status: "Active" | "Draft" | "Archived";
  tags?: string[];
  badge?: string;
  rating?: number;
  numReviews?: number;
  soldCount?: number;
  seller?: { _id: string; name?: string; email?: string; customId?: string };
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductStats {
  total: number;
  active: number;
  pending: number;
  banned: number;
  featured: number;
  violations: number;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "pending" | "archived" | "all";
  flag?: "banned" | "featured" | "violations";
  category?: string;
  seller?: string;
}

export const fetchAdminProducts = (params: ListProductsParams = {}) =>
  apiClient<AdminProductRow[]>(
    `/admin/products${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const fetchAdminProduct = (id: string) =>
  apiClient<AdminProductRow>(`/admin/products/${id}`);

export const updateAdminProduct = (
  id: string,
  payload: {
    status?: "Active" | "Draft" | "Archived";
    action?: "approve" | "ban" | "feature" | "unfeature" | "unban" | "flag-violation" | "clear-violation";
    badge?: string;
  },
) =>
  apiClient<AdminProductRow>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const fetchAdminProductStats = () =>
  apiClient<AdminProductStats>("/admin/products/stats");

// ─── Withdrawals ──────────────────────────────────────────────────────

export type WithdrawStatus = "pending" | "approved" | "completed" | "rejected" | "failed";

export interface AdminWithdrawRow {
  _id: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: WithdrawStatus;
  reference?: string;
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
    customId?: string;
    profileImage?: string;
    isSeller?: boolean;
    seller_type?: string;
  };
  // Resolved server-side from the user's KYC submission so the table can
  // surface a clickable Shop column.
  shopName?: string | null;
  bankAccount?: {
    _id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    isVerified?: boolean;
  };
  // The admin who last took action on this withdrawal (approve / reject /
  // complete / fail). Null while still pending.
  processedBy?: {
    _id: string;
    name?: string;
    email?: string;
    customId?: string;
  } | null;
}

export interface AdminWithdrawStats {
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  failed: number;
  totalsByStatus: Record<string, number>;
}

export interface ListWithdrawalsParams {
  page?: number;
  limit?: number;
  status?: WithdrawStatus | "all";
  role?: "seller" | "creator" | "all";
  search?: string;
}

export const fetchAdminWithdrawals = (params: ListWithdrawalsParams = {}) =>
  apiClient<AdminWithdrawRow[]>(
    `/admin/withdrawals${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const fetchAdminWithdrawal = (id: string) =>
  apiClient<AdminWithdrawRow>(`/admin/withdrawals/${id}`);

export const processAdminWithdrawal = (
  id: string,
  payload: { decision: "approve" | "reject" | "complete" | "fail"; reference?: string; adminNote?: string },
) =>
  apiClient<AdminWithdrawRow>(`/admin/withdrawals/${id}/process`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const fetchAdminWithdrawStats = () =>
  apiClient<AdminWithdrawStats>("/admin/withdrawals/stats");

// ─── Shops ─────────────────────────────────────────────────────────

export interface AdminShopRow {
  _id: string;
  userId: string;
  customId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerUsername?: string;
  profileImage?: string;
  seller_type?: string;
  balance?: number;
  shopName?: string | null;
  shopCategory?: string | null;
  kycStatus?: KycStatus | null;
  productsCount: number;
  revenue: number;
  ordersCount: number;
  createdAt: string;
}

export interface AdminShopStats {
  total: number;
  active: number;
  pending: number;
  closed: number;
}

export interface ListShopsParams {
  page?: number;
  limit?: number;
  status?: "active" | "pending" | "closed" | "all";
  search?: string;
}

export const fetchAdminShops = (params: ListShopsParams = {}) =>
  apiClient<AdminShopRow[]>(
    `/admin/shops${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const fetchAdminShop = (id: string) =>
  apiClient<AdminShopRow & Record<string, unknown>>(`/admin/shops/${id}`);

export const fetchAdminShopStats = () =>
  apiClient<AdminShopStats>("/admin/shops/stats");

// ─── Notifications ───────────────────────────────────────────────────

export type AdminNotificationType =
  | "kyc_approved"
  | "kyc_rejected"
  | "system"
  | "security"
  | "payout"
  | "info";

export interface AdminNotificationRow {
  _id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  user?: { _id: string; name?: string; email?: string; customId?: string };
  createdAt: string;
}

export interface AdminNotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export interface BroadcastPayload {
  title: string;
  body: string;
  type?: "system" | "security" | "info" | "payout";
  audience?: "all" | "sellers" | "buyers" | "creators";
  link?: string;
}

export const fetchAdminNotifications = (params: { page?: number; limit?: number; type?: string; search?: string } = {}) =>
  apiClient<AdminNotificationRow[]>(
    `/admin/notifications${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const broadcastNotification = (payload: BroadcastPayload) =>
  apiClient<{ sent: number; audience: string }>("/admin/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchAdminNotificationStats = () =>
  apiClient<AdminNotificationStats>("/admin/notifications/stats");

// ─── History tabs ────────────────────────────────────────────────────

export interface HistoryParams {
  user?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const fetchHistoryOrders = (params: HistoryParams = {}) =>
  apiClient<unknown[]>(`/admin/history/orders${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryTransactions = (params: HistoryParams = {}) =>
  apiClient<unknown[]>(`/admin/history/transactions${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryWithdrawals = (params: HistoryParams = {}) =>
  apiClient<AdminWithdrawRow[]>(`/admin/history/withdrawals${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryBankChanges = (params: HistoryParams = {}) =>
  apiClient<unknown[]>(`/admin/history/bank-changes${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryKyc = (params: HistoryParams = {}) =>
  apiClient<unknown[]>(`/admin/history/kyc${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryLoginDevice = (params: HistoryParams = {}) =>
  apiClient<unknown[]>(`/admin/history/login-device${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryLinkedAccounts = (params: HistoryParams = {}) =>
  apiClient<unknown[]>(`/admin/history/linked-accounts${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryEditLogs = (params: HistoryParams = {}) =>
  apiClient<unknown[]>(`/admin/history/edit-logs${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryDepositSources = (params: HistoryParams = {}) =>
  apiClient<{ _id: string; count: number; total: number }[]>(`/admin/history/deposit-sources${buildQuery(params as Record<string, string | number | undefined>)}`);

export const fetchHistoryRiskSignals = () =>
  apiClient<unknown[]>(`/admin/history/risk-signals`);

export const fetchHistoryFinancial = (params: HistoryParams = {}) =>
  apiClient<{ revenue: number; ordersPaid: number; withdrawals: Record<string, { total: number; count: number }> }>(
    `/admin/history/financial${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const fetchHistorySupport = () =>
  apiClient<unknown[]>(`/admin/history/support`);

export const fetchHistoryAdminAudit = () =>
  apiClient<unknown[]>(`/admin/history/admin-audit`);

// ─── Reports ──────────────────────────────────────────────────────────

export type ReportTargetType = "user" | "shop" | "product" | "post" | "comment";
export type ReportReason = "spam" | "abuse" | "fraud" | "counterfeit" | "harassment" | "other";
export type ReportStatus = "open" | "reviewing" | "actioned" | "dismissed";
export type ReportAction = "none" | "warn" | "remove" | "suspend" | "ban";

export interface AdminReportRow {
  _id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  evidence?: string[];
  status: ReportStatus;
  actionTaken: ReportAction;
  adminNote?: string;
  reviewedAt?: string;
  reportedBy?: { _id: string; name?: string; email?: string; customId?: string; profileImage?: string };
  assignedTo?: { _id: string; name?: string; email?: string; customId?: string } | null;
  reviewedBy?: { _id: string; name?: string; email?: string; customId?: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportStats {
  total: number;
  open: number;
  reviewing: number;
  actioned: number;
  dismissed: number;
  byReason: Record<string, number>;
  byTargetType: Record<string, number>;
}

export interface ListReportsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReportStatus | "all";
  reason?: ReportReason | "all";
  targetType?: ReportTargetType | "all";
  targetId?: string;
}

export const fetchAdminReports = (params: ListReportsParams = {}) =>
  apiClient<AdminReportRow[]>(
    `/admin/reports${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const fetchAdminReport = (id: string) =>
  apiClient<AdminReportRow>(`/admin/reports/${id}`);

export const updateAdminReport = (
  id: string,
  payload: {
    status?: ReportStatus;
    actionTaken?: ReportAction;
    adminNote?: string;
    assignedTo?: string | null;
  },
) =>
  apiClient<AdminReportRow>(`/admin/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const fetchAdminReportStats = () =>
  apiClient<AdminReportStats>("/admin/reports/stats");

// ─── Categories ───────────────────────────────────────────────────────

export interface AdminCategoryRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent?: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPayload {
  name?: string;
  description?: string;
  icon?: string;
  parent?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export const fetchAdminCategories = () =>
  apiClient<AdminCategoryRow[]>("/admin/categories");

export const createAdminCategory = (payload: CategoryPayload) =>
  apiClient<AdminCategoryRow>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateAdminCategory = (id: string, payload: CategoryPayload) =>
  apiClient<AdminCategoryRow>(`/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAdminCategory = (id: string) =>
  apiClient<{ message: string }>(`/admin/categories/${id}`, {
    method: "DELETE",
  });

// ─── Hero Banners ─────────────────────────────────────────────────────

export interface AdminBannerRow {
  _id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerPayload {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export const fetchAdminBanners = () =>
  apiClient<AdminBannerRow[]>("/admin/banners");

export const createAdminBanner = (payload: BannerPayload) =>
  apiClient<AdminBannerRow>("/admin/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateAdminBanner = (id: string, payload: BannerPayload) =>
  apiClient<AdminBannerRow>(`/admin/banners/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAdminBanner = (id: string) =>
  apiClient<{ message: string }>(`/admin/banners/${id}`, {
    method: "DELETE",
  });

// ─── Audit Logs ──────────────────────────────────────────────────────

export interface AdminAuditLogRow {
  _id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  admin?: { _id: string; name?: string; email?: string; customId?: string };
  createdAt: string;
}

export interface AdminAuditStats {
  total: number;
  last7d: number;
  byAction: { _id: string; count: number }[];
  byAdmin: { _id: string; count: number; admin?: { name?: string; email?: string; customId?: string } }[];
}

export interface ListAuditParams {
  page?: number;
  limit?: number;
  admin?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const fetchAdminAuditLogs = (params: ListAuditParams = {}) =>
  apiClient<AdminAuditLogRow[]>(
    `/admin/audit${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const fetchAdminAuditStats = () =>
  apiClient<AdminAuditStats>("/admin/audit/stats");

// ─── Admin Accounts (direct create — no invite tokens) ──────────────

export type AdminAccountRole = "super" | "finance" | "support" | "content";

export interface AdminAccountRow {
  _id: string;
  name?: string;
  email: string;
  customId?: string;
  adminRole?: AdminAccountRole;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspendedReason?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminPayload {
  email: string;
  password: string;
  name?: string;
  adminRole: AdminAccountRole;
}

export interface CreateAdminResponse {
  _id: string;
  email: string;
  name?: string;
  adminRole?: AdminAccountRole;
  promoted?: boolean;
}

export const fetchAdminAccounts = () =>
  apiClient<AdminAccountRow[]>("/admin/admins");

export const createAdminAccount = (payload: CreateAdminPayload) =>
  apiClient<CreateAdminResponse>("/admin/admins", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const revokeAdminAccount = (id: string) =>
  apiClient<{ _id: string; isAdmin: boolean }>(`/admin/admins/${id}`, {
    method: "DELETE",
  });

// ─── Admin Invites ───────────────────────────────────────────────────

export type InviteRole = "super" | "finance" | "support" | "content";
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface AdminInviteRow {
  _id: string;
  email: string;
  name?: string;
  role: InviteRole;
  message?: string;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  acceptedAt?: string;
  invitedBy?: { _id: string; name?: string; email?: string; customId?: string };
  acceptedBy?: { _id: string; name?: string; email?: string; customId?: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitePayload {
  email: string;
  name?: string;
  role: InviteRole;
  message?: string;
  expiryDays?: number;
}

export const fetchAdminInvites = (status?: InviteStatus | "all") =>
  apiClient<AdminInviteRow[]>(
    `/admin/invites${status && status !== "all" ? `?status=${status}` : ""}`,
  );

export const createAdminInvite = (payload: CreateInvitePayload) =>
  apiClient<AdminInviteRow>("/admin/invites", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const revokeAdminInvite = (id: string) =>
  apiClient<AdminInviteRow>(`/admin/invites/${id}/revoke`, { method: "PATCH" });

export const resendAdminInvite = (id: string) =>
  apiClient<AdminInviteRow>(`/admin/invites/${id}/resend`, { method: "PATCH" });

// ─── System Settings ─────────────────────────────────────────────────

export type SettingType = "string" | "number" | "boolean" | "json";

export interface AdminSettingRow {
  _id: string;
  key: string;
  value: string;
  type: SettingType;
  group: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const fetchAdminSettings = () =>
  apiClient<AdminSettingRow[]>("/admin/settings");

export const updateAdminSetting = (key: string, value: string) =>
  apiClient<AdminSettingRow>(`/admin/settings/${encodeURIComponent(key)}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });

// ─── Support Tickets ─────────────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "payments" | "orders" | "account" | "products" | "shop" | "other";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketReply {
  _id?: string;
  author: { _id: string; name?: string; email?: string; customId?: string } | string;
  authorRole: "user" | "admin";
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface AdminTicketRow {
  _id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  description: string;
  attachments?: string[];
  replies: TicketReply[];
  user?: { _id: string; name?: string; email?: string; customId?: string; profileImage?: string };
  assignedTo?: { _id: string; name?: string; email?: string } | null;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface ListTicketsParams {
  page?: number;
  limit?: number;
  status?: TicketStatus | "all";
  category?: TicketCategory | "all";
  search?: string;
  user?: string;
}

export const fetchAdminTickets = (params: ListTicketsParams = {}) =>
  apiClient<AdminTicketRow[]>(
    `/admin/support${buildQuery(params as Record<string, string | number | undefined>)}`,
  );

export const fetchAdminTicket = (id: string) =>
  apiClient<AdminTicketRow>(`/admin/support/${id}`);

export const replyAdminTicket = (id: string, message: string) =>
  apiClient<AdminTicketRow>(`/admin/support/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export const updateAdminTicket = (
  id: string,
  payload: { status?: TicketStatus; priority?: TicketPriority; assignedTo?: string | null },
) =>
  apiClient<AdminTicketRow>(`/admin/support/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const fetchAdminTicketStats = () =>
  apiClient<AdminTicketStats>("/admin/support/stats");

// ─── Admin role assignment (extends fetchUsers/updateUser) ───────────

export type AdminRole = "super" | "finance" | "support" | "content";

export const updateUserAdminRole = (
  userId: string,
  payload: { isAdmin?: boolean; adminRole?: AdminRole | null },
) =>
  apiClient<AdminUserDetail>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

// ─── Payment methods + slips ─────────────────────────────────────────

export type PaymentMethodKind = "bank" | "promptpay" | "static_qr";

export interface AdminPaymentMethod {
  _id: string;
  kind: PaymentMethodKind;
  label: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  promptpayId?: string;
  qrImageUrl?: string;
  notes?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodInput {
  kind: PaymentMethodKind;
  label: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  promptpayId?: string;
  qrImageUrl?: string;
  notes?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export const fetchAdminPaymentMethods = () =>
  apiClient<AdminPaymentMethod[]>("/payment/admin/methods");

export const createAdminPaymentMethod = (input: PaymentMethodInput) =>
  apiClient<AdminPaymentMethod>("/payment/admin/methods", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateAdminPaymentMethod = (id: string, input: Partial<PaymentMethodInput>) =>
  apiClient<AdminPaymentMethod>(`/payment/admin/methods/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteAdminPaymentMethod = (id: string) =>
  apiClient<{ _id: string }>(`/payment/admin/methods/${id}`, { method: "DELETE" });

export type PaymentSlipStatus = "pending" | "verified" | "rejected";

export interface AdminPaymentSlip {
  _id: string;
  user?: { _id: string; name?: string; email?: string; customId?: string; profileImage?: string };
  order?: { _id: string; totalPrice: number; status: string; isPaid: boolean; createdAt: string };
  paymentMethod?: { _id: string; label: string; kind: string; bankName?: string; accountNumber?: string };
  slipImageUrl: string;
  transferAmount: number;
  transferRef?: string;
  transferredAt?: string;
  buyerNote?: string;
  status: PaymentSlipStatus;
  rejectionReason?: string;
  reviewedBy?: { _id: string; name?: string; email?: string };
  reviewedAt?: string;
  createdAt: string;
}

export interface SlipStats {
  pending: { count: number; total: number };
  verified: { count: number; total: number };
  rejected: { count: number; total: number };
}

export const fetchAdminSlips = (status: PaymentSlipStatus | "all" = "all") =>
  apiClient<AdminPaymentSlip[]>(`/payment/admin/slips?status=${status}`);

export const fetchAdminSlipStats = () =>
  apiClient<SlipStats>("/payment/admin/slips/stats");

export const reviewAdminSlip = (
  id: string,
  payload: { action: "verify" | "reject"; reason?: string }
) =>
  apiClient<AdminPaymentSlip>(`/payment/admin/slips/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

