import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { ReportCategory, ReportType, ReportItem } from '../types';
import { createReport } from '../services/reportsService';
import { uploadImage } from '../services/storageService';
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  Eye,
  Calendar,
  MapPin,
  Tag,
} from 'lucide-react';

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

interface CreateReportViewProps {
  onSuccess: (reportId: string) => void;
  onCancel: () => void;
}

export const CreateReportView: React.FC<CreateReportViewProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { user, openAuthModal } = useAuth();

  // Form State
  const [reportType, setReportType] = useState<ReportType>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory>('electronics');
  const [description, setDescription] = useState('');
  const [generalLocation, setGeneralLocation] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contactPreference, setContactPreference] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // UX States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<ReportItem | null>(null);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('comments.mustLogin')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Sign in or create a real account to submit authentic lost or found reports.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
        >
          {t('nav.signIn')}
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of files) {
      if (selectedFiles.length + validFiles.length >= 3) {
        break;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(t('createReport.validation.invalidImageType'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(t('createReport.validation.imageTooLarge'));
        return;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...validPreviews]);
    setError(null);
  };

  const removePhoto = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // duplicate submission protection

    setError(null);

    // Validation
    if (!title.trim() || title.trim().length < 3) {
      setError(t('createReport.validation.titleRequired'));
      return;
    }
    if (!category) {
      setError(t('createReport.validation.categoryRequired'));
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError(t('createReport.validation.descriptionRequired'));
      return;
    }
    if (!generalLocation.trim()) {
      setError(t('createReport.validation.locationRequired'));
      return;
    }
    if (!eventDate) {
      setError(t('createReport.validation.dateRequired'));
      return;
    }

    try {
      setSubmitting(true);

      // Upload photos if any
      const uploadedImageUrls: string[] = [];
      for (const file of selectedFiles) {
        const result = await uploadImage(file, 'reports');
        uploadedImageUrls.push(result.url);
      }

      const report = await createReport({
        authorUid: user.uid,
        authorName: user.fullName || user.displayName || 'Community Member',
        type: reportType,
        title: title.trim(),
        description: description.trim(),
        category,
        generalLocation: generalLocation.trim(),
        eventDate,
        images: uploadedImageUrls,
        contactPreference: contactPreference.trim() || undefined,
        status: 'active',
      });

      setCreatedReport(report);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Success Confirmation State
  if (createdReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
            {t('createReport.successTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('createReport.successMessage')}{' '}
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {createdReport.id}
            </span>
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-start mb-8 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                  createdReport.type === 'lost'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {createdReport.type === 'lost' ? t('report.lostBadge') : t('report.foundBadge')}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {createdReport.title}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              {createdReport.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onSuccess(createdReport.id)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('createReport.viewReportBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCreatedReport(null);
                setTitle('');
                setDescription('');
                setSelectedFiles([]);
                setFilePreviews([]);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              {t('createReport.createAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-16">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('createReport.title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('createReport.subtitle')}
        </p>
      </div>

      {/* Safety Notice regarding sensitive documents */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 mb-6 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t('report.safeHandoverAlert')}</span>
        </p>
        <p>{t('report.privacyNote')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* 1. Report Type Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            {t('createReport.reportTypePrompt')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReportType('lost')}
              className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                reportType === 'lost'
                  ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                  {t('createReport.lostOption')}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('createReport.lostOptionDesc')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setReportType('found')}
              className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                reportType === 'found'
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {t('createReport.foundOption')}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('createReport.foundOptionDesc')}
              </p>
            </button>
          </div>
        </div>

        {/* 2. Item Title & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('createReport.itemTitle')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('createReport.itemTitlePlaceholder')}
              required
              maxLength={150}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('report.category')} *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('createReport.description')} *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('createReport.descriptionPlaceholder')}
            rows={4}
            required
            maxLength={3000}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
            <span>Minimum 10 characters</span>
            <span>{description.length} / 3000</span>
          </div>
        </div>

        {/* 4. Location & Event Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('createReport.locationLabel')} *
            </label>
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={generalLocation}
                onChange={(e) => setGeneralLocation(e.target.value)}
                placeholder={t('createReport.locationPlaceholder')}
                required
                maxLength={150}
                className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('createReport.dateLabel')} *
            </label>
            <div className="relative">
              <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 5. Contact Preference (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('createReport.contactPreferenceLabel')}
          </label>
          <input
            type="text"
            value={contactPreference}
            onChange={(e) => setContactPreference(e.target.value)}
            placeholder={t('createReport.contactPreferencePlaceholder')}
            maxLength={100}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 6. Photographs Upload (Max 3, up to 5MB each) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('createReport.photoUploadLabel')}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {t('createReport.photoUploadHelp')}
          </p>

          {filePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {filePreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                  <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1.5 end-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length < 3 && (
            <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer transition-colors">
              <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {t('createReport.uploadButton')}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPEG, WebP up to 5MB ({3 - selectedFiles.length} slots left)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('createReport.submitting')}</span>
              </>
            ) : (
              <span>{t('createReport.submitButton')}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
