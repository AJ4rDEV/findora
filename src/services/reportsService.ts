import {
  db,
  auth,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  ReportItem,
  ReportComment,
  FilterOptions,
  ReportStatus,
} from '../types';
import { createNotification } from './notificationsService';

const STORAGE_REPORTS_KEY = 'findora_reports_db';
const STORAGE_COMMENTS_KEY = 'findora_comments_db';
const STORAGE_LIKES_KEY = 'findora_likes_db';
const STORAGE_BOOKMARKS_KEY = 'findora_bookmarks_db';

// Helper for local persistent storage
function getLocalReports(): ReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: ReportItem[]) {
  localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
}

function getLocalComments(): ReportComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalComments(comments: ReportComment[]) {
  localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(comments));
}

function getLocalLikes(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_LIKES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalLikes(likes: Record<string, string[]>) {
  localStorage.setItem(STORAGE_LIKES_KEY, JSON.stringify(likes));
}

function getLocalBookmarks(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalBookmarks(bookmarks: Record<string, string[]>) {
  localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

// 1. Get Reports with Filtering
export async function getReports(filters?: Partial<FilterOptions>): Promise<ReportItem[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const items: ReportItem[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<ReportItem, 'id'>) });
      });

      return applyLocalFilters(items, filters);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'reports', auth);
    }
  }

  // Standalone persistent mode (strictly real records from local storage)
  const allReports = getLocalReports();
  // Sort latest first
  allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return applyLocalFilters(allReports, filters);
}

function applyLocalFilters(reports: ReportItem[], filters?: Partial<FilterOptions>): ReportItem[] {
  if (!filters) return reports;

  return reports.filter((item) => {
    // Type filter
    if (filters.type && filters.type !== 'all' && item.type !== filters.type) {
      return false;
    }
    // Category filter
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    // Status filter
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }
    // Location filter
    if (filters.location && filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      if (!item.generalLocation.toLowerCase().includes(loc)) {
        return false;
      }
    }
    // Keyword search
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchLoc = item.generalLocation.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCat) {
        return false;
      }
    }

    return true;
  });
}

// 2. Get Single Report
export async function getReportById(id: string): Promise<ReportItem | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docSnap = await getDoc(doc(db, 'reports', id));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...(docSnap.data() as Omit<ReportItem, 'id'>) };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `reports/${id}`, auth);
    }
  }

  const reports = getLocalReports();
  return reports.find((r) => r.id === id) || null;
}

// 3. Create Report
export async function createReport(
  data: Omit<ReportItem, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>
): Promise<ReportItem> {
  const newId = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const fullReport: ReportItem = {
    ...data,
    id: newId,
    likesCount: 0,
    commentsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db && auth) {
    try {
      await setDoc(doc(db, 'reports', newId), fullReport);
      return fullReport;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reports/${newId}`, auth);
    }
  }

  const reports = getLocalReports();
  reports.unshift(fullReport);
  saveLocalReports(reports);
  return fullReport;
}

// 4. Update Report
export async function updateReport(
  reportId: string,
  userUid: string,
  updates: Partial<Pick<ReportItem, 'title' | 'description' | 'category' | 'generalLocation' | 'eventDate' | 'images' | 'contactPreference'>>
): Promise<ReportItem> {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db && auth) {
    try {
      const reportRef = doc(db, 'reports', reportId);
      const snap = await getDoc(reportRef);
      if (!snap.exists()) throw new Error('Report not found');
      const current = snap.data() as ReportItem;
      if (current.authorUid !== userUid) {
        throw new Error('Permission denied: You cannot edit another user’s report.');
      }

      await updateDoc(reportRef, {
        ...updates,
        updatedAt: now,
      });

      return { ...current, ...updates, updatedAt: now };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`, auth);
    }
  }

  const reports = getLocalReports();
  const index = reports.findIndex((r) => r.id === reportId);
  if (index === -1) throw new Error('Report not found');
  if (reports[index].authorUid !== userUid) {
    throw new Error('Permission denied: You cannot edit another user’s report.');
  }

  reports[index] = {
    ...reports[index],
    ...updates,
    updatedAt: now,
  };
  saveLocalReports(reports);
  return reports[index];
}

