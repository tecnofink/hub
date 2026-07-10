/** E8 · Logs de auditoria (RF-59): trilha com filtros Todos/Administração/Avaliação/Flux. */
import React, { useState } from 'react';
import { useStore } from '../../store/AppStore';
import { Badge, Pill } from '../../components/ui';
import type { LogTipo } from '../../lib/types';

const FILTROS: [LogTipo | 'todos', string][] = [
  ['todos', 'Todos'],
  ['admin', 'Administração'],
  ['avaliacao', 'Avaliação'],
  ['flux', 'Flux'],
];

const TIPO_L: Record<LogTipo, string> = { admin: 'ADMIN', avaliacao: 'AVALIAÇÃO', flux: 'FLUX' };

export default function AdmLogs() {
  const { state } = useStore();
  const [filtro, setFiltro] = useState<LogTipo | 'todos'>('todos');
  const rows = state.logs.filter((l) => filtro === 'todos' || l.tipo === filtro);

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Logs de auditoria</h1>
      <p className="tf-body" style={{ margin: '0 0 18px' }}>Trilha das ações administrativas e de avaliação: quem fez o quê e quando.</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTROS.map(([k, label]) => (
          <Pill key={k} on={filtro === k} onClick={() => setFiltro(k)} style={{ fontSize: '0.78rem' }}>{label}</Pill>
        ))}
      </div>
      <div className="tf-card" style={{ padding: 0, overflow: 'auto' }}>
        {rows.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 170px 105px 1fr', gap: 14, padding: '12px 24px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
            <span className="tf-mono" style={{ fontSize: '0.64rem' }}>{l.ts}</span>
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{l.quem}</span>
            <Badge kind="neutral">{TIPO_L[l.tipo]}</Badge>
            <span style={{ fontSize: '0.84rem', color: 'var(--tf-ink-2)' }}>
              <strong style={{ color: 'var(--tf-ink)' }}>{l.acao}</strong> — {l.det}
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="tf-small" style={{ margin: 0, padding: 24 }}>Nenhum registro com este filtro.</p>}
      </div>
    </div>
  );
}
