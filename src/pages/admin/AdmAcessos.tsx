/** E6 · Acessos ao Claude (RF-54): tier derivado do pitch, aplicação manual, relatório. */
import React from 'react';
import { useStore } from '../../store/AppStore';
import { Avatar, Badge } from '../../components/ui';

const GRID = '250px 1fr 130px 120px 150px';

export default function AdmAcessos() {
  const store = useStore();
  const { state, cicloAtivo: c } = store;

  // RF-54: tier derivado do pitch do ciclo (Enterprise prevalece sobre Basic)
  const tierDe = (uid: string): string => {
    if (!c) return 'Sem acesso';
    const ts = state.projects.filter((p) => p.ciclo === c.id && p.uid === uid && p.tier && !p.reprovado).map((p) => p.tier);
    return ts.includes('Enterprise') ? 'Enterprise' : ts.includes('Basic') ? 'Basic' : 'Sem acesso';
  };

  const ativos = state.users.filter((x) => x.ativo);
  const semProj = ativos.filter((x) => !state.projects.some((p) => c && p.ciclo === c.id && p.uid === x.id));

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Acessos ao Claude</h1>
      <p className="tf-body" style={{ margin: '0 0 22px' }}>
        Acesso liberado pelo pitch deste ciclo — vale até o encerramento — e status da aplicação manual no console do Claude.
      </p>
      <div className="tf-card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, minWidth: 920, gap: 0, padding: '12px 24px', borderBottom: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)' }}>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>COLABORADOR</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>PITCH NO CICLO</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem', textAlign: 'center' }}>TIER NESTE CICLO</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem', textAlign: 'center' }}>APLICAÇÃO</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem', textAlign: 'right' }}>AÇÃO</span>
        </div>
        {ativos.map((u) => {
          const tier = tierDe(u.id);
          const meusP = c ? state.projects.filter((p) => p.ciclo === c.id && p.uid === u.id) : [];
          const pend = tier !== 'Sem acesso' && state.access[u.id]?.apl === false;
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, minWidth: 920, gap: 0, padding: '12px 24px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar nome={u.nome} cor={store.cor(u.id)} size={28} fontSize="0.58rem" />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, lineHeight: 1.2 }}>{u.nome}</span>
                  <span className="tf-small" style={{ display: 'block', fontSize: '0.7rem' }}>{u.depto || u.cargo}</span>
                </span>
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--tf-ink-2)', paddingRight: 14 }}>{meusP.length ? meusP[0].nome : 'Sem pitch no ciclo — sem acesso'}</span>
              <span style={{ textAlign: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.72rem' }}>{tier}</span>
              <span style={{ textAlign: 'center' }}>
                <Badge kind={tier === 'Sem acesso' ? 'neutral' : pend ? 'warn' : 'live'}>{tier === 'Sem acesso' ? '—' : pend ? 'PENDENTE' : 'APLICADO'}</Badge>
              </span>
              <span style={{ textAlign: 'right' }}>
                {pend && (
                  <button onClick={() => store.marcarAplicado(u.id)} className="tf-btn tf-btn-ghost" style={{ padding: '7px 12px', fontSize: '0.76rem' }}>Marcar aplicado</button>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="tf-mono" style={{ margin: '28px 0 12px' }}>[ RELATÓRIO · SEM PROJETO NO CICLO ]</div>
      <div className="tf-card" style={{ padding: '20px 26px' }}>
        {semProj.length === 0 && <p className="tf-small" style={{ margin: 0 }}>Todos os colaboradores ativos têm projeto inscrito neste ciclo.</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {semProj.map((u) => (
            <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 14px 7px 8px', borderRadius: 999, border: '1px solid rgba(232,93,46,0.4)', background: 'rgba(232,93,46,0.07)' }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(232,93,46,0.14)', color: 'var(--tf-warn)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.56rem' }}>
                {u.nome.trim().split(/\s+/).map((p2, i, a) => (i === 0 || i === a.length - 1 ? p2[0] : '')).join('').slice(0, 2).toUpperCase()}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{u.nome}</span>
              <span className="tf-small" style={{ fontSize: '0.7rem' }}>{u.depto || u.cargo}</span>
            </span>
          ))}
        </div>
        <p className="tf-small" style={{ fontSize: '0.74rem', margin: '14px 0 0' }}>
          Regra do programa: todo mundo começa o ciclo sem acesso. Pitch inscrito + tier definido = acesso liberado para a execução, válido até o encerramento do ciclo. Sem pitch, sem acesso. Concessão e revogação são manuais no console do Claude.
        </p>
      </div>
    </div>
  );
}
