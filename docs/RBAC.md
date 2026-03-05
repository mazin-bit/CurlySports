# RBAC (Role-Based Access Control) – Sports Analytics

This project uses **React + Firebase (Auth + Firestore)**. RBAC is implemented with roles stored in Firestore and enforced in security rules and frontend.

---

## 1. Roles

| Role          | Description |
|---------------|-------------|
| **super_admin** | Create/delete Admins, manage all users, assign roles, system analytics, full DB access. |
| **admin**       | Manage Members, upload/edit analytics. Cannot create Super Admin or change system settings. |
| **member**      | View analytics, save dashboards. Cannot edit or upload data. |

---

## 2. Database schema (Firestore)

### Collection: `users`

Each document is keyed by Firebase Auth `uid`.

| Field           | Type   | Description |
|----------------|--------|-------------|
| `role`         | string | `super_admin` \| `admin` \| `member` (default `member` if missing) |
| `favoriteClubs`| array  | (existing) |
| `favoritePlayers` | array | (existing) |
| `bookedTickets`   | map    | (existing) |
| `penaltyBest`     | number | (existing) |

**Optional (for a separate roles/permissions store):**

- Collection `roles`: document per role with `permissions: string[]`.
- Collection `user_roles`: `userId` → `roleId` for many-to-many (not used in current simple model).

Current design uses a single `role` field on `users/{uid}`.

---

## 3. Role & permission tables (in code)

- **`src/auth/roles.js`**: `ROLES`, `PERMISSIONS`, `hasPermission(role, permission)`, `isAtLeast(role, minRole)`, `canAssignRole(assigner, target)`.
- Permissions are fixed in code; no DB table. Add a `permissions` collection later if you need dynamic permissions.

---

## 4. Middleware / route protection

- **Frontend (React):** Use `RequireRole` or `RequireAtLeast` from `src/auth/RequireRole.jsx`.

```jsx
import { RequireRole, RequireAtLeast } from './auth/RequireRole';

// Only admin and super_admin see this
<RequireRole userRole={user?.role} allowedRoles={['admin', 'super_admin']}>
  <AdminPanel />
</RequireRole>

// At least admin
<RequireAtLeast role={user?.role} minimum="admin">
  <UploadAnalytics />
</RequireAtLeast>
```

- **Firestore:** Enforce in `firestore.rules` (see repo root). Example for an `analytics` collection:

```javascript
match /analytics/{id} {
  allow read: if request.auth != null;
  allow create, update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
}
```

---

## 5. JWT / auth logic

- Firebase Auth issues **ID tokens (JWT)**. Use `auth.currentUser.getIdToken()` for backend calls.
- **Role is in Firestore**, not in custom claims. On login the app reads `users/{uid}` and sets `user.role` in state. For a backend API you can either:
  - **Option A:** Backend reads role from Firestore using the decoded token `uid`.
  - **Option B:** Set custom claims from a trusted backend (e.g. Cloud Function) when role changes so the JWT carries role.

---

## 6. API endpoint examples

### Firebase-only (current)

- **Get current user role:** `getUserData(uid)` → `data.role`.
- **Set user role:** `setUserRole(uid, role)` — allowed only if Firestore rules permit (e.g. super_admin for admin/super_admin, admin or super_admin for member).

### Optional Node.js + PostgreSQL backend

If you add a REST API:

```javascript
// Middleware: require JWT and role
const jwt = require('jsonwebtoken');
const { getCurrentUserRole } = require('./firebase-admin'); // or read from your DB

async function requireRole(minRole) {
  return async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      req.uid = decoded.uid;
      const role = await getCurrentUserRole(decoded.uid); // from Firestore or PostgreSQL
      if (!isAtLeast(role, minRole)) return res.status(403).json({ error: 'Forbidden' });
      req.role = role;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Routes
app.get('/api/analytics', requireAuth, (req, res) => { /* list */ });
app.post('/api/analytics', requireRole('admin'), (req, res) => { /* upload */ });
app.get('/api/admin/users', requireRole('super_admin'), (req, res) => { /* list users */ });
app.patch('/api/admin/users/:id/role', requireRole('super_admin'), (req, res) => { /* set role */ });
```

---

## 7. Frontend role-based UI

- **`user.role`** is set in App.js after loading `getUserData(uid)` (default `member`).
- Use `RequireRole` / `RequireAtLeast` to show/hide sections.
- Use `useUserRole()` for `can(permission)` and `isAtLeast(minRole)`.

```jsx
const { role, can, isAtLeast } = useUserRole();

{can('upload_edit_analytics') && <Button>Upload data</Button>}
{isAtLeast('admin') && <Link to="/admin/users">Manage users</Link>}
```

---

## 8. Security best practices

1. **Never trust the client for role.** Always enforce in Firestore rules (and in any backend API).
2. **Least privilege:** Give each role only the permissions it needs.
3. **First super_admin:** Create the first `super_admin` by writing `users/{uid}.role = 'super_admin'` once in Firebase Console or via a one-off script (no one can set super_admin via app until one exists).
4. **Validate role on write:** In `setUserRole`, backend/rules must ensure only allowed assigners can set each role (e.g. only super_admin can set admin/super_admin).
5. **HTTPS only** in production.
6. **Short-lived tokens:** Firebase ID tokens expire; refresh with `getIdToken(true)` when needed.
7. **Audit:** Log role changes and sensitive actions (e.g. in Cloud Functions or your API).

---

## 9. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

Ensure `firestore.rules` path is correct in `firebase.json` (e.g. `"firestore": { "rules": "firestore.rules" }`).
