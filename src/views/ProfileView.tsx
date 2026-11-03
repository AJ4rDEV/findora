import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { ReportItem } from '../types';
import { getUserReports, getUserBookmarks } from '../services/reportsService';
import { ReportCard } from '../components/ReportCard';
import { EmptyState } from '../components/EmptyState';
import {
  User,
  Calendar,
  Mail,
  ShieldCheck,
  Bookmark,
  FileText,
  Edit2,
  Check,
  X,
  LogOut,
} from 'lucide-react';

interface ProfileViewProps {
  onSelectReport: (id: string) => void;
  onNavigateToCreate: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onSelectReport,
  onNavigateToCreate,
}) => {
  const { t, formatDate } = useTranslation();
  const { user, openAuthModal, updateProfile, logout } = useAuth();

  const [tab, setTab] = useState<'reports' | 'saved'>('reports');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [bookmarks, setBookmarks] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEditName(user.fullName || user.displayName || '');
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const [userReports, userSaved] = await Promise.all([
          getUserReports(user.uid),
          getUserBookmarks(user.uid),
        ]);
        setReports(userReports);
        setBookmarks(userSaved);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) return;
    try {
      setSaving(true);
      await updateProfile({ fullName: editName.trim(), displayName: editName.trim() });
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('comments.mustLogin')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Sign in to view your profile, published reports, and bookmarked items.
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-start">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {user.fullName || user.displayName}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={t('profile.editProfile')}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                  Private
                </span>
              </span>

              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('profile.memberSince')} {formatDate(user.createdAt)}</span>
              </span>

              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Account</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('nav.signOut')}</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              tab === 'reports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('profile.publishedReports')} ({reports.length})</span>
          </button>

          <button
            onClick={() => setTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              tab === 'saved'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{t('profile.savedReports')} ({bookmarks.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse h-48"
            />
          ))}
        </div>
      ) : tab === 'reports' ? (
        reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('profile.emptyMyReports')}
            description="You have not published any reports yet. Report a lost item or something you found."
            actionText={t('profile.emptyMyReportsAction')}
            onAction={onNavigateToCreate}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} onSelect={onSelectReport} />
            ))}
          </div>
        )
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t('profile.emptySaved')}
          description={t('profile.emptySavedDesc')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((report) => (
            <ReportCard key={report.id} report={report} onSelect={onSelectReport} />
          ))}
        </div>
      )}
    </div>
  );
};
