# Implementation Plan: K.O.T FC Admin Portal

## Overview

These tasks implement the K.O.T FC Admin Portal — a SvelteKit 2 application deployed at `admin.kotfc.co.za`. Tasks follow the layered architecture defined in the design document: Firebase initialisation → TypeScript types → Repository layer → Auth & routing → UI shell → Page implementations → Tests → Deployment config.

## Tasks

- [x] 1. Project Scaffolding
  - Initialise a new SvelteKit 2 project inside `admin-portal/` with TypeScript strict mode enabled, Svelte 5 runes, and `@sveltejs/adapter-netlify`
  - Install and configure Tailwind CSS 3 (with `tailwind.config.js` and `postcss.config.js`); populate `theme.extend.colors` with the K.O.T brand palette (`navy`, `blue`, `gold`, `silver`), `fontFamily` (`display: Oswald`, `body: Inter`), and the `shimmer` keyframe/animation exactly as in the public site's config
  - Create `src/app.css` — import Oswald + Inter from Google Fonts, set the `navy-900` background and white body text, and define the shared `@layer components` classes (`heading-display`, `text-eyebrow`, `card-surface`, `btn-primary`, `btn-gold`, `btn-outline`, `skeleton`, `container-x`, `container-narrow`) plus the `prefers-reduced-motion` block, matching the public site's `app.css`
  - Copy K.O.T brand assets (`kot-logo.svg`, `kot-logo.png`, `kot-monogram.svg`) into `static/`; set `kot-monogram.svg` as the favicon and `#071426` as the `theme-color` in `src/app.html`
  - Install Firebase SDK v10 (`firebase`) and dev dependencies (`vitest`, `@vitest/ui`, `fast-check`, `@testing-library/svelte`, `@firebase/rules-unit-testing`)
  - Create `.env.example` with all six `PUBLIC_FIREBASE_*` variables plus `PUBLIC_FIREBASE_USE_EMULATOR=false`
  - Update `.gitignore` to exclude `.env`, `.env.local`, and all `.env.*` files (except `.env.example`)
  - Create `netlify.toml` with build command `npm run build`, publish directory `.svelte-kit/output`, and a catch-all redirect to the Netlify function handler
  - Create `static/robots.txt` disallowing all crawlers on all paths (`User-agent: * / Disallow: /`)
  - Add `<meta name="robots" content="noindex, nofollow">` to `src/app.html` for all admin routes
  - Configure `vitest.config.ts` with a jsdom environment and path aliases matching `svelte.config.js`
  - Verify the project builds and the dev server starts without errors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.4_

- [x] 2. Firebase Client Initialisation
  - Create `src/lib/firebase/client.ts` — initialise the Firebase app (guard against duplicate initialisation with `getApps()`), export `auth`, `db`, and `storage` instances
  - Add emulator connection logic: when `PUBLIC_FIREBASE_USE_EMULATOR === 'true'`, call `connectAuthEmulator`, `connectFirestoreEmulator`, and `connectStorageEmulator` with the ports specified in the design (`9099`, `8080`, `9199`)
  - Create `src/lib/firebase/auth.ts` — export `signInWithEmail`, `signOutUser`, and `getIdTokenRole` helper functions that wrap Firebase Auth SDK calls
  - Ensure no Firebase import appears directly in any `.svelte` file (lint rule or code-review checklist item documented in `CONTRIBUTING.md`)
  - _Requirements: 1.5, 2.1, 2.6, 2.7_

- [x] 3. TypeScript Interfaces
  - Create `src/lib/types/firestore.types.ts` with all type aliases and interfaces exactly as specified in the design document (`UserRole`, `Position`, `PlayerStatus`, `FixtureStatus`, `Visibility`, `NewsStatus`, `NewsCategory`, `MembershipType`, `MemberStatus`, `TournamentStatus`)
  - Add all document interfaces: `Player`, `Fixture`, `Result`, `NewsArticle`, `GalleryAlbum`, `GalleryPhoto`, `Tournament`, `Member`, `AppSettings`, `UserRecord`
  - Verify all interfaces compile under `strict` TypeScript with no errors (`tsc --noEmit`)
  - _Requirements: 15.3_

