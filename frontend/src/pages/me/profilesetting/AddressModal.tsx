import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, User, Home, Navigation, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

interface Address {
  _id?: string;
  recipientName: string;
  phoneNumber: string;
  village: string;
  district: string;
  province: string;
  shippingBranch: string;
  isDefault?: boolean;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: Address | null; // Data to edit
}

export function AddressModal({ isOpen, onClose, onSuccess, editData }: AddressModalProps) {
  const { t } = useTranslation("common");
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<Address>({
    recipientName: "",
    phoneNumber: "",
    village: "",
    district: "",
    province: "",
    shippingBranch: "",
    isDefault: false,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        recipientName: editData.recipientName || "",
        phoneNumber: editData.phoneNumber || "",
        village: editData.village || "",
        district: editData.district || "",
        province: editData.province || "",
        shippingBranch: editData.shippingBranch || "",
        isDefault: editData.isDefault || false,
      });
    } else {
      setFormData({
        recipientName: "",
        phoneNumber: "",
        village: "",
        district: "",
        province: "",
        shippingBranch: "",
        isDefault: false,
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async () => {
    // Check basic info
    if (!formData.recipientName || !formData.phoneNumber || !formData.village || !formData.district || !formData.province || !formData.shippingBranch) {
      alert(t("pages.addressForm2.fillAllInfo"));
      return;
    }

    setLoading(true);
    try {
      const endpoint = editData ? `/address/${editData._id}` : "/address";
      const method = editData ? "PUT" : "POST";

      await apiClient(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      alert(editData ? t("pages.addressForm2.addressUpdated") : t("pages.addressForm2.addressSaved"));
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || t("pages.addressForm2.cannotConnect"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-[#00aeff]/10 rounded-lg text-[#00aeff]">
                  <MapPin size={18} />
                </div>
                {editData ? t("pages.addressForm.editAddress") : t("pages.addressForm.addAddress")}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                {/* Recipient Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{t("pages.addressForm.recipientName")}</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={18} /></div>
                    <input
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("pages.addressForm2.fullName")}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00aeff]/20 focus:border-[#00aeff] outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{t("pages.addressForm.phoneNumber")}</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={18} /></div>
                    <input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      type="tel"
                      placeholder={t("pages.addressForm2.phoneNumberPh")}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00aeff]/20 focus:border-[#00aeff] outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Village */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{t("pages.addressForm.village")}</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Home size={18} /></div>
                    <input
                      name="village"
                      value={formData.village}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("pages.addressForm2.villagePh")}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00aeff]/20 focus:border-[#00aeff] outline-none text-sm"
                    />
                  </div>
                </div>

                {/* District & Province */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">{t("pages.addressForm.district")}</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Navigation size={18} /></div>
                      <input
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        type="text"
                        placeholder={t("pages.addressForm2.districtPh")}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00aeff]/20 focus:border-[#00aeff] outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 ml-1">{t("pages.addressForm.province")}</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={18} /></div>
                      <input
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        type="text"
                        placeholder={t("pages.addressForm2.provincePh")}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00aeff]/20 focus:border-[#00aeff] outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Branch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{t("pages.addressForm.shippingBranch")}</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Truck size={18} /></div>
                    <input
                      name="shippingBranch"
                      value={formData.shippingBranch}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("pages.addressForm2.branchPh")}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00aeff]/20 focus:border-[#00aeff] outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Default Checkbox */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="isDefault"
                    name="isDefault"
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#00aeff] border-gray-300 rounded focus:ring-[#00aeff]"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-600 font-medium cursor-pointer">
                    {t("pages.addressForm2.setAsDefault")}
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                disabled={loading}
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-white transition-all disabled:opacity-50"
              >
                {t("pages.addressForm2.cancel")}
              </button>
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 py-3 px-4 bg-[#00aeff] hover:bg-[#00aeff]/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-[#00aeff]/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? t("pages.addressForm.saving") : editData ? t("pages.addressForm.updateAddress") : t("pages.addressForm.saveAddress")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}