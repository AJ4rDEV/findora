import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { ReportItem, ReportComment, ReportStatus } from '../types';
import {
  getReportById,
  updateReportStatus,
  deleteReport,
  updateReport,
  getComments,
  addComment,
  deleteComment,
  toggleLike,
  isReportLiked,
  toggleBookmark,
  isReportBookmarked,
} from '../services/reportsService';
import { getOrCreateConversation } from '../services/messagesService';
import { SafetyAlert } from '../components/SafetyAlert';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Tag,
  ShieldCheck,
  CheckCircle,
  Archive,
  MessageSquare,
  Send,
  Heart,
  Bookmark,
  Share2,
  Trash2,
  Edit3,
  User,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ReportDetailViewProps {
  reportId: string;
  onBack: () => void;
  onOpenConversation?: (conversationId: string) => void;
}

export const ReportDetailView: React.FC<ReportDetailViewProps> = ({
  reportId,
  onBack,
  onOpenConversation,
}) => {
  const { t, formatDate, formatRelativeTime } = useTranslation();
  const { user, openAuthModal } = useAuth();

  const [report, setReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Social states
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit modal / status change state
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isOwner = user && report && user.uid === report.authorUid;

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getReportById(reportId);
        if (!isMounted) return;
        if (!data) {
          setError('Report not found');
          return;
        }
        setReport(data);
        setLikesCount(data.likesCount || 0);

        if (user) {
          setLiked(isReportLiked(data.id, user.uid));
          setBookmarked(isReportBookmarked(data.id, user.uid));
        }

        const commentsData = await getComments(reportId);
        if (isMounted) setComments(commentsData);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load report');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [reportId, user]);

  const handleStatusChange = async (newStatus: ReportStatus) => {
    if (!user || !report) return;
    try {
      setStatusUpdating(true);
      const updated = await updateReportStatus(report.id, user.uid, newStatus);
      setReport(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!user || !report) return;
    try {
      await deleteReport(report.id, user.uid);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      setPostingComment(true);
      const newComment = await addComment(
        reportId,
        user.uid,
        user.fullName || user.displayName || 'Member',
        commentText
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      if (report) {
        setReport({ ...report, commentsCount: (report.commentsCount || 0) + 1 });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      await deleteComment(reportId, commentId, user.uid);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (report && report.commentsCount > 0) {
        setReport({ ...report, commentsCount: report.commentsCount - 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!user || !report) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await toggleLike(report.id, user.uid, user.fullName || user.displayName || 'Member');
      setLiked(res.liked);
      setLikesCount(res.count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    if (!user || !report) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await toggleBookmark(report.id, user.uid);
      setBookmarked(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    if (!report) return;
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartMessage = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!report) return;
    if (user.uid === report.authorUid) {
      alert('This is your own report.');
      return;
    }

    try {
      const conv = await getOrCreateConversation(
        report.id,
        report.title,
        report.type,
        user.uid,
        user.fullName || user.displayName || 'Member',
        report.authorUid,
        report.authorName
      );
      if (onOpenConversation) {
        onOpenConversation(conv.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open conversation');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {error || 'Report not found'}
        </h2>
        <button
          onClick={onBack}
          className="mt-4 px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const isLost = report.type === 'lost';
  const hasImages = report.images && report.images.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-16">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back')}</span>
        </button>

        {/* Social actions in top bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              liked
                ? 'border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={handleBookmark}
            className={`p-2 rounded-xl border transition-colors ${
              bookmarked
                ? 'border-amber-200 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="Bookmark"
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative transition-colors"
            title={t('report.shareReport')}
          >
            <Share2 className="w-4 h-4" />
            {copied && (
              <span className="absolute -bottom-8 end-0 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow whitespace-nowrap">
                {t('report.linkCopied')}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Safety Reminder Banner */}
      <SafetyAlert />

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm mb-8">
        {/* Gallery / Image Viewer */}
        {hasImages && (
          <div className="bg-slate-950 relative">
            <div className="aspect-[16/9] w-full max-h-[460px] flex items-center justify-center overflow-hidden">
              <img
                src={report.images[activeImageIndex]}
                alt={report.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {report.images.length > 1 && (
              <div className="absolute bottom-3 start-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md">
                {report.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-white scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* Status & Category Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isLost
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLost ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                {isLost ? t('report.lostBadge') : t('report.foundBadge')}
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>{t(`categories.${report.category}`)}</span>
              </span>
            </div>

            {/* Current Status Badge */}
            <div>
              {report.status === 'resolved' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>{t('report.statusResolved')}</span>
                </span>
              ) : report.status === 'closed' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Archive className="w-4 h-4" />
                  <span>{t('report.statusClosed')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>{t('report.statusActive')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
            {report.title}
          </h1>

          {/* Meta Details Pills */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-y border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{report.generalLocation}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{t(isLost ? 'report.dateLost' : 'report.dateFound')}: {formatDate(report.eventDate)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{t('report.publishedOn')} {formatRelativeTime(report.createdAt)}</span>
            </span>
          </div>

          {/* Description */}
          <div className="space-y-3 mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('createReport.description')}
            </h4>
            <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {report.description}
            </p>
          </div>

          {/* Contact Preference notice if provided */}
          {report.contactPreference && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-8 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                {t('createReport.contactPreferenceLabel')}:
              </span>
              <span>{report.contactPreference}</span>
            </div>
          )}

          {/* Author Card & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {report.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('report.reportedBy')}</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{report.authorName}</p>
              </div>
            </div>

            {/* If NOT owner: Contact Reporter button */}
            {!isOwner ? (
              <button
                onClick={handleStartMessage}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('report.contactOwner')}</span>
              </button>
            ) : (
              /* If OWNER: Management Actions */
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {report.status !== 'resolved' && (
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    disabled={statusUpdating}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t('report.markResolved')}</span>
                  </button>
                )}

                {report.status === 'active' ? (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    disabled={statusUpdating}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {t('report.markClosed')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange('active')}
                    disabled={statusUpdating}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 transition-colors"
                  >
                    {t('report.reopenReport')}
                  </button>
                )}

                <button
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title={t('report.deleteReport')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              {t('report.deleteReport')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {t('report.confirmDelete')}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteReport}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community Comments Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('comments.title')} ({comments.length})
          </h3>
        </div>

        {/* Comment input form */}
        <form onSubmit={handlePostComment} className="mb-6">
          <div className="relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? t('comments.placeholder') : t('comments.mustLogin')}
              disabled={!user || postingComment}
              rows={3}
              maxLength={1000}
              className="w-full p-3.5 pe-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 leading-relaxed"
            />
            {user ? (
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="absolute end-3 bottom-3 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-40 transition-all cursor-pointer"
                title={t('comments.submit')}
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="absolute end-3 bottom-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
              >
                {t('nav.signIn')}
              </button>
            )}
          </div>
        </form>

        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 italic">
            {t('comments.empty')}
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {comment.authorName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {comment.text}
                  </p>
                </div>

                {/* Author or report owner can delete */}
                {user && (user.uid === comment.authorUid || user.uid === report.authorUid) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title={t('comments.deleteComment')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
