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
  photoBase64: string | null;         // Inline image data URL for Firestore storage
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
  featuredImageBase64: string | null; // Inline image data URL for Firestore storage
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
