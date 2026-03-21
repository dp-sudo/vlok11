import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    base: '/', // 网页应用使用绝对路径
    server: {
      port: 3000,
      host: '0.0.0.0',
      // Enable gzip compression headers
      headers: {
        'X-Content-Type-Options': 'nosniff',
      },
    },
    plugins: [
      react(),
      glsl({
        include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt'],
        manifest: {
          name: 'IMMERSA 3D - AI 3D Scene Reconstruction',
          short_name: 'IMMERSA 3D',
          description: 'AI驱动的2D到3D场景重建',
          theme_color: '#0b0b10',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          categories: ['graphics', 'utilities', 'video'],
          lang: 'zh-CN',
          dir: 'ltr',
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
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
      // Enable Vite's built-in gzip/brotli compression
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000, // 提升警告阈值，Three.js和TF.js较大是正常的
      rollupOptions: {
        output: {
          manualChunks: (id): string | undefined => {
            // 生产环境优化：动态导入 TensorFlow.js 和 GenAI
            if (isProd) {
              // AI/ML Features - TensorFlow.js 核心
              if (id.includes('@tensorflow/tfjs-core') || id.includes('@tensorflow/tfjs')) {
                return 'tfjs-core';
              }
              // TensorFlow.js 转换器
              if (id.includes('@tensorflow/tfjs-converter')) {
                return 'tfjs-converter';
              }
              // TensorFlow.js WebGL 后端
              if (id.includes('@tensorflow/tfjs-backend-webgl') || id.includes('@tensorflow/tfjs-backend')) {
                return 'tfjs-backend';
              }
              // TensorFlow.js 任务库 (手势、人脸检测等)
              if (id.includes('@tensorflow-models')) {
                return 'tfjs-models';
              }
              // MediaPipe
              if (id.includes('@mediapipe')) {
                return 'mediapipe';
              }
            } else {
              // 开发环境跳过，避免循环依赖警告
              if (id.includes('@tensorflow/tfjs') || id.includes('@tensorflow-models') || id.includes('@mediapipe')) {
                return undefined;
              }
            }

            // Core React
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'react-core';
            }

            // 3D Rendering - Three.js 核心
            if (id.includes('three/examples/jsm/loaders') || id.includes('three/examples/jsm/controls')) {
              return 'three-loaders';
            }
            if (id.includes('three/examples/jsm') || id.includes('@react-three/drei')) {
              return 'three-core';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-core';
            }

            // Media Processing - HLS.js
            if (id.includes('hls.js') || id.includes('video')) {
              return 'media';
            }

            // UI Components
            if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui';
            }

            // Sentry - 只在生产环境打包
            if (isProd && id.includes('@sentry')) {
              return 'monitoring';
            }

            return undefined;
          },
          // 优化入口文件
          entryFileNames: 'assets/index-[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
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
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', '.git'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/setup.ts',
        ],
      },
    },
  };
});
