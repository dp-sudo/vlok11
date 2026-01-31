import { createLogger } from '@/core/Logger';

export function constrainImageDimensions(
  width: number,
  height: number,
  maxSize: number
): {
  height: number;
  width: number;
} {
  let w = width;
  let h = height;

  if (w > h) {
    if (w > maxSize) {
      h *= maxSize / w;
      w = maxSize;
    }
  } else if (h > maxSize) {
    w *= maxSize / h;
    h = maxSize;
  }

  return { width: Math.round(w), height: Math.round(h) };
}
export async function fetchWebPageHtmlViaProxies(pageUrl: string): Promise<string> {
  const html = (await tryFetchAllOriginsHtml(pageUrl)) || (await tryFetchCorsProxyHtml(pageUrl));

  if (!html) {
    throw new Error('Failed to fetch page content via proxies.');
  }

  return html;
}
export async function getImageDimensions(url: string): Promise<ImageDimensions> {
  try {
    const img = await safeLoadImage(url);

    return {
      width: img.width,
      height: img.height,
      aspectRatio: img.width / img.height,
    };
  } catch {
    throw new Error('Failed to get image dimensions. Invalid link, not an image, or CORS blocked.');
  }
}
export function safeLoadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const validation = validateUrl(url);

    if (!validation.valid) {
      reject(new Error(validation.error));

      return;
    }
    const img = new Image();

    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}
export function toAbsoluteUrl(url: string, pageUrl: string): string {
  try {
    if (url.startsWith('//')) return `https:${url}`;
    if (!url.startsWith('http')) return new URL(url, pageUrl).href;

    return url;
  } catch {
    return url;
  }
}
export async function tryFetchAllOriginsHtml(pageUrl: string): Promise<string> {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(pageUrl)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) return '';
    const data = await response.json();

    return data.contents ?? '';
  } catch (e) {
    logger.warn('AllOrigins proxy failed', { error: String(e) });

    return '';
  }
}
export async function tryFetchCorsProxyHtml(pageUrl: string): Promise<string> {
  try {
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(pageUrl)}`);

    if (!response.ok) return '';

    return await response.text();
  } catch (e) {
    logger.warn('CorsProxy failed', { error: String(e) });

    return '';
  }
}
export function validateUrl(url: string): UrlValidationResult {
  try {
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return { valid: true };
    }
    const parsed = new URL(url);

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return { valid: false, error: `Unsupported protocol: ${parsed.protocol}` };
    }
    const hostname = parsed.hostname.toLowerCase();

    for (const blocked of BLOCKED_HOSTS) {
      if (hostname === blocked || hostname.startsWith(blocked)) {
        return { valid: false, error: 'Internal network addresses not allowed' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export interface ImageDimensions {
  aspectRatio: number;
  height: number;
  width: number;
}
export interface UrlValidationResult {
  error?: string;
  valid: boolean;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:'];
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
  'metadata.google',
  'metadata.aws',
  '169.254.169.254',
];
const logger = createLogger({ module: 'ImageLoading' });
