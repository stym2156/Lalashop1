import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Eye, EyeOff, Lock, User } from 'lucide-react';
import { adminLogin } from '@/services/authApi';

const LoginPage = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(t('auth.emailPasswordRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      if (!res.token) {
        throw new Error(t('auth.missingToken'));
      }
      if (!res.isAdmin) {
        throw new Error(t('auth.notAdmin'));
      }
      window.localStorage.setItem('token', res.token);
      window.localStorage.setItem('admin', JSON.stringify({
        _id: res._id,
        name: res.name,
        email: res.email,
        customId: res.customId,
      }));
      if (remember) {
        window.localStorage.setItem('rememberDevice', 'true');
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-black font-sans">
      <div className="hidden lg:flex w-1/2 bg-black text-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            lalashop <span className="text-primary">admin</span>
          </span>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            {t('auth.secureHeadline')}
          </h1>
          <p className="text-gray-400 text-sm mt-6 max-w-sm leading-relaxed">
            {t('auth.secureSubtext')}
          </p>
        </div>
        <div className="text-[11px] text-gray-500 font-medium tracking-wide">
          v1.0.0 · {t('auth.internalUseOnly')}
        </div>
        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-primary opacity-10 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              lalashop <span className="text-primary">admin</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-black">{t('auth.signIn')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('auth.loginSubtitle')}</p>

          {error && (
            <div className="mt-6 px-4 py-3 rounded-md bg-red-50 text-red-700 text-[12px] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{t('auth.emailLabel')}</span>
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl mt-1.5 px-4 focus-within:border-primary transition-colors">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lala.shop"
                  className="w-full py-3 bg-transparent outline-none text-sm placeholder:text-gray-400"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{t('auth.passwordLabel')}</span>
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl mt-1.5 px-4 focus-within:border-primary transition-colors">
                <Lock className="w-4 h-4 text-gray-400 mr-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 bg-transparent outline-none text-sm placeholder:text-gray-400"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-[12px]">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded accent-primary"
                />
                {t('auth.rememberDevice')}
              </label>
              <a href="/forgot-password" className="text-gray-600 hover:text-primary font-medium transition-colors">
                {t('auth.forgotPassword')}
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? t('auth.signingIn') : `${t('auth.signIn')} →`}
            </button>
          </form>

          <p className="text-[11px] text-gray-400 mt-8 leading-relaxed">
            {t('auth.restrictedFooter')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
