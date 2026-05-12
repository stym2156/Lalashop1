import { useState, useEffect } from "react";
import { CheckCircle, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import AddBankAccount from "../../creator/pagescreator/window/addbank";
import { apiClient } from "@/services/apiClient";

export function PaymentSection() {
  const { t } = useTranslation("common");
  const [view, setView] = useState<"main" | "addAccount">("main");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]); // Array of accounts
  const [loading, setLoading] = useState(true);

  const fetchBankData = async () => {
    try {
      setLoading(true);
      const data = await apiClient("/bank/me");
      if (data.success) {
        setBankAccounts(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch bank data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankData();
  }, []);

  const handleAddSuccess = () => {
    fetchBankData();
    setView("main");
  };

  if (view === "addAccount") {
    return (
      <AddBankAccount 
        onBack={() => setView("main")} 
        onSuccess={handleAddSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold  tracking-tight text-slate-800">{t("pages.paymentPanel.title")}</h3>
        <button 
          onClick={() => setView("addAccount")}
          className="bg-[#00aeff] text-white px-5 py-2 rounded-full font-black text-[10px] tracking-widest shadow-lg shadow-[#00aeff]/20 hover:bg-[#0096db] transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={14} /> {t("pages.paymentPanel.addAccount")}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 scale-75">
           <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00aeff] animate-spin rounded-full" />
        </div>
      ) : bankAccounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bankAccounts.map((account, index) => (
            <div key={index} className="flex flex-col p-5 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-[#00aeff]/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-black  text-[#00aeff] tracking-widest">{account.bankName}</p>
                <div className={`w-2 h-2 rounded-full ${account.isVerified ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-400"}`} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-slate-900 tracking-[0.15em] font-mono">
                  **** {account.accountNumber.slice(-4)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 tracking-wide truncate">{account.accountName}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className={`text-[9px] font-black  tracking-widest ${account.isVerified ? "text-emerald-500" : "text-amber-500"}`}>
                  {account.isVerified ? "Verified" : "Pending Approval"}
                </span>
                <CheckCircle size={14} className={account.isVerified ? "text-emerald-500" : "text-slate-200"} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div 
          onClick={() => setView("addAccount")}
          className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-3xl cursor-pointer hover:border-[#00aeff] hover:bg-slate-50 transition-all group"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4 group-hover:scale-110 group-hover:text-[#00aeff] transition-all">
             <Plus size={32} />
          </div>
          <p className="text-[11px] font-black text-slate-400 tracking-widest">{t("pages.paymentPanel.noBankAccounts")}</p>
          <p className="text-[10px] text-slate-300 mt-1">{t("pages.paymentPanel.clickToLink")}</p>
        </div>
      )}
    </div>
  );
}
