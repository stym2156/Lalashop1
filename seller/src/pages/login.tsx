import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Store, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { sellerLogin } from '@/services/authApi';

const SellerLoginPage = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError(t('pages.login.errEmailPassword'));
      return;
    }
    setLoading(true);
    try {
      const res = await sellerLogin(email, password);
      if (!res.token) {
        throw new Error(t('pages.login.errMissingToken'));
      }
      if (!res.isSeller) {
        throw new Error(t('pages.login.errNotSeller'));
      }
      window.localStorage.setItem('token', res.token);
      window.localStorage.setItem(
        'seller',
        JSON.stringify({
          _id: res._id,
          name: res.name,
          email: res.email,
          customId: res.customId,
          seller_type: res.seller_type,
        })
      );
      const redirect = (router.query.redirect as string) || '/';
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.login.errLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-black font-sans">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-black text-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#00aeff]" />
          <span className="text-xl font-bold tracking-tight">
            lalashop <span className="text-[#00aeff]">{t('pages.login.brandSeller')}</span>
          </span>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            {t('pages.login.headlineLine1')}<br />{t('pages.login.headlineLine2')}
          </h1>
          <p className="text-gray-400 text-sm mt-6 max-w-sm leading-relaxed">
            {t('pages.login.tagline')}
          </p>
          <div className="mt-8 flex flex-col gap-2 text-[12px] text-gray-500">
            <div>📦 {t('pages.login.feature1')}</div>
            <div>🛒 {t('pages.login.feature2')}</div>
            <div>💰 {t('pages.login.feature3')}</div>
            <div>📊 {t('pages.login.feature4')}</div>
          </div>
        </div>
        <div className="text-[11px] text-gray-500 font-medium tracking-wide">
          {t('pages.login.approvedOnly')}
        </div>
        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-[#00aeff] opacity-10 blur-3xl" />
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <Store className="w-5 h-5 text-[#00aeff]" />
            <span className="text-xl font-bold tracking-tight">
              lalashop <span className="text-[#00aeff]">{t('pages.dashboard.seller').toLowerCase()}</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-black">{t('pages.login.signInTitle')}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {t('pages.login.signInSubtitle')}
          </p>

          {error && (
            <div className="mt-6 px-4 py-3 rounded-md bg-red-50 text-red-700 text-[12px] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{t('pages.login.emailLabel')}</span>
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl mt-1.5 px-4 focus-within:border-[#00aeff] transition-colors">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('pages.login.emailPlaceholder')}
                  className="w-full py-3 bg-transparent outline-none text-sm placeholder:text-gray-400"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{t('pages.login.passwordLabel')}</span>
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl mt-1.5 px-4 focus-within:border-[#00aeff] transition-colors">
                <Lock className="w-4 h-4 text-gray-400 mr-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 bg-transparent outline-none text-sm placeholder:text-gray-400"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-gray-400 hover:text-black transition-colors"
                  aria-label={showPassword ? t('pages.login.hidePassword') : t('pages.login.showPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-400">{t('pages.login.forgotHint')}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#00aeff] text-white text-sm font-semibold rounded-xl hover:bg-[#0096db] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? t('pages.login.signingIn') : `${t('pages.login.signIn')} →`}
            </button>
          </form>

          <p className="text-[11px] text-gray-400 mt-8 leading-relaxed">
            {t('pages.login.notSeller')}{' '}
            <a
              href="http://localhost:3000/me/opensho/openshop"
              className="text-[#00aeff] font-semibold hover:underline"
            >
              {t('pages.login.openShop')} →
            </a>{' '}
            {t('pages.login.openShopHint')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerLoginPage;
