# Design Document: K.O.T FC Admin Portal

## Overview

The K.O.T FC Admin Portal is a separate SvelteKit 2 application deployed at `admin.kotfc.co.za`. It provides authenticated K.O.T FC administrators and editors with a full content management interface for all data consumed by the public website (`kotfc.co.za`). The public website is a read-only Svelte 4 + Vite SPA that will continue to consume data from Cloud Firestore — the admin portal writes to the same Firebase project and the public site reads from it.

The admin portal is a distinct repository (or subdirectory) from the public website. It uses:

- **SvelteKit 2** with `@sveltejs/adapter-netlify` for SSR-capable routing and Netlify deployment
- **Svelte 5 runes** (`$state`, `$derived`, `$effect`) throughout
- **TypeScript strict mode**
- **Tailwind CSS 3** for utility-first styling, configured with the K.O.T brand palette and typography (see Visual Design System)
- **Firebase SDK v10** (modular) for Auth, Firestore, and Storage
- **Vitest + fast-check** for unit and property-based testing

The admin portal does **not** modify the public website. All content changes flow through Firestore: the admin portal writes documents; the public site reads them.

The admin portal's UI is **brand-aligned with the public K.O.T FC website** — it reuses the same colour palette, typography, and component styling conventions so the two properties feel like one product. See the Visual Design System section below.

---

## Visual Design System & Brand Alignment

The admin portal mirrors the public website's design language. The public site is a Svelte 4 + Vite + Tailwind SPA whose theme is defined in its `tailwind.config.js` and `src/app.css`. The admin portal replicates the same design tokens in its own SvelteKit Tailwind setup (the two apps do not share a config file, so the tokens are copied verbatim to guarantee identical output).

### Colour Palette

The admin portal's `tailwind.config.js` `theme.extend.colors` uses the exact K.O.T brand palette:

```javascript
colors: {
  navy:   { 950: '#030712', 900: '#071426', 800: '#0c1e36', 700: '#102844', 600: '#163354' },
  blue:   { DEFAULT: '#00AEEF', 400: '#33BFF2', 500: '#00AEEF', 600: '#0090C7', 700: '#00729E' },
  gold:   { DEFAULT: '#F4B942', 400: '#F7C961', 500: '#F4B942', 600: '#D9A236' },
  silver: { DEFAULT: '#C9D0D8', 200: '#DDE3E8', 400: '#C9D0D8', 600: '#A5AFBA' },
}
```

Usage conventions carried over from the public site:
- **App background**: `navy-900` (`#071426`); deeper surfaces use `navy-950`, raised surfaces use `navy-800`.
- **Primary text**: white; secondary/muted text: `white/70` and `white/50`.
- **Primary accent / interactive**: `blue-500` (`#00AEEF`) with `blue-400` hover.
- **Highlight / secondary CTA**: `gold-500` (`#F4B942`).
- **Borders / dividers**: `white/10`.

### Typography

- **Display font** (headings, page titles, stat numbers): `Oswald` (uppercase, weight 700), applied via the `heading-display` class and `font-display` utility.
- **Body font** (labels, table content, form fields): `Inter`, applied via `font-body`.
- Both fonts are loaded from Google Fonts in the app's global stylesheet, identical to the public site:
  `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');`

### Shared Component Classes

The admin portal's global stylesheet (`src/app.css`) defines the same `@layer components` utility classes as the public site, so buttons, cards, and loaders look identical:

| Class | Purpose |
|---|---|
| `heading-display` | Oswald uppercase heading style |
| `text-eyebrow` | Small uppercase blue label (section eyebrows, form-group labels) |
| `card-surface` | `rounded-xl border border-white/10 bg-navy-800/60 backdrop-blur-sm` — used for stat cards, gallery cards, modal panels |
| `btn-primary` | Blue primary action button (Save, Add, Submit) |
| `btn-gold` | Gold secondary action button (Publish, feature actions) |
| `btn-outline` | Outlined neutral button (Cancel, secondary nav) |
| `skeleton` | Shimmer skeleton loader background (backs `SkeletonLoader.svelte`) |
| `container-x` / `container-narrow` | Max-width page containers |

### Component-Level Alignment Rules

- **Sidebar**: dark `navy-950`/`navy-900` background; K.O.T logo (`kot-logo.svg` / `kot-monogram.svg`) and club name in the header using `heading-display`; active nav link uses the `blue-500` accent treatment consistent with the public site's `link-nav.active`.
- **Buttons**: all action buttons use `btn-primary`, `btn-gold`, or `btn-outline` — no ad-hoc button styling.
- **Cards & panels**: stat cards, gallery album cards, `ConfirmDialog`, and modal surfaces use `card-surface`.
- **Skeleton loaders**: `SkeletonLoader.svelte` uses the `skeleton` class (shimmer animation) rather than a bespoke placeholder.
- **Toasts**: success toasts use a `blue-500`/`navy` treatment, error toasts a red accent, positioned top-right per Requirement 4.7.
- **Focus & motion**: reuse the public site's focus-ring convention (`focus:ring-2 focus:ring-blue-400 focus:ring-offset-navy-900`) and honour `prefers-reduced-motion` via the same reduced-motion CSS block.
- **Favicon & theme colour**: use `kot-monogram.svg` as the favicon and `#071426` as the `theme-color`, matching the public site's `index.html`.

