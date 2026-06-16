import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/flashboxp/',
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Keep predictable entry filename for Service Worker caching
        entryFileNames: 'js/app.js',
        chunkFileNames: 'js/[name].js',
        // Keep predictable stylesheet filename
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/style.css';
          }
          return '[ext]/[name].[ext]';
        },
      },
    },
  },
});
