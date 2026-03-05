# Fix "Missing or insufficient permissions" (User Management)

Your Firestore rules are already set up so **admin** and **super_admin** can read all users. You just need to deploy them.

## Deploy the rules

1. **Install Firebase CLI** (if needed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in** (if needed):
   ```bash
   firebase login
   ```

3. **Deploy only Firestore rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Refresh the app** and open User Management again. The error should be gone and you should see all users.

## If you still see the error

- **Logged in as Super Admin (bootstrap email):** Your Firestore `users/{your-uid}` document should have `role: 'super_admin'` (the app sets this on login). Deploying the rules is enough.
- **Logged in as Admin (added in Super Admin’s Admin Management):** Your `users/{your-uid}` document must have `role: 'admin'` in Firestore for the rules to allow reading all users. The app currently grants the Admin *UI* via the admin list; for *Firestore* permission you may need to set your role in Firestore once (e.g. via Firebase Console → Firestore → `users` → your document → add field `role` = `admin`), or the app can be updated to write that role when you’re in the admin list.
