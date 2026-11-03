import { auth, db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, LanguageCode, ThemeMode } from '../types';

const STORAGE_USERS_KEY = 'findora_users_db';
const STORAGE_CURRENT_USER_KEY = 'findora_session_user';

interface LocalUserRecord {
  uid: string;
  email: string;
  passwordHash: string; // Basic hash for validation simulation
  profile: UserProfile;
}

// Simple deterministic hash for local standalone mode
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

function getLocalUsers(): Record<string, LocalUserRecord> {
  try {
    const data = localStorage.getItem(STORAGE_USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, LocalUserRecord>) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

export async function registerUser(
  fullName: string,
  email: string,
  password: string,
  preferredLanguage: LanguageCode = 'en',
  themePreference: ThemeMode = 'system'
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  if (isFirebaseConfigured && auth && db) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      await updateProfile(fbUser, { displayName: cleanName });

      const profile: UserProfile = {
        uid: fbUser.uid,
        email: cleanEmail,
        fullName: cleanName,
        displayName: cleanName,
        preferredLanguage,
        themePreference,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', fbUser.uid), profile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`, auth);
      }

      return profile;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account already exists with this email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      throw error;
    }
  }

  // Standalone persistent local storage mode
  const users = getLocalUsers();
  const existing = Object.values(users).find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account already exists with this email address.');
  }

  const uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const profile: UserProfile = {
    uid,
    email: cleanEmail,
    fullName: cleanName,
    displayName: cleanName,
    preferredLanguage,
    themePreference,
    createdAt: new Date().toISOString(),
  };

  users[uid] = {
    uid,
    email: cleanEmail,
    passwordHash: simpleHash(password),
    profile,
  };

  saveLocalUsers(users);
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(profile));
  return profile;
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured && auth && db) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      try {
        const docSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`, auth);
      }

      // Fallback profile if doc not created yet
      return {
        uid: fbUser.uid,
        email: cleanEmail,
        fullName: fbUser.displayName || 'Member',
        preferredLanguage: 'en',
        themePreference: 'system',
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        throw new Error('The email or password entered is incorrect.');
      }
      throw error;
    }
  }

  // Standalone mode
  const users = getLocalUsers();
  const user = Object.values(users).find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user || user.passwordHash !== simpleHash(password)) {
    throw new Error('The email or password entered is incorrect.');
  }

  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user.profile));
  return user.profile;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await fbSignOut(auth);
  }
  localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
}

export async function resetPassword(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (isFirebaseConfigured && auth) {
    await sendPasswordResetEmail(auth, cleanEmail);
    return;
  }

  // Standalone mode verification
  const users = getLocalUsers();
  const user = Object.values(users).find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    throw new Error('No user account found with this email.');
  }
  // In standalone mode, confirm valid user exists
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  if (isFirebaseConfigured && db && auth) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      const snap = await getDoc(userRef);
      return snap.data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`, auth);
    }
  }

  // Standalone mode
  const users = getLocalUsers();
  if (users[uid]) {
    users[uid].profile = {
      ...users[uid].profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveLocalUsers(users);
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(users[uid].profile));
    return users[uid].profile;
  }
  throw new Error('User not found.');
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  if (isFirebaseConfigured && auth && db) {
    const firestoreDb = db;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        callback(null);
        return;
      }
      try {
        const snap = await getDoc(doc(firestoreDb, 'users', fbUser.uid));
        if (snap.exists()) {
          callback(snap.data() as UserProfile);
        } else {
          callback({
            uid: fbUser.uid,
            email: fbUser.email || '',
            fullName: fbUser.displayName || 'Member',
            preferredLanguage: 'en',
            themePreference: 'system',
            createdAt: new Date().toISOString(),
          });
        }
      } catch {
        callback(null);
      }
    });
    return unsubscribe;
  }

  // Standalone mode: read from storage
  const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  if (saved) {
    try {
      callback(JSON.parse(saved));
    } catch {
      callback(null);
    }
  } else {
    callback(null);
  }

  return () => {};
}
