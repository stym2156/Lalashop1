import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Home } from 'lucide-react';

const NotFoundPage = () => {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-8">
      <div className="text-[11px] font-semibold text-gray-500 tracking-wide">ERROR / 404</div>
      <h1 className="text-6xl font-bold text-black tracking-tight mt-4">{t('pages.errors.notFoundTitle')}</h1>
      <p className="text-sm text-gray-500 mt-4 max-w-md">
        {t('pages.errors.notFoundMessage')}
      </p>
      <p className="text-[11px] text-gray-400 font-mono mt-2">{router.asPath}</p>

      <div className="flex items-center gap-2 mt-8">
        <button
          onClick={() => router.back()}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> {t('actions.back')}
        </button>
        <button
          onClick={() => router.push('/')}
          className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900"
        >
          <Home className="w-3.5 h-3.5 mr-1.5" /> {t('nav.dashboard')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
