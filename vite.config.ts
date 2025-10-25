import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // popup と content を別々にビルドするため
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.ts'),
      output: {
        entryFileNames: 'content.js',
        format: 'iife', // IIFE形式で1ファイルにバンドル
        name: 'CalendarTemplates',
      },
    },
    minify: 'esbuild',
  },
  esbuild: {
    // 本番ビルドでconsole.logを削除
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
