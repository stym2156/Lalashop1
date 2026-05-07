import { apiClient } from "./apiClient";

// ─── Products (seller-scoped) ──────────────────────────────────────────

export interface SellerProductRow {
  _id: string;
  name: string;
  description?: string;
  price: number;
  compareAt?: number;
  image: string | string[];
  images?: string[];
  category: string;
  countInStock: number;
  status?: "Active" | "Draft" | "Archived";
  rating?: number;
  numReviews?: number;
  soldCount?: number;
  freeShipping?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  success: boolean;
  data?: SellerProductRow[];
  message?: string;
}

export const fetchMyProducts = async (): Promise<SellerProductRow[]> => {
  const res = await apiClient<ProductsResponse>("/products/my");
  return res.data ?? [];
};

// ─── Orders (seller-scoped) ────────────────────────────────────────────

export interface SellerOrderItem {
  _id?: string;
  name: string;
  qty: number;
  image: string;
  price: number;
  product: string | { _id: string };
  seller: string | { _id: string };
}

export interface SellerOrderRow {
  _id: string;
  user?: { _id: string; name?: string; email?: string; customId?: string } | string;
  orderItems: SellerOrderItem[];
  shippingAddress: { fullName: string; phone: string; address: string };
  paymentMethod: string;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  success: boolean;
  orders?: SellerOrderRow[];
  data?: SellerOrderRow[];
  message?: string;
}

export const fetchMyOrders = async (): Promise<SellerOrderRow[]> => {
  const res = await apiClient<OrdersResponse>("/orders/seller");
  return res.orders ?? res.data ?? [];
};

// ─── Withdrawals (seller-scoped) ───────────────────────────────────────

export type WithdrawStatus = "pending" | "approved" | "completed" | "rejected" | "failed";

export interface SellerWithdrawalRow {
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
  bankAccount?: {
    _id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    isVerified?: boolean;
  };
}

interface WithdrawListResponse {
  success: boolean;
  data?: SellerWithdrawalRow[];
  message?: string;
}

export const fetchMyWithdrawals = async (): Promise<SellerWithdrawalRow[]> => {
  const res = await apiClient<WithdrawListResponse>("/withdraw/me");
  return res.data ?? [];
};

// ─── Notifications ─────────────────────────────────────────────────────

export interface SellerNotificationRow {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data?: SellerNotificationRow[];
  message?: string;
}

export const fetchMyNotifications = async (): Promise<SellerNotificationRow[]> => {
  const res = await apiClient<NotificationsResponse>("/notifications");
  return res.data ?? [];
};

// ─── Reviews ────────────────────────────────────────────────────────────

export interface SellerReviewRow {
  _id: string;
  rating: number;
  comment: string;
  target: "product" | "shop";
  createdAt: string;
  user?: {
    _id: string;
    name?: string;
    username?: string;
    profileImage?: string;
  };
  product?: {
    _id: string;
    name: string;
    image?: string | string[];
    images?: string[];
  };
}

interface ReviewsResponse {
  success: boolean;
  data?: SellerReviewRow[];
  message?: string;
}

export const fetchMyReviews = async (): Promise<SellerReviewRow[]> => {
  const res = await apiClient<ReviewsResponse>("/products/my/reviews");
  return res.data ?? [];
};

// ─── Affiliate ──────────────────────────────────────────────────────────

export interface AffiliateCreatorRow {
  creator: {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    customId?: string;
    profileImage?: string;
  };
  products: Array<{
    product: { _id: string; name: string; image?: string | string[]; images?: string[]; price: number };
    affiliateCode: string;
  }>;
  totalCommission: number;
  totalRevenue: number;
  ordersCount: number;
  clicks: number;
}

export interface AffiliateProductRow {
  _id: string;
  name: string;
  image?: string | string[];
  images?: string[];
  price: number;
  commissionType?: "percent" | "fixed";
  commissionValue?: number;
}

export interface AffiliateSummary {
  totals: {
    activeCreators: number;
    activeProducts: number;
    totalCommissionPaid: number;
    totalAffiliateRevenue: number;
    totalClicks: number;
  };
  creators: AffiliateCreatorRow[];
  products: AffiliateProductRow[];
}

