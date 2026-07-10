/** E1 · Visão geral (RF-53): indicadores com alerta e atalhos de ação. */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr, diasAte } from '../../lib/dates';
import { isAvaliado } from '../../lib/scoring';
import { MetricStat } from '../../components/ui';
import { plural } from '../../lib/format';

export default function AdmPainel() {
  const store = useStore();
  const { state, cicloAtivo: c } = store;
  const nav = useNavigate();

  const aguardTier = state.projects.filter((p) => c && p.ciclo === c.id && !p.tier && !p.reprovado);
  const aguardCom = state.projects.filter((p) => p.ciclo !== 'backlog' && !p.reprovado && p.resultado && !isAvaliado(p));
  const atrasados = state.projects.filter((p) => c && p.ciclo === c.id && p.tier && !p.resultado && !p.reprovado && p.deadline && diasAte(p.deadline) < 0);
  const semProj = state.users.filter((x) => x.ativo && !state.projects.some((p) => p.uid === x.id && c && p.ciclo === c.id));

  const stats = [
    { v: String(aguardTier.length), l: 'pitches aguardando acesso', crit: aguardTier.length > 0 },
    { v: String(aguardCom.length), l: 'resultados no comitê', crit: false },
    { v: String(atrasados.length), l: 'projetos atrasados', crit: atrasados.length > 0 },
    { v: String(semProj.length), l: 'colaboradores sem projeto', crit: semProj.length > 0 },
  ];

  const alertas: { txt: string; cta: string; go: () => void }[] = [
    ...(aguardTier.length ? [{ txt: `${aguardTier.length} pitch${plural(aguardTier.length, '', 'es')} aguardando definição de tier do Claude.`, cta: 'Definir acesso', go: () => nav('/admin/flux/pitches') }] : []),
    ...(atrasados.length ? [{ txt: `${atrasados.length} projeto${plural(atrasados.length, '', 's')} com deadline vencido sem resultado registrado.`, cta: 'Ver no Flux', go: () => nav('/flux') }] : []),
    ...(semProj.length ? [{ txt: `${semProj.length} colaboradores sem pitch no ciclo — seguem sem acesso ao Claude.`, cta: 'Ver relatório', go: () => nav('/admin/flux/acessos') }] : []),
  ];

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Visão geral</h1>
      <p className="tf-body" style={{ margin: '0 0 22px' }}>
        {c ? `${c.nome} · ${dbr(c.inicio)} a ${dbr(c.fim)} · ${Math.max(0, diasAte(c.fim))} dias restantes` : 'Nenhum ciclo ativo — crie um em Ciclos.'}
      </p>
      <div className="g-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: '1px solid var(--tf-line)', borderRadius: 10, background: 'var(--tf-bg-pure)', overflow: 'hidden' }}>
        {stats.map((st, i) => (
          <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid var(--tf-line)' : 'none' }}>
            <MetricStat value={st.v} label={st.l} critical={st.crit} />
          </div>
        ))}
      </div>
      <div className="tf-mono" style={{ margin: '30px 0 12px' }}>[ ALERTAS ]</div>
      {alertas.length === 0 && (
        <div style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
          <p className="tf-small" style={{ margin: 0 }}>Nenhum alerta no momento.</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alertas.map((a, i) => (
          <div key={i} className="tf-card" style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tf-warn)', flex: 'none' }} />
            <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--tf-ink-2)' }}>{a.txt}</span>
            <button onClick={a.go} className="tf-btn tf-btn-ghost" style={{ flex: 'none', padding: '8px 14px' }}>{a.cta} →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