- [x] 4. Auth Store and Toast Store
  - Create `src/lib/stores/auth.store.svelte.ts` using Svelte 5 `$state` — expose `user`, `role` (`UserRole | null`), and `loading` (boolean); subscribe to `onAuthStateChanged` inside a `$effect`; after state change call `getIdTokenResult(user, true)` to read the `role` custom claim
  - Create `src/lib/stores/toast.store.svelte.ts` — expose `toasts` array (`$state`) plus `success(message)`, `error(message)`, and `dismiss(id)` methods; each toast has a unique id, type, message, and auto-dismisses after 4 seconds
  - _Requirements: 3.1, 4.7, 17.5, 17.6_

- [x] 5. Route Protection (hooks.server.ts)
  - Create `src/hooks.server.ts` — in the `handle` hook, inspect the request URL: if path starts with `/admin` and user is not authenticated redirect to `/login`; if path is `/login` and user is authenticated redirect to `/admin`
  - Extend the hook to enforce role restrictions: if path is `/admin/users` or `/admin/settings` and role is not `admin`, redirect to `/admin`
  - Ensure the hook forwards all other requests unmodified via `resolve(event)`
  - _Requirements: 2.4, 2.5, 3.2, 13.4, 14.8_

- [x] 6. Utility Functions
  - Create `src/lib/utils/slug.ts` — export `slugify(title: string): string` that converts a title to a URL-safe lowercase string with words separated by hyphens, stripping all non-alphanumeric characters
  - Create `src/lib/utils/result-label.ts` — export `getResultLabel(homeTeam, awayTeam, homeScore, awayScore, homePenalty?, awayPenalty?): 'Win' | 'Draw' | 'Loss'` that computes the label from K.O.T FC's perspective
  - Create `src/lib/utils/error-messages.ts` — export `mapAuthError(code: string): string` with the mapping defined in the design document; unmapped codes return the generic fallback message
  - Create `src/lib/utils/validation.ts` — export `validateUpload(file: File): { valid: true } | { valid: false; reason: string }` checking MIME type and 10 MB size limit
  - _Requirements: 2.8, 6.12, 8.1, 9.4, 10.10, 16.1, 16.2_

- [x] 7. RepositoryError and Base Repository Pattern
  - Create `src/lib/repositories/repository-error.ts` — export `RepositoryError extends Error` with constructor `(message: string, cause: unknown, operation: 'read' | 'create' | 'update' | 'delete')`
  - Document the repository contract in `src/lib/repositories/README.md`: all repositories receive `db: Firestore` as first argument, use `serverTimestamp()` for timestamps, and wrap all Firebase errors in `RepositoryError`
  - _Requirements: 15.4, 15.5_

- [x] 8. Players Repository
  - Create `src/lib/repositories/players.repository.ts` and implement `getPlayers` (compound query with optional `status`/`position` filters, client-side substring search across `firstName`/`lastName`/`displayName`, returns `{ players, lastDoc }`), `getPlayer`, `createPlayer` (`addDoc` with `serverTimestamp()`), `updatePlayer` (`updateDoc` with `serverTimestamp()`), and `deletePlayer`
  - Wrap all Firebase calls in try/catch and rethrow as `RepositoryError` with the appropriate `operation` value
  - _Requirements: 6.5, 6.6, 6.7, 6.9, 6.10, 15.1, 15.2, 15.4, 15.5_

- [x] 9. Fixtures Repository
  - Create `src/lib/repositories/fixtures.repository.ts` and implement `getFixtures` (filter by `status`, order by `date` ASC), `getFixture`, `createFixture`, `updateFixture`, and `deleteFixture`
  - Wrap all Firebase calls in `RepositoryError`
  - _Requirements: 7.2, 7.4, 7.5, 7.8, 15.1, 15.4, 15.5_

