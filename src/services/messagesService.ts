import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, query, orderBy } from 'firebase/firestore';
import { Conversation, DirectMessage, ReportType } from '../types';
import { createNotification } from './notificationsService';

const STORAGE_CONVERSATIONS_KEY = 'findora_conversations_db';
const STORAGE_MESSAGES_KEY = 'findora_messages_db';

function getLocalConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalConversations(convs: Conversation[]) {
  localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(convs));
}

function getLocalMessages(): DirectMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(msgs: DirectMessage[]) {
  localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(msgs));
}

export async function getOrCreateConversation(
  reportId: string,
  reportTitle: string,
  reportType: ReportType,
  currentUserId: string,
  currentUserName: string,
  targetUserId: string,
  targetUserName: string
): Promise<Conversation> {
  if (currentUserId === targetUserId) {
    throw new Error('You cannot start a conversation with yourself.');
  }

  // Sorted IDs to form consistent deterministic conversation ID
  const participants = [currentUserId, targetUserId].sort();
  const convId = `conv_${reportId}_${participants[0]}_${participants[1]}`;

  if (isFirebaseConfigured && db && auth) {
    try {
      const convRef = doc(db, 'conversations', convId);
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<Conversation, 'id'>) };
      }

      const now = new Date().toISOString();
      const newConv: Conversation = {
        id: convId,
        reportId,
        reportTitle,
        reportType,
        participants,
        participantNames: {
          [currentUserId]: currentUserName,
          [targetUserId]: targetUserName,
        },
        lastMessage: '',
        lastMessageTimestamp: now,
        createdAt: now,
      };

      await setDoc(convRef, newConv);
      return newConv;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `conversations/${convId}`, auth);
    }
  }

  const convs = getLocalConversations();
  const existing = convs.find((c) => c.id === convId);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const newConv: Conversation = {
    id: convId,
    reportId,
    reportTitle,
    reportType,
    participants,
    participantNames: {
      [currentUserId]: currentUserName,
      [targetUserId]: targetUserName,
    },
    lastMessage: '',
    lastMessageTimestamp: now,
    createdAt: now,
  };

  convs.unshift(newConv);
  saveLocalConversations(convs);
  return newConv;
}

export async function getUserConversations(userUid: string): Promise<Conversation[]> {
  const allConvs = getLocalConversations();
  const userConvs = allConvs.filter((c) => c.participants.includes(userUid));
  userConvs.sort(
    (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
  );
  return userConvs;
}

export async function getConversationMessages(conversationId: string, userUid: string): Promise<DirectMessage[]> {
  if (isFirebaseConfigured && db && auth) {
    try {
      const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      const msgs: DirectMessage[] = [];
      snap.forEach((d) => msgs.push({ id: d.id, ...(d.data() as Omit<DirectMessage, 'id'>) }));
      return msgs;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `conversations/${conversationId}/messages`, auth);
    }
  }

  const allMsgs = getLocalMessages();
  return allMsgs.filter((m) => m.conversationId === conversationId);
}

export async function sendMessage(
  conversationId: string,
  senderUid: string,
  senderName: string,
  text: string
): Promise<DirectMessage> {
  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();
  const trimmed = text.trim();

  const newMsg: DirectMessage = {
    id: msgId,
    conversationId,
    senderUid,
    senderName,
    text: trimmed,
    createdAt: now,
  };

  if (isFirebaseConfigured && db && auth) {
    try {
      await setDoc(doc(db, 'conversations', conversationId, 'messages', msgId), newMsg);
      const convRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const cData = convSnap.data() as Conversation;
        await setDoc(
          convRef,
          {
            lastMessage: trimmed,
            lastMessageTimestamp: now,
          },
          { merge: true }
        );

        const recipientUid = cData.participants.find((p) => p !== senderUid);
        if (recipientUid) {
          await createNotification(
            recipientUid,
            'message',
            senderUid,
            senderName,
            cData.reportId,
            cData.reportTitle
          );
        }
      }
      return newMsg;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `conversations/${conversationId}/messages/${msgId}`, auth);
    }
  }

  const msgs = getLocalMessages();
  msgs.push(newMsg);
  saveLocalMessages(msgs);

  const convs = getLocalConversations();
  const conv = convs.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = trimmed;
    conv.lastMessageTimestamp = now;
    saveLocalConversations(convs);

    const recipientUid = conv.participants.find((p) => p !== senderUid);
    if (recipientUid) {
      await createNotification(
        recipientUid,
        'message',
        senderUid,
        senderName,
        conv.reportId,
        conv.reportTitle
      );
    }
  }

  return newMsg;
}
