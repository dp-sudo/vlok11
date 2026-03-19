import { describe, expect, it } from 'vitest';

import { clamp, degToRad, generateId, lerp, radToDeg } from './common';

describe('math/common', () => {
  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should clamp value below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, 0, 10)).toBe(0);
    });

    it('should clamp value above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, 0, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(clamp(0, -10, -5)).toBe(-5);
      expect(clamp(-15, -10, -5)).toBe(-10);
      expect(clamp(-3, -10, -5)).toBe(-5);
    });
  });

  describe('lerp', () => {
    it('should return a when t is 0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
      expect(lerp(0, 100, 0)).toBe(0);
    });

    it('should return b when t is 1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
      expect(lerp(0, 100, 1)).toBe(100);
    });

    it('should return midpoint when t is 0.5', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(10, 20, 0.5)).toBe(15);
    });

    it('should interpolate correctly for any t in [0,1]', () => {
      expect(lerp(0, 100, 0.25)).toBe(25);
      expect(lerp(0, 100, 0.75)).toBe(75);
    });

    it('should extrapolate when t is outside [0,1]', () => {
      expect(lerp(0, 10, -0.5)).toBe(-5);
      expect(lerp(0, 10, 1.5)).toBe(15);
    });
  });

  describe('degToRad', () => {
    it('should convert 0 degrees to 0 radians', () => {
      expect(degToRad(0)).toBe(0);
    });

    it('should convert 180 degrees to PI radians', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
    });

    it('should convert 360 degrees to 2*PI radians', () => {
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    it('should convert 90 degrees to PI/2 radians', () => {
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    });

    it('should handle negative degrees', () => {
      expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('radToDeg', () => {
    it('should convert 0 radians to 0 degrees', () => {
      expect(radToDeg(0)).toBe(0);
    });

    it('should convert PI radians to 180 degrees', () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
    });

    it('should convert 2*PI radians to 360 degrees', () => {
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });

    it('should convert PI/2 radians to 90 degrees', () => {
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
    });

    it('should handle negative radians', () => {
      expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90);
    });
  });

  describe('generateId', () => {
    it('should return a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should return unique ids on consecutive calls', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should contain underscore separator', () => {
      const id = generateId();
      expect(id).toContain('_');
    });

    it('should have reasonable length', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(10);
    });
  });
});
