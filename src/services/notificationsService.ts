import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { AppNotification } from '../types';

const STORAGE_NOTIFS_KEY = 'findora_notifications_db';

function getLocalNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotifications(notifs: AppNotification[]) {
  localStorage.setItem(STORAGE_NOTIFS_KEY, JSON.stringify(notifs));
}

export async function createNotification(
  recipientUid: string,
  type: 'comment' | 'like' | 'message' | 'status_change',
  actorUid: string,
  actorName: string,
  relatedReportId?: string,
  reportTitle?: string
): Promise<AppNotification> {
  const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  let message = '';
  if (type === 'comment') {
    message = `${actorName} commented on your report "${reportTitle || 'Report'}"`;
  } else if (type === 'like') {
    message = `${actorName} liked your report "${reportTitle || 'Report'}"`;
  } else if (type === 'message') {
    message = `${actorName} sent you a message about "${reportTitle || 'Report'}"`;
  } else if (type === 'status_change') {
    message = `Status for "${reportTitle || 'Report'}" was updated`;
  }

  const notification: AppNotification = {
    id: notifId,
    recipientUid,
    type,
    relatedReportId,
    actorUid,
    actorName,
    message,
    read: false,
    createdAt: now,
  };

  if (isFirebaseConfigured && db && auth) {
    try {
      await setDoc(doc(db, 'users', recipientUid, 'notifications', notifId), notification);
      return notification;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${recipientUid}/notifications/${notifId}`, auth);
    }
  }

  const list = getLocalNotifications();
  list.unshift(notification);
  saveLocalNotifications(list);
  return notification;
}

export async function getUserNotifications(userUid: string): Promise<AppNotification[]> {
  if (isFirebaseConfigured && db && auth) {
    try {
      const q = query(collection(db, 'users', userUid, 'notifications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const items: AppNotification[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) }));
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${userUid}/notifications`, auth);
    }
  }

  const all = getLocalNotifications();
  return all.filter((n) => n.recipientUid === userUid);
}

export async function markNotificationAsRead(userUid: string, notifId: string): Promise<void> {
  if (isFirebaseConfigured && db && auth) {
    try {
      await updateDoc(doc(db, 'users', userUid, 'notifications', notifId), { read: true });
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userUid}/notifications/${notifId}`, auth);
    }
  }

  const all = getLocalNotifications();
  const target = all.find((n) => n.id === notifId && n.recipientUid === userUid);
  if (target) {
    target.read = true;
    saveLocalNotifications(all);
  }
}

export async function markAllNotificationsAsRead(userUid: string): Promise<void> {
  const all = getLocalNotifications();
  let changed = false;
  all.forEach((n) => {
    if (n.recipientUid === userUid && !n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed) {
    saveLocalNotifications(all);
  }
}
