import { Shield, Lock, CheckCircle, Mail, Smartphone, ChevronRight, Eye, EyeOff, Copy, AlertCircle } from "lucide-react";
import { useEffect, useState, FormEvent, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

export function SecuritySection() {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Data
  const [userEmail, setUserEmail] = useState("");

  // Password State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 2FA State
  const [twoFactor, setTwoFactor] = useState({
    enabled: false,
    type: 'none' as 'email' | 'authenticator' | 'none'
  });

  // 2FA UI States
  const [activeSetup, setActiveSetup] = useState<'none' | 'email' | 'authenticator'>('none');
  const [emailInput, setEmailInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [totpSetup, setTotpSetup] = useState<{ secret: string, qrCode: string } | null>(null);
  const [totpToken, setTotpToken] = useState("");

  // Withdrawal PIN State
  const [hasWithdrawPin, setHasWithdrawPin] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [withdrawPin, setWithdrawPin] = useState("");

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const data = await apiClient("/auth/me");
        setUserEmail(data.email);
        setEmailInput(data.email);
        setTwoFactor({
          enabled: data.twoFactorEnabled || false,
          type: data.twoFactorType || 'none'
        });
        setHasWithdrawPin(!!data.hasWithdrawPin);
      } catch (error) {
        console.error("Failed to fetch security settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSecurity();
  }, []);

  const handleSetWithdrawPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawPin.length !== 6) {
      setError(t("pages.securityPanel2.pinSixDigits"));
      return;
    }

    setSaving(true);
    try {
      await apiClient("/auth/withdraw-pin/set", {
        method: "POST",
        body: JSON.stringify({ pin: withdrawPin }),
      });
      setHasWithdrawPin(true);
      setSuccess(true);
      setShowPinForm(false);
      setWithdrawPin("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || t("pages.securityPanel2.failedSetPin"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#00aeff] animate-spin rounded-full" />
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (passwords.new !== passwords.confirm) {
      setError(t("pages.securityPanel2.passwordsMismatch"));
      return;
    }

    setSaving(true);
    try {
      await apiClient("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwords.current,
          password: passwords.new
        }),
      });
      setSuccess(true);
      setPasswords({ current: "", new: "", confirm: "" });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || t("pages.securityPanel2.failedChangePassword"));
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmailOTP = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiClient("/auth/2fa/email/send", { method: "POST" });
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || t("pages.securityPanel2.failedSendOtp"));
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiClient("/auth/2fa/email/verify", {
        method: "POST",
        body: JSON.stringify({ otp })
      });
      setTwoFactor({ enabled: true, type: 'email' });
      setSuccess(true);
      setActiveSetup('none');
      setOtpSent(false);
      setOtp("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(t("pages.securityPanel2.invalidCode"));
    } finally {
      setSaving(false);
    }
  };

  const handleSetupAuthenticator = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = await apiClient("/auth/2fa/setup");
      setTotpSetup(data);
      setActiveSetup('authenticator');
    } catch (err: any) {
      setError(err.message || t("pages.securityPanel2.failedSetupAuth"));
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiClient("/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ token: totpToken })
      });
      setTwoFactor({ enabled: true, type: 'authenticator' });
      setSuccess(true);
      setActiveSetup('none');
      setTotpToken("");
      setTotpSetup(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(t("pages.securityPanel2.invalidCode"));
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm(t("pages.securityPanel2.confirmDisable2FA"))) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          twoFactorEnabled: false,
          twoFactorType: 'none'
        }),
      });
      setTwoFactor({ enabled: false, type: 'none' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || t("pages.securityPanel2.failedDisable2FA"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#00aeff]">
              <Lock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">{t("pages.securityPanel.password")}</p>
              <p className="text-xs text-gray-500">{t("pages.securityPanel.passwordDesc")}</p>
            </div>
          </div>
          
          <button
            onClick={() => { setShowPasswordForm(!showPasswordForm); setError(null); }}
            className="text-xs font-bold text-[#00aeff] hover:underline"
          >
            {showPasswordForm ? t("pages.securityPanel.cancel") : t("pages.securityPanel.changePassword")}
          </button>
          
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="p-4 space-y-4 border-t border-gray-50 bg-white">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">{t("pages.securityPanel.currentPassword")}</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-[#00aeff] outline-none"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">{t("pages.securityPanel.newPasswordLabel")}</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-[#00aeff] outline-none"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">{t("pages.securityPanel.confirmNewPassword")}</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-[#00aeff] outline-none"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && !activeSetup && !showPinForm && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#00aeff] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#008ecc] transition-colors disabled:opacity-50"
            >
              {saving ? t("pages.securityPanel.updating") : t("pages.securityPanel.updatePassword")}
            </button>
          </form>
        )}
        
      </div>

      {/* Withdrawal PIN Section */}
      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="flex items-center justify-between p-4 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasWithdrawPin ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"}`}>
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">{t("pages.securityPanel.withdrawalPin")}</p>
              <p className="text-xs text-gray-500">{hasWithdrawPin ? t("pages.securityPanel.pinSet") : t("pages.securityPanel.pinRequired")}</p>
            </div>
          </div>
          
          {!hasWithdrawPin ? (
            <button
              onClick={() => { setShowPinForm(!showPinForm); setError(null); }}
              className="text-xs font-bold text-[#00aeff] hover:underline"
            >
              {showPinForm ? t("pages.securityPanel.cancel") : t("pages.securityPanel.setPin")}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle size={14} />
              <span className="text-[10px] font-black tracking-widest">{t("pages.securityPanel.active")}</span>
            </div>
          )}
        </div>

        {showPinForm && !hasWithdrawPin && (
          <form onSubmit={handleSetWithdrawPin} className="p-5 space-y-4 border-t border-gray-50 bg-white animate-in slide-in-from-top-2">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 tracking-widest text-center block">{t("pages.securityPanel2.setPinLabel")}</label>
              <div className="flex justify-center gap-2">
                 <input
                    type="password"
                    maxLength={6}
                    required
                    className="w-full max-w-[240px] border-2 border-slate-100 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-[#00aeff] focus:border-transparent outline-none transition-all"
                    value={withdrawPin}
                    onChange={(e) => setWithdrawPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="******"
                  />
              </div>
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                {t("pages.securityPanel2.pinCannotChange")}
              </p>
            </div>
            
            {error && showPinForm && <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1 font-bold"><AlertCircle size={12} /> {error}</p>}
            
            <button
              type="submit"
              disabled={saving || withdrawPin.length !== 6}
              className="w-full bg-[#00aeff] text-white py-3 rounded-xl text-sm font-black tracking-widest shadow-lg shadow-[#00aeff]/20 active:scale-95 transition-all disabled:opacity-30"
            >
              {saving ? t("pages.securityPanel2.settingPin") : t("pages.securityPanel2.confirmPin")}
            </button>
          </form>
        )}
      </div>

      {/* 2FA Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Shield size={18} className="text-gray-400" />
          <h3 className="text-sm font-bold text-gray-700  tracking-wider">{t("pages.securityPanel.twoFactor")}</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Email Option */}
          <div className={`border rounded-xl transition-all overflow-hidden ${twoFactor.type === 'email' ? "border-[#00aeff] bg-[#00aeff]/5" : "border-gray-100 bg-white"}`}>
            <button
              onClick={() => {
                if (activeSetup === 'email') setActiveSetup('none');
                else { setActiveSetup('email'); setError(null); }
              }}
              disabled={twoFactor.enabled && twoFactor.type !== 'email'}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${twoFactor.type === 'email' ? "bg-[#00aeff] text-white" : "bg-gray-100 text-gray-400"}`}>
                  <Mail size={22} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{t("pages.securityPanel.emailAuth")}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
              </div>
              {twoFactor.type === 'email' ? <CheckCircle size={20} className="text-[#00aeff]" /> : <ChevronRight size={18} className={`text-gray-300 transition-transform ${activeSetup === 'email' ? 'rotate-90' : ''}`} />}
            </button>

            {activeSetup === 'email' && !twoFactor.enabled && (
              <div className="p-4 pt-0 space-y-4 border-t border-gray-50 bg-white/50 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1 pt-3">
                  <label className="text-[10px] font-bold text-gray-400">{t("pages.securityPanel2.emailAddress")}</label>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-[#00aeff] outline-none bg-gray-50"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t("pages.securityPanel2.enterEmailPh")}
                  />
                </div>
                {!otpSent ? (
                  <button
                    onClick={handleSendEmailOTP}
                    disabled={saving}
                    className="w-full py-2 bg-[#00aeff] text-white rounded-lg text-xs font-bold hover:bg-[#008ecc] transition-all"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full mx-auto" /> : t("pages.securityPanel2.sendCode")}
                  </button>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <p className="text-[10px] font-bold text-gray-400">{t("pages.securityPanel2.enter6Digit")}</p>
                    <input
                      type="text"
                      maxLength={6}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-center text-lg font-bold tracking-[0.5em] focus:ring-1 focus:ring-[#00aeff] outline-none"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    {error && activeSetup === 'email' && <p className="text-[10px] text-red-500 text-center font-bold">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setOtpSent(false); setError(null); }}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500"
                      >
                        {t("pages.securityPanel2.resend")}
                      </button>
                      <button
                        onClick={handleVerifyEmailOTP}
                        disabled={saving || otp.length < 6}
                        className="flex-[2] py-2 bg-[#00aeff] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full mx-auto" /> : t("pages.securityPanel2.verify")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Authenticator App Option */}
          <div className={`border rounded-xl transition-all overflow-hidden ${twoFactor.type === 'authenticator' ? "border-[#00aeff] bg-[#00aeff]/5" : "border-gray-100 bg-white"}`}>
            <button
              onClick={() => {
                if (activeSetup === 'authenticator') setActiveSetup('none');
                else { handleSetupAuthenticator(); setError(null); }
              }}
              disabled={twoFactor.enabled && twoFactor.type !== 'authenticator'}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${twoFactor.type === 'authenticator' ? "bg-[#00aeff] text-white" : "bg-gray-100 text-gray-400"}`}>
                  <Smartphone size={22} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{t("pages.securityPanel.authenticatorApp")}</p>
                  <p className="text-xs text-gray-500">{t("pages.securityPanel.authenticatorAppHint")}</p>
                </div>
              </div>
              {twoFactor.type === 'authenticator' ? <CheckCircle size={20} className="text-[#00aeff]" /> : <ChevronRight size={18} className={`text-gray-300 transition-transform ${activeSetup === 'authenticator' ? 'rotate-90' : ''}`} />}
            </button>

            {activeSetup === 'authenticator' && !twoFactor.enabled && totpSetup && (
              <div className="p-4 pt-0 space-y-5 border-t border-gray-50 bg-white/50 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col items-center gap-4 pt-4">
                  <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <img src={totpSetup.qrCode} alt={t("pages.securityPanel2.qrCodeAlt")} className="w-40 h-40" />
                  </div>
                  <div className="w-full space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 text-center">{t("pages.securityPanel2.secretKey")}</p>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                      <code className="flex-1 text-xs font-mono font-bold text-gray-600 truncate">{totpSetup.secret}</code>
                      <button onClick={() => { navigator.clipboard.writeText(totpSetup.secret); alert(t("pages.securityPanel2.copiedShort")) }} className="p-1 text-[#00aeff]">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400">{t("pages.securityPanel2.enterAppCode")}</p>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-center text-lg font-bold tracking-[0.5em] focus:ring-1 focus:ring-[#00aeff] outline-none"
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value)}
                  />
                  {error && activeSetup === 'authenticator' && <p className="text-[10px] text-red-500 text-center font-bold">{error}</p>}
                  <button
                    onClick={handleVerifyAuthenticator}
                    disabled={saving || totpToken.length < 6}
                    className="w-full py-2 bg-[#00aeff] text-white rounded-lg text-sm font-bold disabled:opacity-50"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full mx-auto" /> : t("pages.securityPanel2.verify")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Disable Option */}
          {twoFactor.enabled && (
            <button
              onClick={handleDisable2FA}
              disabled={saving}
              className="text-center py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
            >
              {t("pages.securityPanel2.disable2FA")}
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 z-50">
          <CheckCircle size={20} className="text-emerald-400" />
          <span className="text-sm font-medium">{t("pages.securityPanel2.settingsUpdated")}</span>
        </div>
      )}
    </div>
  );
}
