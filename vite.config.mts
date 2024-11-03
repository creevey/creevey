import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: './',
  root: './src/client/web',
  build: {
    emptyOutDir: true,
    outDir: '../../../dist/client/web',
  },
  define: command == 'serve' ? { __CREEVEY_SERVER_PORT__: '3000' } : {},
  plugins: [react()],
  server: {
    port: 8000,
  },
}));
