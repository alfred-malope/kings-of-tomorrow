# Requirements Document

## Introduction

This document specifies the requirements for the Kings Of Tomorrow FC (K.O.T FC) Admin Portal — a separate SvelteKit application deployed at admin.kotfc.co.za. The portal enables authorised K.O.T FC administrators and editors to manage all content consumed by the public website (kotfc.co.za), which is a Svelte + Vite + TypeScript SPA. The admin portal uses Firebase Authentication, Cloud Firestore, and Firebase Storage as its backend. It is deployed on Netlify using the SvelteKit Netlify adapter. The public website is not modified as part of this feature.

---

## Glossary

- **Admin_Portal**: The SvelteKit application deployed at admin.kotfc.co.za.
- **Public_Website**: The existing Svelte + Vite + TypeScript SPA at kotfc.co.za.
- **Auth_Service**: Firebase Authentication, responsible for verifying user identity via email/password.
- **Database**: Cloud Firestore, the NoSQL document database used to store all K.O.T FC data.
- **Storage**: Firebase Storage, used for hosting uploaded images and media files.
- **Security_Rules**: Firebase Security Rules (Firestore and Storage) that enforce access control server-side.
- **Repository**: A TypeScript module that encapsulates all Firestore queries for a specific collection, keeping database logic out of Svelte components.
- **Admin**: A user with the `admin` custom claim — has full CRUD access to all collections including Users and Settings.
- **Editor**: A user with the `editor` custom claim — has CRUD access to Players, Fixtures, Results, News, Gallery, Tournaments, and Members; no access to Users or Settings.
- **Viewer**: A user with the `viewer` custom claim — has read-only access to Dashboard, Players, Fixtures, Results, News, Gallery, and Tournaments.
- **Custom_Claim**: A Firebase Authentication JWT claim (`{"role": "admin|editor|viewer"}`) set server-side and used by Security_Rules for authorisation.
- **Route_Guard**: A SvelteKit layout or hook that checks authentication state and role before rendering a protected route.
- **serverTimestamp**: The Firestore `serverTimestamp()` function used to record the server time for `createdAt`, `updatedAt`, and `publishedAt` fields.
- **Slug**: A URL-safe string identifier derived from a title, used for news articles and gallery albums.
- **Toast**: A brief, non-blocking notification message displayed to the user after an action.
- **Skeleton_Loader**: A placeholder UI element displayed while data is being fetched.
- **Penalty_Shootout**: A tie-breaking method in which penalty goals are recorded separately from normal match goals.
- **TBC**: To Be Confirmed — a fixture status indicating the date or time has not yet been finalised.
- **Firebase_Emulator**: The Firebase Local Emulator Suite used to run Auth, Firestore, and Storage locally during development.

---

## Requirements

### Requirement 1: Project Foundation and SvelteKit Setup

**User Story:** As a developer, I want a correctly configured SvelteKit + TypeScript + Tailwind CSS project with the Netlify adapter, so that the Admin_Portal can be built, tested locally, and deployed to Netlify.

#### Acceptance Criteria