Brand assets (logos, monogram) are copied into the admin portal's `static/` directory from the public site's `public/` directory (`kot-logo.svg`, `kot-logo.png`, `kot-monogram.svg`).

---

## Architecture

### Deployment Architecture

```
┌──────────────────────────────────┐     ┌──────────────────────────────────┐
│  Public Website (kotfc.co.za)    │     │  Admin Portal(admin.kotfc.co.za) │
│  Svelte 4 + Vite SPA             │     │  SvelteKit 2 + Netlify adapter   │
│  Static hosting on Netlify       │     │  SSR/SPA on Netlify              │
└────────────────┬─────────────────┘     └────────────────┬─────────────────┘
                 │ reads                                   │ reads + writes
                 ▼                                         ▼
        ┌───────────────────────────────────────────────────────┐
        │                  Firebase Project                     │
        │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
        │  │  Firestore  │  │     Auth     │  │   Storage    │  │
        │  └─────────────┘  └──────────────┘  └──────────────┘  │
        └───────────────────────────────────────────────────────┘
```

### Application Architecture

The admin portal follows a **layered architecture**:

```
┌─────────────────────────────────────────────────┐
│                 Svelte Components               │
│(pages, layouts, UI — no direct Firestore calls) │
└──────────────────────┬──────────────────────────┘
                       │ calls
┌──────────────────────▼──────────────────────────┐
│               Repository Layer                  │
│  (PlayersRepository, FixturesRepository, …)     │
│  All Firestore + Storage SDK calls live here    │
└──────────────────────┬──────────────────────────┘
                       │ uses
┌──────────────────────▼──────────────────────────┐
│            Firebase SDK (modular v10)           │
│  getFirestore, getAuth, getStorage, etc.        │
└─────────────────────────────────────────────────┘
```

Key architectural decisions:
- **No Firestore imports in `.svelte` files** — all database access is proxied through repositories.
- **Svelte stores for auth state** — a reactive `authStore` exposes the current user and role; components subscribe to it via `$derived`.
- **SvelteKit `hooks.server.ts`** handles route protection server-side before a page renders.
- **Firebase Security Rules** are the final enforcement layer — the portal's route guards are UX-level protection; the rules enforce data integrity server-side.

---

## Components and Interfaces

### SvelteKit Routing Structure

```
admin-portal/
└── src/
    ├── routes/
    │   ├── +layout.svelte           # root layout (loads Firebase, sets auth store)
    │   ├── +layout.server.ts        # root server layout
    │   ├── login/
    │   │   └── +page.svelte         # /login
    │   └── admin/
    │       ├── +layout.svelte       # admin shell (sidebar + header)
    │       ├── +layout.server.ts    # route guard: auth check
    │       ├── +page.svelte         # /admin → Dashboard
    │       ├── players/
    │       │   ├── +page.svelte     # /admin/players — list
    │       │   ├── new/
    │       │   │   └── +page.svelte # /admin/players/new — create form
    │       │   └── [id]/
    │       │       └── +page.svelte # /admin/players/[id] — edit form
    │       ├── fixtures/
    │       │   ├── +page.svelte
    │       │   ├── new/+page.svelte
    │       │   └── [id]/+page.svelte
    │       ├── results/
    │       │   ├── +page.svelte
    │       │   ├── new/+page.svelte
    │       │   └── [id]/+page.svelte
    │       ├── news/
    │       │   ├── +page.svelte
    │       │   ├── new/+page.svelte
    │       │   └── [id]/+page.svelte
    │       ├── gallery/
    │       │   ├── +page.svelte
    │       │   ├── new/+page.svelte
    │       │   └── [albumId]/
    │       │       └── +page.svelte
    │       ├── tournaments/
    │       │   ├── +page.svelte
    │       │   ├── new/+page.svelte
    │       │   └── [id]/+page.svelte
    │       ├── members/
    │       │   ├── +page.svelte
    │       │   ├── new/+page.svelte
    │       │   └── [id]/+page.svelte
    │       ├── settings/
    │       │   └── +page.svelte     # admin-only
    │       └── users/
    │           ├── +page.svelte     # admin-only
    │           ├── new/+page.svelte
    │           └── [id]/+page.svelte
    ├── lib/
    │   ├── firebase/
    │   │   ├── client.ts            # Firebase app initialisation
    │   │   ├── auth.ts              # auth helpers + store
    │   │   └── emulator.ts          # emulator connection (dev only)
    │   ├── repositories/
    │   │   ├── players.repository.ts
    │   │   ├── fixtures.repository.ts
    │   │   ├── results.repository.ts
    │   │   ├── news.repository.ts
    │   │   ├── gallery.repository.ts
    │   │   ├── tournaments.repository.ts
    │   │   ├── members.repository.ts
    │   │   ├── settings.repository.ts
    │   │   └── users.repository.ts
    │   ├── types/
    │   │   └── firestore.types.ts   # all document interfaces
    │   ├── stores/
    │   │   ├── auth.store.svelte.ts # $state-based auth store
    │   │   └── toast.store.svelte.ts
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.svelte
    │   │   │   ├── TopHeader.svelte
    │   │   │   └── MobileDrawer.svelte
    │   │   ├── ui/
    │   │   │   ├── Toast.svelte
    │   │   │   ├── ToastContainer.svelte
    │   │   │   ├── SkeletonLoader.svelte
    │   │   │   ├── ConfirmDialog.svelte
    │   │   │   ├── EmptyState.svelte
    │   │   │   ├── ErrorState.svelte
    │   │   │   ├── DataTable.svelte
    │   │   │   ├── Pagination.svelte
    │   │   │   └── ImageUpload.svelte
    │   │   └── forms/
    │   │       ├── PlayerForm.svelte
    │   │       ├── FixtureForm.svelte
    │   │       ├── ResultForm.svelte
    │   │       ├── NewsForm.svelte
    │   │       ├── GalleryAlbumForm.svelte
    │   │       ├── TournamentForm.svelte
    │   │       ├── MemberForm.svelte
    │   │       └── UserForm.svelte
    │   └── utils/
    │       ├── slug.ts              # title → slug utility
    │       ├── validation.ts        # shared form validation
    │       └── result-label.ts      # Win/Draw/Loss from KOT perspective
    ├── hooks.server.ts              # route protection
    └── app.html
```

