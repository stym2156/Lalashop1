import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Megaphone } from "lucide-react";

const CampaignsPage: React.FC = () => {
  const { t } = useTranslation("common");
  return (
  <div className="space-y-4 text-sm">
    <div>
      <h1 className="text-[16px] font-bold text-gray-900">{t('pages.affCampaigns.title')}</h1>
      <p className="text-[12px] text-gray-500 mt-0.5">
        {t('pages.affCampaigns.subtitle')}
      </p>
    </div>

    <div className="rounded-lg bg-gray-50 px-6 py-12 text-center">
      <Megaphone className="w-7 h-7 text-gray-300 mx-auto mb-3" />
      <h2 className="text-[13px] font-semibold text-gray-700">{t('pages.affCampaigns.comingSoon')}</h2>
      <p className="text-[11px] text-gray-500 mt-1 max-w-md mx-auto">
        {t('pages.affCampaigns.comingSoonDesc')} <Link href="/affiliate/commission" className="text-[#00aeff] hover:underline font-bold">{t('pages.affCampaigns.commissionLink')}</Link> {t('pages.affCampaigns.andViewPerformance')} <Link href="/affiliate/creators" className="text-[#00aeff] hover:underline font-bold">{t('pages.affCampaigns.creatorsLink')}</Link>.
      </p>
    </div>
  </div>
  );
};

export default CampaignsPage;
