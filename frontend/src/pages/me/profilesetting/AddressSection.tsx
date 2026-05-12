"use client";
import { AlertCircle, MapPin, Trash2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AddressModal } from "./AddressModal";
import { apiClient } from "@/services/apiClient";

export function AddressSection() {
  const { t } = useTranslation("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]); // เก็บข้อมูลที่อยู่หลายรายการ
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. ฟังก์ชันดึงข้อมูลทั้งหมดจาก Backend
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
    fetchAddresses();
  }, []);

  const handleEdit = (addr: any) => {
    setEditData(addr);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("pages.addressForm2.confirmDelete"))) return;
    try {
      await apiClient(`/address/${id}`, { method: "DELETE" });
      fetchAddresses();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient(`/address/${id}/default`, { method: "PATCH" });
      fetchAddresses();
    } catch (error) {
      console.error("Set default error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-blue-700">
        <AlertCircle size={20} />
        <p className="text-xs font-medium">{t("pages.addressForm2.warehouseInfo")}</p>
      </div>

      <div className="space-y-4">
        {addresses.length > 0 ? (
          addresses.map((addr) => (
            <div 
              key={addr._id} 
              className={`p-4 border rounded-lg relative transition-colors ${addr.isDefault ? "border-[#00aeff] bg-[#00aeff]/5" : "border-gray-200 bg-white"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {addr.isDefault ? (
                    <span className="bg-[#00aeff] text-white text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} /> {t("pages.addressForm2.primary")}
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-gray-400 text-[10px] px-2 py-0.5 rounded border border-gray-200 hover:border-[#00aeff] hover:text-[#00aeff] transition-colors font-bold"
                    >
                      {t("pages.addressForm2.setAsPrimary")}
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleEdit(addr)} className="text-[#00aeff] text-xs font-bold hover:underline">{t("pages.addressForm2.edit")}</button>
                  <button onClick={() => handleDelete(addr._id)} className="text-red-400 text-xs font-bold hover:underline">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-bold">{addr.recipientName} ({addr.phoneNumber})</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {addr.village}, {addr.district}, {addr.province}
                <br />
                <span className="font-medium text-gray-400">{t("pages.addressForm2.branchLabel", { branch: addr.shippingBranch })}</span>
              </p>
            </div>
          ))
        ) : !loading && (
          <p className="text-center text-xs text-gray-400 py-4 italic text-balance">{t("pages.addressForm.noAddress")}</p>
        )}

        <button 
          onClick={handleAdd}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-bold hover:bg-gray-50/80 hover:border-[#00aeff]/40 hover:text-[#00aeff] transition-all group overflow-hidden relative"
        >
          <span className="relative flex items-center justify-center gap-2">
            <span className="text-lg">+</span> {t("pages.addressForm2.addNewAddress")}
          </span>
        </button>
      </div>

      <AddressModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchAddresses}
        editData={editData}
      />
    </div>
  );
}