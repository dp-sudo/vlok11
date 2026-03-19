import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { generateUUID } from './uuid';

describe('uuid', () => {
  describe('generateUUID', () => {
    it('should return a string', () => {
      const uuid = generateUUID();
      expect(typeof uuid).toBe('string');
    });

    it('should return a valid UUID format', () => {
      const uuid = generateUUID();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should return unique UUIDs on consecutive calls', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    it('should return correct version (4)', () => {
      const uuid = generateUUID();
      // The version is in position 14 (0-indexed), should be '4'
      expect(uuid.charAt(14)).toBe('4');
    });

    it('should return correct variant (8, 9, a, or b)', () => {
      const uuid = generateUUID();
      // Position 19 should be 8, 9, a, or b for UUID v4
      const validVariants = ['8', '9', 'a', 'b'];
      expect(validVariants.includes(uuid.charAt(19).toLowerCase())).toBe(true);
    });

    describe('with crypto.randomUUID', () => {
      beforeEach(() => {
        vi.spyOn(crypto, 'randomUUID').mockReturnValue('550e8400-e29b-41d4-a716-446655440000' as `${string}-${string}-${string}-${string}-${string}`);
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('should use crypto.randomUUID when available', () => {
        const uuid = generateUUID();
        expect(uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
      });
    });

    describe('without crypto.randomUUID', () => {
      beforeEach(() => {
        // Delete crypto.randomUUID to force fallback to math-based implementation
        vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
          throw new Error('Not available');
        });
        // After throwing once, remove it so typeof check returns false
        Object.defineProperty(crypto, 'randomUUID', {
          get: () => undefined,
          configurable: true,
        });
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('should fallback to math-based implementation', () => {
        const uuid = generateUUID();
        // Should still return valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuid).toMatch(uuidRegex);
      });
    });
  });
});
