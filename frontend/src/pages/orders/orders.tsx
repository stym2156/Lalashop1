"use client";
import Header from "@/components/layout/Header";
import {
   Search, ChevronLeft, Package, Truck,
   MessageSquare, ExternalLink, Calendar,
   ShoppingBag, Clock, CheckCircle2,
   XCircle, ChevronRight, Store, HelpCircle,
   Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";
import Link from "next/link";
import { motion } from "framer-motion";

interface OrderSeller {
   _id: string;
   name?: string;
   username?: string;
   profileImage?: string;
   customId?: string;
}

interface OrderItem {
   name: string;
   qty: number;
   image: string;
   price: number;
   product: any; // Can be ID string or populated object
   seller?: string | OrderSeller;
   description?: string;
}

interface OrderSlip {
   status: "pending" | "verified" | "rejected";
   rejectionReason?: string;
   transferAmount?: number;
}

interface Order {
   _id: string;
   status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
   isPaid?: boolean;
   totalPrice: number;
   createdAt: string;
   orderItems: OrderItem[];
   paymentMethod: string;
   slip?: OrderSlip | null;
}

export default function OrdersPage() {
   const { t } = useTranslation("common");

   // Compute the user-facing status — slip state takes priority over the
   // underlying order.status because customers care about "did admin approve
   // my transfer yet" before they care about the seller's fulfilment progress.
   const resolveOrderStatus = (
      order: Order,
   ): { label: string; tone: string } => {
      if (order.slip?.status === "pending" && !order.isPaid) {
         return { label: t("order.awaitingVerification"), tone: "text-amber-600" };
      }
      if (order.slip?.status === "rejected" && !order.isPaid) {
         return { label: t("order.slipRejected"), tone: "text-rose-600" };
      }
      const labels: Record<Order["status"], string> = {
         pending: t("order.statusToPay"),
         processing: t("order.statusToShip"),
         shipped: t("order.statusToReceive"),
         delivered: t("order.statusCompleted"),
         canceled: t("order.statusCanceled"),
      };
      const tones: Record<Order["status"], string> = {
         pending: "text-[#FE2C55]",
         processing: "text-[#0077b6]",
         shipped: "text-[#0077b6]",
         delivered: "text-emerald-500",
         canceled: "text-rose-500",
      };
      return { label: labels[order.status], tone: tones[order.status] };
   };

   // Resolve the order's primary shop. We assume one order = one seller (the
   // cart UX groups items per shop) but defensively pull from the first item
   // and detect if multiple sellers slipped through.
   const resolveOrderShop = (order: Order): {
      id: string | null;
      name: string;
      profileImage?: string;
      multiple: boolean;
   } => {
      const sellers = order.orderItems
         .map((it) => it.seller)
         .filter(Boolean) as Array<string | OrderSeller>;
      const ids = Array.from(
         new Set(
            sellers.map((s) => (typeof s === "string" ? s : String(s?._id || ""))).filter(Boolean),
         ),
      );
      if (ids.length === 0) {
         return { id: null, name: t("order.unknownShop"), multiple: false };
      }
      const first = sellers[0];
      const populated = typeof first === "object" ? first : null;
      return {
         id: ids[0],
         name: populated?.name || populated?.username || t("order.shop"),
         profileImage: populated?.profileImage,
         multiple: ids.length > 1,
      };
   };

   const tabs = ["all", "to pay", "to ship", "to receive", "completed", "canceled"];
   const tabLabels: Record<string, string> = {
      "all": t("order.all"),
      "to pay": t("order.toPay"),
      "to ship": t("order.toShip"),
      "to receive": t("order.toReceive"),
      "completed": t("order.completed"),
      "canceled": t("order.canceled"),
   };

   // Map UI tabs to Backend statuses
   const statusMap: Record<string, string> = {
      "to pay": "pending",
      "to ship": "processing",
      "to receive": "shipped",
      "completed": "delivered",
      "canceled": "canceled"
   };

   const router = useRouter();
   const [orders, setOrders] = useState<Order[]>([]);
   const [selectedTab, setSelectedTab] = useState<string>("all");
   const [loading, setLoading] = useState(true);

   const loadOrders = async () => {
      setLoading(true);
      try {
         const data = await apiClient("/orders/mine");
         if (data.success) {
            setOrders(data.orders || []);
         }
      } catch (error) {
         console.error("Load Orders Error:", error);
         setOrders([]);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadOrders();
   }, []);

   const filteredOrders = useMemo(() => {
      if (selectedTab === "all") return orders;
      const targetStatus = statusMap[selectedTab];
      return orders.filter((o) => o.status === targetStatus);
   }, [orders, selectedTab]);

   const handleDeleteOrder = async (orderId: string) => {
      if (!confirm(t("order.cancelConfirm"))) return;
      try {
         const res = await apiClient(`/orders/${orderId}`, { method: "DELETE" });
         if (res.success) {
            setOrders(prev => prev.filter(o => o._id !== orderId));
         }
      } catch (error) {
         console.error("Delete Order Error:", error);
         alert(t("order.deleteFailed"));
      }
   };

   return (
      <div className="flex-1 flex flex-col min-h-screen bg-gray-light text-dark font-body antialiased overflow-x-hidden">
         <Header />

         {/* Tabs */}
         <div className="bg-white border-b border-gray-border flex overflow-x-auto no-scrollbar sticky top-[52px] z-40 w-full">
            {tabs.map((tab) => (
               <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-5 py-4 text-[13px] font-bold tracking-tight whitespace-nowrap transition-all relative flex-1 text-center capitalize ${
                     selectedTab === tab ? "text-primary-hover font-black" : "text-gray-400"
                  }`}
               >
                  {tabLabels[tab]}
                  {selectedTab === tab && (
                     <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-hover" 
                     />
                  )}
               </button>
            ))}
         </div>

         <main className="w-full pb-20">
            {loading ? (
               <div className="py-20 flex justify-center w-full">
                  <div className="w-6 h-6 border-2 border-gray-border border-t-primary-hover animate-spin rounded-full" />
               </div>
            ) : filteredOrders.length === 0 ? (
               <div className="py-32 flex flex-col items-center opacity-20 w-full text-gray-400">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p className="mt-4 text-[13px] font-bold tracking-widest ">{t("order.noOrders")}</p>
               </div>
            ) : (
               <div className="space-y-4 mt-2 w-full px-0">
                  {filteredOrders.map((order) => {
                     const shop = resolveOrderShop(order);
                     const status = resolveOrderStatus(order);
                     return (
                     <div key={order._id} className="bg-white border-y border-gray-border overflow-hidden shadow-sm shadow-black/[0.02]">
                        {/* Store Header — real shop, clickable to /u/{sellerId} */}
                        <div className="px-4 py-3 flex items-center justify-between border-b border-[#F8F8F8] gap-3">
                           {shop.id ? (
                              <Link
                                 href={`/u/${shop.id}`}
                                 className="flex items-center gap-2 min-w-0 hover:text-[#0077b6] transition-colors"
                              >
                                 {shop.profileImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                       src={shop.profileImage}
                                       alt={shop.name}
                                       className="w-6 h-6 rounded-full object-cover bg-gray-100 flex-shrink-0"
                                    />
                                 ) : (
                                    <Store size={16} strokeWidth={2.5} />
                                 )}
                                 <span className="text-[13px] font-bold tracking-tight truncate">
                                    {shop.multiple ? t("order.moreItems", { name: shop.name, count: order.orderItems.length - 1 }) : shop.name}
                                 </span>
                                 <ChevronRight size={14} className="text-[#BBBBBB] flex-shrink-0" />
                              </Link>
                           ) : (
                              <div className="flex items-center gap-2 min-w-0 text-gray-400">
                                 <Store size={16} strokeWidth={2.5} />
                                 <span className="text-[13px] font-bold tracking-tight truncate">{shop.name}</span>
                              </div>
                           )}
                           <div className="flex items-center gap-3 flex-shrink-0">
                              <span
                                 className={`text-[11px] font-black tracking-wider ${status.tone}`}
                              >
                                 {status.label}
                              </span>
                              {order.status === 'pending' && (
                                 <button
                                    onClick={() => handleDeleteOrder(order._id)}
                                    className="text-gray-300 hover:text-rose-500 transition-colors p-1"
                                    aria-label={t("order.cancelOrderAria")}
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              )}
                           </div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-gray-50">
                           {order.orderItems.map((item, idx) => {
                              const productId = typeof item.product === 'object' ? item.product._id : item.product;
                              const displayDescription = item.description || (typeof item.product === 'object' ? item.product.description : "");
                              
                              return (
                                 <div key={idx} className="p-4 flex gap-4">
                                    <Link href={`/product/${productId}`} className="w-20 h-20 bg-[#F5F5F5] flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 hover:opacity-80 transition-opacity">
                                       <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                    </Link>
                                    <div className="flex-1 space-y-1 min-w-0">
                                       <Link href={`/product/${productId}`} className="hover:text-blue-600 transition-colors">
                                          <h4 className="text-[14px] font-bold leading-tight line-clamp-2">
                                             {item.name}
                                          </h4>
                                       </Link>
                                       <p className="text-[12px] text-gray-500 line-clamp-2 leading-snug mt-1 ">
                                          {displayDescription || t("product.noDescription")}
                                       </p>
                                       <div className="flex justify-between items-center mt-2">
                                          <p className="text-[11px] text-[#86878B] font-bold">x{item.qty}</p>
                                          <p className="text-[14px] font-black tracking-tighter">฿{item.price.toLocaleString()}</p>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                     );
                  })}
               </div>
            )}
         </main>
      </div>
   );
}