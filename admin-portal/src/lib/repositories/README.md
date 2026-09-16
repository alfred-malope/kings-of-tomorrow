# Repository Layer

All Firestore and Storage access in the admin portal is encapsulated in
repository modules. Svelte components **never** import the Firebase SDK
directly — they call repository functions instead. This keeps components clean
and makes data logic testable in isolation.

Each repository is a plain TypeScript module (no class instantiation required)
that exports async functions. There is one repository per Firestore collection:

- `players.repository.ts` — `PlayersRepository`
- `fixtures.repository.ts` — `FixturesRepository`
- `results.repository.ts` — `ResultsRepository`
- `news.repository.ts` — `NewsRepository`
- `gallery.repository.ts` — `GalleryRepository`
- `tournaments.repository.ts` — `TournamentsRepository`
- `members.repository.ts` — `MembersRepository`
- `settings.repository.ts` — `SettingsRepository`
- `users.repository.ts` — `UsersRepository`

## Contract

Every repository follows the same structural contract.

### 1. `db: Firestore` is the first argument

Repositories receive the `Firestore` instance as their first parameter rather
than importing the module-level singleton. This keeps them testable without
mocking module-level singletons.

```typescript
import { type Firestore } from 'firebase/firestore';

export async function getPlayers(db: Firestore, /* ... */) { /* ... */ }
export async function createPlayer(db: Firestore, /* ... */) { /* ... */ }
```

### 2. Use `serverTimestamp()` for timestamps

All `createdAt`, `updatedAt`, and `publishedAt` fields are written with
Firestore's `serverTimestamp()`. Client-side `Date.now()` **must not** be used
for these fields — the server clock is authoritative.

```typescript
import { serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'players'), {
  ...data,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

### 3. Wrap all Firebase errors in `RepositoryError`

Every Firebase call is wrapped in a `try/catch`. On failure, the repository
rethrows the original error as a [`RepositoryError`](./repository-error.ts),
setting the `operation` field to the appropriate value
(`'read' | 'create' | 'update' | 'delete'`). This gives calling components a
single, predictable error type to catch.

```typescript
import { RepositoryError } from './repository-error';

export async function createPlayer(db: Firestore, data: PlayerInput): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'players'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } catch (err) {
    throw new RepositoryError('Failed to create player', err, 'create');
  }
}
```

Components catch `RepositoryError` and surface the message via
`toastStore.error(err.message)`. Raw Firebase error codes are never shown to
users directly; they are mapped to user-readable messages in
`src/lib/utils/error-messages.ts`.
