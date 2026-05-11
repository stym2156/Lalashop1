import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

const ServerErrorPage = () => {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-8">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <div className="text-[11px] font-semibold text-gray-500 tracking-wide mt-6">ERROR / 500</div>
      <h1 className="text-5xl font-bold text-black tracking-tight mt-2">{t('pages.errors.serverErrorTitle')}</h1>
      <p className="text-sm text-gray-500 mt-4 max-w-md">
        {t('pages.errors.serverErrorMessage')}
      </p>

      <div className="flex items-center gap-2 mt-8">
        <button
          onClick={() => router.back()}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> {t('actions.back')}
        </button>
        <button
          onClick={() => router.reload()}
          className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {t('actions.tryAgain')}
        </button>
      </div>
    </div>
  );
};

export default ServerErrorPage;
