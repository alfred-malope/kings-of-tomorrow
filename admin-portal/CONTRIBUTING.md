# Contributing to the K.O.T FC Admin Portal

## Architecture rules

The admin portal follows a layered architecture (see `design.md`). These rules
keep components clean and data logic testable in isolation.

### No direct Firebase imports in `.svelte` files

Svelte components **must not** import from the Firebase SDK (`firebase/app`,
`firebase/auth`, `firebase/firestore`, `firebase/storage`) or from the Firebase
client module (`$lib/firebase/client`) directly.

All Firebase access must be proxied through:

- **Repositories** (`$lib/repositories/*`) for Firestore and Storage reads/writes.
- **Auth helpers** (`$lib/firebase/auth`) for authentication actions
  (`signInWithEmail`, `signOutUser`, `getIdTokenRole`).
- **Stores** (`$lib/stores/*`) for reactive auth and toast state.

**Rationale:** components stay free of database logic, and all Firebase calls
live in one testable layer.

#### Code-review checklist

Before approving a PR, confirm:

- [ ] No `.svelte` file contains an `import ... from 'firebase/*'` statement.
- [ ] No `.svelte` file imports `$lib/firebase/client` directly.
- [ ] All Firestore/Storage access goes through a repository.
- [ ] All auth actions go through `$lib/firebase/auth` or an auth store.

A quick way to check locally:

```bash
# Should return no matches:
grep -rnE "from '(firebase/|\\$lib/firebase/client)" src/**/*.svelte
```

> This rule can additionally be enforced with an ESLint
> `no-restricted-imports` rule scoped to `**/*.svelte` if/when ESLint is added
> to the project. Until then, it is enforced via this code-review checklist.

## Integration tests (Firebase Emulator Suite)

The security-rules integration tests in `tests/integration/**`
(`firestore-rules.test.ts` and `storage-rules.test.ts`) run against the
**Firebase Local Emulator Suite** using `@firebase/rules-unit-testing`. They are
**excluded from the default `npm run test` run** so that the unit and
property-based suites can pass without any emulator running.

### 1. Start the emulator

You need the Firebase CLI installed (`npm install -g firebase-tools`). From the
`admin-portal/` directory, start the Auth, Firestore, and Storage emulators:

```bash
firebase emulators:start --only auth,firestore,storage
```

Leave this process running in its own terminal.

### 2. Run the integration tests

In a second terminal, run:

```bash
npm run test:integration
```

The tests connect to the emulator via the standard emulator environment
variables (`FIRESTORE_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`,
`FIREBASE_AUTH_EMULATOR_HOST`), which the Firebase CLI exports for processes it
spawns. If you run the tests in a separate terminal, export those variables
yourself (matching the ports reported by the emulator, typically `8080`,
`9199`, and `9099`).

> **Note:** each integration suite is guarded with
> `describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)` (and the equivalent
> Storage variable) so the tests are safely **skipped** — rather than failing —
> in environments where the emulator is not available (e.g. CI without the
> emulator).
