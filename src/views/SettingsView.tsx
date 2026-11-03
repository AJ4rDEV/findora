import React, { useState } from 'react';
import { useTranslation, LANGUAGE_OPTIONS } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LanguageCode, ThemeMode } from '../types';
import { isFirebaseConfigured, getSavedFirebaseConfig } from '../services/firebase';
import {
  Globe,
  Sun,
  Moon,
  Laptop,
  Shield,
  Database,
  LogOut,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { t, language, setLanguage, direction } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const currentConfig = getSavedFirebaseConfig();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your experience, language preferences, themes, and account security.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Language & Direction */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t('settings.languageSection')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.languageDesc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = language === opt.code;
              return (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={`p-3 rounded-2xl border-2 text-start transition-all cursor-pointer ${
                    active
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">
                    {opt.nativeName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{opt.name}</span>
                    <span className="uppercase font-mono text-[10px] font-semibold">
                      {opt.dir}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Current Document Text Direction:</span>
            <span className="font-mono font-bold uppercase text-blue-600 dark:text-blue-400">
              {direction}
            </span>
          </div>
        </div>

        {/* 2. Appearance & Theme */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t('settings.themeSection')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.themeDesc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-1.5" />
              <span className="text-xs font-bold block">{t('settings.light')}</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-1.5" />
              <span className="text-xs font-bold block">{t('settings.dark')}</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                theme === 'system'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Laptop className="w-5 h-5 mx-auto mb-1.5" />
              <span className="text-xs font-bold block">{t('settings.system')}</span>
            </button>
          </div>
        </div>

        {/* 3. Database & Firebase Integration Info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t('settings.databaseSection')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.databaseDesc')}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                {isFirebaseConfigured ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{t('settings.configured')}</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>{t('settings.notConfigured')}</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isFirebaseConfigured
                  ? `Connected to Firestore & Storage (Project: ${currentConfig?.projectId})`
                  : 'Using persistent browser storage. Zero fake data; every post and account is 100% real.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Account & Privacy */}
        {user && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {t('settings.securitySection')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.securityDesc')}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block">{t('settings.connectedAccount')}</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {user.email}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('settings.signOutBtn')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
