/**
 * Papéis do FLUX (área do Admin do Flux): comitê e administradores do
 * programa. Contas do portal (ativar/desativar, Admin do Hub) ficam em
 * Admin do Hub → Usuários do portal.
 */
import React from 'react';
import { useStore } from '../../store/AppStore';
import { ehFluxAdmin } from '../../lib/roles';
import { Avatar, Badge, Pill } from '../../components/ui';

const GRID = '280px 1fr 220px 120px';

export default function AdmUsuarios() {
  const store = useStore();
  const { me, state } = store;
  if (!me) return null;

  const ativos = state.users.filter((u) => u.ativo);

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Papéis do Flux</h1>
      <p className="tf-body" style={{ margin: '0 0 22px' }}>
        Comitê de avaliação e administradores do programa — papéis cumulativos, válidos apenas dentro do Flux. Contas do portal são geridas no Admin do Hub.
      </p>
      <div className="tf-card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, minWidth: 860, gap: 0, padding: '12px 24px', borderBottom: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)' }}>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>COLABORADOR</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>E-MAIL · CARGO</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>PAPÉIS NO FLUX</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem', textAlign: 'center' }}>COMITÊ</span>
        </div>
        {ativos.map((u) => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, minWidth: 860, gap: 0, padding: '13px 24px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar nome={u.nome} cor={store.cor(u.id)} foto={u.foto} size={30} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{u.nome}</span>
            </span>
            <span style={{ minWidth: 0, paddingRight: 12 }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--tf-ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
              <span className="tf-small" style={{ display: 'block', fontSize: '0.72rem' }}>{u.cargo || '—'}</span>
            </span>
            <span style={{ display: 'flex', gap: 5 }}>
              <Pill on={u.roles.includes('avaliador')} onClick={() => store.toggleRole(u.id, 'avaliador')} style={{ padding: '6px 11px', fontSize: '0.72rem' }}>Comitê</Pill>
              <Pill on={ehFluxAdmin(u)} onClick={() => store.toggleRole(u.id, 'fluxAdmin')} style={{ padding: '6px 11px', fontSize: '0.72rem' }}>Admin do Flux</Pill>
            </span>
            <span style={{ textAlign: 'center' }}>
              {u.roles.includes('avaliador') && <Badge kind="warn">avaliador</Badge>}
            </span>
          </div>
        ))}
      </div>
      <p className="tf-small" style={{ fontSize: '0.74rem', margin: '14px 0 0' }}>
        O comitê é fixo em três pessoas (Marcos, Emilio e Thomas) — atribua o papel quando cada um fizer o primeiro login no portal.
      </p>
    </div>
  );
}
