import React from 'react';
import { useTranslation } from '../i18n';
import { FilterOptions, ReportCategory, ReportType, ReportStatus } from '../types';
import { Search, MapPin, Tag, X, SlidersHorizontal } from 'lucide-react';

interface ReportFiltersProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  categories: ReportCategory[];
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ filters, onChange, categories }) => {
  const { t } = useTranslation();

  const handleTypeChange = (type: 'all' | ReportType) => {
    onChange({ ...filters, type });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, category: e.target.value as 'all' | ReportCategory });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, status: e.target.value as 'all' | ReportStatus });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, searchQuery: e.target.value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, location: e.target.value });
  };

  const handleClear = () => {
    onChange({
      searchQuery: '',
      type: 'all',
      category: 'all',
      location: '',
      status: 'all',
    });
  };

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.location !== '' ||
    filters.status !== 'all';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs space-y-4">
      {/* Type Toggle Tabs: All / Lost / Found */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => handleTypeChange('all')}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              filters.type === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('filters.allTypes')}
          </button>
          <button
            onClick={() => handleTypeChange('lost')}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              filters.type === 'lost'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300'
            }`}
          >
            {t('filters.lostOnly')}
          </button>
          <button
            onClick={() => handleTypeChange('found')}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              filters.type === 'found'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            {t('filters.foundOnly')}
          </button>
        </div>

        {isFiltered && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('filters.clearFilters')}</span>
          </button>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={handleSearchChange}
          placeholder={t('filters.searchPlaceholder')}
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
        />
      </div>

      {/* Secondary Filters: Category, Location, Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Category Selector */}
        <div className="relative">
          <Tag className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('filters.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Location Input */}
        <div className="relative">
          <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.location}
            onChange={handleLocationChange}
            placeholder={t('filters.filterByLocation')}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('filters.allStatuses')}</option>
            <option value="active">{t('report.statusActive')}</option>
            <option value="resolved">{t('report.statusResolved')}</option>
            <option value="closed">{t('report.statusClosed')}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
