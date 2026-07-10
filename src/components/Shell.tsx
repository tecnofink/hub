/** Shell autenticado: cabeçalho com navegação contextual, rodapé, toast e modal. */
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { dbr, todayISO } from '../lib/dates';
import { ehFluxAdmin, ehHubAdmin, faviconDe, rotaNormalizada } from '../lib/roles';
import { Avatar } from './ui';
import ALink from './ALink';

function NavPill({ on, to, children, outline }: { on: boolean; to: string; children: React.ReactNode; outline?: boolean }) {
  return (
    <ALink
      to={to}
      style={{
        padding: '8px 15px', borderRadius: 999,
        border: '1px solid ' + (on ? 'var(--tf-accent)' : outline ? 'var(--tf-line-2)' : 'transparent'),
        background: on ? 'var(--tf-accent)' : 'transparent',
        color: on ? '#fff' : 'var(--tf-ink-2)',
        fontFamily: 'var(--tf-font-body)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center',
      }}
    >
      {children}
    </ALink>
  );
}

export function ThemeToggleBtn({ fixed }: { fixed?: boolean }) {
  const { state, toggleTema } = useStore();
  const dark = state.tema === 'dark';
  return (
    <button
      onClick={toggleTema}
      style={{
        ...(fixed ? { position: 'absolute' as const, top: 22, right: 26 } : {}),
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--tf-font-mono)', fontSize: '0.66rem', letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: 'pointer', padding: '9px 14px', borderRadius: 999,
        border: '1px solid var(--tf-line-2)', background: 'var(--tf-bg-pure)', color: 'var(--tf-ink-2)', flex: 'none',
      }}
    >
      {dark ? '☀ Claro' : '☾ Escuro'}
    </button>
  );
}

