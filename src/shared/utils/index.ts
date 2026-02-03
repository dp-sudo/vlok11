export * from './coordinates';
export * from './math';
export * from './media';
export * from './presets';

/**
 * Format file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${units[i]}`;
}
