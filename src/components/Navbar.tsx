import React, { useState } from 'react';
import { useTranslation, LANGUAGE_OPTIONS } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LanguageCode } from '../types';
import {
  Search,
  PlusCircle,
  Bell,
  MessageSquare,
  User,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  ShieldCheck,
  FileText,
  LogOut,
  Settings as SettingsIcon,
  Compass,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, reportId?: string) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, unreadCount = 0 }) => {
  const { t, language, setLanguage } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLangSelect = (code: LanguageCode) => {
    setLanguage(code);
    setLangMenuOpen(false);
  };

  const navItemClass = (view: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
      currentView === view
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('feed')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  {t('app.name')}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 uppercase tracking-wider">
                  Community
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-[200px] md:max-w-none">
                {t('app.tagline')}
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button onClick={() => onNavigate('feed')} className={navItemClass('feed')}>
            <FileText className="w-4 h-4" />
            <span>{t('nav.feed')}</span>
          </button>
          <button onClick={() => onNavigate('explore')} className={navItemClass('explore')}>
            <Compass className="w-4 h-4" />
            <span>{t('nav.explore')}</span>
          </button>
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                onNavigate('create');
              }
            }}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('nav.createReport')}</span>
          </button>
          {user && (
            <>
              <button onClick={() => onNavigate('myReports')} className={navItemClass('myReports')}>
                <span>{t('nav.myReports')}</span>
              </button>
              <button onClick={() => onNavigate('messages')} className={navItemClass('messages')}>
                <MessageSquare className="w-4 h-4" />
                <span>{t('nav.messages')}</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Side Actions: Language, Theme, Auth / Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications icon (if user logged in) */}
          {user && (
            <button
              onClick={() => onNavigate('notifications')}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 relative transition-colors"
              title={t('nav.notifications')}
              aria-label={t('nav.notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              aria-label="Select Language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase">{language}</span>
            </button>

            {langMenuOpen && (
              <div
                className="absolute end-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 dark:bg-slate-800 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setLangMenuOpen(false)}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => handleLangSelect(opt.code)}
                    className={`w-full px-4 py-2.5 text-start text-sm flex items-center justify-between transition-colors ${
                      language === opt.code
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{opt.nativeName}</span>
                    <span className="text-xs text-slate-400 uppercase font-mono">{opt.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User Auth Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden lg:inline max-w-[120px] truncate">
                  {user.fullName || user.displayName}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {userMenuOpen && (
                <div
                  className="absolute end-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 dark:bg-slate-800 dark:border-slate-700"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                    <p className="text-xs text-slate-400">{t('profile.title')}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => onNavigate('profile')}
                    className="w-full px-4 py-2 text-start text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{t('nav.profile')}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('myReports')}
                    className="w-full px-4 py-2 text-start text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{t('nav.myReports')}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('settings')}
                    className="w-full px-4 py-2 text-start text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-400" />
                    <span>{t('nav.settings')}</span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-700/60 my-1"></div>
                  <button
                    onClick={() => logout()}
                    className="w-full px-4 py-2 text-start text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors"
              >
                {t('nav.signIn')}
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                {t('nav.signUp')}
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => {
              onNavigate('feed');
              setMobileMenuOpen(false);
            }}
            className={`w-full ${navItemClass('feed')}`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('nav.feed')}</span>
          </button>
          <button
            onClick={() => {
              onNavigate('explore');
              setMobileMenuOpen(false);
            }}
            className={`w-full ${navItemClass('explore')}`}
          >
            <Compass className="w-4 h-4" />
            <span>{t('nav.explore')}</span>
          </button>
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                onNavigate('create');
              }
              setMobileMenuOpen(false);
            }}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('nav.createReport')}</span>
          </button>
          {user && (
            <>
              <button
                onClick={() => {
                  onNavigate('myReports');
                  setMobileMenuOpen(false);
                }}
                className={`w-full ${navItemClass('myReports')}`}
              >
                <span>{t('nav.myReports')}</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('messages');
                  setMobileMenuOpen(false);
                }}
                className={`w-full ${navItemClass('messages')}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('nav.messages')}</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('profile');
                  setMobileMenuOpen(false);
                }}
                className={`w-full ${navItemClass('profile')}`}
              >
                <User className="w-4 h-4" />
                <span>{t('nav.profile')}</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('settings');
                  setMobileMenuOpen(false);
                }}
                className={`w-full ${navItemClass('settings')}`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>{t('nav.settings')}</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-start text-sm text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.signOut')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
