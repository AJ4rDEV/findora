import React from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { Home, Compass, PlusCircle, MessageSquare, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const { t } = useTranslation();
  const { user, openAuthModal } = useAuth();

  const handleAction = (view: string, requireAuth: boolean = false) => {
    if (requireAuth && !user) {
      openAuthModal('login');
      return;
    }
    onNavigate(view);
  };

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
      active
        ? 'text-blue-600 dark:text-blue-400 font-bold'
        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 start-0 end-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 h-16 flex items-center justify-around px-2 pb-safe">
      <button onClick={() => handleAction('feed')} className={itemClass(currentView === 'feed')}>
        <Home className="w-5 h-5 mb-0.5" />
        <span>{t('nav.feed')}</span>
      </button>

      <button onClick={() => handleAction('explore')} className={itemClass(currentView === 'explore')}>
        <Compass className="w-5 h-5 mb-0.5" />
        <span>{t('nav.explore')}</span>
      </button>

      {/* Central High-Visibility Report Button */}
      <button
        onClick={() => handleAction('create', true)}
        className="flex flex-col items-center justify-center -mt-5"
        aria-label={t('nav.createReport')}
      >
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all">
          <PlusCircle className="w-6 h-6 stroke-[2.3]" />
        </div>
        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
          {t('report.typeLost').split(' ')[0]}
        </span>
      </button>

      <button onClick={() => handleAction('messages', true)} className={itemClass(currentView === 'messages')}>
        <MessageSquare className="w-5 h-5 mb-0.5" />
        <span>{t('nav.messages')}</span>
      </button>

      <button
        onClick={() => {
          if (!user) {
            openAuthModal('login');
          } else {
            handleAction('profile');
          }
        }}
        className={itemClass(currentView === 'profile')}
      >
        <User className="w-5 h-5 mb-0.5" />
        <span>{user ? t('nav.profile') : t('nav.signIn')}</span>
      </button>
    </nav>
  );
};
