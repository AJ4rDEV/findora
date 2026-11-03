import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationsService';
import { EmptyState } from '../components/EmptyState';
import { Bell, CheckCheck, MessageSquare, Heart, CheckCircle2, Clock } from 'lucide-react';

interface NotificationsViewProps {
  onSelectReport: (reportId: string) => void;
  onOpenMessages: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onSelectReport,
  onOpenMessages,
}) => {
  const { t, formatRelativeTime } = useTranslation();
  const { user, openAuthModal } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserNotifications(user.uid);
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!user) return;
    if (!notif.read) {
      await markNotificationAsRead(user.uid, notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.type === 'message') {
      onOpenMessages();
    } else if (notif.relatedReportId) {
      onSelectReport(notif.relatedReportId);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('comments.mustLogin')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Sign in to view your activity notifications.
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('notifications.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real notifications for comments, likes, and return messages.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t('notifications.markAllRead')}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 animate-pulse h-18"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notifications.empty')}
          description={t('notifications.emptyDesc')}
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                notif.read
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 opacity-80'
                  : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900 shadow-xs'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                  {notif.message}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(notif.createdAt)}</span>
                </div>
              </div>
              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