### UI Component Hierarchy

```
RootLayout (+layout.svelte)
├── authStore initialisation ($effect listens to onAuthStateChanged)
├── ToastContainer (fixed top-right)
└── <slot>
    ├── LoginPage (/login)
    └── AdminLayout (/admin/+layout.svelte)
        ├── Sidebar
        │   ├── BrandingHeader (logo + club name)
        │   ├── NavLink × N (highlights active route)
        │   └── [MobileDrawer wraps Sidebar on mobile]
        ├── TopHeader
        │   ├── PageTitle (derived from current route)
        │   ├── UserDisplayName
        │   └── LogoutButton
        └── MainContent (<slot>)
            └── [page component]
```

### Authentication Flow

```
User visits /admin/*
        │
        ▼
hooks.server.ts: load() checks session cookie / Firebase session
        │
   Not authenticated?
        │         │
       Yes        No
        │         │
        ▼         ▼
  redirect     Check role for
  /login       restricted routes
                    │
        ┌───────────┴────────────┐
    /admin/users            /admin/settings
    /admin/settings         requires admin
        │
    non-admin?
        │
        ▼
    redirect /admin
```

On the client, `auth.store.svelte.ts` uses `onAuthStateChanged` to keep reactive auth state (`user`, `role`, `loading`) updated. The `role` is read from the ID token's custom claims via `getIdTokenResult(user, true)`.

---

## Data Models

All Firestore document types are defined in `src/lib/types/firestore.types.ts`.

```typescript
import type { Timestamp, FieldValue } from 'firebase/firestore';

// ── Shared ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'editor' | 'viewer';
export type Position = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
export type PlayerStatus = 'active' | 'inactive' | 'injured' | 'suspended';
export type FixtureStatus = 'scheduled' | 'completed' | 'postponed' | 'cancelled' | 'tbc';
export type Visibility = 'public' | 'private';
export type NewsStatus = 'draft' | 'published' | 'archived';
export type NewsCategory =
  | 'Match Report'
  | 'Team News'
  | 'Training'
  | 'Club News'
  | 'Tournament Announcement';
export type MembershipType = 'standard' | 'premium' | 'lifetime' | 'honorary';
export type MemberStatus = 'active' | 'inactive' | 'expired' | 'suspended';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

// ── Players ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;                         // Firestore document ID
  firstName: string;
  lastName: string;
  displayName: string;                // e.g. "Tshiamo Molwatse"
  squadNumber: number;
  position: Position;
  status: PlayerStatus;
  bio: string;
  joinedDate: string;                 // ISO date string "YYYY-MM-DD"
  photoUrl: string | null;            // Firebase Storage download URL
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

export interface Fixture {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string | 'TBC';               // ISO date string or "TBC"
  time: string | 'TBC';               // "HH:MM" or "TBC"
  venue: string;
  status: FixtureStatus;
  visibility: Visibility;
  tournamentId: string | null;        // optional tournament association
  notes: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// ── Results ───────────────────────────────────────────────────────────────────

export interface Result {
  id: string;
  fixtureId: string;                  // reference to parent Fixture
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number | null;    // null if no penalty shootout
  awayPenaltyScore: number | null;
  visibility: Visibility;
  matchReport: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// ── News ──────────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;                       // URL-safe, derived from title
  excerpt: string;
  content: string;                    // markdown or rich-text string
  category: NewsCategory;
  status: NewsStatus;
  authorId: string;                   // Firebase Auth UID
  featuredImageUrl: string | null;    // Storage download URL or null
  publishedAt: Timestamp | FieldValue | null;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// ── Gallery ───────────────────────────────────────────────────────────────────

export interface GalleryAlbum {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;                   // e.g. "Match Day", "Training"
  visibility: Visibility;
  coverImageUrl: string | null;
  photoCount: number;                 // denormalised count, updated on photo add/delete
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface GalleryPhoto {
  id: string;                         // Firestore document ID = photoId
  fileName: string;
  storagePath: string;                // e.g. "gallery/{albumId}/photos/{photoId}"
  downloadUrl: string;
  caption: string;
  uploadedBy: string;                 // Firebase Auth UID
  createdAt: Timestamp | FieldValue;
}

// ── Tournaments ───────────────────────────────────────────────────────────────

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;                  // ISO date string
  endDate: string;
  venue: string;
  status: TournamentStatus;
  visibility: Visibility;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// ── Members ───────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  membershipNumber: string;
  email: string;
  phone: string;
  membershipType: MembershipType;
  status: MemberStatus;
  joinedDate: string;                 // ISO date string
  expiryDate: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface AppSettings {
  id: string;                         // typically "global" — single document
  siteName: string;
  contactEmail: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  updatedAt: Timestamp | FieldValue;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: string;                         // matches Firebase Auth UID
  displayName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}
```

