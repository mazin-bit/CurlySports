# Database Schema: Personalized Dashboard & Notifications

## Firestore

### Collection: `users` (existing, extended)

Each document is keyed by Firebase Auth `uid`.

| Field | Type | Description |
|-------|------|-------------|
| `favoriteClubs` | string[] | Team names (existing) |
| `favoritePlayers` | number[] | Player IDs (existing) |
| `surveyCompleted` | boolean | **Required.** `true` after user completes signup survey. |
| `surveyInterests` | map | **Required.** Stored on survey submit. Supports two shapes: |
| `surveyInterests.sports` | map | **New (per-sport).** `{ [sportKey]: { favoriteTeams: string[], favoritePlayers: number[], contentTypes: {} } }`. |
| `surveyInterests.favoriteTeams` | string[] | **Legacy.** Team names from survey (single-sport). |
| `surveyInterests.favoriteLeagues` | string[] | League keys, e.g. `['pl', 'ucl', 'nba']`. |
| `surveyInterests.favoritePlayers` | number[] | Player IDs from survey (legacy). |
| `surveyInterests.contentTypes` | map | Content type toggles (legacy or used when no per-sport). |
| `surveyInterests.contentTypes.news` | boolean | Show news on dashboard. |
| `surveyInterests.contentTypes.matchReports` | boolean | Match reports. |
| `surveyInterests.contentTypes.transferNews` | boolean | Transfer news. |
| `surveyInterests.contentTypes.liveScores` | boolean | Live scores. |
| `surveyInterests.contentTypes.playerStats` | boolean | Player stats. |
| `surveyInterests.contentTypes.videos` | boolean | Videos. |
| `displayName`, `email`, `role`, `lastLoginDate`, `currentStreak`, `longestStreak`, `bookedTickets`, `penaltyBest`, `superOverBest`, `lastSeen` | (existing) | Unchanged. |

- **Survey gate:** If `surveyCompleted !== true`, the app shows the mandatory survey and blocks main content until submitted.
- **Dashboard:** Content is filtered by `surveyInterests` and `favoriteClubs` / `favoritePlayers`. Favorites and survey interests are kept in sync where applicable.

---

### Collection: `notifications`

Documents are auto-generated IDs.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Firestore user id (same as `users/{uid}`). |
| `type` | string | `match_start` \| `match_result` \| `goal` \| `player_news` \| `transfer` \| `info`. |
| `title` | string | Short title. |
| `body` | string | Optional body. |
| `read` | boolean | Default `false`. Set `true` when user marks read. |
| `createdAt` | Timestamp | `serverTimestamp()`. |
| `payload` | map | Optional: `link`, `matchId`, `teamName`, `playerId`, etc. |

- **Index required:** Composite index on `notifications`: `userId` (Asc) + `createdAt` (Desc). Create via Firebase Console when prompted, or add to `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

- **Notifications** are created when:
  - Favorite team: match start, result, goal updates.
  - Favorite player: stats, news, achievements.
  - Transfer alerts for selected teams/players.
- **Delivery:** In-app bell (unread count + list), pop-up toasts, and email (see Email section below).

---

## Email Alerts (Always On)

Email is **always enabled** per requirement. Options:

1. **Firebase Trigger Email extension**  
   - Install "Trigger Email" from Firebase Extensions.  
   - On `notifications` document create, the extension sends an email using a template.  
   - Configure SMTP or SendGrid in extension config.

2. **Cloud Function**  
   - `onCreate` on `notifications/{id}`: load user doc for `email`, send via SendGrid/Mailgun/Nodemailer.  
   - Deploy and ensure Firestore rules allow the function’s service account to read `users/{userId}`.

The app calls `addNotification(userId, type, title, body)`; the extension or function then sends the email. No optional toggle: every notification is also sent by email.