// 5. Update Status (Active, Resolved, Closed)
export async function updateReportStatus(
  reportId: string,
  userUid: string,
  newStatus: ReportStatus
): Promise<ReportItem> {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db && auth) {
    try {
      const reportRef = doc(db, 'reports', reportId);
      const snap = await getDoc(reportRef);
      if (!snap.exists()) throw new Error('Report not found');
      const current = snap.data() as ReportItem;
      if (current.authorUid !== userUid) {
        throw new Error('Permission denied: Only the author can update report status.');
      }

      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: now,
      });

      return { ...current, status: newStatus, updatedAt: now };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`, auth);
    }
  }

  const reports = getLocalReports();
  const index = reports.findIndex((r) => r.id === reportId);
  if (index === -1) throw new Error('Report not found');
  if (reports[index].authorUid !== userUid) {
    throw new Error('Permission denied: Only the author can update report status.');
  }

  reports[index] = {
    ...reports[index],
    status: newStatus,
    updatedAt: now,
  };
  saveLocalReports(reports);
  return reports[index];
}

// 6. Delete Report
export async function deleteReport(reportId: string, userUid: string): Promise<void> {
  if (isFirebaseConfigured && db && auth) {
    try {
      const reportRef = doc(db, 'reports', reportId);
      const snap = await getDoc(reportRef);
      if (!snap.exists()) throw new Error('Report not found');
      const current = snap.data() as ReportItem;
      if (current.authorUid !== userUid) {
        throw new Error('Permission denied: You cannot delete another user’s report.');
      }
      await deleteDoc(reportRef);
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reports/${reportId}`, auth);
    }
  }

  const reports = getLocalReports();
  const index = reports.findIndex((r) => r.id === reportId);
  if (index === -1) throw new Error('Report not found');
  if (reports[index].authorUid !== userUid) {
    throw new Error('Permission denied: You cannot delete another user’s report.');
  }

  reports.splice(index, 1);
  saveLocalReports(reports);
}

// 7. Get User Published Reports
export async function getUserReports(authorUid: string): Promise<ReportItem[]> {
  const all = await getReports();
  return all.filter((r) => r.authorUid === authorUid);
}

// 8. Comments
export async function getComments(reportId: string): Promise<ReportComment[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'reports', reportId, 'comments'), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      const comments: ReportComment[] = [];
      snapshot.forEach((snap) => {
        comments.push({ id: snap.id, ...(snap.data() as Omit<ReportComment, 'id'>) });
      });
      return comments;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `reports/${reportId}/comments`, auth);
    }
  }

  const allComments = getLocalComments();
  return allComments.filter((c) => c.reportId === reportId);
}

export async function addComment(
  reportId: string,
  authorUid: string,
  authorName: string,
  text: string
): Promise<ReportComment> {
  const commentId = 'com_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const newComment: ReportComment = {
    id: commentId,
    reportId,
    authorUid,
    authorName,
    text: text.trim(),
    createdAt: now,
  };

  if (isFirebaseConfigured && db && auth) {
    try {
      await setDoc(doc(db, 'reports', reportId, 'comments', commentId), newComment);
      const reportRef = doc(db, 'reports', reportId);
      const reportSnap = await getDoc(reportRef);
      if (reportSnap.exists()) {
        const repData = reportSnap.data() as ReportItem;
        await updateDoc(reportRef, {
          commentsCount: (repData.commentsCount || 0) + 1,
        });

        // Send in-app notification if not self-comment
        if (repData.authorUid !== authorUid) {
          await createNotification(
            repData.authorUid,
            'comment',
            authorUid,
            authorName,
            reportId,
            repData.title
          );
        }
      }
      return newComment;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}/comments/${commentId}`, auth);
    }
  }

  const comments = getLocalComments();
  comments.push(newComment);
  saveLocalComments(comments);

  // Update report count locally
  const reports = getLocalReports();
  const rep = reports.find((r) => r.id === reportId);
  if (rep) {
    rep.commentsCount = (rep.commentsCount || 0) + 1;
    saveLocalReports(reports);

    if (rep.authorUid !== authorUid) {
      await createNotification(
        rep.authorUid,
        'comment',
        authorUid,
        authorName,
        reportId,
        rep.title
      );
    }
  }

  return newComment;
}

export async function deleteComment(reportId: string, commentId: string, userUid: string): Promise<void> {
  if (isFirebaseConfigured && db && auth) {
    try {
      await deleteDoc(doc(db, 'reports', reportId, 'comments', commentId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reports/${reportId}/comments/${commentId}`, auth);
    }
  }

  const comments = getLocalComments();
  const index = comments.findIndex((c) => c.id === commentId && c.authorUid === userUid);
  if (index !== -1) {
    comments.splice(index, 1);
    saveLocalComments(comments);

    const reports = getLocalReports();
    const rep = reports.find((r) => r.id === reportId);
    if (rep && rep.commentsCount > 0) {
      rep.commentsCount -= 1;
      saveLocalReports(reports);
    }
  }
}

