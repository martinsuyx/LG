import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

// Allow importing generated SDK that lives at the repo root.
const workspaceRoot = path.resolve(__dirname, '..', '..', '..');

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    fs: {
      allow: [workspaceRoot]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
