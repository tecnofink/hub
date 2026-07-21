/** C7 · Destaques por categoria (RF-42): o líder de cada uma das 5 categorias. */
import React from 'react';
import { useStore } from '../../store/AppStore';
import { CATS, rankingDoCiclo } from '../../lib/scoring';
import { AXEL_CATEGORIA } from '../../lib/axel';
import { Avatar } from '../../components/ui';
import FluxPills from './FluxPills';

export default function Categorias() {
  const store = useStore();
  const { state, cicloAtivo: c } = store;

  const ranking = c ? rankingDoCiclo(state.projects, c.id) : [];

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 32px 80px' }}>
      <FluxPills comBadge />
      <div style={{ marginTop: 28 }}>
        <h1 className="tf-h2" style={{ margin: '0 0 8px' }}>Destaques por categoria</h1>
        <p className="tf-body" style={{ margin: 0 }}>O líder de cada uma das 5 categorias do programa{c ? ' · ' + c.nome : ''}</p>
      </div>
      <div className="tf-card-grid g-cats" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginTop: 28 }}>
        {CATS.map((ct) => {
          const lider = ranking.find((r) => r.p.cat === ct.id);
          const u = lider ? store.byId(lider.p.uid) : null;
          return (
            <div key={ct.id} style={{ background: 'var(--tf-bg-pure)', padding: '26px 22px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 250 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, minHeight: 28 }}>
                <span className="tf-mono" style={{ fontSize: '0.58rem', color: 'var(--tf-accent)' }}>{ct.nome.toUpperCase()}</span>
                {/* com líder, o Axel da categoria vira uma marca discreta no canto */}
                {lider && u && <img src={AXEL_CATEGORIA[ct.id]} alt="" aria-hidden="true" loading="lazy" style={{ height: 44, width: 'auto', flex: 'none', marginTop: -8 }} />}
              </div>
              {lider && u ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <Avatar nome={u.nome} cor={store.cor(u.id)} size={38} fontSize="0.68rem" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.nome}</div>
                    <div className="tf-small" style={{ fontSize: '0.74rem' }}>{u.depto}</div>
                  </div>
                  <p className="tf-small" style={{ margin: 0, fontSize: '0.8rem', flex: 1 }}>{lider.p.nome}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '2.1rem', color: 'var(--tf-accent)', lineHeight: 1 }}>{lider.s.final}</span>
                    <span className="tf-mono" style={{ fontSize: '0.6rem' }}>PTS</span>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 4px' }}>
                  <img src={AXEL_CATEGORIA[ct.id]} alt={'Categoria ' + ct.nome + ' em disputa — nenhum projeto avaliado ainda'} loading="lazy" style={{ height: 176, width: 'auto', maxWidth: '92%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