### Firestore Collection Structure

```
firestore/
├── players/{playerId}
├── fixtures/{fixtureId}
├── results/{resultId}
├── news/{newsId}
├── gallery/{albumId}
│   └── photos/{photoId}       ← subcollection
├── tournaments/{tournamentId}
├── members/{memberId}
├── settings/{settingId}       ← typically single doc "global"
└── users/{uid}
```

### Composite Indexes

Required indexes (defined in `firestore.indexes.json`):

| Collection | Fields | Order |
|---|---|---|
| `news` | `status` ASC, `publishedAt` DESC | For published articles feed |
| `fixtures` | `status` ASC, `date` ASC | For tabbed fixture views |
| `players` | `status` ASC, `position` ASC | For filtered squad list |
| `gallery` | `visibility` ASC, `createdAt` DESC | For public album listing |
| `members` | `status` ASC, `expiryDate` ASC | For expiry management |

### Firebase Storage Path Structure

```
storage/
├── players/{playerId}/photo          ← player profile images
├── news/{newsId}/featured            ← news featured images
├── gallery/{albumId}/photos/{photoId} ← album photos
└── assets/**                          ← club branding (admin-only read/write)
```

---

## Repository Pattern

Each repository is a plain TypeScript module (no class instantiation required) exporting async functions. Repositories receive the Firestore instance as a parameter to keep them testable without mocking module-level singletons.

### Example: PlayersRepository

```typescript
// src/lib/repositories/players.repository.ts
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  serverTimestamp, type Firestore, type QueryDocumentSnapshot
} from 'firebase/firestore';
import type { Player, PlayerStatus, Position } from '$lib/types/firestore.types';

export type PlayerFilters = {
  status?: PlayerStatus;
  position?: Position;
  search?: string;
};

export async function getPlayers(
  db: Firestore,
  filters: PlayerFilters = {},
  pageSize = 25,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ players: Player[]; lastDoc: QueryDocumentSnapshot | null }> {
  // builds compound query, returns paginated results
}

export async function createPlayer(
  db: Firestore,
  data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'players'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlayer(
  db: Firestore,
  id: string,
  data: Partial<Omit<Player, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'players', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlayer(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'players', id));
}
```

All nine repositories follow the same structural contract. Repositories throw typed errors (`RepositoryError` wrapping the original Firebase error) so calling components can surface them via the toast store.

### Image Upload Flow

```
User selects file
      │
      ▼
ImageUpload.svelte validates:
  - MIME type ∈ { image/jpeg, image/png, image/webp }
  - size ≤ 10 MB
      │
  Fails? → show inline error, abort
      │
  Pass
      ▼
uploadBytesResumable(storageRef, file)
      │
  Upload progress → progress bar
      │
  Complete
      ▼
getDownloadURL(storageRef)
      ▼
Repository.update({ photoUrl / featuredImageUrl / downloadUrl })
      ▼
Toast: "Photo saved"
```

Storage references follow the path conventions defined in the data model section. The `ImageUpload.svelte` component is reusable across Players, News, and Gallery; it accepts a `storagePath` prop.

---

