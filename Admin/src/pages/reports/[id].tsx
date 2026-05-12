import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft, AlertCircle, User, Tag, FileText, Save, Check, X,
  Shield, Eye, Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  fetchAdminReport,
  updateAdminReport,
  type AdminReportRow,
  type ReportAction,
  type ReportStatus,
} from '@/services/adminApi';

const reasonBadge: Record<string, string> = {
  spam: 'bg-orange-50 text-orange-700',
  abuse: 'bg-red-50 text-red-700',
  fraud: 'bg-purple-50 text-purple-700',
  counterfeit: 'bg-amber-50 text-amber-700',
  harassment: 'bg-rose-50 text-rose-700',
  other: 'bg-gray-100 text-gray-600',
};

const statusBadge: Record<string, string> = {
  open: 'bg-red-50 text-red-700',
  reviewing: 'bg-orange-50 text-orange-700',
  actioned: 'bg-green-50 text-green-700',
  dismissed: 'bg-gray-100 text-gray-600',
};

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const targetLink = (r: AdminReportRow): string => {
  switch (r.targetType) {
    case 'product':
      return `/products/${r.targetId}`;
    case 'shop':
      return `/shops/${r.targetId}`;
    case 'user':
      return `/users/${r.targetId}`;
    default:
      return '#';
  }
};

const ReportDetailPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState<AdminReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [adminNote, setAdminNote] = useState('');
  const [actionTaken, setActionTaken] = useState<ReportAction>('none');

  const reasonLabelT = (r: string) => t(`pages.reports.reasonLabel.${r}`);
  const statusLabelT = (s: string) => t(`pages.reports.statusLabel.${s}`);

  const load = async (reportId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminReport(reportId);
      const data = res.data ?? null;
      setReport(data);
      if (data) {
        setAdminNote(data.adminNote ?? '');
        setActionTaken(data.actionTaken ?? 'none');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.reports.details.loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof id !== 'string') return;
    load(id);
  }, [id]);

  const onUpdate = async (
    payload: { status?: ReportStatus; actionTaken?: ReportAction; adminNote?: string },
  ) => {
    if (typeof id !== 'string') return;
    setBusy(true);
    setSavedMessage(null);
    try {
      await updateAdminReport(id, payload);
      await load(id);
      setSavedMessage(t('pages.reports.detail.saved'));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('actions.save'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4 text-sm">
        <button
          onClick={() => router.push('/reports')}
          className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('pages.reports.details.back')}
        </button>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error || t('pages.reports.details.notFound')}
        </div>
      </div>
    );
  }

  const reporter = report.reportedBy;

  return (
    <div className="space-y-4 text-sm">
      <button
        onClick={() => router.push('/reports')}
        className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t('pages.reports.details.back')}
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-lg ${reasonBadge[report.reason]}`}>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[16px] font-bold text-gray-900">
              RPT-{report._id.slice(-6).toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${reasonBadge[report.reason]}`}>
                {reasonLabelT(report.reason)}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[report.status]}`}>
                {statusLabelT(report.status)}
              </span>
              <span className="text-[11px] text-gray-500">{t('pages.reports.table.reported')} {formatDate(report.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {report.status === 'open' && (
            <button
              disabled={busy}
              onClick={() => onUpdate({ status: 'reviewing' })}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-orange-700 bg-orange-50 inline-flex items-center hover:bg-orange-100 disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" /> {t('pages.reports.detail.startReviewing')}
            </button>
          )}
          {(report.status === 'open' || report.status === 'reviewing') && (
            <>
              <button
                disabled={busy}
                onClick={() => onUpdate({ status: 'actioned', actionTaken })}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-green-700 bg-green-50 inline-flex items-center hover:bg-green-100 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" /> {t('pages.reports.detail.takeAction')}
              </button>
              <button
                disabled={busy}
                onClick={() => onUpdate({ status: 'dismissed', actionTaken: 'none' })}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 bg-red-50 inline-flex items-center hover:bg-red-100 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5 mr-1.5" /> {t('pages.reports.detail.dismiss')}
              </button>
            </>
          )}
          {(report.status === 'actioned' || report.status === 'dismissed') && (
            <button
              disabled={busy}
              onClick={() => onUpdate({ status: 'reviewing' })}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-gray-100 inline-flex items-center hover:bg-gray-200 disabled:opacity-50"
            >
              {t('pages.reports.detail.reOpen')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section icon={FileText} title={t('pages.reports.detail.sectionDescription')}>
            <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">
              {report.description || <span className="text-gray-400">{t('pages.reports.detail.noDescription')}</span>}
            </p>

            {report.evidence && report.evidence.length > 0 && (
              <>
                <h4 className="text-[11px] font-semibold text-gray-500 tracking-wide mt-4 mb-2">{t('pages.reports.detail.labelEvidence')}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {report.evidence.map((src, i) => (
                    <a key={`${src}-${i}`} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`evidence ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section icon={Shield} title={t('pages.reports.detail.sectionAdminNote')}>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{t('pages.reports.detail.labelActionTaken')}</span>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value as ReportAction)}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-[12px] outline-none focus:border-primary"
                >
                  <option value="none">{t('pages.reports.detail.actionNone')}</option>
                  <option value="warn">{t('pages.reports.detail.actionWarn')}</option>
                  <option value="remove">{t('pages.reports.detail.actionRemove')}</option>
                  <option value="suspend">{t('pages.reports.detail.actionSuspend')}</option>
                  <option value="ban">{t('pages.reports.detail.actionBan')}</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">{t('pages.reports.detail.labelAdminNote')}</span>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={4}
                  placeholder={t('pages.reports.detail.adminNotePlaceholder')}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-[12px] outline-none focus:border-primary resize-none"
                />
              </label>

              <div className="flex items-center justify-end gap-2">
                {savedMessage && (
                  <span className="text-[12px] text-green-700 font-medium">{savedMessage}</span>
                )}
                <button
                  disabled={busy}
                  onClick={() => onUpdate({ actionTaken, adminNote })}
                  className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" /> {t('pages.reports.detail.save')}
                </button>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section icon={Tag} title={t('pages.reports.detail.sectionTarget')}>
            <Row label={t('pages.reports.detail.labelType')} value={<span className="capitalize text-gray-900">{report.targetType}</span>} />
            <Row
              label={t('pages.reports.detail.labelId')}
              value={
                <Link href={targetLink(report)} className="font-mono text-[11px] text-gray-900 hover:text-primary truncate">
                  {report.targetId}
                </Link>
              }
            />
            <Link
              href={targetLink(report)}
              className="block mt-3 px-3 py-2 rounded-md text-xs font-medium text-center bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              {t('pages.reports.detail.openTarget')}
            </Link>
          </Section>

          <Section icon={User} title={t('pages.reports.detail.sectionReporter')}>
            {reporter ? (
              <>
                <Row label={t('pages.reports.detail.labelName')} value={reporter.name || reporter.email || '—'} />
                {reporter.email && <Row label={t('pages.reports.detail.labelEmail')} value={reporter.email} />}
                {reporter.customId && <Row label={t('pages.reports.detail.labelCustomId')} value={reporter.customId} mono />}
                <Link
                  href={`/users/${reporter._id}`}
                  className="block mt-3 px-3 py-2 rounded-md text-xs font-medium text-center bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {t('pages.reports.detail.openReporterProfile')}
                </Link>
              </>
            ) : (
              <p className="text-[12px] text-gray-400">{t('pages.reports.detail.unknownReporter')}</p>
            )}
          </Section>

          <Section icon={Shield} title={t('pages.reports.detail.sectionReviewHistory')}>
            <Row label={t('pages.reports.detail.labelStatus')} value={<span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[report.status]}`}>{statusLabelT(report.status)}</span>} />
            <Row label={t('pages.reports.detail.labelAction')} value={<span className="text-[11px] capitalize">{report.actionTaken}</span>} />
            <Row label={t('pages.reports.detail.labelReviewedAt')} value={formatDate(report.reviewedAt)} />
            <Row
              label={t('pages.reports.detail.labelReviewedBy')}
              value={report.reviewedBy?.name || report.reviewedBy?.email || '—'}
            />
            <Row label={t('pages.reports.detail.labelCreated')} value={formatDate(report.createdAt)} />
            <Row label={t('pages.reports.detail.labelUpdated')} value={formatDate(report.updatedAt)} />
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-gray-100 p-4 space-y-2">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      <h3 className="text-[11px] font-semibold text-gray-500 tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-[11px] text-gray-500 flex-shrink-0">{label}</span>
    <span className={`text-[12px] text-gray-900 truncate text-right ${mono ? 'font-mono text-[11px]' : ''}`}>
      {value}
    </span>
  </div>
);

export default ReportDetailPage;
