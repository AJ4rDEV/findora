import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { ReportItem, ReportStatus } from '../types';
import { getUserReports, updateReportStatus, deleteReport } from '../services/reportsService';
import { EmptyState } from '../components/EmptyState';
import {
  FileText,
  PlusCircle,
  CheckCircle,
  Archive,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react';

interface MyReportsViewProps {
  onSelectReport: (id: string) => void;
  onNavigateToCreate: () => void;
}

export const MyReportsView: React.FC<MyReportsViewProps> = ({
  onSelectReport,
  onNavigateToCreate,
}) => {
  const { t, formatDate, formatRelativeTime } = useTranslation();
  const { user, openAuthModal } = useAuth();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserReports = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserReports(user.uid);
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserReports();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('comments.mustLogin')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Sign in to view and manage your published lost and found reports.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white"
        >
          {t('nav.signIn')}
        </button>
      </div>
    );
  }

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    try {
      await updateReportStatus(reportId, user.uid, newStatus);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm(t('report.confirmDelete'))) return;
    try {
      await deleteReport(reportId, user.uid);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('profile.publishedReports')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your reports, mark them as returned, or archive them when completed.
          </p>
        </div>

        <button
          onClick={onNavigateToCreate}
          className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('nav.createReport')}</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse h-28"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('profile.emptyMyReports')}
          description="Reports you create to find your lost items or return found belongings will appear here."
          actionText={t('profile.emptyMyReportsAction')}
          onAction={onNavigateToCreate}
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isLost = report.type === 'lost';
            return (
              <div
                key={report.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isLost
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isLost ? t('report.lostBadge') : t('report.foundBadge')}
                    </span>

                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t(`categories.${report.category}`)}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      • {formatRelativeTime(report.createdAt)}
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectReport(report.id)}
                    className="font-bold text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    {report.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{report.generalLocation}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(report.eventDate)}</span>
                    </span>
                  </div>
                </div>

                {/* Status & Actions Controls */}
                <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                  {report.status !== 'resolved' ? (
                    <button
                      onClick={() => handleStatusChange(report.id, 'resolved')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('report.markResolved')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(report.id, 'active')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
                    >
                      {t('report.reopenReport')}
                    </button>
                  )}

                  <button
                    onClick={() => onSelectReport(report.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="View details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title={t('report.deleteReport')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
