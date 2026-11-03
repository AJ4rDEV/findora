# Findora Security Specification & ABAC Test Suite

## 1. Data Invariants

1. **Identity Binding**: A report document cannot be created with an `authorUid` different from `request.auth.uid`.
2. **Path Hardening**: Document IDs across `users`, `reports`, `comments`, and `conversations` must strictly conform to regex `^[a-zA-Z0-9_\-]+$` and have length `<= 128`.
3. **Immutability of Author & Creation Time**: An author cannot reassign ownership of a published report to another user (`incoming().authorUid == existing().authorUid`).
4. **Field Validation**: Report titles (`3..150` chars), descriptions (`5..3000` chars), locations (`2..150` chars), and valid categories are enforced at the security boundary.
5. **Private Conversation Isolation**: Only users whose UIDs are in the `participants` list of a conversation can read or send messages within it.
6. **No Self-Privilege Escalation**: Users cannot add arbitrary administrative fields or change their UIDs.
7. **PII Isolation**: User email and private metadata are isolated to owner read-only scopes.
8. **Owner Mutation Only**: Only the author of a report can change its status or delete the report.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 attack vectors are blocked by `firestore.rules`:

### Payload 1: Identity Spoofing (Create report with someone else's UID)
```json
{
  "reportId": "rep_spoof_01",
  "authorUid": "victim_uid_999",
  "type": "lost",
  "title": "Stolen Identity Post",
  "description": "Attempting to post as victim",
  "category": "electronics",
  "generalLocation": "City Center",
  "eventDate": "2026-11-01",
  "status": "active"
}
```
*Expected: PERMISSION_DENIED (authorUid != request.auth.uid)*

### Payload 2: Ghost Field Injection (Denial-of-Wallet / Schema Pollution)
```json
{
  "reportId": "rep_ghost_02",
  "authorUid": "attacker_uid",
  "type": "lost",
  "title": "Legit Item",
  "description": "Legit Description",
  "category": "electronics",
  "generalLocation": "Station",
  "eventDate": "2026-11-01",
  "status": "active",
  "isAdmin": true,
  "verifiedBadge": true
}
```
*Expected: PERMISSION_DENIED (Unauthorized shadow keys in create)*

### Payload 3: Oversized Payload Attack (Denial of Wallet)
```json
{
  "reportId": "rep_oversize_03",
  "authorUid": "attacker_uid",
  "type": "lost",
  "title": "A".repeat(500),
  "description": "A".repeat(10000),
  "category": "electronics",
  "generalLocation": "Station",
  "eventDate": "2026-11-01",
  "status": "active"
}
```
*Expected: PERMISSION_DENIED (String bounds exceeded)*

### Payload 4: Invalid Category Enum Bypass
```json
{
  "reportId": "rep_badcat_04",
  "authorUid": "attacker_uid",
  "type": "lost",
  "title": "Weapons or contraband",
  "description": "Not in approved community category enum",
  "category": "unapproved_contraband_category",
  "generalLocation": "Downtown",
  "eventDate": "2026-11-01",
  "status": "active"
}
```
*Expected: PERMISSION_DENIED (Category not in allowlist)*

### Payload 5: Unauthorized Report Status Hijack
*Action: User B attempts to change status of User A's report*
```json
{
  "status": "resolved"
}
```
*Expected: PERMISSION_DENIED (existing().authorUid != request.auth.uid)*

### Payload 6: Ownership Transfer Attack
*Action: User A attempts to update existing report to set authorUid to User B*
```json
{
  "authorUid": "user_b_uid"
}
```
*Expected: PERMISSION_DENIED (authorUid is immutable)*

### Payload 7: Path ID Poisoning (Malicious Path Character Injection)
*Target Doc: `reports/../../secret_doc` or oversized 2KB path key*
*Expected: PERMISSION_DENIED (isValidId regex rejection)*

### Payload 8: Conversation Snooping (Eavesdropping on Private Chat)
*Action: User C attempts to read `conversations/conv_userA_userB`*
*Expected: PERMISSION_DENIED (request.auth.uid not in participants)*

### Payload 9: Unauthorized Direct Message Injection
*Action: User C attempts to create message inside conversation between User A and User B*
```json
{
  "messageId": "msg_hack_09",
  "conversationId": "conv_userA_userB",
  "senderUid": "attacker_user_c",
  "text": "Spy injection attempt"
}
```
*Expected: PERMISSION_DENIED (User C not a participant in parent conversation)*

### Payload 10: Unauthorized Comment Deletion
*Action: User C attempts to delete User B's comment on User A's report*
*Expected: PERMISSION_DENIED (Only comment author or report author can delete)*

### Payload 11: Unauthenticated Write / Mutation
*Action: Guest without auth attempts to create report or post comment*
*Expected: PERMISSION_DENIED (request.auth == null)*

### Payload 12: User Profile Privilege Escalation
*Action: User attempts to edit their profile document to set `accountStatus: "admin"`*
```json
{
  "accountStatus": "admin",
  "isAdmin": true
}
```
*Expected: PERMISSION_DENIED (affectedKeys().hasOnly(['fullName', 'displayName', 'photoURL', 'preferredLanguage', 'themePreference', 'updatedAt']))*
