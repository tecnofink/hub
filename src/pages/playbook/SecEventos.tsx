/** [01] Eventos — cards nacionais/internacionais, status ciclável, eventos custom. */
import React, { useState } from 'react';
import type { PbEvento, PbStatusEvento } from '../../lib/playbook';
import { Badge, L } from '../../components/ui';
import { useStore } from '../../store/AppStore';
import { pbId } from './usePlaybook';
import { SecHead } from './comum';

const CICLO: PbStatusEvento[] = ['NÃO INICIADO', 'EM ANDAMENTO', 'CONCLUÍDO'];
const BADGE: Record<PbStatusEvento, 'neutral' | 'warn' | 'live'> = { 'NÃO INICIADO': 'neutral', 'EM ANDAMENTO': 'warn', 'CONCLUÍDO': 'live' };

export default function SecEventos({ lista, podeEditar, salvar }: {
  lista: PbEvento[];
  podeEditar: boolean;
  salvar: (dados: { lista: PbEvento[] }) => void;
}) {
  const store = useStore();
  const [novoOn, setNovoOn] = useState(false);
  const [f, setF] = useState({ nome: '', local: '', data: '', tipo: 'nacional' as 'nacional' | 'internacional' });

  const ciclarStatus = (ev: PbEvento) => {
    if (!podeEditar) return;
    const prox = CICLO[(CICLO.indexOf(ev.status) + 1) % CICLO.length];
    salvar({ lista: lista.map((x) => (x.id === ev.id ? { ...x, status: prox } : x)) });
  };

  const adicionar = () => {
    if (!f.nome.trim()) return store.showToast('Dê um nome ao evento.');
    const maiorOrdem = lista.reduce((a, x) => Math.max(a, x.ordem), 0);
    salvar({
      lista: [...lista, { id: pbId(), nome: f.nome.trim(), local: f.local.trim() || undefined, data: f.data.trim() || 'A definir', tipo: f.tipo, status: 'NÃO INICIADO', obs: '', isCustom: true, ordem: maiorOrdem + 1 }],
    });
    setF({ nome: '', local: '', data: '', tipo: 'nacional' });
    setNovoOn(false);
  };

  const grupo = (tipo: 'nacional' | 'internacional', base: number) => {
    const evs = lista.filter((e) => e.tipo === tipo);
    return evs.map((ev, i) => (
      <div key={ev.id} className="tf-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>[{String(base + i + 1).padStart(2, '0')}]</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a onClick={() => ciclarStatus(ev)} style={{ cursor: podeEditar ? 'pointer' : 'default' }} title={podeEditar ? 'Clique para mudar o status' : undefined}>
              <Badge kind={BADGE[ev.status]}>{ev.status}</Badge>
            </a>
            {podeEditar && ev.isCustom && (
              <button
                type="button"
                className="acao foco-tf"
                onClick={() => store.confirmar({
                  titulo: 'Remover evento?', texto: `"${ev.nome}" e a página da feira dele (checklist, logística, leads e portal) serão removidos.`, cta: 'Remover', danger: true,
                  onConfirm: () => salvar({ lista: lista.filter((x) => x.id !== ev.id) }),
                })}
                style={{ color: 'var(--tf-crit)', fontWeight: 700 }}
              >
                ×
              </button>
            )}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.08rem', lineHeight: 1.25 }}>{ev.nome}</div>
        <div className="tf-small" style={{ fontSize: '0.78rem' }}>{[ev.local, ev.data].filter(Boolean).join(' · ')}</div>
      </div>
    ));
  };

  const nacionais = lista.filter((e) => e.tipo === 'nacional').length;

  return (
    <section>
      <SecHead id="eventos" num="01" titulo="Eventos" sub="Feiras e eventos do ano — clique no status para atualizá-lo (editores)." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>{grupo('nacional', 0)}</div>
      <div className="tf-mono" style={{ margin: '22px 0 10px', fontSize: '0.62rem' }}>[ EVENTOS INTERNACIONAIS ]</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>{grupo('internacional', nacionais)}</div>

      {podeEditar && (novoOn ? (
        <div className="tf-card" style={{ marginTop: 16, padding: '18px 22px', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}><L>Nome</L><input className="f-input" value={f.nome} onChange={(e) => setF((s) => ({ ...s, nome: e.target.value }))} autoFocus /></div>
          <div style={{ width: 170 }}><L>Local</L><input className="f-input" value={f.local} onChange={(e) => setF((s) => ({ ...s, local: e.target.value }))} /></div>
          <div style={{ width: 140 }}><L>Data</L><input className="f-input" value={f.data} onChange={(e) => setF((s) => ({ ...s, data: e.target.value }))} placeholder="Ex.: 12–14 Ago" /></div>
          <div style={{ width: 150 }}>
            <L>Tipo</L>
            <select className="f-select" value={f.tipo} onChange={(e) => setF((s) => ({ ...s, tipo: e.target.value as 'nacional' | 'internacional' }))}>
              <option value="nacional">Nacional</option>
              <option value="internacional">Internacional</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setNovoOn(false)} className="tf-btn tf-btn-ghost">Cancelar</button>
            <button onClick={adicionar} className="tf-btn tf-btn-accent">Adicionar evento</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setNovoOn(true)} className="tf-btn tf-btn-ghost" style={{ marginTop: 16 }}>+ Novo evento</button>
      ))}
    </section>
  );
}