export function ToastModal() {
  const { toast, fecharToast, modal, fecharModal } = useStore();
  return (
    <>
      {toast && (
        <div
          onClick={fecharToast}
          style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 300, background: 'var(--tf-ink)', color: 'var(--tf-bg)', padding: '14px 20px', borderRadius: 10, boxShadow: 'var(--tf-shadow-lg)', fontFamily: 'var(--tf-font-body)', fontSize: '0.9rem', fontWeight: 500, maxWidth: 440, cursor: 'pointer', animation: 'tfPop .3s ease both', display: 'flex', alignItems: 'center', gap: 14 }}
        >
          <span>{toast.msg}</span>
          {toast.acao && (
            <button
              onClick={(e) => { e.stopPropagation(); toast.acao!.fn(); fecharToast(); }}
              style={{ flex: 'none', background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'var(--tf-bg)', borderRadius: 999, padding: '6px 14px', fontFamily: 'var(--tf-font-body)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {toast.acao.label}
            </button>
          )}
        </div>
      )}
      {modal && (
        <div onClick={fecharModal} style={{ position: 'fixed', inset: 0, background: 'rgba(8,0,62,0.45)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'tfIn .2s ease both' }}>
          <div onClick={(e) => e.stopPropagation()} className="tf-card" style={{ maxWidth: 480, width: '100%', padding: 30, boxShadow: 'var(--tf-shadow-lg)' }}>
            <h3 className="tf-h4" style={{ margin: '0 0 10px' }}>{modal.titulo}</h3>
            <p className="tf-body" style={{ margin: '0 0 24px', whiteSpace: 'pre-line' }}>{modal.texto}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={fecharModal} className="tf-btn tf-btn-ghost">Cancelar</button>
              <button
                onClick={() => { const fn = modal.onConfirm; fecharModal(); fn(); }}
                className="tf-btn"
                style={{ background: modal.danger ? 'var(--tf-crit)' : 'var(--tf-accent)', color: '#fff' }}
              >
                {modal.cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Tela de carregamento enquanto a autenticação/dados resolvem. */
function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <img src="/brand/tecnofink-icon-transparent.png" alt="Tecnofink" style={{ width: 52, height: 52, animation: 'tfPop .5s ease both' }} />
      <span className="tf-mono">[ CARREGANDO O PORTAL… ]</span>
    </div>
  );
}

/** Título da aba do navegador conforme a ferramenta aberta. */
function tituloDe(path: string): string {
  if (path.startsWith('/flux') || path.startsWith('/comite') || path.startsWith('/admin/flux')) return 'Flux';
  if (path.startsWith('/tarefas')) return 'Gestor de Tarefas';
  if (path.startsWith('/playbook')) return 'Playbook';
  if (path.startsWith('/admin/hub')) return 'Admin do Hub';
  if (path.startsWith('/perfil')) return 'Perfil';
  return 'HUB';
}

/** Layout autenticado (RF-05: sessão + "Sair"; RF-11: tema; navegação contextual). */
export default function Shell() {
  const { me, state, authReady, logado, dataReady, logout } = useStore();
  const nav = useNavigate();
  const loc = useLocation();

  // ferramenta cadastrada (não nativa) cuja rota interna está aberta — rotas
  // nativas ficam de fora mesmo se houver cadastro apontando para elas
  const ferramentaAtual = state.tools.find((t) => {
    if (['flux', 'gestor', 'playbook'].includes(t.id)) return false;
    const r = rotaNormalizada(t.rota);
    if (['/flux', '/tarefas', '/playbook'].some((n) => r === n || r.startsWith(n + '/'))) return false;
    return r.startsWith('/') && r.length > 1
      && (loc.pathname === r || loc.pathname.startsWith(r + '/'));
  });

  useEffect(() => {
    document.title = (ferramentaAtual?.nome ?? tituloDe(loc.pathname)) + ' · Tecnofink';
    // favicon por contexto: badge do Flux no Flux, logo do Gestor nas tarefas,
    // livro no Playbook, Tecnofink no resto
    const noFlux = loc.pathname.startsWith('/flux') || loc.pathname.startsWith('/comite') || loc.pathname.startsWith('/admin/flux');
    const noGestor = loc.pathname.startsWith('/tarefas');
    const noPlaybook = loc.pathname.startsWith('/playbook');
    const icone = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icone) icone.href = noFlux ? '/brand/flux-badge.png' : noGestor ? '/brand/gestor-badge.png' : noPlaybook ? '/brand/playbook-badge.png' : '/brand/tecnofink-icon-transparent.png';
  }, [loc.pathname, ferramentaAtual?.nome]);

  if (!authReady) return <Splash />;
  if (!logado) return <Navigate to="/login" replace />;
  if (!me || !dataReady) return <Splash />;
  // RF-04: conta desativada perde o acesso imediatamente
  if (!me.ativo) { void logout(); return <Navigate to="/login" replace />; }

  const path = loc.pathname;
  const souFluxAdmin = ehFluxAdmin(me);
  const souHubAdmin = ehHubAdmin(me);
  const souAval = me.roles.includes('avaliador');
  const emFlux = path.startsWith('/flux');
  const emGestor = path.startsWith('/tarefas');
  const emPlaybook = path.startsWith('/playbook');
  const emComite = path.startsWith('/comite');
  const emAdminFlux = path.startsWith('/admin/flux');
  const emAdminHub = path.startsWith('/admin/hub');
  const emHub = path === '/';
  const fluxCtx = emFlux || emComite || emAdminFlux;

  const ctxTag = emComite ? 'FLUX · COMITÊ' : emAdminFlux ? 'FLUX · ADMIN' : emFlux ? 'FLUX' : emGestor ? 'GESTOR DE TAREFAS' : emPlaybook ? 'PLAYBOOK' : emAdminHub ? 'HUB · ADMINISTRAÇÃO' : ferramentaAtual ? ferramentaAtual.nome.toUpperCase() : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 60, background: 'var(--tf-bg-pure)', borderBottom: '1px solid var(--tf-line)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 20 }}>
          <ALink
            to="/"
            title="Hub — página inicial"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 999, border: '1px solid ' + (emHub ? 'var(--tf-accent)' : 'var(--tf-line-2)'), background: emHub ? 'var(--tf-accent)' : 'transparent', color: emHub ? '#fff' : 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-body)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap', flex: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: -1 }}>
              <path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5" />
            </svg>
            Hub
          </ALink>
          <span style={{ width: 1, height: 24, background: 'var(--tf-line-2)', flex: 'none' }} />
          <ALink
            to={fluxCtx ? '/flux' : emGestor ? '/tarefas' : emPlaybook ? '/playbook' : ferramentaAtual ? rotaNormalizada(ferramentaAtual.rota) : '/'}
            title={fluxCtx ? 'Flux — abrir a ferramenta' : emGestor ? 'Gestor de Tarefas — meus projetos' : emPlaybook ? 'Playbook' : ferramentaAtual?.nome ?? 'Tecnofink'}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flex: 'none' }}
          >
            {fluxCtx && <img src="/brand/flux-badge.png" alt="Flux" style={{ width: 26, height: 26 }} />}
            {emGestor && <img src="/brand/gestor-badge.png" alt="Gestor de Tarefas" style={{ height: 22 }} />}
            {emPlaybook && <img src="/brand/playbook-badge.png" alt="Playbook" style={{ height: 26 }} />}
            {ferramentaAtual && (
              faviconDe(ferramentaAtual.rota)
                ? <img src={faviconDe(ferramentaAtual.rota)!} alt={ferramentaAtual.nome} style={{ width: 24, height: 24, borderRadius: 6 }} />
                : <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--tf-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '0.7rem' }}>{ferramentaAtual.sigla}</span>
            )}
            {!fluxCtx && !emGestor && !emPlaybook && !ferramentaAtual && <img src="/brand/tecnofink-logo-transparent.png" alt="Tecnofink" className="tf-logo" style={{ height: 20 }} />}
            {ctxTag && <span className="tf-mono" style={{ fontSize: '0.66rem', color: 'var(--tf-accent)' }}>[ {ctxTag} ]</span>}
          </ALink>
          <nav style={{ display: 'flex', gap: 6, flex: 1 }}>
            <NavPill on={emFlux} to="/flux">Flux</NavPill>
            <NavPill on={emGestor} to="/tarefas">Tarefas</NavPill>
            <NavPill on={emPlaybook} to="/playbook">Playbook</NavPill>
            {fluxCtx && souAval && <NavPill on={emComite} to="/comite/acesso">Comitê</NavPill>}
            {fluxCtx && souFluxAdmin && <NavPill on={emAdminFlux} to="/admin/flux">Admin do Flux</NavPill>}
            {!fluxCtx && !emGestor && !emPlaybook && souHubAdmin && <NavPill on={emAdminHub} to="/admin/hub/dominios">Admin do Hub</NavPill>}
          </nav>
          <span className="tf-mono" style={{ fontSize: '0.6rem', flex: 'none' }}>[ HOJE · {dbr(todayISO())} ]</span>
          <ThemeToggleBtn />
          <ALink to="/perfil" title="Meu perfil" style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flex: 'none' }}>
            <MeAvatar />
          </ALink>
          <button onClick={() => { void logout(); }} className="tf-btn tf-btn-ghost" style={{ padding: '8px 14px', flex: 'none' }}>Sair</button>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: '1px solid var(--tf-line)', background: 'var(--tf-bg-pure)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '18px 32px', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span className="tf-mono" style={{ fontSize: '0.6rem' }}>TECNOFINK LTDA — PORTAL FLUX</span>
          <span style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="mailto:analista.dados1@tecnofink.com" className="tf-mono" style={{ fontSize: '0.6rem', color: 'var(--tf-accent)', fontWeight: 700, textDecoration: 'none' }}>✉ SUPORTE</a>
            <span className="tf-mono" style={{ fontSize: '0.6rem' }}>V1 · PRODUÇÃO</span>
          </span>
        </div>
      </footer>
      <ToastModal />
    </div>
  );
}

function MeAvatar() {
  const { me, cor } = useStore();
  if (!me) return null;
  return (
    <span style={{ boxShadow: '0 0 0 2px var(--tf-bg-pure), 0 0 0 3px var(--tf-line-2)', borderRadius: '50%', display: 'flex' }}>
      <Avatar nome={me.nome} cor={cor(me.id)} foto={me.foto} size={34} fontSize="0.68rem" />
    </span>
  );
}

/** Guard de papel: comitê e administrações validados na navegação (regras reforçam no backend). */
export function RequireRole({ role, children }: { role: 'avaliador' | 'fluxAdmin' | 'hubAdmin'; children: React.ReactNode }) {
  const { me } = useStore();
  const ok = role === 'avaliador' ? !!me?.roles.includes('avaliador')
    : role === 'fluxAdmin' ? ehFluxAdmin(me)
    : ehHubAdmin(me);
  if (!ok) return <Navigate to="/" replace />;
  return <>{children}</>;
}
