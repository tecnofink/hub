/** E · Administração em duas áreas (RF-52): Admin do Flux e Admin do Hub. */
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const MENU_FLUX: [string, string][] = [
  ['/admin/flux', 'Visão geral'],
  ['/admin/flux/usuarios', 'Papéis do Flux'],
  ['/admin/flux/ciclos', 'Ciclos'],
  ['/admin/flux/pitches', 'Acesso dos pitches'],
  ['/admin/flux/acessos', 'Acessos ao Claude'],
  ['/admin/flux/logs', 'Logs de auditoria'],
];

const MENU_HUB: [string, string][] = [
  ['/admin/hub/dominios', 'Domínios liberados'],
  ['/admin/hub/ferramentas', 'Ferramentas do hub'],
  ['/admin/hub/usuarios', 'Usuários do portal'],
];

export default function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const hubArea = loc.pathname.startsWith('/admin/hub');
  const menu = hubArea ? MENU_HUB : MENU_FLUX;

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 32px 80px' }}>
      <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ {hubArea ? 'ADMINISTRAÇÃO DO HUB' : 'FLUX · ADMINISTRAÇÃO'} ]</span>
      <div className="adm-grid" style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 36, marginTop: 20, alignItems: 'start' }}>
        <nav className="adm-nav" style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 88 }}>
          {menu.map(([rota, label]) => {
            const on = loc.pathname === rota;
            return (
              <button
                key={rota}
                onClick={() => nav(rota)}
                style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: 'none', background: on ? 'var(--tf-accent-soft)' : 'transparent', color: on ? 'var(--tf-accent)' : 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-body)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {label}
              </button>
            );
          })}
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
