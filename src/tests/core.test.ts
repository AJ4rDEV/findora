import { describe, it, expect, beforeEach } from 'vitest';
import * as authService from '../services/authService';
import * as reportsService from '../services/reportsService';
import * as messagesService from '../services/messagesService';
import { en } from '../i18n/locales/en';
import { ar } from '../i18n/locales/ar';
import { ku } from '../i18n/locales/ku';
import { tr } from '../i18n/locales/tr';
import { LANGUAGE_OPTIONS } from '../i18n';

// In-memory localStorage mock for node test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    length: 0,
  } as Storage;
}

describe('Findora Comprehensive Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Authentication Module', () => {
    it('signs up a user with valid credentials', async () => {
      const user = await authService.registerUser(
        'Sarah Jenkins',
        'sarah@example.com',
        'secret123',
        'en'
      );
      expect(user).toBeDefined();
      expect(user.uid).toBeDefined();
      expect(user.email).toBe('sarah@example.com');
      expect(user.fullName).toBe('Sarah Jenkins');
    });

    it('rejects duplicate email during sign-up', async () => {
      await authService.registerUser('User One', 'duplicate@example.com', 'pass1234');
      await expect(
        authService.registerUser('User Two', 'duplicate@example.com', 'differentPass')
      ).rejects.toThrow('An account already exists with this email address.');
    });

    it('successfully logs in an existing user with valid credentials', async () => {
      await authService.registerUser('Alice Brown', 'alice@test.com', 'securepass');
      const loggedIn = await authService.loginUser('alice@test.com', 'securepass');
      expect(loggedIn).toBeDefined();
      expect(loggedIn.email).toBe('alice@test.com');
    });

    it('rejects login with incorrect credentials', async () => {
      await authService.registerUser('Bob Green', 'bob@test.com', 'correctPass');
      await expect(authService.loginUser('bob@test.com', 'wrongPass')).rejects.toThrow(
        'The email or password entered is incorrect.'
      );
    });

    it('logs out and clears active user session', async () => {
      await authService.registerUser('Charlie', 'charlie@test.com', 'password123');
      await authService.logoutUser();
      expect(localStorage.getItem('findora_session_user')).toBeNull();
    });

    it('handles password reset validation', async () => {
      await authService.registerUser('Diana Prince', 'diana@test.com', 'wonderpass');
      await expect(authService.resetPassword('diana@test.com')).resolves.not.toThrow();
      await expect(authService.resetPassword('nonexistent@test.com')).rejects.toThrow(
        'No user account found with this email.'
      );
    });
  });

  describe('2. Reports and Feed Module', () => {
    it('creates an authenticated lost report with valid data', async () => {
      const report = await reportsService.createReport({
        authorUid: 'user_123',
        authorName: 'Sarah Jenkins',
        type: 'lost',
        title: 'Blue Leather Wallet',
        description: 'Lost near the public park bench. Contains metro card.',
        category: 'wallets_bags',
        generalLocation: 'Central Park West',
        eventDate: '2026-11-01',
        images: [],
        status: 'active',
      });

      expect(report.id).toBeDefined();
      expect(report.title).toBe('Blue Leather Wallet');
      expect(report.status).toBe('active');
      expect(report.likesCount).toBe(0);
      expect(report.commentsCount).toBe(0);
    });

    it('retrieves reports feed filtered by type and category', async () => {
      await reportsService.createReport({
        authorUid: 'user_1',
        authorName: 'Alex',
        type: 'lost',
        title: 'MacBook Pro 14"',
        description: 'Left in library reading room',
        category: 'electronics',
        generalLocation: 'Public Library',
        eventDate: '2026-11-02',
        images: [],
        status: 'active',
      });

      await reportsService.createReport({
        authorUid: 'user_2',
        authorName: 'Bahar',
        type: 'found',
        title: 'Bicycle Key with Red Ribbon',
        description: 'Found on the bike rack',
        category: 'keys',
        generalLocation: 'Metro Station Bike Rack',
        eventDate: '2026-11-03',
        images: [],
        status: 'active',
      });

      const lostFeed = await reportsService.getReports({ type: 'lost' });
      expect(lostFeed.length).toBe(1);
      expect(lostFeed[0].title).toBe('MacBook Pro 14"');

      const foundFeed = await reportsService.getReports({ type: 'found' });
      expect(foundFeed.length).toBe(1);
      expect(foundFeed[0].title).toBe('Bicycle Key with Red Ribbon');
    });

    it('filters reports by keyword and location query', async () => {
      await reportsService.createReport({
        authorUid: 'user_1',
        authorName: 'Sam',
        type: 'lost',
        title: 'Golden Retriever Dog named Max',
        description: 'Friendly dog with blue collar',
        category: 'pets',
        generalLocation: 'Greenwood Park',
        eventDate: '2026-11-01',
        images: [],
        status: 'active',
      });

      const searchResults = await reportsService.getReports({ searchQuery: 'Max' });
      expect(searchResults.length).toBe(1);
      expect(searchResults[0].title).toContain('Max');

      const locationResults = await reportsService.getReports({ location: 'Greenwood' });
      expect(locationResults.length).toBe(1);

      const noResults = await reportsService.getReports({ searchQuery: 'NonexistentItemKeyword' });
      expect(noResults.length).toBe(0);
    });

    it('allows owner to update report status to resolved', async () => {
      const rep = await reportsService.createReport({
        authorUid: 'owner_uid',
        authorName: 'Owner Name',
        type: 'found',
        title: 'Keys with Toyota Logo',
        description: 'Found near parking exit',
        category: 'keys',
        generalLocation: 'Mall Parking',
        eventDate: '2026-11-01',
        images: [],
        status: 'active',
      });

      const updated = await reportsService.updateReportStatus(rep.id, 'owner_uid', 'resolved');
      expect(updated.status).toBe('resolved');
    });

    it('rejects status change by non-owner user (Security enforcement)', async () => {
      const rep = await reportsService.createReport({
        authorUid: 'legit_owner',
        authorName: 'Legit Owner',
        type: 'lost',
        title: 'Camera Lens',
        description: '50mm prime lens',
        category: 'electronics',
        generalLocation: 'Plaza',
        eventDate: '2026-11-01',
        images: [],
        status: 'active',
      });

      await expect(
        reportsService.updateReportStatus(rep.id, 'intruder_user', 'resolved')
      ).rejects.toThrow('Permission denied');
    });

    it('allows owner to delete report and forbids non-owner deletion', async () => {
      const rep = await reportsService.createReport({
        authorUid: 'owner_abc',
        authorName: 'Owner ABC',
        type: 'lost',
        title: 'Passport in black cover',
        description: 'Lost at terminal 2',
        category: 'documents_id',
        generalLocation: 'Airport Terminal 2',
        eventDate: '2026-11-01',
        images: [],
        status: 'active',
      });

      // Intruder attempt must fail
      await expect(reportsService.deleteReport(rep.id, 'intruder_xyz')).rejects.toThrow(
        'Permission denied'
      );

      // Owner delete must succeed
      await reportsService.deleteReport(rep.id, 'owner_abc');
      const retrieved = await reportsService.getReportById(rep.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('3. Social Features & Messaging Security', () => {
    it('adds comments and updates comment count correctly', async () => {
      const rep = await reportsService.createReport({
        authorUid: 'author_1',
        authorName: 'Author',
        type: 'found',
        title: 'Silver Watch',
        description: 'Found on bench',
        category: 'jewelry',
        generalLocation: 'Square',
        eventDate: '2026-11-01',
        images: [],
        status: 'active',
      });

      const comment = await reportsService.addComment(
        rep.id,
        'commenter_1',
        'Sarah',
        'I believe this might be my friend watch, what brand is on back?'
      );
      expect(comment.id).toBeDefined();
      expect(comment.text).toContain('what brand');

      const allComments = await reportsService.getComments(rep.id);
      expect(allComments.length).toBe(1);
    });

    it('toggles likes without allowing duplicate count increments', async () => {
      const rep = await reportsService.createReport({
        authorUid: 'author_1',
        authorName: 'Author',
        type: 'lost',
        title: 'Backpack',
        description: 'Black backpack',
        category: 'wallets_bags',
        generalLocation: 'Train station',
        eventDate: '2026-11-01',
        images: [],
        status: 'active',
      });

      // First like
      const res1 = await reportsService.toggleLike(rep.id, 'user_voter', 'Voter Name');
      expect(res1.liked).toBe(true);
      expect(res1.count).toBe(1);

      // Second click unlikes
      const res2 = await reportsService.toggleLike(rep.id, 'user_voter', 'Voter Name');
      expect(res2.liked).toBe(false);
      expect(res2.count).toBe(0);
    });

    it('creates private conversation only between authorized participants', async () => {
      const conv = await messagesService.getOrCreateConversation(
        'rep_100',
        'Lost Glasses',
        'lost',
        'user_a',
        'Alice',
        'user_b',
        'Bob'
      );
      expect(conv.participants).toContain('user_a');
      expect(conv.participants).toContain('user_b');

      // Cannot start conversation with self
      await expect(
        messagesService.getOrCreateConversation(
          'rep_100',
          'Lost Glasses',
          'lost',
          'user_a',
          'Alice',
          'user_a',
          'Alice'
        )
      ).rejects.toThrow('You cannot start a conversation with yourself.');
    });
  });

  describe('4. Localization & RTL Compliance', () => {
    it('contains all 4 supported languages with complete key structure', () => {
      expect(LANGUAGE_OPTIONS.map((l) => l.code)).toEqual(['en', 'ar', 'ku', 'tr']);

      const requiredCategories = [
        'electronics',
        'keys',
        'wallets_bags',
        'documents_id',
        'clothing',
        'jewelry',
        'pets',
        'books_education',
        'vehicles_accessories',
        'other',
      ];

      for (const cat of requiredCategories) {
        expect(en.categories[cat as keyof typeof en.categories]).toBeDefined();
        expect(ar.categories[cat as keyof typeof ar.categories]).toBeDefined();
        expect(ku.categories[cat as keyof typeof ku.categories]).toBeDefined();
        expect(tr.categories[cat as keyof typeof tr.categories]).toBeDefined();
      }
    });

    it('correctly maps RTL for Arabic and Kurdish Sorani, and LTR for English and Turkish', () => {
      const enOption = LANGUAGE_OPTIONS.find((l) => l.code === 'en');
      const trOption = LANGUAGE_OPTIONS.find((l) => l.code === 'tr');
      const arOption = LANGUAGE_OPTIONS.find((l) => l.code === 'ar');
      const kuOption = LANGUAGE_OPTIONS.find((l) => l.code === 'ku');

      expect(enOption?.dir).toBe('ltr');
      expect(trOption?.dir).toBe('ltr');
      expect(arOption?.dir).toBe('rtl');
      expect(kuOption?.dir).toBe('rtl');
    });
  });

  describe('5. Rule A: Zero Fake Data Invariant', () => {
    it('initial database is strictly empty and never seeds fake items', async () => {
      const initialReports = await reportsService.getReports();
      expect(initialReports.length).toBe(0);
      expect(Array.isArray(initialReports)).toBe(true);
    });
  });
});
