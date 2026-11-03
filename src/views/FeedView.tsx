import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { ReportItem, FilterOptions, ReportCategory } from '../types';
import { getReports } from '../services/reportsService';
import { ReportCard } from '../components/ReportCard';
import { ReportFilters } from '../components/ReportFilters';
import { EmptyState } from '../components/EmptyState';
import { SafetyAlert } from '../components/SafetyAlert';
import { PlusCircle, RefreshCw, FileText, Sparkles } from 'lucide-react';

const CATEGORIES: ReportCategory[] = [
  'electronics',
  'keys',
  'wallets_bags',
  'documents_id',
  'clothing',
  'jewelry',
  'pets',
  'books_education',
  'vehicles_accessories',
  'other',
];

interface FeedViewProps {
  onSelectReport: (id: string) => void;
  onNavigateToCreate: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ onSelectReport, onNavigateToCreate }) => {
  const { t } = useTranslation();
  const { user, openAuthModal } = useAuth();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    type: 'all',
    category: 'all',
    location: '',
    status: 'all',
  });

  const loadFeed = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const items = await getReports(filters);
      setReports(items);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [filters]);

  const handleCreateClick = () => {
    if (!user) {
      openAuthModal('login');
    } else {
      onNavigateToCreate();
    }
  };

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.location !== '' ||
    filters.status !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* Community Hero Introduction */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 sm:p-10 text-white shadow-xl shadow-blue-900/10 mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('app.tagline')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {t('app.subtagline')}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-xl leading-relaxed">
            Every report on Findora is 100% verified and created by real community members. Report what you lost or found in seconds.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreateClick}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white text-blue-700 hover:bg-blue-50 active:scale-95 shadow-lg shadow-black/10 transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.4]" />
              <span>{t('nav.createReport')}</span>
            </button>
            <button
              onClick={() => loadFeed(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm active:scale-95 transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t('common.loading') : 'Refresh Feed'}</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -end-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Safety Alert Reminder */}
      <SafetyAlert />

      {/* Search & Filter Controls */}
      <ReportFilters filters={filters} onChange={setFilters} categories={CATEGORIES} />

      {/* Feed Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        isFiltered ? (
          <EmptyState
            title={t('emptyStates.noSearchResults')}
            description={t('emptyStates.noSearchResultsDesc')}
            secondaryActionText={t('filters.clearFilters')}
            onSecondaryAction={() =>
              setFilters({
                searchQuery: '',
                type: 'all',
                category: 'all',
                location: '',
                status: 'all',
              })
            }
          />
        ) : (
          <EmptyState
            icon={FileText}
            title={t('emptyStates.noReportsFeed')}
            description={t('emptyStates.noReportsFeedDesc')}
            actionText={t('emptyStates.createFirstReport')}
            onAction={handleCreateClick}
          />
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              {t('filters.resultsCount', { count: reports.length })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} onSelect={onSelectReport} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
