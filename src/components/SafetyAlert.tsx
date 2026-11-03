import React from 'react';
import { useTranslation } from '../i18n';
import { ShieldCheck, Info } from 'lucide-react';

export const SafetyAlert: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200/90 leading-relaxed space-y-1">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            {t('report.safeHandoverAlert')}
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300/80 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 inline shrink-0" />
            <span>{t('report.privacyNote')}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
