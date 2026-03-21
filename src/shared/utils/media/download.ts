function recordDownload(
  kind: 'blob' | 'data-url',
  filename: string,
  metadata?: { mimeType?: string; size?: number }
): void {
  if (typeof window === 'undefined' || window.__TEST_MODE__ !== true) {
    return;
  }

  window.__IMMERSA_LAST_DOWNLOAD__ = {
    filename,
    kind,
    ...(metadata?.mimeType ? { mimeType: metadata.mimeType } : {}),
    ...(metadata?.size !== undefined ? { size: metadata.size } : {}),
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  recordDownload('blob', filename, {
    ...(blob.type ? { mimeType: blob.type } : {}),
    size: blob.size,
  });

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
  const mimeTypeMatch = /^data:([^;]+);/.exec(dataUrl);

  recordDownload(
    'data-url',
    filename,
    mimeTypeMatch?.[1] ? { mimeType: mimeTypeMatch[1] } : undefined
  );

  const a = document.createElement('a');

  a.href = dataUrl;
  a.download = filename;
  a.click();
}
export function downloadText(text: string, filename: string, mimeType = 'text/plain'): void {
  downloadBlob(new Blob([text], { type: mimeType }), filename);
}
