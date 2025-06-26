import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true,  // エラーオーバーレイを表示
    },
    watch: {
      usePolling: true,  // ファイル変更の検出を改善
    },
  },
  // エラーハンドリングの改善
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // CSSの重複警告を無視
        if (warning.code === 'css-unused-selector') return;
        warn(warning);
      },
    },
  },
})
