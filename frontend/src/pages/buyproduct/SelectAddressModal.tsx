import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, CheckCircle2, Plus, Truck, Phone, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AddressModal } from "../me/profilesetting/AddressModal";
import { apiClient } from "@/services/apiClient";
import { useEffect, useState } from "react";

interface Address {
  _id: string;
  recipientName: string;
  phoneNumber: string;
  village: string;
  district: string;
  province: string;
  shippingBranch: string;
  isDefault: boolean;
}

interface SelectAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
  selectedId?: string;
}

export function SelectAddressModal({ isOpen, onClose, onSelect, selectedId }: SelectAddressModalProps) {
  const { t } = useTranslation("common");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchAddresses = async () => {
    try {
      const data = await apiClient("/address/all");
      setAddresses(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-2 text-blue-500">
                    <MapPin size={18} />
                  </div>
                  {t("pages.selectAddress.title")}
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              {/* List */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />
                    ))}
                  </div>
                ) : addresses.length > 0 ? (
                  addresses.map((addr) => (
                    <button
                      key={addr._id}
                      onClick={() => onSelect(addr)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all relative group ${
                        selectedId === addr._id
                          ? "border-blue-500 bg-blue-50/30"
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{addr.recipientName}</p>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">{t("pages.settings.default")}</span>
                          )}
                        </div>
                        {selectedId === addr._id && (
                          <CheckCircle2 size={18} className="text-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <Phone size={12} /> {addr.phoneNumber}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {addr.village}, {addr.district}, {addr.province}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                        <Truck size={12} />
                        Branch: {addr.shippingBranch}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                      <MapPin size={30} />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{t("pages.selectAddress.noAddresses")}</p>
                    <p className="text-xs text-gray-400 mt-1">{t("pages.selectAddress.addNew")}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-3.5 bg-white  text-gray-500 text-sm font-bold hover:bg-gray-100 hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {t("pages.selectAddress.addNew")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddressModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchAddresses();
          setIsAddModalOpen(false);
        }}
      />
    </>
  );
}