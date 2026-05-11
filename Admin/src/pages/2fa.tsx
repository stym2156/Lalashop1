import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { adminVerifyEmailOTP, adminSendEmailOTP, adminVerifyTOTP } from '@/services/authApi';

type Method = 'email' | 'totp';

const TwoFactorPage = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [method, setMethod] = useState<Method>('email');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (method === 'email') {
      adminSendEmailOTP().catch(() => {
        // Best effort — still allow user to enter code
      });
    }
  }, [method]);

  const handleChange = (idx: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...code];
    next[idx] = cleaned;
    setCode(next);
    if (cleaned && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError(t('pages.twoFactor.invalidCode'));
      return;
    }
    setLoading(true);
    try {
      if (method === 'email') {
        const res = await adminVerifyEmailOTP(fullCode);
        if (res.token) window.localStorage.setItem('token', res.token);
      } else {
        await adminVerifyTOTP(fullCode);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.twoFactor.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setInfo('');
    try {
      await adminSendEmailOTP();
      setInfo(t('pages.notifications.send.sentSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.notifications.send.sentFailed'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white text-black font-sans p-8">
      <div className="w-full max-w-sm">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors mb-12"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('pages.forgotPassword.backToLogin')}
        </button>

        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold tracking-tight">{t('pages.twoFactor.title')}</span>
        </div>

        <h2 className="text-2xl font-bold text-black">{t('pages.twoFactor.title')}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {t('pages.twoFactor.subtitle')}
        </p>

        <div className="flex gap-2 mt-4 text-[12px]">
          <button
            type="button"
            onClick={() => setMethod('email')}
            className={`px-3 py-1 rounded font-medium ${method === 'email' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t('auth.email')}
          </button>
          <button
            type="button"
            onClick={() => setMethod('totp')}
            className={`px-3 py-1 rounded font-medium ${method === 'totp' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t('pages.twoFactor.title')}
          </button>
        </div>

        {error && (
          <div className="mt-6 px-4 py-3 rounded-md bg-red-50 text-red-700 text-[12px] font-medium">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="mt-6 px-4 py-3 rounded-md bg-green-50 text-green-700 text-[12px] font-medium">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex gap-2 justify-between">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold tabular-nums bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-colors"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-3 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {loading ? t('pages.twoFactor.verifying') : `${t('pages.twoFactor.verify')} →`}
          </button>

          {method === 'email' && (
            <div className="flex items-center justify-center text-[12px] mt-6 text-gray-500">
              <button
                type="button"
                disabled={resending}
                onClick={handleResend}
                className="hover:text-black font-medium disabled:opacity-50"
              >
                {resending ? t('pages.notifications.send.sending') : t('actions.refresh')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TwoFactorPage;
