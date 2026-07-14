import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
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
