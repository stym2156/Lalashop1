import React from 'react';
import { useTranslation } from 'react-i18next';
import WithdrawalsTable from '@/components/Withdrawals/WithdrawalsTable';

const SellerWithdrawals = () => {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-[14px] font-semibold text-gray-900">{t('withdraw.sellerTitle')}</h2>
      <WithdrawalsTable role="seller" defaultStatus="pending" />
    </div>
  );
};

export default SellerWithdrawals;