- [x] 10. Results Repository
  - Create `src/lib/repositories/results.repository.ts` and implement `getResults` (ordered by `createdAt` DESC), `getResult`, `createResult` (`addDoc` with `serverTimestamp()` and calls `updateFixture(db, data.fixtureId, { status: 'completed' })`), `updateResult`, and `deleteResult`
  - Wrap all Firebase calls in `RepositoryError`
  - _Requirements: 8.4, 8.5, 8.7, 15.1, 15.4, 15.5_

- [x] 11. News Repository
  - Create `src/lib/repositories/news.repository.ts` and implement `getNews` (optional `status`/`category` filters, ordered by `createdAt` DESC), `getNewsArticle`, `createNews` (`serverTimestamp()` for `createdAt`/`updatedAt`, sets `authorId`), `updateNews` (sets `publishedAt: serverTimestamp()` when status becomes `published` and it is not already set), and `deleteNews`
  - Wrap all Firebase calls in `RepositoryError`
  - _Requirements: 9.6, 9.7, 9.9, 15.1, 15.4, 15.5_

- [x] 12. Gallery Repository
  - Create `src/lib/repositories/gallery.repository.ts` and implement `getAlbums`, `getAlbum`, `createAlbum`, `updateAlbum`, `deleteAlbum`, `getAlbumPhotos` (subcollection query ordered by `createdAt` ASC), `createPhoto` (adds to subcollection and increments `album.photoCount` in a batch), `updatePhoto`, and `deletePhoto` (deletes subcollection document and decrements `album.photoCount` in a batch)
  - Wrap all Firebase calls in `RepositoryError`
  - _Requirements: 10.5, 10.7, 10.8, 10.11, 15.1, 15.4, 15.5_

- [x] 13. Tournaments Repository
  - Create `src/lib/repositories/tournaments.repository.ts` and implement `getTournaments`, `getTournament`, `createTournament`, `updateTournament`, and `deleteTournament`
  - Wrap all Firebase calls in `RepositoryError`
  - _Requirements: 11.3, 11.4, 15.1, 15.4, 15.5_

- [x] 14. Members Repository
  - Create `src/lib/repositories/members.repository.ts` and implement `getMembers` (optional `status`/`membershipType` filters), `getMember`, `createMember`, `updateMember`, and `deleteMember`
  - Wrap all Firebase calls in `RepositoryError`
  - _Requirements: 12.4, 12.5, 12.8, 15.1, 15.4, 15.5_

- [x] 15. Settings Repository
  - Create `src/lib/repositories/settings.repository.ts` and implement `getSettings` (`getDoc(doc(db, 'settings', 'global'))`) and `updateSettings` (`updateDoc` with `serverTimestamp()` for `updatedAt`)
  - Wrap all Firebase calls in `RepositoryError`
  - _Requirements: 13.2, 13.3, 15.1, 15.4, 15.5_

- [x] 16. Users Repository
  - Create `src/lib/repositories/users.repository.ts` and implement `getUsers`, `getUser`, `createUser` (`setDoc(doc(db, 'users', uid), ...)` with `serverTimestamp()`), `updateUser`, and `deleteUser`
  - Wrap all Firebase calls in `RepositoryError`
  - _Requirements: 14.4, 14.5, 15.1, 15.4, 15.5_

- [x] 17. Core UI Components
  - Create `src/lib/components/ui/Toast.svelte` (single toast: type, message, dismiss button) and `ToastContainer.svelte` (fixed top-right container reading from `toastStore`)
  - Create `SkeletonLoader.svelte` (`variant` prop: `card` | `row` | `list`), `ConfirmDialog.svelte` (modal with title/description/Cancel/Confirm emitting `confirm`/`cancel`), `EmptyState.svelte` (`message` + optional `ctaLabel`/`ctaHref`), and `ErrorState.svelte` (`message` + `onRetry`)
  - Create `DataTable.svelte` (generic `columns`/`rows`, responsive horizontal scroll), `Pagination.svelte` (`hasNext`/`hasPrev`/`onNext`/`onPrev`, min tap target 44×44px), and `ImageUpload.svelte` (`storagePath`/`onUpload(url)` props, validates via `validateUpload`, progress bar, inline error on validation failure)
  - Apply K.O.T brand styling to every component: buttons use `btn-primary`/`btn-gold`/`btn-outline`; `SkeletonLoader` uses the `skeleton` shimmer class; `ConfirmDialog`/modal panels and any card surfaces use `card-surface`; focus states use the `focus:ring-blue-400 focus:ring-offset-navy-900` convention
  - _Requirements: 4.7, 16.1, 16.2, 17.1, 17.2, 17.3, 17.4, 17.7, 17.8_