1. THE Admin_Portal SHALL be a SvelteKit application using TypeScript strict mode, Tailwind CSS, and Svelte 5 runes (`$state`, `$derived`, `$effect`).
2. THE Admin_Portal SHALL use the `@sveltejs/adapter-netlify` adapter and include a `netlify.toml` configuration file for deployment.
3. THE Admin_Portal SHALL include a `.env.example` file listing all required `PUBLIC_FIREBASE_*` environment variables (`PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_AUTH_DOMAIN`, `PUBLIC_FIREBASE_PROJECT_ID`, `PUBLIC_FIREBASE_STORAGE_BUCKET`, `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `PUBLIC_FIREBASE_APP_ID`).
4. THE Admin_Portal SHALL include `robots.txt` and meta tags that prevent all admin routes from being indexed by search engines.
5. THE Admin_Portal SHALL support the Firebase_Emulator Suite for Auth, Firestore, and Storage when the `PUBLIC_FIREBASE_USE_EMULATOR=true` environment variable is set.
6. THE Admin_Portal SHALL NOT include a `.env` file in the repository; the `.gitignore` SHALL exclude `.env` files.
7. THE Admin_Portal SHALL configure Firestore with the following composite indexes: `news(status + publishedAt)`, `fixtures(status + date)`, `players(status + position)`, `gallery(visibility + createdAt)`, `members(status + expiryDate)`.

---

### Requirement 2: Authentication

**User Story:** As an authorised K.O.T FC administrator or editor, I want to log in with my email and password, so that I can access the Admin_Portal securely.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a `/login` route that renders a login form accepting an email address and a password.
2. WHEN a user submits valid credentials, THE Auth_Service SHALL authenticate the user and THE Admin_Portal SHALL redirect the user to `/admin`.
3. IF a user submits invalid credentials, THEN THE Admin_Portal SHALL display an inline error message describing the failure (e.g., "Invalid email or password") and SHALL keep the user on the `/login` page without redirecting.
4. WHILE a user is not authenticated, THE Route_Guard SHALL redirect all requests to `/admin/*` routes to `/login`.
5. WHILE a user is authenticated, THE Route_Guard SHALL redirect requests to `/login` to `/admin`.
6. WHEN a user clicks the logout button, THE Auth_Service SHALL sign out the user and THE Admin_Portal SHALL redirect the user to `/login`.
7. THE Admin_Portal SHALL persist the authentication session across page refreshes using Firebase Authentication's built-in session persistence.
8. IF the Auth_Service returns an error during login, THEN THE Admin_Portal SHALL display a user-readable error message and SHALL NOT expose raw Firebase error codes to the user.

---

### Requirement 3: Role-Based Access Control

**User Story:** As a K.O.T FC administrator, I want roles enforced at both the UI and database level, so that users can only access and modify data their role permits.

#### Acceptance Criteria

1. THE Admin_Portal SHALL read the user's Custom_Claim (`role`) from the Firebase Authentication ID token after login and store it in a reactive auth store.
2. THE Route_Guard SHALL restrict `/admin/users` and `/admin/settings` routes to users with the `admin` role; users with `editor` or `viewer` roles SHALL be redirected to `/admin` and SHALL NOT be shown any read-only version of user management or settings interfaces.
3. THE Route_Guard SHALL restrict write operations (create, edit, delete) on all non-user-management routes to users with the `admin` or `editor` role; users with the `viewer` role SHALL see read-only views of content such as Players, Fixtures, Results, News, Gallery, and Tournaments.
4. THE Security_Rules SHALL enforce that only authenticated users with the `admin` Custom_Claim can write to the `users` and `settings` Firestore collections.
5. THE Security_Rules SHALL enforce that authenticated users with the `admin` or `editor` Custom_Claim can write to the `players`, `fixtures`, `results`, `news`, `gallery`, `tournaments`, and `members` Firestore collections.
6. THE Security_Rules SHALL enforce that the `members` Firestore collection has no public (unauthenticated) read access; only authenticated users with `admin` or `editor` Custom_Claims can read it.
7. THE Security_Rules SHALL enforce that authenticated users with any valid Custom_Claim (`admin`, `editor`, `viewer`) can read all collections except `members` and `users`.
8. THE Security_Rules SHALL enforce that the `users` Firestore collection has no public (unauthenticated) read access; only authenticated users with the `admin` Custom_Claim can read or write to the `users` collection.
9. IF a user attempts an unauthorised action, THEN THE Admin_Portal SHALL display an access-denied message and SHALL NOT expose internal error details.

---

### Requirement 4: Application Layout and Navigation

**User Story:** As an authenticated user, I want a consistent and responsive layout with sidebar navigation, so that I can navigate between sections of the Admin_Portal efficiently on any device.

#### Acceptance Criteria

1. THE Admin_Portal SHALL render a persistent left sidebar navigation for all `/admin/*` routes, containing links to: Dashboard, Players, Fixtures, Results, News, Gallery, Tournaments, Members, Settings, and User Management.
2. THE Admin_Portal SHALL render a top header bar on all `/admin/*` routes displaying the current page title, the authenticated user's display name, and a logout button.
3. WHILE the viewport width is below 768px, THE Admin_Portal SHALL collapse the sidebar into a slide-out drawer toggled by a hamburger menu button in the top header.
4. THE Admin_Portal SHALL display K.O.T FC branding (logo and club name) in the sidebar header.
5. THE Route_Guard SHALL hide the "Settings" sidebar link for users with `editor` or `viewer` roles, and SHALL hide the "User Management" sidebar link independently for users with `editor` or `viewer` roles; the visibility of each link is evaluated independently.
6. THE Admin_Portal SHALL highlight the active navigation link corresponding to the current route.
7. THE Admin_Portal SHALL display Toast notifications in a fixed position (top-right corner) for user feedback on actions such as save, delete, and error events.

---

### Requirement 5: Dashboard

**User Story:** As an authenticated user, I want a dashboard overview of club statistics and recent activity, so that I can quickly assess the current state of the club's data.

#### Acceptance Criteria

1. THE Admin_Portal Dashboard SHALL display the following statistics cards: total active players, upcoming fixtures count, total matches played, wins count, draws count, losses count, published news articles count, and total gallery albums count.
2. THE Admin_Portal Dashboard SHALL display a list of the next 5 upcoming fixtures ordered by date ascending.
3. THE Admin_Portal Dashboard SHALL display a list of the 5 most recent results ordered by date descending.
4. THE Admin_Portal Dashboard SHALL display a list of the 3 most recently published news articles.
5. THE Admin_Portal Dashboard SHALL display quick-action buttons for: "Add Player", "Add Fixture", "Add News", and "Upload Photos".
6. WHILE Dashboard data is loading, THE Admin_Portal SHALL display Skeleton_Loader placeholders in place of statistics cards and lists; any previously loaded or cached data SHALL remain visible during the loading state.
7. IF a Dashboard data fetch fails, THEN THE Admin_Portal SHALL display an inline error state with a retry button.

---

### Requirement 6: Player Management

**User Story:** As an Admin or Editor, I want to create, view, edit, and delete player profiles with photos, so that the squad information on the public website is always up to date.

#### Acceptance Criteria

1. THE Admin_Portal Players page SHALL display a data table listing all players with columns: photo thumbnail, display name, squad number, position, and status.
2. THE Admin_Portal Players page SHALL support filtering the player list by position (Goalkeeper, Defender, Midfielder, Forward) and by status (active, inactive, injured, suspended).
3. THE Admin_Portal Players page SHALL support text search across player `firstName`, `lastName`, and `displayName` fields.
4. WHEN an Admin or Editor clicks "Add Player", THE Admin_Portal SHALL display a form accepting: firstName, lastName, displayName, squad number, position, status, bio, joinedDate, and a photo upload field.
5. WHEN an Admin or Editor submits a valid player creation form, THE Repository SHALL write the player document to the `players` Firestore collection with `createdAt` and `updatedAt` set using serverTimestamp.
6. WHEN an Admin or Editor uploads a player photo, THE Storage SHALL store the image under `players/{playerId}/photo` and THE Repository SHALL save the resulting `photoUrl` on the player document.
7. WHEN an Admin or Editor submits a valid player edit form, THE Repository SHALL update only the changed fields on the player document and set `updatedAt` using serverTimestamp.
8. WHEN an Admin or Editor clicks "Delete Player", THE Admin_Portal SHALL display a confirmation dialog before executing the deletion.
9. IF a player deletion is confirmed, THEN THE Repository SHALL delete the player document from Firestore AND delete the associated photo from Storage if one exists; if the photo deletion fails after the document has been deleted, THE Admin_Portal SHALL display an error Toast but SHALL NOT attempt to restore the deleted document.
10. THE Repository SHALL paginate player queries with a maximum of 25 players per page.
11. THE Admin_Portal Players page SHALL display an empty state message when no players match the active filters.
12. THE Storage SHALL reject player photo uploads that are not `image/jpeg`, `image/png`, or `image/webp`, or that exceed 10MB.

---

### Requirement 7: Fixture Management

**User Story:** As an Admin or Editor, I want to create, edit, and delete fixtures across multiple status categories, so that the match schedule on the public website reflects accurate information.

#### Acceptance Criteria

1. THE Admin_Portal Fixtures page SHALL display fixtures in tabbed views: Upcoming, Completed, TBC, Cancelled, and All.
2. WHEN a tab is selected, THE Repository SHALL query fixtures filtered by the corresponding `status` field and ordered by `date` ascending.
3. WHEN an Admin or Editor clicks "Add Fixture", THE Admin_Portal SHALL display a form accepting: competition, homeTeam, awayTeam, date, time, venue, status (scheduled, completed, postponed, cancelled, tbc), visibility, and notes.
4. WHEN an Admin or Editor submits a valid fixture creation form, THE Repository SHALL write the fixture document to the `fixtures` Firestore collection with `createdAt` and `updatedAt` set using serverTimestamp.
5. WHEN an Admin or Editor submits a valid fixture edit form, THE Repository SHALL update the fixture document and set `updatedAt` using serverTimestamp.
6. WHEN an Admin or Editor clicks "Delete Fixture", THE Admin_Portal SHALL display a confirmation dialog before executing the deletion.
7. THE Admin_Portal Fixtures page SHALL display a "Record Result" button only on fixtures with `status` of `completed`, which navigates to the result creation form pre-populated with fixture data.
8. THE Repository SHALL paginate fixture queries with a maximum of 20 fixtures per page per tab.
9. THE Admin_Portal Fixtures page SHALL display an empty state message when no fixtures exist for the selected tab.

---

### Requirement 8: Results Management

**User Story:** As an Admin or Editor, I want to record match results including penalty shootout scores, so that accurate match outcomes are displayed on the public website.

#### Acceptance Criteria

1. THE Admin_Portal Results page SHALL display a list of results with columns: homeTeam vs awayTeam, score, result label (Win/Draw/Loss from K.O.T FC's perspective), and match date.
2. WHEN an Admin or Editor creates a result, THE Admin_Portal SHALL display a form accepting: fixtureId (linked fixture), homeTeam, awayTeam, homeScore, awayScore, visibility, and matchReport.
3. THE Admin_Portal result form SHALL include optional Penalty_Shootout fields: homePenaltyScore and awayPenaltyScore, which are only recorded when a penalty shootout occurred.
4. WHEN an Admin or Editor submits a valid result creation form, THE Repository SHALL write the result document to the `results` Firestore collection with `createdAt` and `updatedAt` set using serverTimestamp, and SHALL update the linked fixture's `status` to `completed`.
5. WHEN an Admin or Editor submits a valid result edit form, THE Repository SHALL update only the changed fields on the result document and set `updatedAt` using serverTimestamp.
6. WHEN an Admin or Editor clicks "Delete Result", THE Admin_Portal SHALL display a confirmation dialog before executing the deletion.
7. THE Repository SHALL paginate result queries with a maximum of 20 results per page, ordered by `createdAt` descending.

---

### Requirement 9: News Management

**User Story:** As an Admin or Editor, I want to create, edit, publish, and archive news articles with featured images, so that club news is managed from one place and surfaced on the public website.

#### Acceptance Criteria

1. THE Admin_Portal News page SHALL display a data table of articles with columns: title, category, status, author, and published date.
2. THE Admin_Portal News page SHALL support filtering articles by status (draft, published, archived) and by category (Match Report, Team News, Training, Club News, Tournament Announcement).
3. WHEN an Admin or Editor clicks "Add Article", THE Admin_Portal SHALL display an editor form accepting: title, Slug (auto-generated from title but editable), excerpt, content (rich text or markdown), category, featuredImageUrl (via file upload), status, and publishedAt.
4. THE Admin_Portal news article Slug field SHALL be auto-generated from the title in URL-safe format and SHALL remain editable by the user.
5. WHEN an Admin or Editor uploads a featured image, THE Storage SHALL store the image under `news/{newsId}/featured` and THE Repository SHALL save the resulting `featuredImageUrl` on the article document; if no featured image is uploaded, THE Repository SHALL store the article with `featuredImageUrl` as `null` or an empty string.
6. WHEN an Admin or Editor submits a valid article creation form, THE Repository SHALL write the article document to the `news` Firestore collection with `createdAt` set using serverTimestamp, `authorId` set to the current user's UID, and `updatedAt` set using serverTimestamp.
7. WHEN an Admin or Editor changes an article's status to `published` and no `publishedAt` date is set, THE Repository SHALL set `publishedAt` to serverTimestamp.
8. THE Admin_Portal News page SHALL provide inline actions to: Edit, Publish, Unpublish, and Archive an article without navigating away from the list.
9. THE Repository SHALL paginate news queries with a maximum of 20 articles per page, ordered by `createdAt` descending.

---

### Requirement 10: Gallery Management

**User Story:** As an Admin or Editor, I want to create photo albums and upload multiple images with captions, so that match-day and club photography is organised and published on the public website.

#### Acceptance Criteria

1. THE Admin_Portal Gallery page SHALL display albums as a card grid, each card showing the cover image, album name, category, and photo count.
2. WHEN an Admin or Editor clicks "Create Album", THE Admin_Portal SHALL display a form accepting: name, Slug (auto-generated), description, category, visibility, and a cover image upload field.
3. WHEN an Admin or Editor opens an album, THE Admin_Portal SHALL display a photo grid of all photos in that album with their captions.
4. THE Admin_Portal album photo upload interface SHALL support selecting multiple image files simultaneously and SHALL provide drag-and-drop upload functionality.
5. WHEN images are uploaded to an album, THE Storage SHALL store each image under `gallery/{albumId}/photos/{photoId}` and THE Repository SHALL write a photo document to `gallery/{albumId}/photos/{photoId}` with `fileName`, `storagePath`, `downloadUrl`, `caption`, `createdAt` set using serverTimestamp, and `uploadedBy` set to the current user's UID.
6. THE Admin_Portal SHALL allow an Admin or Editor to set the caption on each individual photo after upload.
7. THE Admin_Portal SHALL allow an Admin or Editor to designate any photo in an album as the cover image, which updates the album's `coverImageUrl` field.
8. WHEN an Admin or Editor clicks "Delete Photo", THE Admin_Portal SHALL display a confirmation dialog, and if confirmed, THE Storage SHALL delete the image file and THE Repository SHALL delete the photo document.
9. THE Admin_Portal SHALL allow an Admin or Editor to publish or unpublish an album by toggling the `visibility` field between `public` and `private`.
10. THE Storage SHALL reject gallery photo uploads that are not `image/jpeg`, `image/png`, or `image/webp`, or that exceed 10MB.
11. THE Repository SHALL paginate album photo queries with a maximum of 50 photos per page.

---

### Requirement 11: Tournament Management

**User Story:** As an Admin or Editor, I want to create and manage tournaments and associate them with fixtures and results, so that tournament participation is clearly organised.

#### Acceptance Criteria

1. THE Admin_Portal Tournaments page SHALL display a list of all tournaments with: name, startDate, endDate, venue, status, and visibility.
2. WHEN an Admin or Editor clicks "Add Tournament", THE Admin_Portal SHALL display a form accepting: name, description, startDate, endDate, venue, status, and visibility.
3. WHEN an Admin or Editor submits a valid tournament creation form, THE Repository SHALL write the tournament document to the `tournaments` Firestore collection with `createdAt` and `updatedAt` set using serverTimestamp; invalid tournament forms SHALL NOT be submitted to the Repository.
4. WHEN an Admin or Editor submits a valid tournament edit form, THE Repository SHALL update the tournament document and set `updatedAt` using serverTimestamp; invalid tournament edit forms SHALL be rejected with inline validation errors and SHALL NOT trigger a Repository update.
5. WHEN an Admin or Editor clicks "Delete Tournament", THE Admin_Portal SHALL display a confirmation dialog before executing the deletion.
6. THE Admin_Portal fixture form SHALL include an optional tournament association field that references a `tournamentId`.

---

### Requirement 12: Members Management

**User Story:** As an Admin or Editor, I want to manage club membership records privately, so that member data is securely maintained and never exposed to the public website.

#### Acceptance Criteria

1. THE Admin_Portal Members page SHALL display a data table of members with columns: membership number, full name, email, membership type, status, and expiry date.
2. THE Admin_Portal Members page SHALL support filtering members by status and by membership type.
3. WHEN an Admin or Editor clicks "Add Member", THE Admin_Portal SHALL display a form accepting: firstName, lastName, membershipNumber, email, phone, membershipType, status, joinedDate, and expiryDate.
4. WHEN an Admin or Editor submits a valid member creation form, THE Repository SHALL write the member document to the `members` Firestore collection with `createdAt` and `updatedAt` set using serverTimestamp.
5. WHEN an Admin or Editor submits a valid member edit form, THE Repository SHALL update the member document and set `updatedAt` using serverTimestamp.
6. WHEN an Admin or Editor clicks "Delete Member", THE Admin_Portal SHALL display a confirmation dialog before executing the deletion.
7. THE Security_Rules SHALL enforce that the `members` collection has no public (unauthenticated) read or write access; authenticated users without an `admin` or `editor` Custom_Claim (including `viewer` role users) SHALL also be denied read and write access to the `members` collection.
8. THE Repository SHALL paginate member queries with a maximum of 25 members per page.
9. THE Admin_Portal Members page SHALL display an empty state message when no members exist or no members match the active filters.

---

### Requirement 13: Settings Management

**User Story:** As an Admin, I want to manage application-level configuration from a dedicated settings page, so that site-wide settings can be updated without a code deployment.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a `/admin/settings` route accessible only to users with the `admin` role; access restriction applies when users navigate to or are on the `/admin/settings` route.
2. THE Admin_Portal Settings page SHALL allow an Admin to read and update documents in the `settings` Firestore collection.
3. WHEN an Admin submits valid settings changes, THE Repository SHALL update the settings document and set `updatedAt` using serverTimestamp.
4. IF a non-admin user attempts to access `/admin/settings`, THEN THE Route_Guard SHALL redirect the user to `/admin`.

---

### Requirement 14: User Management

**User Story:** As an Admin, I want to create, view, edit, and deactivate Admin_Portal user accounts and assign roles, so that access to the Admin_Portal is controlled and auditable.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a `/admin/users` route accessible only to users with the `admin` role.
2. THE Admin_Portal Users page SHALL display a table of all user records from the `users` Firestore collection with columns: display name, email, role, active status, and created date.
3. WHEN an Admin clicks "Add User", THE Admin_Portal SHALL display a form accepting: email, displayName, role (admin, editor, viewer), and active status.
4. WHEN a new user record is created, THE Repository SHALL write the user document to `users/{uid}` with `createdAt` and `updatedAt` set using serverTimestamp.
5. WHEN an Admin updates a user's role or active status, THE Repository SHALL update the user document and set `updatedAt` using serverTimestamp.
6. WHEN an Admin clicks "Delete User", THE Admin_Portal SHALL display a confirmation dialog before executing the deletion.
7. THE Security_Rules SHALL enforce that only users with the `admin` Custom_Claim can read or write to the `users` Firestore collection; access is granted to any user possessing the `admin` Custom_Claim regardless of other account attributes.
8. IF a non-admin user attempts to access `/admin/users`, THEN THE Route_Guard SHALL redirect the user to `/admin`.

---

### Requirement 15: Repository Pattern and Data Architecture

**User Story:** As a developer, I want all Firestore and Storage interactions encapsulated in Repository modules, so that components remain clean and data logic is testable in isolation.

#### Acceptance Criteria

1. THE Admin_Portal SHALL implement a separate Repository module for each Firestore collection: `PlayersRepository`, `FixturesRepository`, `ResultsRepository`, `NewsRepository`, `GalleryRepository`, `TournamentsRepository`, `MembersRepository`, `SettingsRepository`, and `UsersRepository`.
2. THE Admin_Portal Svelte components SHALL NOT import Firestore SDK functions directly; all database access SHALL go through the corresponding Repository.
3. THE Admin_Portal SHALL implement a typed TypeScript interface for each Firestore document (e.g., `Player`, `Fixture`, `Result`, `NewsArticle`, `GalleryAlbum`, `GalleryPhoto`, `Tournament`, `Member`, `AppSettings`, `UserRecord`).
4. WHEN any Repository write operation fails, THE Repository SHALL throw a typed error that the calling component can catch and surface via a Toast notification; if the Repository fails to throw the error, some write failures may not surface to the user.
5. THE Admin_Portal SHALL use `serverTimestamp()` for all `createdAt`, `updatedAt`, and `publishedAt` fields; client-side `Date.now()` SHALL NOT be used for these fields.

---

### Requirement 16: Image Upload and Storage Rules

**User Story:** As an Admin or Editor, I want image uploads to be validated and storage access to be correctly restricted, so that only permitted file types are stored and assets are protected appropriately.

#### Acceptance Criteria

1. THE Admin_Portal upload components SHALL validate that selected files are one of `image/jpeg`, `image/png`, or `image/webp` and are no larger than 10MB before initiating an upload to Storage.
2. IF a selected file fails client-side validation, THEN THE Admin_Portal SHALL display an inline error message specifying the rejection reason (invalid type or size exceeded) without uploading the file.
3. THE Security_Rules for Storage SHALL enforce that public read access is granted for paths `players/**`, `news/**`, and `gallery/**`.
4. THE Security_Rules for Storage SHALL enforce that delete operations on any path require the `admin` Custom_Claim.
5. THE Security_Rules for Storage SHALL enforce that uploads to `players/**`, `news/**`, and `gallery/**` require `admin` or `editor` Custom_Claims, a valid content type (`image/jpeg`, `image/png`, or `image/webp`), and a file size no greater than 10MB.
6. THE Security_Rules for Storage SHALL enforce that paths under `assets/**` (club branding assets) are restricted to `admin` Custom_Claim for both read and write.

---

### Requirement 17: UI States and Interaction Patterns

**User Story:** As a user, I want consistent loading, empty, and error states throughout the Admin_Portal, so that I always understand the current status of data and actions.

#### Acceptance Criteria

1. WHILE any data fetch is in progress, THE Admin_Portal SHALL display Skeleton_Loader elements appropriate to the expected content layout.
2. WHEN a data fetch completes with zero results, THE Admin_Portal SHALL display an empty state illustration and message, and where applicable a call-to-action button (e.g., "Add your first player").
3. IF a data fetch fails, THEN THE Admin_Portal SHALL display an error state with a human-readable message and a retry button.
4. WHEN a destructive action (delete, unpublish, archive) is initiated, THE Admin_Portal SHALL display a modal confirmation dialog describing the action before executing it; if the confirmation modal cannot be displayed due to a technical error, THE Admin_Portal SHALL block the action entirely.
5. WHEN a create, update, or delete operation completes successfully, THE Admin_Portal SHALL display a success Toast notification.
6. IF a create, update, or delete operation fails, THEN THE Admin_Portal SHALL display an error Toast notification with a brief description of the failure.
7. THE Admin_Portal forms SHALL display inline validation error messages adjacent to invalid fields before allowing submission.
8. WHILE a form submission is in progress, THE Admin_Portal SHALL disable the submit button and display a loading indicator to prevent duplicate submissions.

---

### Requirement 18: Responsive Design and Mobile Workflow

**User Story:** As an Admin or Editor at a match, I want the Admin_Portal to work end-to-end on a mobile phone, so that I can record results and update fixtures from the touchline.

#### Acceptance Criteria

1. THE Admin_Portal SHALL be fully functional on viewport widths from 320px to 2560px.
2. THE Admin_Portal data tables SHALL adapt to smaller viewports by either stacking columns or using horizontal scroll, ensuring primary data (name, score, status) remains visible without truncation on screens 375px wide.
3. THE Admin_Portal match-day workflow — navigating to Fixtures, opening a completed fixture, recording a result (including Penalty_Shootout scores), and saving — SHALL be completable entirely on a 375px wide mobile viewport without horizontal scrolling of the form.
4. THE Admin_Portal SHALL use touch-friendly tap targets with a minimum size of 44×44px for all interactive elements on mobile viewports.
5. WHERE the device supports drag-and-drop, THE Admin_Portal gallery upload interface SHALL support drag-and-drop; on devices without drag-and-drop support (including touch-only devices), THE Admin_Portal SHALL provide a file picker input as the upload mechanism; THE Admin_Portal SHALL require that file picker inputs are always available as a fallback regardless of device capabilities.
