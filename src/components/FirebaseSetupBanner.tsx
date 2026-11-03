import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { isFirebaseConfigured, getSavedFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../services/firebase';
import { Database, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, X, Settings2 } from 'lucide-react';

export const FirebaseSetupBanner: React.FC = () => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const currentConfig = getSavedFirebaseConfig();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');
  const [firestoreDatabaseId, setFirestoreDatabaseId] = useState(currentConfig?.firestoreDatabaseId || '');
  const [jsonInput, setJsonInput] = useState('');

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);
      if (parsed.firestoreDatabaseId) setFirestoreDatabaseId(parsed.firestoreDatabaseId);
    } catch {
      // Allow user to finish typing
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('API Key and Project ID are required.');
      return;
    }
    saveFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
      firestoreDatabaseId: firestoreDatabaseId.trim() || undefined,
    });
  };

  return (
    <>
      {/* Top Banner Indicator */}
      <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 text-[11px] py-1.5 px-4 text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            {isFirebaseConfigured ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('settings.configured')} ({projectId})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>Database: Persistent Browser Storage (Zero fake data)</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer shrink-0"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isFirebaseConfigured ? 'Firebase Settings' : 'Connect Firebase Cloud'}</span>
          </button>
        </div>
      </div>

      {/* Firebase Configuration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Firebase Cloud Configuration
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect your Firestore database & Authentication
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 leading-relaxed">
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Ready with full security rules & schema:
                </p>
                <p>
                  Findora has already prepared hardened <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-[11px]">firestore.rules</code> and <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-[11px]">storage.rules</code> in the project. Paste your Firebase project web configuration below to synchronize live cloud records.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                  Quick Paste Firebase Config (JSON object):
                </label>
                <textarea
                  value={jsonInput}
                  onChange={handleJsonPaste}
                  rows={3}
                  placeholder='{"apiKey": "...", "authDomain": "...", "projectId": "..."}'
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <form onSubmit={handleSave} className="space-y-2.5">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">API Key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                    placeholder="AIzaSy..."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Project ID</label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      required
                      placeholder="my-lost-found-app"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Auth Domain</label>
                    <input
                      type="text"
                      value={authDomain}
                      onChange={(e) => setAuthDomain(e.target.value)}
                      placeholder="app.firebaseapp.com"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Storage Bucket</label>
                    <input
                      type="text"
                      value={storageBucket}
                      onChange={(e) => setStorageBucket(e.target.value)}
                      placeholder="app.appspot.com"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">App ID</label>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="1:12345:web:..."
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-2">
                  {isFirebaseConfigured ? (
                    <button
                      type="button"
                      onClick={() => clearFirebaseConfig()}
                      className="px-3 py-2 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Disconnect & Use Standalone Mode
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">All data currently stays in browser storage.</span>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    Save & Connect Firebase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