## Firebase Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helpers ──────────────────────────────────────────────────────────────
    function isAuthenticated() {
      return request.auth != null;
    }
    function getRole() {
      return request.auth.token.role;
    }
    function isAdmin() {
      return isAuthenticated() && getRole() == 'admin';
    }
    function isAdminOrEditor() {
      return isAuthenticated() && getRole() in ['admin', 'editor'];
    }
    function isAnyValidRole() {
      return isAuthenticated() && getRole() in ['admin', 'editor', 'viewer'];
    }

    // ── Public content collections ────────────────────────────────────────────
    // players, fixtures, results, news, gallery, tournaments
    // Read: any valid role
    // Write: admin or editor

    match /players/{docId} {
      allow read: if isAnyValidRole();
      allow write: if isAdminOrEditor();
    }
    match /fixtures/{docId} {
      allow read: if isAnyValidRole();
      allow write: if isAdminOrEditor();
    }
    match /results/{docId} {
      allow read: if isAnyValidRole();
      allow write: if isAdminOrEditor();
    }
    match /news/{docId} {
      allow read: if isAnyValidRole();
      allow write: if isAdminOrEditor();
    }
    match /gallery/{albumId} {
      allow read: if isAnyValidRole();
      allow write: if isAdminOrEditor();

      match /photos/{photoId} {
        allow read: if isAnyValidRole();
        allow write: if isAdminOrEditor();
      }
    }
    match /tournaments/{docId} {
      allow read: if isAnyValidRole();
      allow write: if isAdminOrEditor();
    }

    // ── Members: no public access, admin+editor only ──────────────────────────
    match /members/{docId} {
      allow read, write: if isAdminOrEditor();
    }

    // ── Settings: admin only ──────────────────────────────────────────────────
    match /settings/{docId} {
      allow read, write: if isAdmin();
    }

    // ── Users: admin only ─────────────────────────────────────────────────────
    match /users/{uid} {
      allow read, write: if isAdmin();
    }
  }
}
```

### Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // ── Helpers ──────────────────────────────────────────────────────────────
    function isAuthenticated() {
      return request.auth != null;
    }
    function getRole() {
      return request.auth.token.role;
    }
    function isAdmin() {
      return isAuthenticated() && getRole() == 'admin';
    }
    function isAdminOrEditor() {
      return isAuthenticated() && getRole() in ['admin', 'editor'];
    }
    function isValidImage() {
      return request.resource.contentType in ['image/jpeg', 'image/png', 'image/webp']
          && request.resource.size <= 10 * 1024 * 1024;
    }

    // ── Player photos ─────────────────────────────────────────────────────────
    match /players/{allPaths=**} {
      allow read: if true;                          // public read
      allow create, update: if isAdminOrEditor() && isValidImage();
      allow delete: if isAdmin();
    }

    // ── News featured images ───────────────────────────────────────────────────
    match /news/{allPaths=**} {
      allow read: if true;
      allow create, update: if isAdminOrEditor() && isValidImage();
      allow delete: if isAdmin();
    }

    // ── Gallery photos ─────────────────────────────────────────────────────────
    match /gallery/{allPaths=**} {
      allow read: if true;
      allow create, update: if isAdminOrEditor() && isValidImage();
      allow delete: if isAdmin();
    }

    // ── Club branding assets: admin only ──────────────────────────────────────
    match /assets/{allPaths=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

## Error Handling

### Repository Error Contract

All repositories wrap Firebase errors in a typed `RepositoryError`:

```typescript
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause: unknown,
    public readonly operation: 'read' | 'create' | 'update' | 'delete'
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
```

Components catch `RepositoryError` and call `toastStore.error(err.message)`. Raw Firebase error codes (e.g. `auth/wrong-password`) are never shown to users — they are mapped to user-readable messages in `src/lib/utils/error-messages.ts`.

### Auth Error Mapping

```typescript
export function mapAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential':   'Invalid email or password.',
    'auth/user-disabled':        'This account has been disabled.',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] ?? 'An unexpected error occurred. Please try again.';
}
```

### UI Error States

| Scenario | UI Response |
|---|---|
| Page-level data fetch failure | Inline `ErrorState.svelte` with retry button |
| Form submission failure | Error toast + re-enable submit button |
| Image upload validation failure | Inline error beneath the file input |
| Unauthorised route access | Redirect (no visible error) |
| Confirmation modal cannot display | Action is blocked entirely |
| Photo delete fails after doc delete | Error toast; document is NOT restored |

---

## Environment Configuration

### `.env.example`

```
PUBLIC_FIREBASE_API_KEY=
PUBLIC_FIREBASE_AUTH_DOMAIN=
PUBLIC_FIREBASE_PROJECT_ID=
PUBLIC_FIREBASE_STORAGE_BUCKET=
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_FIREBASE_APP_ID=
PUBLIC_FIREBASE_USE_EMULATOR=false
```

### Firebase Initialisation (`src/lib/firebase/client.ts`)

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import {
  PUBLIC_FIREBASE_API_KEY,
  PUBLIC_FIREBASE_AUTH_DOMAIN,
  PUBLIC_FIREBASE_PROJECT_ID,
  PUBLIC_FIREBASE_STORAGE_BUCKET,
  PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  PUBLIC_FIREBASE_APP_ID,
  PUBLIC_FIREBASE_USE_EMULATOR,
} from '$env/static/public';

const firebaseConfig = {
  apiKey: PUBLIC_FIREBASE_API_KEY,
  authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
```

### `netlify.toml`

