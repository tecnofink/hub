import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // host explícito em IPv4: sem ele o Node pode resolver "localhost" para ::1
  // (só IPv6) e o navegador que tenta 127.0.0.1 recebe ERR_CONNECTION_REFUSED
  server: { host: '127.0.0.1', port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // vendors estáveis em chunks próprios: o cache do firebase/react não é
        // invalidado a cada deploy do app; o resto é dividido por rota (lazy)
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/@firebase/') || id.includes('/firebase/')) return 'firebase';
          if (id.includes('/react') || id.includes('/scheduler/')) return 'react';
          return undefined;
        },
      },
    },
  },
});
