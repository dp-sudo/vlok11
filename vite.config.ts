import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
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
  };
});
