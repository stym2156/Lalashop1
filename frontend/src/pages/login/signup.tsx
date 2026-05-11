import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { UserPlus, Mail, Lock, User, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

export default function SignupPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data));

      // Redirect to home
      router.push("/");
    } catch (err: any) {
      setError(err.message || t("auth.failedToCreateAccount"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center p-4 font-body">
      <Head>
        <title>{t("auth.signupCta")} | LALA</title>
      </Head>

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-border overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        <Link href="/login" className="absolute top-6 left-6 text-gray-400 hover:text-dark transition-colors">
          <ArrowLeft size={20} />
        </Link>

        <div className="p-8 pt-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-dark">{t("auth.createAnAccount")}</h1>
            <p className="text-gray-500 text-sm">{t("auth.createAccountSubtitle")}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400  tracking-widest block mb-2">{t("auth.fullName")}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-light border border-gray-border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-dark"
                  placeholder={t("auth.namePlaceholder")}
                />
              </div>
            </div>


            <div>
              <label className="text-xs font-bold text-gray-400  tracking-widest block mb-2">{t("auth.phone")}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-light border border-gray-border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-dark"
                  placeholder="+856****"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400  tracking-widest block mb-2">{t("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-light border border-gray-border rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-dark"
                  placeholder="****@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400  tracking-widest block mb-2">{t("auth.password")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-gray-light border border-gray-border rounded-xl py-3 pl-10 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-xs text-dark"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400  tracking-widest block mb-2">{t("auth.confirmPassword")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-gray-light border border-gray-border rounded-xl py-3 pl-10 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-xs text-dark"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-dark hover:bg-navy disabled:bg-gray-300 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : t("auth.createAccount")}
            </button>
          </form>

          <div className="mt-8 text-center pb-2">
            <p className="text-sm text-gray-500">
              {t("auth.haveAccount")}{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">{t("auth.signIn")}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
