/** C8 · Histórico de ciclos (RF-43): ciclos encerrados → ranking congelado. */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr } from '../../lib/dates';
import { Badge } from '../../components/ui';
import FluxPills from './FluxPills';

export default function Historico() {
  const { state } = useStore();
  const nav = useNavigate();
  const encerrados = state.cycles.filter((x) => x.status === 'encerrado');

  return (
    <div className="anim-in" style={{ maxWidth: 920, margin: '0 auto', padding: '48px 32px 80px' }}>
      <div style={{ marginBottom: 28 }}>
        <FluxPills comBadge />
      </div>
      <h1 className="tf-h2" style={{ margin: '0 0 8px' }}>Histórico de ciclos</h1>
      <p className="tf-body" style={{ margin: '0 0 28px' }}>
        Ciclos encerrados, com projetos, pontuações e rankings congelados no encerramento. A pontuação não acumula entre ciclos.
      </p>
      {encerrados.length === 0 && (
        <div style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 12, padding: '44px 32px', textAlign: 'center', background: 'var(--tf-bg-pure)' }}>
          <p className="tf-small" style={{ margin: 0 }}>Nenhum ciclo encerrado ainda.</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {encerrados.map((h) => (
          <div key={h.id} onClick={() => nav('/flux/ranking/' + h.id)} className="tf-card hover-accent" style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', flexWrap: 'wrap' }}>
            <Badge kind="neutral" style={{ flex: 'none' }}>encerrado</Badge>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.15rem' }}>{h.nome}</div>
              <div className="tf-small" style={{ fontSize: '0.8rem' }}>{dbr(h.inicio)} a {dbr(h.fim)} · {(h.frozen?.length ?? 0)} projetos avaliados · ranking congelado</div>
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tf-accent)' }}>Abrir ranking congelado →</span>
          </div>
        ))}
      </div>
    </div>
  );
}
