import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

export default function LoginPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After OAuth callback the backend redirects to /login?token=...
  // Persist BOTH the token AND the resolved user profile (matching the
  // email/password flow) — otherwise pages that read `userInfo` from
  // localStorage think the user is still anonymous and bounce back here.
  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;
    if (!token || typeof token !== "string") return;
    let cancelled = false;
    (async () => {
      try {
        localStorage.setItem("token", token);
        const res = await apiClient("/auth/me");
        const profile = res?.data || res;
        if (cancelled) return;
        if (profile?._id) {
          const { token: _t, success: _s, ...userInfo } = profile;
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
        }
        router.replace("/");
      } catch (err) {
        if (!cancelled) {
          localStorage.removeItem("token");
          setError(t("auth.invalidCredentials"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.token, router, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      localStorage.setItem("token", data.token);
      const { token, success, ...userInfo } = data;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      router.push("/");
    } catch (err: any) {
      setError(err.message || t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google') => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    window.location.href = `${backendUrl}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans selection:bg-primary/20">
      <Head>
        <title>{t("auth.loginTitle")} • LALA</title>
      </Head>

      <div className="w-full max-w-[400px] space-y-4">
        {/* Main Login Card */}
        <div className="bg-white shadow-xl shadow-slate-200/60 rounded-2xl p-8 pt-12 pb-10 flex flex-col items-center border border-white/50 backdrop-blur-sm">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
             <div className="w-16 h-16 bg-primary rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center mb-4 transform -rotate-6">
                <span className="text-white text-3xl font-black italic">L</span>
             </div>
             <h1 className="text-4xl font-black text-slate-800 tracking-tightest">
               LALA
             </h1>
          </div>

          {error && (
            <div className="mb-6 w-full p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-1 duration-300">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-600 ml-1">{t("auth.emailOrPhone")}</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={t("auth.emailWithPhonePlaceholder")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-center px-1">
                <label className="text-[13px] font-semibold text-slate-600">{t("auth.password")}</label>
                <Link href="/login/forgot-password" className="text-xs font-bold text-primary hover:text-primary-hover">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.email || formData.password.length < 6}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/25 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : t("auth.loginCta")}
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-[1px] bg-slate-100"></div>
              <span className="text-[12px] font-bold text-slate-400  tracking-widest">{t("auth.orContinueWith")}</span>
              <div className="flex-1 h-[1px] bg-slate-100"></div>
            </div>

            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </form>
          <div className="bg-white/60 border border-white rounded-2xl p-5 text-center backdrop-blur-md shadow-sm">
            <p className="text-sm text-slate-600">
              {t("auth.noAccount")}{" "}
              <Link href="/login/signup" className="text-primary font-bold hover:underline ml-1">{t("auth.createAccount")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}