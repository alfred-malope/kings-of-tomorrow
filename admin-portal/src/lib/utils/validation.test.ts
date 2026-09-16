import { describe, it, expect } from 'vitest';
import { validateUpload, MAX_UPLOAD_BYTES } from './validation';

/**
 * Builds a File-like object with a controlled `type` and `size`. jsdom's File
 * constructor computes `size` from the provided parts, so we override `size`
 * via Object.defineProperty to test the boundary without allocating megabytes.
 */
function makeFile(type: string, size: number): File {
  const file = new File(['x'], 'upload.bin', { type });
  Object.defineProperty(file, 'size', { value: size, configurable: true });
  return file;
}

describe('validateUpload', () => {
  it('accepts a valid JPEG under 10MB', () => {
    const result = validateUpload(makeFile('image/jpeg', 1024));
    expect(result).toEqual({ valid: true });
  });

  it('accepts a valid PNG', () => {
    const result = validateUpload(makeFile('image/png', 5 * 1024 * 1024));
    expect(result).toEqual({ valid: true });
  });

  it('accepts a valid WebP', () => {
    const result = validateUpload(makeFile('image/webp', 2048));
    expect(result).toEqual({ valid: true });
  });

  it('rejects an invalid MIME type with a reason', () => {
    const result = validateUpload(makeFile('application/pdf', 1024));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/type/i);
    }
  });

  it('accepts a file exactly at the 10MB boundary', () => {
    const result = validateUpload(makeFile('image/jpeg', MAX_UPLOAD_BYTES));
    expect(result).toEqual({ valid: true });
  });

  it('rejects a file over 10MB with a reason', () => {
    const result = validateUpload(makeFile('image/png', MAX_UPLOAD_BYTES + 1));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/large|size/i);
    }
  });
});
