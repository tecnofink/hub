/**
 * A1 · Login — exclusivamente com Google Workspace (RF-01, decisão P10).
 * A restrição de domínio (RF-02), a criação automática de conta (RF-03) e o
 * bloqueio de conta desativada (RF-04) são resolvidos no fluxo de autenticação
 * e impostos pelas regras do Firestore.
 */
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { ThemeToggleBtn, ToastModal } from '../components/Shell';
import { Erro } from '../components/ui';
import { AXEL } from '../lib/axel';

export default function Login() {
  const { logado, authReady, loginErro, loginGoogle } = useStore();

  useEffect(() => { document.title = 'Entrar · Tecnofink'; }, []);

  if (logado) return <Navigate to="/" replace />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative' }}>
      <ThemeToggleBtn fixed />
      <div className="anim-pop" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 26 }}>
          <img src={AXEL.login} alt="Axel, o mascote do Flux, segurando o planeta Terra" style={{ height: 'clamp(110px, 18vh, 150px)', width: 'auto' }} />
          <img src="/brand/tecnofink-logo-transparent.png" alt="Tecnofink" className="tf-logo" style={{ height: 30 }} />
          <span className="tf-mono">[ HUB DE FERRAMENTAS DE IA ]</span>
        </div>
        <div className="tf-card" style={{ padding: 'clamp(20px, 6vw, 32px)' }}>
          <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Entrar no portal</h1>
          <p className="tf-small" style={{ margin: '0 0 22px' }}>Acesso exclusivo para colaboradores do grupo Tecnofink.</p>
          {loginErro && <div style={{ marginBottom: 16 }}><Erro msg={loginErro} /></div>}
          <button
            onClick={() => { void loginGoogle(); }}
            disabled={!authReady}
            className="hover-accent"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, padding: '15px 16px', borderRadius: 8, border: '1px solid var(--tf-line-2)', background: 'var(--tf-bg-pure)', cursor: 'pointer', fontFamily: 'var(--tf-font-body)', fontSize: '0.98rem', fontWeight: 700, color: 'var(--tf-ink)', opacity: authReady ? 1 : 0.6 }}
          >
            <span style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--tf-line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-display)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--tf-accent)', background: '#fff' }}>G</span>
            Entrar com Google Workspace
          </button>
          <p className="tf-small" style={{ fontSize: '0.78rem', margin: '16px 0 0', lineHeight: 1.55, textAlign: 'center' }}>
            Primeira vez por aqui? Sua conta é criada automaticamente no primeiro acesso com o e-mail corporativo — sem senha própria do portal.
          </p>
        </div>
        <p className="tf-mono" style={{ fontSize: '0.6rem', textAlign: 'center', margin: '18px 0 0', color: 'var(--tf-ink-3)' }}>
          [ AUTENTICAÇÃO GOOGLE WORKSPACE · DOMÍNIOS DO GRUPO TECNOFINK ]
        </p>
      </div>
      <ToastModal />
    </div>
  );
}
