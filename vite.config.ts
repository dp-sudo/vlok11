import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    base: '/', // 网页应用使用绝对路径
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      glsl({
        include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      }),
    ],
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        three: path.resolve(__dirname, 'node_modules/three'),
      },
    },

    build: {
      target: 'es2022',
      minify: 'esbuild',
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Automatic chunking
        },
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        'zustand',
      ],
    },
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },
  };
});
