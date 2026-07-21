import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/ds.css';
import './styles/app.css';

// chunk lazy que falha ao baixar (comum quando uma aba antiga fica aberta e sai
// um novo deploy que troca os hashes) — recarrega uma vez para pegar os assets novos
window.addEventListener('vite:preloadError', () => {
  const chave = 'pf-reload-chunk';
  try {
    if (!sessionStorage.getItem(chave)) { sessionStorage.setItem(chave, '1'); window.location.reload(); }
  } catch { window.location.reload(); }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// re-arma o guarda anti-loop após um boot saudável: se sobrevivemos alguns
// segundos sem erro de chunk, um próximo deploy pode disparar reload de novo.
// (um erro persistente reapareceria antes disto, mantendo o guarda ativo)
setTimeout(() => {
  try { sessionStorage.removeItem('pf-reload-chunk'); } catch { /* sem storage */ }
}, 8000);
