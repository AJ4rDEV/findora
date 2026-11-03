export type LanguageCode = 'en' | 'ar' | 'ku' | 'tr';

export type TextDirection = 'ltr' | 'rtl';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ReportType = 'lost' | 'found';

export type ReportCategory =
  | 'electronics'
  | 'keys'
  | 'wallets_bags'
  | 'documents_id'
  | 'clothing'
  | 'jewelry'
  | 'pets'
  | 'books_education'
  | 'vehicles_accessories'
  | 'other';

export type ReportStatus = 'active' | 'resolved' | 'closed';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  displayName?: string;
  photoURL?: string;
  preferredLanguage: LanguageCode;
  themePreference: ThemeMode;
  createdAt: string;
  updatedAt?: string;
}

export interface ReportItem {
  id: string;
  authorUid: string;
  authorName: string;
  type: ReportType;
  title: string;
  description: string;
  category: ReportCategory;
  generalLocation: string;
  eventDate: string;
  images: string[];
  contactPreference?: string;
  status: ReportStatus;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportComment {
  id: string;
  reportId: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  reportId: string;
  reportTitle: string;
  reportType: ReportType;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageTimestamp: string;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  type: 'comment' | 'like' | 'message' | 'status_change';
  relatedReportId?: string;
  actorUid: string;
  actorName: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  type: 'all' | ReportType;
  category: 'all' | ReportCategory;
  location: string;
  status: 'all' | ReportStatus;
}
