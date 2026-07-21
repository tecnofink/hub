/**
 * Fronteira de erro raiz: um throw em qualquer render (ou uma falha ao baixar um
 * chunk lazy após redeploy) deixaria o app em tela branca sem esta rede. Mostra
 * uma tela amigável com "Recarregar" em vez de apagar tudo.
 */
import React from 'react';

interface Props { children: React.ReactNode }
interface State { erro: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { erro: false };

  static getDerivedStateFromError(): State {
    return { erro: true };
  }

  componentDidCatch(erro: unknown, info: unknown) {
    const msg = String((erro as { message?: string })?.message ?? erro);
    // falha ao baixar um chunk lazy (deploy trocou os hashes com a aba aberta):
    // recarrega UMA vez para pegar os assets novos, em vez de mostrar erro
    if (/dynamically imported module|module script failed|Failed to fetch|ChunkLoadError|error loading/i.test(msg)) {
      try {
        if (!sessionStorage.getItem('pf-reload-chunk')) {
          sessionStorage.setItem('pf-reload-chunk', '1');
          window.location.reload();
          return;
        }
      } catch { window.location.reload(); return; }
    }
    // sem serviço de monitoramento ainda; ao menos deixa rastro no console
    console.error('[ErrorBoundary] erro de render capturado:', erro, info);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 440 }}>
          <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ OPS ]</span>
          <h1 className="tf-h3" style={{ margin: '12px 0 8px' }}>Algo saiu do trilho</h1>
          <p className="tf-body" style={{ margin: '0 0 22px' }}>
            Tivemos um erro inesperado ao montar esta tela. Recarregar costuma resolver — em geral é uma atualização do portal que acabou de sair.
          </p>
          <button onClick={() => window.location.reload()} className="tf-btn tf-btn-accent" style={{ padding: '12px 24px' }}>
            Recarregar o portal
          </button>
        </div>
      </div>
    );
  }
}
