/** Navegação em pílulas das telas do Flux (kanban · ranking · categorias · histórico). */
import React from 'react';
import { useLocation } from 'react-router-dom';
import ALink from '../../components/ALink';

const PILLS: [string, string][] = [
  ['/flux', 'Kanban de projetos'],
  ['/flux/ranking', 'Ranking global'],
  ['/flux/categorias', 'Por categoria'],
  ['/flux/historico', 'Histórico'],
  ['/flux/como-funciona', 'Como funciona?'],
];

export default function FluxPills({ comBadge }: { comBadge?: boolean }) {
  const loc = useLocation();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {comBadge && <img src="/brand/flux-badge.png" alt="Flux" style={{ width: 30, height: 30, marginRight: 2 }} />}
      {PILLS.map(([rota, label]) => {
        const on = loc.pathname === rota;
        return (
          <ALink
            key={rota}
            to={rota}
            style={{ padding: '9px 18px', borderRadius: 999, border: '1px solid ' + (on ? 'var(--tf-accent)' : 'var(--tf-line-2)'), background: on ? 'var(--tf-accent)' : 'var(--tf-bg-pure)', color: on ? '#fff' : 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-body)', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex' }}
          >
            {label}
          </ALink>
        );
      })}
    </div>
  );
}
