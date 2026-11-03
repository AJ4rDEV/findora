import React, { useState, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './i18n';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { FirebaseSetupBanner } from './components/FirebaseSetupBanner';
import { FeedView } from './views/FeedView';
import { ExploreView } from './views/ExploreView';
import { CreateReportView } from './views/CreateReportView';
import { ReportDetailView } from './views/ReportDetailView';
import { MyReportsView } from './views/MyReportsView';
import { MessagesView } from './views/MessagesView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import { AuthModal } from './views/AuthModal';
import { getUserNotifications } from './services/notificationsService';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('feed');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Parse shareable URL query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportParam = params.get('report');
    if (reportParam) {
      setSelectedReportId(reportParam);
      setCurrentView('reportDetail');
    }
  }, []);

  // Check unread notifications
  useEffect(() => {
    if (!user) {
      setUnreadNotifsCount(0);
      return;
    }
    const checkNotifs = async () => {
      try {
        const notifs = await getUserNotifications(user.uid);
        const unread = notifs.filter((n) => !n.read).length;
        setUnreadNotifsCount(unread);
      } catch (err) {
        // silent catch
      }
    };
    checkNotifs();
    const interval = setInterval(checkNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNavigate = (view: string, reportId?: string) => {
    if (reportId) {
      setSelectedReportId(reportId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setCurrentView('messages');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <FirebaseSetupBanner />
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        unreadCount={unreadNotifsCount}
      />

      <main className="flex-1">
        {currentView === 'feed' && (
          <FeedView
            onSelectReport={(id) => handleNavigate('reportDetail', id)}
            onNavigateToCreate={() => handleNavigate('create')}
          />
        )}

        {currentView === 'explore' && (
          <ExploreView
            onSelectReport={(id) => handleNavigate('reportDetail', id)}
            onNavigateToCreate={() => handleNavigate('create')}
          />
        )}

        {currentView === 'create' && (
          <CreateReportView
            onSuccess={(id) => handleNavigate('reportDetail', id)}
            onCancel={() => handleNavigate('feed')}
          />
        )}

        {currentView === 'reportDetail' && selectedReportId && (
          <ReportDetailView
            reportId={selectedReportId}
            onBack={() => handleNavigate('feed')}
            onOpenConversation={handleOpenConversation}
          />
        )}

        {currentView === 'myReports' && (
          <MyReportsView
            onSelectReport={(id) => handleNavigate('reportDetail', id)}
            onNavigateToCreate={() => handleNavigate('create')}
          />
        )}

        {currentView === 'messages' && (
          <MessagesView
            initialConversationId={selectedConversationId}
            onSelectReport={(id) => handleNavigate('reportDetail', id)}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsView
            onSelectReport={(id) => handleNavigate('reportDetail', id)}
            onOpenMessages={() => handleNavigate('messages')}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            onSelectReport={(id) => handleNavigate('reportDetail', id)}
            onNavigateToCreate={() => handleNavigate('create')}
          />
        )}

        {currentView === 'settings' && <SettingsView />}
      </main>

      <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
