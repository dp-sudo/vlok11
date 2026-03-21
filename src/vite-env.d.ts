/// <reference types="vite/client" />

// Vite plugin type declarations for modules without bundled types
declare module 'vite-plugin-compression' {
  import type { Plugin } from 'vite';

  interface CompressionOptions {
    algorithm?: 'gzip' | 'brotliCompress' | 'deflate' | 'decompress';
    ext?: string;
    threshold?: number;
    deleteOriginalAssets?: boolean;
  }
  function compression(options?: CompressionOptions): Plugin;
  export default compression;
}

declare module 'rollup-plugin-visualizer' {
  import type { Plugin } from 'rollup';

  interface VisualizerOptions {
    filename?: string;
    open?: boolean;
    gzipSize?: boolean;
    brotliSize?: boolean;
    template?: string;
  }
  export function visualizer(options?: VisualizerOptions): Plugin;
}

declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}