interface AffiliateSummaryResponse {
  success: boolean;
  data?: AffiliateSummary;
  message?: string;
}

export const fetchAffiliateSummary = async (): Promise<AffiliateSummary | null> => {
  const res = await apiClient<AffiliateSummaryResponse>("/affiliate/seller-summary");
  return res.data ?? null;
};

// ─── Support tickets ────────────────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "payments" | "orders" | "account" | "products" | "shop" | "other";

export interface SellerTicketReply {
  _id?: string;
  authorRole: "user" | "admin";
  message: string;
  createdAt: string;
  author?: { _id: string; name?: string; email?: string };
}

export interface SellerTicketRow {
  _id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: "low" | "normal" | "high" | "urgent";
  description: string;
  attachments?: string[];
  replies: SellerTicketReply[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

interface TicketsResponse {
  success: boolean;
  data?: SellerTicketRow[];
  message?: string;
}

interface TicketResponse {
  success: boolean;
  data?: SellerTicketRow;
  message?: string;
}

export const fetchMyTickets = async (): Promise<SellerTicketRow[]> => {
  const res = await apiClient<TicketsResponse>("/support/mine");
  return res.data ?? [];
};

export interface CreateTicketPayload {
  subject: string;
  category: TicketCategory;
  description: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export const createTicket = async (payload: CreateTicketPayload): Promise<SellerTicketRow | null> => {
  const res = await apiClient<TicketResponse>("/support", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data ?? null;
};

// ─── Marketing: Coupons / Promotions / Broadcasts ────────────────────

export type CouponType = "percent" | "fixed" | "freeship";
export type CouponStatus = "draft" | "active" | "paused" | "expired";
export type CouponScope = "shop" | "products" | "categories";

export interface SellerCoupon {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  scope: CouponScope;
  productIds: string[];
  categories: string[];
  startsAt?: string;
  expiresAt?: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInput {
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  scope?: CouponScope;
  productIds?: string[];
  categories?: string[];
  startsAt?: string;
  expiresAt?: string;
  status?: CouponStatus;
}

interface CouponListResponse {
  success: boolean;
  data?: SellerCoupon[];
}
interface CouponItemResponse {
  success: boolean;
  data?: SellerCoupon;
  message?: string;
}

export const fetchMyCoupons = async (): Promise<SellerCoupon[]> => {
  const res = await apiClient<CouponListResponse>("/marketing/coupons");
  return res.data ?? [];
};

export const createCoupon = async (input: CouponInput): Promise<SellerCoupon | null> => {
  const res = await apiClient<CouponItemResponse>("/marketing/coupons", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data ?? null;
};

export const updateCoupon = async (id: string, input: Partial<CouponInput>): Promise<SellerCoupon | null> => {
  const res = await apiClient<CouponItemResponse>(`/marketing/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data ?? null;
};

export const deleteCoupon = async (id: string): Promise<boolean> => {
  await apiClient(`/marketing/coupons/${id}`, { method: "DELETE" });
  return true;
};

export type PromotionType = "flash_sale" | "bundle" | "bogo" | "discount";
export type PromotionStatus = "draft" | "scheduled" | "active" | "ended";

export interface SellerPromotion {
  _id: string;
  name: string;
  type: PromotionType;
  description?: string;
  bannerImage?: string;
  productIds: Array<string | { _id: string; name: string; image: string; price: number }>;
  discountPercent: number;
  bundleQty: number;
  bogoBuy: number;
  bogoGet: number;
  startsAt: string;
  endsAt: string;
  status: PromotionStatus;
  views: number;
  orders: number;
  revenue: number;
  createdAt: string;
}

export interface PromotionInput {
  name: string;
  type: PromotionType;
  description?: string;
  bannerImage?: string;
  productIds?: string[];
  discountPercent?: number;
  bundleQty?: number;
  bogoBuy?: number;
  bogoGet?: number;
  startsAt: string;
  endsAt: string;
  status?: PromotionStatus;
}

interface PromotionListResponse {
  success: boolean;
  data?: SellerPromotion[];
}
interface PromotionItemResponse {
  success: boolean;
  data?: SellerPromotion;
}

export const fetchMyPromotions = async (): Promise<SellerPromotion[]> => {
  const res = await apiClient<PromotionListResponse>("/marketing/promotions");
  return res.data ?? [];
};

export const createPromotion = async (input: PromotionInput): Promise<SellerPromotion | null> => {
  const res = await apiClient<PromotionItemResponse>("/marketing/promotions", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data ?? null;
};

export const updatePromotion = async (id: string, input: Partial<PromotionInput>): Promise<SellerPromotion | null> => {
  const res = await apiClient<PromotionItemResponse>(`/marketing/promotions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data ?? null;
};

export const deletePromotion = async (id: string): Promise<boolean> => {
  await apiClient(`/marketing/promotions/${id}`, { method: "DELETE" });
  return true;
};

export type BroadcastChannel = "in_app" | "email";
export type BroadcastAudience = "all_followers" | "all_customers" | "vip" | "inactive";
export type BroadcastStatus = "draft" | "scheduled" | "sent" | "failed";

export interface SellerBroadcast {
  _id: string;
  title: string;
  body: string;
  channel: BroadcastChannel;
  audience: BroadcastAudience;
  audienceCount: number;
  scheduledAt?: string;
  sentAt?: string;
  status: BroadcastStatus;
  metrics: { delivered: number; opened: number; clicked: number };
  link?: string;
  createdAt: string;
}

export interface BroadcastInput {
  title: string;
  body: string;
  channel?: BroadcastChannel;
  audience?: BroadcastAudience;
  scheduledAt?: string;
  link?: string;
}

interface BroadcastListResponse {
  success: boolean;
  data?: SellerBroadcast[];
}
interface BroadcastItemResponse {
  success: boolean;
  data?: SellerBroadcast;
}

export const fetchMyBroadcasts = async (): Promise<SellerBroadcast[]> => {
  const res = await apiClient<BroadcastListResponse>("/marketing/broadcasts");
  return res.data ?? [];
};

export const createBroadcast = async (input: BroadcastInput): Promise<SellerBroadcast | null> => {
  const res = await apiClient<BroadcastItemResponse>("/marketing/broadcasts", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data ?? null;
};

export const sendBroadcast = async (id: string): Promise<SellerBroadcast | null> => {
  const res = await apiClient<BroadcastItemResponse>(`/marketing/broadcasts/${id}/send`, {
    method: "POST",
  });
  return res.data ?? null;
};

export const deleteBroadcast = async (id: string): Promise<boolean> => {
  await apiClient(`/marketing/broadcasts/${id}`, { method: "DELETE" });
  return true;
};

// ─── Shop Settings ────────────────────────────────────────────────────

export interface ShopGeneral {
  storeName: string;
  storeSlug: string;
  tagline: string;
  description: string;
  logo: string;
  banner: string;
  category: string;
  language: string;
  currency: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  rate: number;
  freeShippingThreshold: number;
  estimatedDays: { min: number; max: number };
}

export interface ShopShipping {
  enabled: boolean;
  freeShippingDefault: boolean;
  defaultRate: number;
  defaultLeadDays: { min: number; max: number };
  zones: ShippingZone[];
  defaultPackageWeight: number;
  weightUnit: "g" | "kg";
}

export interface ShopPayment {
  acceptCash: boolean;
  acceptBankTransfer: boolean;
  acceptCreditCard: boolean;
  acceptPromptPay: boolean;
  promptPayId: string;
  vatRegistered: boolean;
  vatNumber: string;
  vatPercent: number;
  payoutSchedule: "weekly" | "biweekly" | "monthly";
}

export type IntegrationKey = "tiktok" | "facebook" | "instagram" | "line" | "shopify";

export interface ShopIntegration {
  key: IntegrationKey;
  enabled: boolean;
  connectedAt?: string;
  account?: string;
}

export interface ShopSettingDoc {
  _id: string;
  shop: string;
  general: ShopGeneral;
  shipping: ShopShipping;
  payment: ShopPayment;
  integrations: ShopIntegration[];
}

interface SettingsResponse {
  success: boolean;
  data?: ShopSettingDoc;
}
interface GeneralResponse {
  success: boolean;
  data?: ShopGeneral;
}
interface ShippingResponse {
  success: boolean;
  data?: ShopShipping;
}
interface PaymentResponse {
  success: boolean;
  data?: ShopPayment;
}
interface IntegrationsResponse {
  success: boolean;
  data?: ShopIntegration[];
}

export const fetchShopSettings = async (): Promise<ShopSettingDoc | null> => {
  const res = await apiClient<SettingsResponse>("/shop-settings");
  return res.data ?? null;
};

export const updateShopGeneral = async (input: Partial<ShopGeneral>): Promise<ShopGeneral | null> => {
  const res = await apiClient<GeneralResponse>("/shop-settings/general", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data ?? null;
};

export const updateShopShipping = async (input: Partial<ShopShipping>): Promise<ShopShipping | null> => {
  const res = await apiClient<ShippingResponse>("/shop-settings/shipping", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data ?? null;
};

export const updateShopPayment = async (input: Partial<ShopPayment>): Promise<ShopPayment | null> => {
  const res = await apiClient<PaymentResponse>("/shop-settings/payment", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data ?? null;
};

export const toggleIntegration = async (
  key: IntegrationKey,
  enabled: boolean,
  account?: string
): Promise<ShopIntegration[] | null> => {
  const res = await apiClient<IntegrationsResponse>(`/shop-settings/integrations/${key}/toggle`, {
    method: "POST",
    body: JSON.stringify({ enabled, account }),
  });
  return res.data ?? null;
};

// ─── Customers ────────────────────────────────────────────────────────

export type CustomerSegment = "vip" | "regular" | "new" | "inactive" | "blocked" | "";

export interface SellerCustomer {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  profileImage?: string;
  joinedAt?: string;
  orderCount: number;
  paidOrderCount: number;
  totalSpent: number;
  lastOrderAt?: string;
  channels: string[];
  tags: string[];
  segment: CustomerSegment;
  note: string;
}

export interface CustomerActivity {
  profile: {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    profileImage?: string;
    createdAt?: string;
  };
  orders: Array<{
    _id: string;
    totalPrice: number;
    isPaid: boolean;
    status: string;
    createdAt: string;
    channel?: string;
    items: Array<{ name: string; qty: number; price: number; image: string }>;
  }>;
  label: {
    tags: string[];
    segment: CustomerSegment;
    note: string;
  } | null;
}

export interface SegmentSummary {
  total: number;
  vip: number;
  regular: number;
  newCustomers: number;
  inactive: number;
  totalRevenue: number;
}

interface CustomerListResponse {
  success: boolean;
  data?: SellerCustomer[];
}
interface CustomerActivityResponse {
  success: boolean;
  data?: CustomerActivity;
}
interface SegmentResponse {
  success: boolean;
  data?: SegmentSummary;
}
interface LabelResponse {
  success: boolean;
  data?: { tags: string[]; segment: CustomerSegment; note: string };
}

export const fetchCustomers = async (): Promise<SellerCustomer[]> => {
  const res = await apiClient<CustomerListResponse>("/customers");
  return res.data ?? [];
};

export const fetchCustomerActivity = async (id: string): Promise<CustomerActivity | null> => {
  const res = await apiClient<CustomerActivityResponse>(`/customers/${id}/activity`);
  return res.data ?? null;
};

export const fetchSegmentSummary = async (): Promise<SegmentSummary | null> => {
  const res = await apiClient<SegmentResponse>("/customers/segments");
  return res.data ?? null;
};

export const updateCustomerLabel = async (
  id: string,
  payload: { tags?: string[]; segment?: CustomerSegment; note?: string }
): Promise<LabelResponse["data"] | null> => {
  const res = await apiClient<LabelResponse>(`/customers/${id}/label`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data ?? null;
};

// ─── Finance: Refunds / Settlements / Transactions ───────────────────

export type RefundStatus = "requested" | "approved" | "rejected" | "completed";
export type RefundReason =
  | "not_received"
  | "damaged"
  | "wrong_item"
  | "not_as_described"
  | "changed_mind"
  | "other";

export interface SellerRefund {
  _id: string;
  customer?: { _id: string; name?: string; username?: string; profileImage?: string; email?: string };
  order?: { _id: string; totalPrice: number; createdAt: string };
  amount: number;
  reason: RefundReason;
  description: string;
  status: RefundStatus;
  evidenceImages: string[];
  resolutionNote: string;
  decidedAt?: string;
  createdAt: string;
}

export interface SellerSettlement {
  period: string;
  startDate: string;
  gross: number;
  fees: number;
  net: number;
  count: number;
  withdrawals: Array<{
    _id: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: string;
    createdAt: string;
    processedAt?: string;
    bankAccount?: { bankName: string; accountNumber: string };
  }>;
}

export interface SellerTransaction {
  _id: string;
  type: "income" | "withdrawal" | "refund" | "fee";
  description: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface RefundsResponse {
  success: boolean;
  data?: SellerRefund[];
}
interface RefundResponse {
  success: boolean;
  data?: SellerRefund;
}
interface SettlementsResponse {
  success: boolean;
  data?: SellerSettlement[];
}
interface TransactionsResponse {
  success: boolean;
  data?: SellerTransaction[];
}

export const fetchRefunds = async (): Promise<SellerRefund[]> => {
  const res = await apiClient<RefundsResponse>("/finance/refunds");
  return res.data ?? [];
};

export const decideRefund = async (
  id: string,
  action: "approve" | "reject" | "complete",
  note?: string
): Promise<SellerRefund | null> => {
  const res = await apiClient<RefundResponse>(`/finance/refunds/${id}`, {
    method: "PUT",
    body: JSON.stringify({ action, note: note || "" }),
  });
  return res.data ?? null;
};

export const fetchSettlements = async (period: "week" | "month" = "month"): Promise<SellerSettlement[]> => {
  const res = await apiClient<SettlementsResponse>(`/finance/settlements?period=${period}`);
  return res.data ?? [];
};

export const fetchTransactions = async (limit = 200): Promise<SellerTransaction[]> => {
  const res = await apiClient<TransactionsResponse>(`/finance/transactions?limit=${limit}`);
  return res.data ?? [];
};

// ─── Analytics: Chat ─────────────────────────────────────────────────

export interface ChatAnalytics {
  rangeDays: number;
  totalConversations: number;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  unreadInbound: number;
  avgResponseSec: number;
  p50ResponseSec: number;
  p95ResponseSec: number;
  responseSampleSize: number;
  dailyVolume: Array<{ date: string; inbound: number; outbound: number }>;
  buyersWhoChat: number;
  buyersWhoOrdered: number;
  chatConversionRate: number;
}

interface ChatAnalyticsResponse {
  success: boolean;
  data?: ChatAnalytics;
}

export const fetchChatAnalytics = async (days = 30): Promise<ChatAnalytics | null> => {
  const res = await apiClient<ChatAnalyticsResponse>(`/analytics/chat?days=${days}`);
  return res.data ?? null;
};

// ─── Tracking: Traffic + Conversion ──────────────────────────────────

export interface TrafficAnalytics {
  rangeDays: number;
  totalViews: number;
  uniqueSessions: number;
  bySource: Record<string, number>;
  byDevice: Record<string, number>;
  topPages: Array<{ path: string; views: number; uniqueSessions: number }>;
  topReferrers: Array<{ host: string; count: number }>;
  daily: Array<{ date: string; views: number; sessions: number }>;
}

export interface ConversionFunnel {
  rangeDays: number;
  productViewSessions: number;
  productViewers: number;
  cartUsers: number;
  orderUsers: number;
  paidOrders: number;
  paidRevenue: number;
  viewToCartRate: number;
  viewToOrderRate: number;
  cartToOrderRate: number;
}

interface TrafficResponse {
  success: boolean;
  data?: TrafficAnalytics;
}
interface ConversionResponse {
  success: boolean;
  data?: ConversionFunnel;
}

export const fetchTrafficAnalytics = async (days = 30): Promise<TrafficAnalytics | null> => {
  const res = await apiClient<TrafficResponse>(`/tracking/traffic?days=${days}`);
  return res.data ?? null;
};

export const fetchConversionFunnel = async (days = 30): Promise<ConversionFunnel | null> => {
  const res = await apiClient<ConversionResponse>(`/tracking/conversion?days=${days}`);
  return res.data ?? null;
};
