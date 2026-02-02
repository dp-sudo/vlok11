/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID() if available (secure context),
 * otherwise falls back to a math-based implementation.
 */
export const generateUUID = (): string => {
  // Use native crypto API if available (Node.js 14.17+, modern browsers in secure contexts)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for non-secure contexts (e.g., http://localhost on some older browsers)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });
};
