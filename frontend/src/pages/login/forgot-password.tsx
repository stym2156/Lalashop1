import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  
  // UI States
  const [emailSent, setEmailSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Data States
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSent) return; // Prevent re-sending if already sent (or could allow resend)

    setLoading(true);
    setError(null);
    try {
      await apiClient("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identity: email }),
      });
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || t("auth.failedToSendCode"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient("/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ identity: email, otp }),
      });
      setOtpVerified(true);
    } catch (err: any) {
      setError(err.message || t("auth.invalidCode"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ identity: email, otp, password: newPassword }),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || t("auth.failedToReset"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 font-sans">
      <Head>
        <title>{t("auth.resetPasswordTitle")} • LALA</title>
      </Head>

      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden relative">
        {!isSuccess && (
          <Link href="/login" className="absolute top-8 left-8 text-slate-400 hover:text-primary transition-all p-2 hover:bg-slate-50 rounded-full z-10">
            <ArrowLeft size={22} />
          </Link>
        )}

        <div className="p-10 pt-16">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t("auth.forgotPasswordTitle")}</h1>
                  <p className="text-slate-500 text-xs mt-1">{t("auth.forgotPasswordSubtitle")}</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="font-medium">{error}</p>
                  </motion.div>
                )}

                {/* STEP 1: Email Input */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1 ">{t("auth.email")}</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email" 
                        disabled={emailSent}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-slate-50 border ${emailSent ? 'border-green-200 text-slate-400' : 'border-slate-200 text-slate-800'} rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-sm`}
                        placeholder="email@example.com"
                      />
                      {emailSent && <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                    </div>
                  </div>

                  {!emailSent && (
                    <button 
                      onClick={handleRequestOTP}
                      disabled={loading || !email.includes("@")}
                      className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : t("auth.sendVerificationCode")}
                    </button>
                  )}
                </div>

                {/* STEP 2: OTP Input (Unfolds) */}
                <AnimatePresence>
                  {emailSent && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-4 pt-4 border-t border-slate-100"
                    >
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">{t("auth.enterCode")}</label>
                        <input 
                          type="text" 
                          disabled={otpVerified}
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                          className={`w-full bg-slate-50 border ${otpVerified ? 'border-green-200 text-slate-400' : 'border-slate-200 text-slate-800'} rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5rem] outline-none transition-all`}
                          placeholder="******"
                        />
                      </div>
                      
                      {!otpVerified && (
                        <button 
                          onClick={handleVerifyOTP}
                          disabled={loading || otp.length !== 6}
                          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          {loading ? <Loader2 className="animate-spin" size={20} /> : t("auth.verifyCode")}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* STEP 3: Reset Password (Unfolds) */}
                <AnimatePresence>
                  {otpVerified && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-4 pt-4 border-t border-slate-100"
                    >
                      <label className="text-[11px] font-bold text-slate-400 tracking-widest ml-1">{t("auth.newPassword")}</label>
                      
                      <div className="space-y-3">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock size={18} />
                          </div>
                          <input 
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 outline-none text-sm"
                            placeholder={t("auth.newPassword")}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock size={18} />
                          </div>
                          <input 
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none text-sm"
                            placeholder={t("auth.confirmNewPassword")}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleResetPassword}
                        disabled={loading || newPassword.length < 6}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 text-sm mt-2"
                      >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : t("auth.resetPassword")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-3">{t("auth.passwordChanged")}</h2>
                <p className="text-slate-500 text-sm mb-10 px-2 leading-relaxed">
                  {t("auth.passwordChangedDesc")}
                </p>
                <Link
                  href="/login"
                  className="w-full inline-block bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  {t("auth.returnToLogin")}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}