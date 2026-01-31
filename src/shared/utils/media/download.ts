export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  try {
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');

  a.href = dataUrl;
  a.download = filename;
  a.click();
}
export function downloadText(text: string, filename: string, mimeType = 'text/plain'): void {
  downloadBlob(new Blob([text], { type: mimeType }), filename);
}