// 9. Likes
export async function toggleLike(
  reportId: string,
  userUid: string,
  userName: string
): Promise<{ liked: boolean; count: number }> {
  if (isFirebaseConfigured && db && auth) {
    try {
      const likeRef = doc(db, 'reports', reportId, 'likes', userUid);
      const likeSnap = await getDoc(likeRef);
      const isLiked = likeSnap.exists();
      const reportRef = doc(db, 'reports', reportId);
      const reportSnap = await getDoc(reportRef);
      const repData = reportSnap.data() as ReportItem;
      let newCount = repData?.likesCount || 0;

      if (isLiked) {
        await deleteDoc(likeRef);
        newCount = Math.max(0, newCount - 1);
      } else {
        await setDoc(likeRef, { userId: userUid, createdAt: new Date().toISOString() });
        newCount += 1;
        if (repData && repData.authorUid !== userUid) {
          await createNotification(
            repData.authorUid,
            'like',
            userUid,
            userName,
            reportId,
            repData.title
          );
        }
      }

      await updateDoc(reportRef, { likesCount: newCount });
      return { liked: !isLiked, count: newCount };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reports/${reportId}/likes/${userUid}`, auth);
    }
  }

  const likesMap = getLocalLikes();
  const currentLikes = likesMap[reportId] || [];
  const hasLiked = currentLikes.includes(userUid);

  let updatedLikes: string[];
  if (hasLiked) {
    updatedLikes = currentLikes.filter((id) => id !== userUid);
  } else {
    updatedLikes = [...currentLikes, userUid];
  }
  likesMap[reportId] = updatedLikes;
  saveLocalLikes(likesMap);

  const reports = getLocalReports();
  const rep = reports.find((r) => r.id === reportId);
  const count = updatedLikes.length;
  if (rep) {
    rep.likesCount = count;
    saveLocalReports(reports);

    if (!hasLiked && rep.authorUid !== userUid) {
      await createNotification(rep.authorUid, 'like', userUid, userName, reportId, rep.title);
    }
  }

  return { liked: !hasLiked, count };
}

export function isReportLiked(reportId: string, userUid: string): boolean {
  const likesMap = getLocalLikes();
  return (likesMap[reportId] || []).includes(userUid);
}

// 10. Bookmarks
export async function toggleBookmark(reportId: string, userUid: string): Promise<boolean> {
  if (isFirebaseConfigured && db && auth) {
    try {
      const bookmarkRef = doc(db, 'users', userUid, 'bookmarks', reportId);
      const snap = await getDoc(bookmarkRef);
      if (snap.exists()) {
        await deleteDoc(bookmarkRef);
        return false;
      } else {
        await setDoc(bookmarkRef, { reportId, createdAt: new Date().toISOString() });
        return true;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userUid}/bookmarks/${reportId}`, auth);
    }
  }

  const bmMap = getLocalBookmarks();
  const userBookmarks = bmMap[userUid] || [];
  const exists = userBookmarks.includes(reportId);

  if (exists) {
    bmMap[userUid] = userBookmarks.filter((id) => id !== reportId);
  } else {
    bmMap[userUid] = [...userBookmarks, reportId];
  }
  saveLocalBookmarks(bmMap);
  return !exists;
}

export function isReportBookmarked(reportId: string, userUid: string): boolean {
  const bmMap = getLocalBookmarks();
  return (bmMap[userUid] || []).includes(reportId);
}

export async function getUserBookmarks(userUid: string): Promise<ReportItem[]> {
  const bmMap = getLocalBookmarks();
  const ids = bmMap[userUid] || [];
  const all = await getReports();
  return all.filter((r) => ids.includes(r.id));
}