```toml
[build]
  command   = "npm run build"
  publish   = ".svelte-kit/output"

[[redirects]]
  from   = "/*"
  to     = "/.netlify/functions/handler"
  status = 200
```

---

## Module Data Flows

### Dashboard

```
/admin (page load)
  → Promise.all([
      getPlayerCount(db),          // count query players where status=active
      getUpcomingFixtures(db, 5),  // fixtures where status=scheduled, order by date asc, limit 5
      getRecentResults(db, 5),     // results order by createdAt desc, limit 5
      getRecentNews(db, 3),        // news where status=published, order by publishedAt desc, limit 3
      getStats(db),                // fixtures aggregate: total, wins, draws, losses
      getAlbumCount(db),           // count query gallery
    ])
  → Skeleton loaders shown during fetch
  → Stats cards + lists rendered on resolution
  → ErrorState shown on rejection (individual section, not full page)
```

### Player Management Data Flow

```
/admin/players (list)
  → getPlayers(db, filters, 25, lastDoc)
  → DataTable renders with photo thumbnail, displayName, squadNumber, position, status
  → Filter controls: position select + status select + search input
  → Pagination using cursor (lastDoc) for next/prev pages

/admin/players/new (create)
  → PlayerForm.svelte (all fields + ImageUpload)
  → On valid submit:
      1. createPlayer(db, formData)  → returns playerId
      2. If photo selected: uploadBytesResumable(ref, file)
         → getDownloadURL → updatePlayer(db, playerId, { photoUrl })
  → redirect /admin/players on success + success toast

/admin/players/[id] (edit)
  → getPlayer(db, id) on load
  → PlayerForm pre-populated
  → On valid submit: updatePlayer(db, id, changedFields)
  → Delete: ConfirmDialog → deletePlayer(db, id) + delete storage photo
```

### Fixture & Result Data Flow

```
/admin/fixtures
  → Tabs: Upcoming | Completed | TBC | Cancelled | All
  → Tab selection triggers getFixtures(db, { status: tabStatus }, 20, lastDoc)
  → "Record Result" button appears on completed fixtures
    → navigates to /admin/results/new?fixtureId=X
    → ResultForm pre-populated with homeTeam, awayTeam from fixture

/admin/results/new
  → Optional penaltyScore fields shown only when "Penalty shootout?" checkbox is checked
  → On submit:
      1. createResult(db, resultData)
      2. updateFixture(db, fixtureId, { status: 'completed' })
  → Win/Draw/Loss label computed client-side:
      kotTeam = homeTeam or awayTeam (whichever matches "K.O.T FC")
      resultLabel = kotScore > oppScore ? 'Win' : kotScore < oppScore ? 'Loss' : 'Draw'
```

### News Data Flow

```
/admin/news
  → getNews(db, { status, category }, 20, lastDoc)
  → Inline actions per row: Edit | Publish | Unpublish | Archive
    → Publish: updateNews(db, id, { status: 'published', publishedAt: serverTimestamp() })
      (only sets publishedAt if currently null)

/admin/news/new
  → Title input → auto-generates slug via slugify(title)
  → Slug field remains editable
  → featuredImage: ImageUpload → storage path news/{newId}/featured
  → On submit: createNews(db, data) → upload image → updateNews({ featuredImageUrl })
```

### Gallery Data Flow

