import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { ReportItem } from '../types';
import { toggleLike, isReportLiked, toggleBookmark, isReportBookmarked } from '../services/reportsService';
import {
  MapPin,
  Calendar,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  CheckCircle,
  Clock,
  Archive,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';

interface ReportCardProps {
  report: ReportItem;
  onSelect: (reportId: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onSelect }) => {
  const { t, formatRelativeTime, formatDate } = useTranslation();
  const { user, openAuthModal } = useAuth();

  const [liked, setLiked] = useState(() => (user ? isReportLiked(report.id, user.uid) : false));
  const [likesCount, setLikesCount] = useState(report.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(() => (user ? isReportBookmarked(report.id, user.uid) : false));
  const [copied, setCopied] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await toggleLike(report.id, user.uid, user.fullName || user.displayName || 'Member');
      setLiked(res.liked);
      setLikesCount(res.count);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const isBookmarked = await toggleBookmark(report.id, user.uid);
      setBookmarked(isBookmarked);
    } catch (err) {
      console.error('Bookmark failed:', err);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.origin + '?report=' + report.id;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLost = report.type === 'lost';
  const hasImages = report.images && report.images.length > 0;

  return (
    <article
      onClick={() => onSelect(report.id)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Lost/Found Tag & Status */}
        <div className="p-4 sm:p-5 pb-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Lost vs Found Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black tracking-wide uppercase shadow-xs ${
                isLost
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-900/60'
                  : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
              {isLost ? t('report.lostBadge') : t('report.foundBadge')}
            </span>

            {/* Status Indicator */}
            <div className="flex items-center gap-1.5">
              {report.status === 'resolved' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{t('report.statusResolved')}</span>
                </span>
              ) : report.status === 'closed' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  <Archive className="w-3.5 h-3.5" />
                  <span>{t('report.statusClosed')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>{formatRelativeTime(report.createdAt)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
            {report.title}
          </h3>

          {/* Category & Location Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>{t(`categories.${report.category}`)}</span>
            </span>

            <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate max-w-[150px]">{report.generalLocation}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDate(report.eventDate)}</span>
            </span>
          </div>

          {/* Description snippet */}
          <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {report.description}
          </p>
        </div>

        {/* Image Attachment Preview */}
        {hasImages ? (
          <div className="px-4 sm:px-5 pb-3">
            <div className="relative aspect-video sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={report.images[0]}
                alt={report.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                loading="lazy"
              />
              {report.images.length > 1 && (
                <div className="absolute bottom-2 end-2 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  <span>+{report.images.length - 1}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer / Interaction Controls */}
      <div className="p-3 sm:px-5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1 truncate max-w-[140px] sm:max-w-[200px]">
          <span className="text-[11px]">{t('report.reportedBy')}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
            {report.authorName}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-lg flex items-center gap-1 font-semibold transition-colors ${
              liked
                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Like"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 stroke-rose-500' : ''}`} />
            <span className="text-xs">{likesCount}</span>
          </button>

          {/* Comment Count */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(report.id);
            }}
            className="p-1.5 rounded-lg flex items-center gap-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Comments"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">{report.commentsCount || 0}</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-lg transition-colors ${
              bookmarked
                ? 'text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                : 'text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Bookmark"
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500' : ''}`} />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 relative transition-colors"
            title={t('report.shareReport')}
          >
            <Share2 className="w-4 h-4" />
            {copied && (
              <span className="absolute -top-7 end-0 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded shadow whitespace-nowrap animate-in fade-in">
                {t('report.linkCopied')}
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
