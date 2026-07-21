/** Shell autenticado: cabeçalho com navegação contextual, rodapé, toast e modal. */
import React, { Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { dbr, todayISO } from '../lib/dates';
import { ehFluxAdmin, ehHubAdmin, faviconDe, rotaNormalizada } from '../lib/roles';
import { Avatar, Modal } from './ui';
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
      className="m-ml-auto"
      style={{
        ...(fixed ? { position: 'absolute' as const, top: 22, right: 26 } : {}),
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--tf-font-mono)', fontSize: '0.66rem', letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: 'pointer', padding: '9px 14px', borderRadius: 999,
        border: '1px solid var(--tf-line-2)', background: 'var(--tf-bg-pure)', color: 'var(--tf-ink-2)', flex: 'none',
      }}
    >
      {dark ? '☀' : '☾'}<span className="m-hide">{dark ? 'Claro' : 'Escuro'}</span>
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
          role={toast.erro ? 'alert' : 'status'}
          style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 300, background: toast.erro ? 'var(--tf-crit)' : 'var(--tf-ink)', color: '#fff', padding: '14px 20px', borderRadius: 10, boxShadow: 'var(--tf-shadow-lg)', fontFamily: 'var(--tf-font-body)', fontSize: '0.9rem', fontWeight: 500, maxWidth: 'min(440px, calc(100vw - 48px))', cursor: 'pointer', animation: 'tfPop .3s ease both', display: 'flex', alignItems: 'center', gap: 14 }}
        >
          {toast.erro && <span aria-hidden="true" style={{ flex: 'none', fontWeight: 800 }}>⚠</span>}
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
        <Modal onClose={fecharModal} labelId="modal-conf-titulo">
          <h3 id="modal-conf-titulo" className="tf-h4" style={{ margin: '0 0 10px' }}>{modal.titulo}</h3>
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
        </Modal>
      )}
    </>
  );
}

/** Fallback leve enquanto o chunk da rota (lazy) baixa — não empurra o layout. */
function CarregandoRota() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="tf-mono">[ CARREGANDO… ]</span>
    </div>
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
  if (path.startsWith('/tarefas')) return 'Produtividade';
  if (path.startsWith('/playbook')) return 'Marketing';
  if (path.startsWith('/admin/hub')) return 'Admin do Hub';
  if (path.startsWith('/perfil')) return 'Perfil';
  return 'HUB';
}

