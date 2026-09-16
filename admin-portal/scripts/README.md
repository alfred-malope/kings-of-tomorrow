# Admin scripts

## set-admin-role.mjs

Creates (or reuses) a Firebase Auth user, sets their `role` custom claim, and
mirrors the account into the `users/{uid}` Firestore collection.

### 1. Get a service account key

Firebase Console → **Project settings** → **Service accounts** →
**Generate new private key**. Save the downloaded file as:

```
admin-portal/scripts/service-account.json
```

This path is gitignored — never commit it.

### 2. Install the Admin SDK (one time)

From the `admin-portal/` directory:

```bash
npm install
```

(`firebase-admin` is listed as a devDependency.)

### 3. Run the script

```bash
node scripts/set-admin-role.mjs <email> <password> [role]
```

- `email` — the login email (required)
- `password` — min 6 chars (required only when creating a new user)
- `role` — `admin` | `editor` | `viewer` (optional, defaults to `admin`)

Example:

```bash
node scripts/set-admin-role.mjs you@kotfc.co.za "ChangeMe123!" admin
```

After it succeeds, sign in at the portal with that email/password. If the user
was already signed in, they must sign out and back in for the new role claim to
take effect.

### Prerequisites in the Firebase Console

- **Authentication** → enable the **Email/Password** sign-in provider.
- **Firestore Database** → create the database (needed before the `users` record
  can be written and before any data pages load).
