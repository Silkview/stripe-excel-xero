import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

function getHttpsConfig(): { key: Buffer; cert: Buffer } | undefined {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const defaultCert = path.join(home, '.office-addin-dev-certs/localhost.crt');
  const defaultKey = path.join(home, '.office-addin-dev-certs/localhost.key');
  if (fs.existsSync(defaultCert) && fs.existsSync(defaultKey)) {
    return {
      key: fs.readFileSync(defaultKey),
      cert: fs.readFileSync(defaultCert),
    };
  }
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        taskpane: resolve(__dirname, 'src/taskpane.html'),
      },
    },
  },
  server: {
    port: 4000,
    https: getHttpsConfig(),
    proxy: {
      '/auth': { target: 'http://localhost:4003', changeOrigin: true },
      '/api': { target: 'http://localhost:4003', changeOrigin: true },
      '/_next': { target: 'http://localhost:4003', changeOrigin: true },
    },
  },
});
