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
      chunkSizeWarningLimit: 1000, // 提升警告阈值，Three.js和TF.js较大是正常的
      rollupOptions: {
        output: {
          manualChunks: (id): string | undefined => {
            // 生产环境优化：动态导入 TensorFlow.js 和 GenAI
            if (isProd) {
              // AI/ML Features - TensorFlow (只在生产环境拆分)
              if (id.includes('@tensorflow/tfjs') || id.includes('@tensorflow-models') || id.includes('@mediapipe')) {
                return 'ai-ml';
              }
            } else {
              // 开发环境跳过，避免循环依赖警告
              if (id.includes('@tensorflow/tfjs') || id.includes('@tensorflow-models') || id.includes('@mediapipe')) {
                return undefined;
              }
            }

            // Google GenAI - 独立 chunk
            if (id.includes('@google/genai')) {
              return 'genai';
            }

            // Core React
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'react-core';
            }

            // 3D Rendering (largest chunk - 无法进一步拆分)
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-core';
            }

            // State Management
            if (id.includes('zustand')) {
              return 'state';
            }

            // Media Processing
            if (id.includes('hls.js')) {
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
