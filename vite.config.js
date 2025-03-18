import { defineConfig, splitVendorChunkPlugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [splitVendorChunkPlugin()],
  base: '/pixel-art-shader/',
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