/** Popup do Axel: notícia de mudança de etapa ou de acesso ao Claude (fila do store). */
export function AxelModal() {
  const { axelNoticia, axelProximo } = useStore();
  if (!axelNoticia) return null;
  return (
    <Modal onClose={axelProximo} maxWidth={520} labelId="axel-titulo">
      <div style={{ textAlign: 'center', padding: '10px 6px 4px' }}>
        <img src={axelNoticia.img} alt="" style={{ maxHeight: 'min(320px, 42vh)', maxWidth: '84%', width: 'auto' }} />
        <h3 id="axel-titulo" className="tf-h3" style={{ margin: '16px 0 8px' }}>{axelNoticia.titulo}</h3>
        <p className="tf-body" style={{ margin: '0 auto 22px', maxWidth: 400 }}>{axelNoticia.texto}</p>
        <button onClick={axelProximo} className="tf-btn tf-btn-accent foco-tf" style={{ padding: '12px 28px' }}>Entendi!</button>
      </div>
    </Modal>
  );
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
    // favicon por contexto: badge do Flux no Flux, prancheta na Produtividade,
    // quadro de planejamento no Marketing, Tecnofink no resto
    const noFlux = loc.pathname.startsWith('/flux') || loc.pathname.startsWith('/comite') || loc.pathname.startsWith('/admin/flux');
    const noGestor = loc.pathname.startsWith('/tarefas');
    const noPlaybook = loc.pathname.startsWith('/playbook');
    const icone = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icone) icone.href = noFlux ? '/brand/flux-badge.png' : noGestor ? '/brand/produtividade-badge.png' : noPlaybook ? '/brand/marketing-badge.png' : '/brand/tecnofink-icon-transparent.png';
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

  const ctxTag = emComite ? 'FLUX · COMITÊ' : emAdminFlux ? 'FLUX · ADMIN' : emFlux ? 'FLUX' : emGestor ? 'PRODUTIVIDADE' : emPlaybook ? 'MARKETING' : emAdminHub ? 'HUB · ADMINISTRAÇÃO' : ferramentaAtual ? ferramentaAtual.nome.toUpperCase() : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 60, background: 'var(--tf-bg-pure)', borderBottom: '1px solid var(--tf-line)' }}>
        <div className="m-header" style={{ maxWidth: 1320, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 20 }}>
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
          <span className="m-hide" style={{ width: 1, height: 24, background: 'var(--tf-line-2)', flex: 'none' }} />
          <ALink
            to={fluxCtx ? '/flux' : emGestor ? '/tarefas' : emPlaybook ? '/playbook' : ferramentaAtual ? rotaNormalizada(ferramentaAtual.rota) : '/'}
            title={fluxCtx ? 'Flux — abrir a ferramenta' : emGestor ? 'Produtividade — meus projetos' : emPlaybook ? 'Marketing' : ferramentaAtual?.nome ?? 'Tecnofink'}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flex: 'none' }}
          >
            {fluxCtx && <img src="/brand/flux-badge.png" alt="Flux" style={{ width: 26, height: 26 }} />}
            {emGestor && <img src="/brand/produtividade-badge.png" alt="Produtividade" style={{ height: 26 }} />}
            {emPlaybook && <img src="/brand/marketing-badge.png" alt="Marketing" style={{ height: 26 }} />}
            {ferramentaAtual && (
              faviconDe(ferramentaAtual.rota)
                ? <img src={faviconDe(ferramentaAtual.rota)!} alt={ferramentaAtual.nome} style={{ width: 24, height: 24, borderRadius: 6 }} />
                : <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--tf-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '0.7rem' }}>{ferramentaAtual.sigla}</span>
            )}
            {!fluxCtx && !emGestor && !emPlaybook && !ferramentaAtual && (
              <>
                <img src="/brand/tecnofink-logo-transparent.png" alt="Tecnofink" className="tf-logo m-hide" style={{ height: 20 }} />
                <img src="/brand/tecnofink-icon-transparent.png" alt="Tecnofink" className="tf-logo m-only" style={{ height: 28 }} />
              </>
            )}
            {ctxTag && <span className="tf-mono m-hide" style={{ fontSize: '0.66rem', color: 'var(--tf-accent)' }}>[ {ctxTag} ]</span>}
          </ALink>
          <nav className="m-nav" style={{ display: 'flex', gap: 6, flex: 1 }}>
            <NavPill on={emFlux} to="/flux">Flux</NavPill>
            <NavPill on={emGestor} to="/tarefas">Produtividade</NavPill>
            <NavPill on={emPlaybook} to="/playbook">Marketing</NavPill>
            {fluxCtx && souAval && <NavPill on={emComite} to="/comite/acesso">Comitê</NavPill>}
            {fluxCtx && souFluxAdmin && <NavPill on={emAdminFlux} to="/admin/flux">Admin do Flux</NavPill>}
            {!fluxCtx && !emGestor && !emPlaybook && souHubAdmin && <NavPill on={emAdminHub} to="/admin/hub/dominios">Admin do Hub</NavPill>}
          </nav>
          <span className="tf-mono m-hide" style={{ fontSize: '0.6rem', flex: 'none' }}>[ HOJE · {dbr(todayISO())} ]</span>
          <ThemeToggleBtn />
          <ALink to="/perfil" title="Meu perfil" style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flex: 'none' }}>
            <MeAvatar />
          </ALink>
          <button onClick={() => { void logout(); }} className="tf-btn tf-btn-ghost" style={{ padding: '8px 14px', flex: 'none' }}>Sair</button>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Suspense fallback={<CarregandoRota />}>
          <Outlet />
        </Suspense>
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
      <AxelModal />
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
