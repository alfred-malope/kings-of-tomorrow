/**
 * A typed error thrown by every repository when a Firebase (Firestore or
 * Storage) operation fails.
 *
 * Repositories wrap raw Firebase errors in a `RepositoryError` so that calling
 * components can catch a single, predictable error type and surface a message
 * via the toast store. Raw Firebase error codes (e.g. `auth/wrong-password`)
 * are never shown to users directly — they are mapped to user-readable
 * messages in `src/lib/utils/error-messages.ts`.
 *
 * @see design.md — "Error Handling / Repository Error Contract"
 */
export class RepositoryError extends Error {
  /**
   * @param message   A human-readable description of what failed.
   * @param cause     The original error thrown by the Firebase SDK.
   * @param operation The repository operation that was being performed.
   */
  constructor(
    message: string,
    public readonly cause: unknown,
    public readonly operation: 'read' | 'create' | 'update' | 'delete'
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
