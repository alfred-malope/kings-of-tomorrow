import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateUpload,
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES
} from '$lib/utils/validation';

/**
 * Builds a File with an arbitrary MIME type and size. `File.size` is derived
 * from the blob contents and cannot exceed jsdom's memory, so the reported size
 * is overridden via `Object.defineProperty` to model arbitrarily large files
 * without actually allocating them.
 */
function makeFile(type: string, size: number): File {
  const file = new File([''], 'upload.bin', { type });
  Object.defineProperty(file, 'size', { value: size, configurable: true });
  return file;
}

describe('validateUpload — properties', () => {
  // Feature: kot-fc-admin-portal, Property 10: Client-side upload validation rejects invalid files
  // **Validates: Requirements 16.1, 16.2**
  it('rejects when MIME is not allowed or size exceeds the limit, and accepts otherwise', () => {
    // A mix of allowed and arbitrary MIME strings so both branches are exercised.
    const mimeArb = fc.oneof(
      fc.constantFrom(...ALLOWED_IMAGE_TYPES),
      fc.string(),
      fc.constantFrom('text/plain', 'application/pdf', 'image/gif', 'image/svg+xml')
    );
    const sizeArb = fc.integer({ min: 0, max: 20_000_000 });

    fc.assert(
      fc.property(mimeArb, sizeArb, (mime, size) => {
        const file = makeFile(mime, size);
        const result = validateUpload(file);

        const typeAllowed = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mime);
        const sizeOk = size <= MAX_UPLOAD_BYTES;
        const shouldBeValid = typeAllowed && sizeOk;

        expect(result.valid).toBe(shouldBeValid);
        if (!result.valid) {
          // A rejection always carries a human-readable reason.
          expect(result.reason.length).toBeGreaterThan(0);
        }
      })
    );
  });
});
