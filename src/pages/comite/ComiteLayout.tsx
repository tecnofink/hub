/** Área do comitê (RF-24, RF-37): cabeçalho + abas Acesso dos pitches / Resultados. */
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { isAvaliado } from '../../lib/scoring';
import { Pill } from '../../components/ui';
import { todayISO } from '../../lib/dates';

export default function ComiteLayout() {
  const store = useStore();
  const { state, cicloAtivo: c } = store;
  const nav = useNavigate();
  const loc = useLocation();

  const acesso = state.projects.filter((p) => c && p.ciclo === c.id && !p.tier && !p.reprovado);
  const fila = state.projects.filter((p) => p.ciclo !== 'backlog' && !p.reprovado && p.resultado && !isAvaliado(p));

  const membros = state.users.filter((u) => u.roles.includes('avaliador')).map((u) => u.nome.split(' ')[0]);

  return (
    <div className="anim-in" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 80px' }}>
      <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ COMITÊ DE AVALIAÇÃO · {membros.join(', ').toUpperCase()} ]</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
        <h1 className="tf-h2" style={{ margin: 0 }}>Comitê de avaliação</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Pill on={loc.pathname === '/comite/acesso'} onClick={() => nav('/comite/acesso')} style={{ padding: '9px 18px', fontSize: '0.86rem' }}>
            Acesso dos pitches · {acesso.length}
          </Pill>
          <Pill on={loc.pathname !== '/comite/acesso'} onClick={() => nav('/comite/fila')} style={{ padding: '9px 18px', fontSize: '0.86rem' }}>
            Resultados · {fila.length}
          </Pill>
        </div>
      </div>
      <Outlet />
      {c && todayISO() > c.limite && null}
    </div>
  );
}
