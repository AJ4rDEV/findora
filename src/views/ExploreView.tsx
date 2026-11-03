import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { ReportItem, FilterOptions, ReportCategory } from '../types';
import { getReports } from '../services/reportsService';
import { ReportCard } from '../components/ReportCard';
import { ReportFilters } from '../components/ReportFilters';
import { EmptyState } from '../components/EmptyState';
import { Compass, Search, Filter } from 'lucide-react';

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

interface ExploreViewProps {
  onSelectReport: (id: string) => void;
  onNavigateToCreate: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onSelectReport, onNavigateToCreate }) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    type: 'all',
    category: 'all',
    location: '',
    status: 'all',
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const results = await getReports(filters);
        if (isMounted) setReports(results);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  const selectCategoryPill = (cat: ReportCategory) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === cat ? 'all' : cat,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
          <Compass className="w-4 h-4" />
          <span>{t('nav.explore')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Explore Real Community Reports
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Filter through reports by keyword, category, approximate location, or recovery status.
        </p>
      </div>

      {/* Quick Category Badges Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = filters.category === cat;
          return (
            <button
              key={cat}
              onClick={() => selectCategoryPill(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs scale-102'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          );
        })}
      </div>

      {/* Search and Advanced Filters */}
      <ReportFilters filters={filters} onChange={setFilters} categories={CATEGORIES} />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
        <span>{t('filters.resultsCount', { count: reports.length })}</span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse space-y-4"
            >
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} onSelect={onSelectReport} />
          ))}
        </div>
      )}
    </div>
  );
};