- [x] 18. Application Layout Components
  - Create `src/lib/components/layout/Sidebar.svelte` — `navy-950`/`navy-900` background; K.O.T FC logo (`kot-logo.svg`) and club name rendered with `heading-display`; nav links for Dashboard, Players, Fixtures, Results, News, Gallery, Tournaments, Members, Settings, User Management; active link uses the `blue-500` accent treatment (matching the public site's `link-nav.active`); conditionally hides Settings and User Management links for `editor`/`viewer` roles (evaluated independently)
  - Create `TopHeader.svelte` — current page title (derived from route), authenticated user's display name, hamburger menu button (mobile), and logout button that calls `signOutUser()` then redirects to `/login`
  - Create `MobileDrawer.svelte` — wraps `Sidebar` in a slide-out overlay triggered by a boolean `open` prop; renders on viewports < 768px
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 19. Root and Admin Layouts
  - Create `src/routes/+layout.svelte` (initialise the auth store via `$effect`/`onAuthStateChanged`; render `<ToastContainer>` and `<slot>`) and `src/routes/+layout.server.ts` (minimal root server layout, no guard logic)
  - Create `src/routes/admin/+layout.svelte` — render `<Sidebar>`, `<TopHeader>`, `<MobileDrawer>`, and `<slot>`; manage mobile drawer open/close state with `$state`
  - Create `src/routes/admin/+layout.server.ts` — server-side route guard: unauthenticated requests redirect to `/login`; role checks for `/admin/users` and `/admin/settings` redirect non-admin users to `/admin`
  - _Requirements: 2.4, 2.5, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 20. Login Page
  - Create `src/routes/login/+page.svelte` — render email and password inputs plus a submit button; bind values with `$state`; call `signInWithEmail` on submit
  - Handle auth errors: catch Firebase errors, pass the code to `mapAuthError`, display the mapped message inline beneath the form; do not redirect on failure
  - Disable the submit button and show a loading spinner while the sign-in request is in flight; on success redirect to `/admin`
  - _Requirements: 2.1, 2.2, 2.3, 2.8, 17.7, 17.8_

- [x] 21. Dashboard Page
  - Create `src/routes/admin/+page.svelte` — on mount, call all dashboard queries in parallel via `Promise.all` (active player count, upcoming fixtures ×5, recent results ×5, recent news ×3, match stats, album count)
  - Render statistics cards (total active players, upcoming fixtures, total matches played, wins, draws, losses, published news count, gallery album count), the Next 5 Fixtures list (date ascending), Recent 5 Results list (date descending), and 3 Latest News list (`publishedAt` descending)
  - Render quick-action buttons: Add Player → `/admin/players/new`, Add Fixture → `/admin/fixtures/new`, Add News → `/admin/news/new`, Upload Photos → `/admin/gallery`
  - Show `<SkeletonLoader variant="card">` placeholders during loading and `<ErrorState>` with retry button for any section that fails to load
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 22. Players Pages
  - Create `src/routes/admin/players/+page.svelte` — data table (photo thumbnail, display name, squad number, position, status); position/status filter selects; text search input; `<Pagination>`; `<EmptyState>`; `<SkeletonLoader>`; hide Add/Edit/Delete controls for `viewer` role
  - Create `src/lib/components/forms/PlayerForm.svelte` — fields firstName, lastName, displayName, squadNumber, position (select), status (select), bio (textarea), joinedDate (date), and `<ImageUpload storagePath="players/{id}/photo">`; inline validation errors per field
  - Create `src/routes/admin/players/new/+page.svelte` — render `<PlayerForm>`; on submit call `createPlayer`, upload photo if provided, then `updatePlayer({ photoUrl })`; redirect to `/admin/players` with success toast; error toast on failure
  - Create `src/routes/admin/players/[id]/+page.svelte` — load with `getPlayer`; pre-populate form; on submit call `updatePlayer`; Delete button shows `<ConfirmDialog>` then `deletePlayer` and attempts Storage deletion (error toast if Storage delete fails, but do not restore the document)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12_

- [x] 23. Fixtures Pages
  - Create `src/routes/admin/fixtures/+page.svelte` — tab navigation (Upcoming, Completed, TBC, Cancelled, All); on tab change call `getFixtures` with matching status filter; `<DataTable>` (competition, homeTeam vs awayTeam, date/time, venue, status); "Record Result" button visible only on completed fixtures (links to `/admin/results/new?fixtureId=X`); `<Pagination>`; `<EmptyState>` per tab; hide write controls for `viewer` role
  - Create `src/lib/components/forms/FixtureForm.svelte` — fields competition, homeTeam, awayTeam, date, time, venue, status (select), visibility (select), tournamentId (optional select from `getTournaments`), notes; inline validation
  - Create `src/routes/admin/fixtures/new/+page.svelte` — render `<FixtureForm>`; on submit call `createFixture`; redirect to `/admin/fixtures`
  - Create `src/routes/admin/fixtures/[id]/+page.svelte` — load with `getFixture`; pre-populate form; on submit call `updateFixture`; Delete → `<ConfirmDialog>` → `deleteFixture`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

- [x] 24. Results Pages
  - Create `src/routes/admin/results/+page.svelte` — list (homeTeam vs awayTeam, score, result label Win/Draw/Loss, match date); `<Pagination>`; `<EmptyState>`; hide write controls for `viewer` role
  - Create `src/lib/components/forms/ResultForm.svelte` — fields fixtureId (pre-populated from query param when navigating from Fixtures), homeTeam, awayTeam, homeScore, awayScore, visibility, matchReport; "Penalty shootout?" checkbox toggling homePenaltyScore/awayPenaltyScore fields; inline validation; result label preview via `getResultLabel`
  - Create `src/routes/admin/results/new/+page.svelte` — if `?fixtureId=X` present, load fixture and pre-populate homeTeam/awayTeam; on submit call `createResult` (internally updates fixture status to `completed`); redirect to `/admin/results`
  - Create `src/routes/admin/results/[id]/+page.svelte` — load result; pre-populate form; on submit call `updateResult`; Delete → `<ConfirmDialog>` → `deleteResult`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 25. News Pages
  - Create `src/routes/admin/news/+page.svelte` — data table (title, category, status, author, published date); status/category filter selects; inline row actions Edit (link), Publish (`updateNews({ status: 'published', publishedAt: serverTimestamp() })`), Unpublish (`updateNews({ status: 'draft' })`), Archive (`updateNews({ status: 'archived' })`); `<Pagination>`; `<EmptyState>`; hide write actions for `viewer` role
  - Create `src/lib/components/forms/NewsForm.svelte` — fields title (auto-generates slug via `slugify`), slug (editable, preserves user edits), excerpt, content (textarea/basic markdown editor), category (select), status (select), publishedAt (optional date/time), and `<ImageUpload storagePath="news/{id}/featured">`; inline validation
  - Create `src/routes/admin/news/new/+page.svelte` — render `<NewsForm>`; on submit call `createNews` with `authorId` from auth store; if featured image selected, upload then `updateNews({ featuredImageUrl })`; redirect to `/admin/news`
  - Create `src/routes/admin/news/[id]/+page.svelte` — load article; pre-populate form; on submit call `updateNews`; Delete → `<ConfirmDialog>` → `deleteNews`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

- [x] 26. Gallery Pages
  - Create `src/routes/admin/gallery/+page.svelte` — card grid (cover image or placeholder, album name, category, photo count); "Create Album" button; `<EmptyState>`; hide write actions for `viewer` role
  - Create `src/lib/components/forms/GalleryAlbumForm.svelte` — fields name (auto-generates slug), slug (editable), description, category, visibility (select), and cover image upload; inline validation
  - Create `src/routes/admin/gallery/new/+page.svelte` — render `<GalleryAlbumForm>`; on submit call `createAlbum`; redirect to the new album's page
  - Create `src/routes/admin/gallery/[albumId]/+page.svelte` — load album (`getAlbum`) and photos (`getAlbumPhotos`); multi-file upload with drag-and-drop zone plus always-visible `<input type="file" multiple>` fallback; per file `validateUpload` → `uploadBytesResumable` (progress bar) → `createPhoto` (increments `photoCount`); photo grid with editable caption, "Set as Cover", and "Delete Photo"; caption edit calls `updatePhoto`; set cover calls `updateAlbum({ coverImageUrl })`; delete photo `<ConfirmDialog>` → `deleteObject` then `deletePhoto` (decrements `photoCount`); publish/unpublish toggle calls `updateAlbum({ visibility })`; `<Pagination>` for photos
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11_

- [x] 27. Tournaments Pages
  - Create `src/routes/admin/tournaments/+page.svelte` — list (name, startDate, endDate, venue, status, visibility); `<EmptyState>`; hide write actions for `viewer` role
  - Create `src/lib/components/forms/TournamentForm.svelte` — fields name, description, startDate (date), endDate (date), venue, status (select), visibility (select); inline validation including `endDate >= startDate`
  - Create `src/routes/admin/tournaments/new/+page.svelte` — render `<TournamentForm>`; on submit call `createTournament`; redirect to `/admin/tournaments`
  - Create `src/routes/admin/tournaments/[id]/+page.svelte` — load tournament; pre-populate form; on submit call `updateTournament`; Delete → `<ConfirmDialog>` → `deleteTournament`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 28. Members Pages
  - Create `src/routes/admin/members/+page.svelte` — data table (membership number, full name, email, membership type, status, expiry date); status/membership type filter selects; `<Pagination>`; `<EmptyState>`; hide write actions for `viewer` role
  - Create `src/lib/components/forms/MemberForm.svelte` — fields firstName, lastName, membershipNumber, email, phone, membershipType (select), status (select), joinedDate, expiryDate; inline validation
  - Create `src/routes/admin/members/new/+page.svelte` — render `<MemberForm>`; on submit call `createMember`; redirect to `/admin/members`
  - Create `src/routes/admin/members/[id]/+page.svelte` — load member; pre-populate form; on submit call `updateMember`; Delete → `<ConfirmDialog>` → `deleteMember`
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.8, 12.9_

- [x] 29. Settings Page
  - Create `src/routes/admin/settings/+page.svelte` — load settings document with `getSettings`; render a form with siteName, contactEmail, and three social link fields (facebook, instagram, twitter); on submit call `updateSettings`; show success/error toast; disable form and show loading state during submission
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 30. User Management Pages
  - Create `src/routes/admin/users/+page.svelte` — data table (display name, email, role, active status, created date); `<EmptyState>`
  - Create `src/lib/components/forms/UserForm.svelte` — fields email, displayName, role (select: admin/editor/viewer), active (checkbox); inline validation
  - Create `src/routes/admin/users/new/+page.svelte` — render `<UserForm>`; on submit call `createUser`; redirect to `/admin/users`
  - Create `src/routes/admin/users/[id]/+page.svelte` — load user record; pre-populate form; on submit call `updateUser`; Delete → `<ConfirmDialog>` → `deleteUser`
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.8_

- [x] 31. Firebase Security Rules
  - Create `firestore.rules` with helper functions (`isAuthenticated`, `getRole`, `isAdmin`, `isAdminOrEditor`, `isAnyValidRole`); public content collections (`players`, `fixtures`, `results`, `news`, `gallery` + `photos` subcollection, `tournaments`) read for any valid role and write for admin/editor; `members` read/write only for admin/editor; `settings` read/write only for admin; `users` read/write only for admin
  - Create `storage.rules`: `players/**`, `news/**`, `gallery/**` public read, admin/editor create/update with `isValidImage`, admin-only delete; `assets/**` admin-only read and write
  - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 16.3, 16.4, 16.5, 16.6_

- [x] 32. Firestore Composite Indexes
  - Create `firestore.indexes.json` with the five composite indexes: `news` (`status` ASC + `publishedAt` DESC), `fixtures` (`status` ASC + `date` ASC), `players` (`status` ASC + `position` ASC), `gallery` (`visibility` ASC + `createdAt` DESC), `members` (`status` ASC + `expiryDate` ASC)
  - _Requirements: 1.7_

- [x] 33. Unit Tests
  - `src/lib/utils/slug.test.ts` — `slugify` with normal title, special characters, all-caps, empty string, and numbers
  - `src/lib/utils/result-label.test.ts` — `getResultLabel` with home win, away win, draw, penalty win/loss, KOT as home, KOT as away
  - `src/lib/utils/error-messages.test.ts` — `mapAuthError` with each known code, unknown code fallback, empty string fallback
  - `src/lib/utils/validation.test.ts` — `validateUpload` with valid JPEG under 10 MB, valid PNG, invalid MIME (fails with reason), file exactly 10 MB (passes), file over 10 MB (fails with reason)
  - `tests/viewer-ui.test.ts` — render each content page with a `viewer` role mock; assert add/edit/delete buttons are absent
  - `tests/tournament-form.test.ts` (unit portion) — submitting with `endDate < startDate` shows inline error and does not call the repository
  - _Requirements: 2.8, 6.12, 8.1, 9.4, 10.10, 16.1, 16.2, 17.7_

- [x] 34. Property-Based Tests
  - `src/lib/utils/slug.test.ts` — Property 11 — `fc.string()` → assert output matches `^[a-z0-9]+(-[a-z0-9]+)*$` or is empty; no uppercase, spaces, or special characters other than hyphens
  - `src/lib/utils/result-label.test.ts` — Property 12 — `fc.integer() × 4` + `fc.boolean()` (isHome) → assert Win/Draw/Loss correct for all score combinations including penalty shootout
  - `src/lib/utils/error-messages.test.ts` — Property 3 — `fc.string()` → assert `mapAuthError(code)` does not contain the input code and has length > 0
  - `tests/image-upload.test.ts` — Property 10 — `fc.string()` (MIME) + `fc.integer({ min: 0, max: 20_000_000 })` (size) → assert `validateUpload` rejects when MIME not allowed OR size > 10 MB
  - `tests/hooks.test.ts` — Property 1 (`fc.constantFrom(...adminPaths)`, unauthenticated → redirect `/login`), Property 2 (`fc.constantFrom('admin','editor','viewer')`, authenticated `/login` → redirect `/admin`), Property 5 (`fc.constantFrom('editor','viewer')`, `/admin/users` or `/admin/settings` → redirect `/admin`)
  - `src/lib/stores/auth.store.test.ts` — Property 4 — `fc.constantFrom('admin','editor','viewer')` → store `role` equals claim value after processing a mock ID token result
  - `src/lib/repositories/players.repository.test.ts` — Property 7 (filter predicate holds), Property 8 (search substring holds case-insensitively), Property 9 (page length ≤ 25), Property 13 (thrown error is `RepositoryError` with correct `operation`)
  - `src/lib/repositories/fixtures.repository.test.ts` — Property 7 (filtered results only contain matching statuses), Property 9 (page length ≤ 20)
  - `tests/tournament-form.test.ts` — Property 14 — `fc.date()` + `fc.date()` where `end < start` → form shows inline error and does not invoke the repository
  - _Requirements: Design Properties 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14_

- [x] 35. Integration Tests (Firebase Emulator)
  - Create `tests/integration/firestore-rules.test.ts` using `@firebase/rules-unit-testing`: admin can write `users`; editor/viewer cannot write `users`; unauthenticated cannot read `members`; editor can write `players`; viewer cannot write `players`
  - Create `tests/integration/storage-rules.test.ts`: admin can delete Storage objects; editor cannot delete; upload with `text/plain` denied (invalid MIME); upload over 10 MB denied; editor cannot read `assets/**`
  - Document how to start the Firebase Emulator Suite before running integration tests in `CONTRIBUTING.md` (`firebase emulators:start --only auth,firestore,storage`)
  - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 16.3, 16.4, 16.5, 16.6_

- [x] 36. Responsive Design Verification
  - Verify all data tables use horizontal scroll on viewports < 768px; primary columns (name/score/status) remain visible without truncation at 375px
  - Verify all interactive elements (buttons, links, form controls) have a minimum tap target size of 44×44px
  - Verify the match-day workflow (Fixtures list → completed fixture → Results form with penalty fields → save) is completable at 375px width without horizontal form scrolling
  - Verify drag-and-drop on gallery upload works on desktop and the `<input type="file" multiple>` fallback is always visible and functional on all viewports
  - _Requirements: 4.3_

- [x] 37. Deployment Configuration and Final Review
  - Confirm `netlify.toml` (build command, publish directory, catch-all redirect), `.env.example` (all six `PUBLIC_FIREBASE_*` plus `PUBLIC_FIREBASE_USE_EMULATOR`), `static/robots.txt` (disallow all crawlers), the `noindex,nofollow` meta tag in `src/app.html`, and `.gitignore` (`.env` and `.env.*` except `.env.example`)
  - Run `npm run build` — confirm zero TypeScript errors and a successful production build
  - Run `npm run test` — confirm all unit and property-based tests pass
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1],
      "description": "Project scaffolding — no dependencies"
    },
    {
      "wave": 2,
      "tasks": [2, 3, 6, 32],
      "description": "Firebase client, TypeScript types, utilities, and Firestore indexes (depend on scaffolding)"
    },
    {
      "wave": 3,
      "tasks": [4, 7, 17, 31],
      "description": "Auth/Toast stores, RepositoryError, core UI components, and security rules"
    },
    {
      "wave": 4,
      "tasks": [5, 8, 9, 11, 12, 13, 14, 15, 16, 18],
      "description": "Route protection, independent repositories, and layout components"
    },
    {
      "wave": 5,
      "tasks": [10, 19],
      "description": "Results repository (depends on fixtures) and root/admin layouts"
    },
    {
      "wave": 6,
      "tasks": [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      "description": "Login and all page implementations (depend on repositories, UI, and layouts)"
    },
    {
      "wave": 7,
      "tasks": [33, 34, 35, 36],
      "description": "Unit, property-based, integration, and responsive verification tests"
    },
    {
      "wave": 8,
      "tasks": [37],
      "description": "Deployment configuration and final review"
    }
  ]
}
```

## Notes

- Tasks 8–16 (repositories) are independent of one another and may be implemented in parallel once Task 7 (RepositoryError) is done. Task 10 (Results) depends on Task 9 (Fixtures) because `createResult` updates the linked fixture.
- Tasks 22–30 (page implementations) each depend on their corresponding repository (Tasks 8–16), the core UI components (Task 17), and the layout shell (Tasks 18–19).
- Property-based tests use fast-check with a minimum of 100 iterations per property and are tagged `Feature: kot-fc-admin-portal, Property N: <title>` per the design's testing strategy.
- Integration tests (Task 35) require the Firebase Emulator Suite running locally.
- The public website (`kotfc.co.za`) is not modified by any task in this plan.
- Requirement 18 (Responsive Design) acceptance criteria beyond 4.3 are verified in Task 36; adjust the requirement references if Requirement 18 numbering is finalised differently in requirements.md.
