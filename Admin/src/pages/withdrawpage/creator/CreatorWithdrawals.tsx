import React from 'react';
import { useTranslation } from 'react-i18next';
import WithdrawalsTable from '@/components/Withdrawals/WithdrawalsTable';

const CreatorWithdrawals = () => {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-[14px] font-semibold text-gray-900">{t('withdraw.creatorTitle')}</h2>
      <WithdrawalsTable role="creator" defaultStatus="pending" />
    </div>
  );
};

export default CreatorWithdrawals;
