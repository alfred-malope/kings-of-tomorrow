/** Allowed image MIME types for uploads. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Maximum permitted upload size in bytes (10 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Validates a file selected for upload against the allowed image MIME types and
 * the maximum size limit.
 *
 * A file is rejected when its MIME type is not one of `image/jpeg`,
 * `image/png`, or `image/webp`, OR when its size exceeds 10 MB. A file exactly
 * at the 10 MB boundary is accepted.
 *
 * @param file - The file to validate.
 * @returns `{ valid: true }` when the file passes, otherwise
 *          `{ valid: false, reason }` describing the rejection.
 */
export function validateUpload(file: File): UploadValidationResult {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      reason: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      reason: 'File too large. Maximum size is 10MB.'
    };
  }

  return { valid: true };
}