```
/admin/gallery
  → getAlbums(db)  → card grid

/admin/gallery/new
  → GalleryAlbumForm (name, slug, description, category, visibility, coverImage)
  → createAlbum(db, data)

/admin/gallery/[albumId]
  → getAlbum(db, albumId) + getAlbumPhotos(db, albumId, 50, lastDoc)
  → Photo upload:
      - Drag-and-drop (desktop) OR file picker input (always available as fallback)
      - Multi-file selection supported
      - Per-file: validate type/size → uploadBytesResumable → createPhoto(db, albumId, photoData)
      - Increment album.photoCount in the same batch
  → Caption edit: inline text field per photo card → updatePhoto(db, albumId, photoId, { caption })
  → Set cover: updateAlbum(db, albumId, { coverImageUrl: photo.downloadUrl })
  → Delete photo: ConfirmDialog → deleteObject(storageRef) + deletePhoto(db, albumId, photoId)
                  → decrement album.photoCount
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property reflection:** After reviewing all prework classifications, the following redundancies were resolved:
- Requirements 6.12 and 10.10 both describe the same client-side upload validation function — merged into a single property (Property 5).
- Requirements 2.4 and 2.5 (route guard redirect) are directionally opposite but cover the same guard function — kept as two distinct properties because the directions differ meaningfully.
- Pagination properties for players (6.10) and fixtures (7.8) describe the same invariant applied to different collections — merged into one general pagination property (Property 7).
- Requirements 6.2 and 7.2 both describe collection filtering — the filtering invariant is stated once generically in Property 3 and applied to both.

---

### Property 1: Unauthenticated requests are always redirected to /login

*For any* URL path that begins with `/admin`, when the route guard evaluates a request from a user with no valid Firebase Auth session, the guard should redirect to `/login`.

**Validates: Requirements 2.4**

---

### Property 2: Authenticated users are redirected away from /login

*For any* authenticated user regardless of their role (`admin`, `editor`, or `viewer`), navigating to `/login` should redirect them to `/admin`.

**Validates: Requirements 2.5**

---

### Property 3: Auth error codes are never exposed to the user

*For any* Firebase Authentication error code string (e.g. `auth/wrong-password`, `auth/user-disabled`), the `mapAuthError` function should return a human-readable message that does not contain the original error code string.

**Validates: Requirements 2.8**

---

### Property 4: Auth store reflects role from ID token claims

*For any* valid Firebase ID token result containing a `role` claim with value `admin`, `editor`, or `viewer`, after the auth store processes that token result, the stored role should equal the `role` field from the token's claims.

**Validates: Requirements 3.1**

---

### Property 5: Non-admin users cannot access admin-only routes

*For any* user whose role is `editor` or `viewer`, a request to `/admin/users` or `/admin/settings` should be redirected to `/admin`.

**Validates: Requirements 3.2**

---

### Property 6: Viewer role produces read-only UI across all content pages

*For any* content management page (Players, Fixtures, Results, News, Gallery, Tournaments) rendered with an authenticated session where the user's role is `viewer`, no create, edit, or delete action controls should be present in the rendered output.

**Validates: Requirements 3.3**

---

### Property 7: Collection filtering returns only matching documents

*For any* collection query (players or fixtures) with one or more active filter values (e.g. `status`, `position`), every document returned by the repository should satisfy all specified filter predicates.

**Validates: Requirements 6.2, 7.2**

---

### Property 8: Player text search returns only matching players

*For any* non-empty search string, every player returned by the search query should contain the search string (case-insensitive) in at least one of `firstName`, `lastName`, or `displayName`.

**Validates: Requirements 6.3**

---

### Property 9: Repository pages never exceed the declared page size

*For any* repository list query (players with pageSize 25, fixtures with pageSize 20, results with pageSize 20, news with pageSize 20, gallery photos with pageSize 50, members with pageSize 25), the number of documents returned in a single page should never exceed the declared maximum page size for that collection.

**Validates: Requirements 6.10, 7.8, 8.7, 9.9, 10.11, 12.8**

---

### Property 10: Client-side upload validation rejects invalid files

*For any* selected file where the MIME type is not one of `image/jpeg`, `image/png`, or `image/webp`, OR the file size exceeds 10 MB, the client-side `validateUpload` function should return an error result and should not initiate a Storage upload.

**Validates: Requirements 6.12, 10.10, 16.1, 16.2**

---

### Property 11: Slug generation produces URL-safe strings

*For any* non-empty title string, the `slugify` function should return a string that matches the pattern `^[a-z0-9]+(-[a-z0-9]+)*$` or an empty string (for titles composed entirely of non-alphanumeric characters). The output should never contain uppercase letters, spaces, or special characters other than hyphens.

**Validates: Requirements 9.4**

---

### Property 12: Match result label is correctly derived from scores

*For any* result where `homeTeam` or `awayTeam` is `"K.O.T FC"`, the computed result label should be `"Win"` when K.O.T FC's score is strictly greater than the opponent's score, `"Loss"` when strictly less, and `"Draw"` when equal. If a penalty shootout occurred, the label is derived from the penalty scores when normal-time scores are equal.

**Validates: Requirements 8.1**

---

### Property 13: Repository write failures throw RepositoryError instances

*For any* repository write operation (create, update, delete) that encounters a Firestore error, the thrown error should be an instance of `RepositoryError` (not a raw Firebase error), and should have an `operation` field set to the appropriate operation type.

**Validates: Requirements 15.4**

---

### Property 14: Tournament forms with invalid dates are rejected

*For any* tournament form submission where `endDate` is earlier than `startDate`, or where any required field is empty, the form should display inline validation errors and should not invoke the repository `createTournament` or `updateTournament` function.

**Validates: Requirements 11.3, 11.4**

---

## Testing Strategy

### Technology Choices

- **Unit and property tests**: [Vitest](https://vitest.dev/) as the test runner
- **Property-based testing**: [fast-check](https://fast-check.dev/) (TypeScript-native PBT library)
- **Component tests**: Vitest + `@testing-library/svelte`
- **Integration tests (Security Rules)**: Firebase Emulator Suite with the `@firebase/rules-unit-testing` package

Minimum **100 iterations** per property test (fast-check default is 100; keep the default or increase it).

Each property test is annotated with a comment tag referencing the design property it implements:

```typescript
// Feature: kot-fc-admin-portal, Property 3: Auth error codes are never exposed to the user
it.prop([fc.string()])('mapAuthError never exposes raw Firebase codes', (code) => {
  const result = mapAuthError(code);
  expect(result).not.toContain(code);
  expect(result.length).toBeGreaterThan(0);
});
```

---

### Unit Tests (Example-Based)

These cover specific scenarios, integration points, and edge cases that complement the property tests:

| Scope | Test Cases |
|---|---|
| Login page rendering | Email input, password input, and submit button present |
| Login success | Mock auth success → assert redirect to /admin |
| Login failure | Mock various Firebase errors → assert mapped messages, no redirect |
| Logout | Mock signOut → assert redirect to /login |
| Sidebar rendering (admin) | All nav links including Users and Settings present |
| Sidebar rendering (editor) | Users and Settings links absent |
| Sidebar rendering (viewer) | Users and Settings links absent; write actions absent on content pages |
| News publish action | Status `draft` → `published` sets `publishedAt` to serverTimestamp |
| Result form penalty fields | Penalty fields only appear when "penalty shootout" is toggled on |
| Confirmation dialog | Delete action requires confirmation; confirmed → calls repository delete |
| Empty state | Zero-result query renders EmptyState with correct message |
| Error state | Failed query renders ErrorState with retry button |
| Skeleton loader | During fetch, SkeletonLoader elements render in place of content |
| Toast notification | Success/error operations emit correct toast type |
| Inline form validation | Submitting empty required fields shows adjacent error messages |
| Submit button disabled during submission | Button disabled + loading indicator visible during in-flight request |

---

### Property Tests (Universal Properties)

All implemented with fast-check. Tag format: `Feature: kot-fc-admin-portal, Property N: <property title>`.

| Property | Test file | Arbitraries used |
|---|---|---|
| P1: Unauthenticated redirect | `hooks.test.ts` | `fc.constantFrom(...adminPaths)` |
| P2: Authenticated /login redirect | `hooks.test.ts` | `fc.constantFrom('admin','editor','viewer')` |
| P3: Auth error codes never exposed | `error-messages.test.ts` | `fc.string()` |
| P4: Auth store reflects role claims | `auth.store.test.ts` | `fc.constantFrom('admin','editor','viewer')` |
| P5: Non-admin blocked from admin-only routes | `hooks.test.ts` | `fc.constantFrom('editor','viewer')` |
| P6: Viewer gets read-only UI | `viewer-ui.test.ts` | `fc.constantFrom(...contentPages)` |
| P7: Collection filtering invariant | `players.repository.test.ts`, `fixtures.repository.test.ts` | `fc.array(playerArbitrary)`, filter combos |
| P8: Player text search invariant | `players.repository.test.ts` | `fc.string()`, `fc.array(playerArbitrary)` |
| P9: Pagination page size invariant | `*.repository.test.ts` | `fc.array(...)` with varying lengths |
| P10: Upload validation rejects invalid files | `image-upload.test.ts` | `fc.string()` (MIME), `fc.integer()` (size) |
| P11: Slug generation URL-safe | `slug.test.ts` | `fc.string()` |
| P12: Result label derivation | `result-label.test.ts` | `fc.integer()` × 4 (scores), `fc.boolean()` (isHome) |
| P13: Repository error wrapping | `*.repository.test.ts` | `fc.constantFrom('create','update','delete')` |
| P14: Tournament invalid date rejection | `tournament-form.test.ts` | `fc.date()`, `fc.date()` (where end < start) |

---

### Integration Tests (Firebase Emulator)

Run against the Firebase Local Emulator Suite to verify Security Rules:

| Test | Emulator | Scenario |
|---|---|---|
| Admin can write to `users` collection | Firestore | admin token → write → success |
| Editor cannot write to `users` collection | Firestore | editor token → write → denied |
| Viewer cannot write to `users` collection | Firestore | viewer token → write → denied |
| Unauthenticated cannot read `members` | Firestore | no token → read → denied |
| Editor can write to `players` collection | Firestore | editor token → write → success |
| Viewer cannot write to `players` collection | Firestore | viewer token → write → denied |
| Admin can delete Storage objects | Storage | admin token → delete → success |
| Editor cannot delete Storage objects | Storage | editor token → delete → denied |
| Upload with invalid MIME rejected by Storage Rules | Storage | editor token + text/plain file → denied |
| Upload exceeding 10MB rejected by Storage Rules | Storage | editor token + 11MB file → denied |
| `assets/**` read blocked for non-admin | Storage | editor token → read assets/ → denied |

---

### Test File Structure

```
admin-portal/
└── src/
    └── lib/
        ├── utils/
        │   ├── slug.test.ts
        │   ├── error-messages.test.ts
        │   └── result-label.test.ts
        ├── repositories/
        │   ├── players.repository.test.ts
        │   ├── fixtures.repository.test.ts
        │   ├── results.repository.test.ts
        │   ├── news.repository.test.ts
        │   ├── gallery.repository.test.ts
        │   ├── tournaments.repository.test.ts
        │   └── members.repository.test.ts
        └── stores/
            └── auth.store.test.ts
tests/
├── hooks.test.ts
├── viewer-ui.test.ts
├── image-upload.test.ts
├── tournament-form.test.ts
└── integration/
    ├── firestore-rules.test.ts
    └── storage-rules.test.ts
```
