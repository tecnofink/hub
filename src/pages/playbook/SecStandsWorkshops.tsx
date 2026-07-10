/** [07] Stands 2027 · [08] Workshops. */
import React from 'react';
import type { PbStand, PbStandStatus, PbWorkshop } from '../../lib/playbook';
import { brl } from '../../lib/format';
import { MetricStat, L } from '../../components/ui';
import { pbId } from './usePlaybook';
import { BotaoRemover, CampoBlur, NumeroBlur, SecHead, UploadCampo } from './comum';

const STAND_STATUS: PbStandStatus[] = ['A avaliar', 'Orçamento solicitado', 'Reservado', 'Confirmado / Pago'];
const STATUS_COR: Record<PbStandStatus, string> = {
  'A avaliar': 'var(--tf-ink-3)',
  'Orçamento solicitado': 'var(--tf-warn)',
  'Reservado': 'var(--tf-accent)',
  'Confirmado / Pago': 'var(--tf-live)',
};

export function SecStands({ lista, podeEditar, salvar }: { lista: PbStand[]; podeEditar: boolean; salvar: (d: { lista: PbStand[] }) => void }) {
  const up = (id: string, fn: (s: PbStand) => PbStand) => salvar({ lista: lista.map((s) => (s.id === id ? fn(s) : s)) });
  const confirmados = lista.filter((s) => s.status === 'Confirmado / Pago').length;
  const investimento = lista.reduce((a, s) => a + (s.valor ?? 0), 0);

  return (
    <section>
      <SecHead id="stands2027" num="07" titulo="Stands 2027" sub="Planejamento antecipado dos stands do próximo ano: status, valores, prazos e documentos." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: '1px solid var(--tf-line)', borderRadius: 10, background: 'var(--tf-bg-pure)', overflow: 'hidden' }}>
        {[
          { v: String(lista.length), l: 'eventos no radar' },
          { v: String(confirmados), l: 'stands confirmados' },
          { v: brl(investimento), l: 'investimento previsto' },
        ].map((st, i) => (
          <div key={i} style={{ padding: '18px 22px', borderRight: i < 2 ? '1px solid var(--tf-line)' : 'none' }}>
            <MetricStat value={st.v} label={st.l} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 12, marginTop: 14 }}>
        {lista.sort((a, b) => a.ordem - b.ordem).map((s) => (
          <div key={s.id} className="tf-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CampoBlur valor={s.nome ?? ''} onSalvar={(v) => up(s.id, (x) => ({ ...x, nome: v }))} desabilitado={!podeEditar} placeholder="Nome do evento" style={{ fontWeight: 700, fontSize: '0.96rem', padding: '7px 10px', flex: 1 }} />
              <BotaoRemover podeEditar={podeEditar} titulo="Remover stand?" texto={`"${s.nome ?? 'Stand'}" sai do planejamento 2027.`} onConfirmar={() => salvar({ lista: lista.filter((x) => x.id !== s.id) })} />
            </div>
            <select
              className="f-select" value={s.status} disabled={!podeEditar}
              onChange={(e) => up(s.id, (x) => ({ ...x, status: e.target.value as PbStandStatus }))}
              style={{ fontWeight: 700, color: STATUS_COR[s.status], padding: '8px 10px', fontSize: '0.84rem' }}
            >
              {STAND_STATUS.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><L>Local</L><CampoBlur valor={s.local ?? ''} onSalvar={(v) => up(s.id, (x) => ({ ...x, local: v }))} desabilitado={!podeEditar} style={{ padding: '7px 10px', fontSize: '0.82rem' }} /></div>
              <div><L>Data do evento</L><CampoBlur valor={s.data ?? ''} onSalvar={(v) => up(s.id, (x) => ({ ...x, data: v }))} desabilitado={!podeEditar} style={{ padding: '7px 10px', fontSize: '0.82rem' }} /></div>
              <div><L>Comprar até</L><CampoBlur valor={s.dataLimite ?? ''} onSalvar={(v) => up(s.id, (x) => ({ ...x, dataLimite: v }))} desabilitado={!podeEditar} style={{ padding: '7px 10px', fontSize: '0.82rem' }} /></div>
              <div><L>Valor (R$)</L><NumeroBlur valor={s.valor} onSalvar={(v) => up(s.id, (x) => ({ ...x, valor: v }))} desabilitado={!podeEditar} largura={120} placeholder="—" /></div>
            </div>
            <div><L>Observações</L><CampoBlur area valor={s.obs ?? ''} onSalvar={(v) => up(s.id, (x) => ({ ...x, obs: v }))} desabilitado={!podeEditar} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <UploadCampo rotulo="Planta baixa" valor={s.docs.planta} pathPrefix={`stands/${s.id}/planta`} accept=".pdf,image/*" podeEditar={podeEditar} onSalvar={(arq) => up(s.id, (x) => ({ ...x, docs: { ...x.docs, planta: arq } }))} />
              <UploadCampo rotulo="Projeto do stand" valor={s.docs.projeto} pathPrefix={`stands/${s.id}/projeto`} accept=".pdf,image/*" podeEditar={podeEditar} onSalvar={(arq) => up(s.id, (x) => ({ ...x, docs: { ...x.docs, projeto: arq } }))} />
            </div>
          </div>
        ))}
      </div>
      {podeEditar && (
        <button
          onClick={() => salvar({ lista: [...lista, { id: pbId(), status: 'A avaliar', ordem: lista.reduce((a, x) => Math.max(a, x.ordem), 0) + 1, docs: {} }] })}
          className="tf-btn tf-btn-ghost" style={{ marginTop: 14 }}
        >
          + Novo stand
        </button>
      )}
    </section>
  );
}

export function SecWorkshops({ lista, podeEditar, salvar }: { lista: PbWorkshop[]; podeEditar: boolean; salvar: (d: { lista: PbWorkshop[] }) => void }) {
  const up = (id: string, fn: (w: PbWorkshop) => PbWorkshop) => salvar({ lista: lista.map((w) => (w.id === id ? fn(w) : w)) });

  return (
    <section>
      <SecHead id="workshops" num="08" titulo="Workshops" sub="Registro dos workshops técnicos: quem organizou, onde, quando e o que foi apresentado." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 12 }}>
        {lista.sort((a, b) => a.ordem - b.ordem).map((w) => (
          <div key={w.id} className="tf-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CampoBlur valor={w.tema} onSalvar={(v) => up(w.id, (x) => ({ ...x, tema: v }))} desabilitado={!podeEditar} placeholder="Tema do workshop" style={{ fontWeight: 700, fontSize: '0.96rem', padding: '7px 10px', flex: 1 }} />
              <BotaoRemover podeEditar={podeEditar} titulo="Remover workshop?" texto={`"${w.tema || 'Workshop'}" será removido.`} onConfirmar={() => salvar({ lista: lista.filter((x) => x.id !== w.id) })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div><L>Organizador</L><CampoBlur valor={w.organizador ?? ''} onSalvar={(v) => up(w.id, (x) => ({ ...x, organizador: v }))} desabilitado={!podeEditar} style={{ padding: '7px 10px', fontSize: '0.8rem' }} /></div>
              <div><L>Local</L><CampoBlur valor={w.local ?? ''} onSalvar={(v) => up(w.id, (x) => ({ ...x, local: v }))} desabilitado={!podeEditar} style={{ padding: '7px 10px', fontSize: '0.8rem' }} /></div>
              <div><L>Data</L><CampoBlur valor={w.data ?? ''} onSalvar={(v) => up(w.id, (x) => ({ ...x, data: v }))} desabilitado={!podeEditar} style={{ padding: '7px 10px', fontSize: '0.8rem' }} /></div>
            </div>
            <div>
              <L>Produtos apresentados</L>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {w.produtos.sort((a, b) => a.ordem - b.ordem).map((p) => (
                  <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--tf-line-2)', borderRadius: 999, padding: '4px 11px', fontSize: '0.78rem' }}>
                    {p.texto}
                    {podeEditar && <a className="acao" onClick={() => up(w.id, (x) => ({ ...x, produtos: x.produtos.filter((y) => y.id !== p.id) }))} style={{ color: 'var(--tf-crit)', fontWeight: 700 }}>×</a>}
                  </span>
                ))}
                {podeEditar && (
                  <input
                    className="f-input" placeholder="+ produto (Enter)" style={{ width: 150, padding: '4px 10px', fontSize: '0.76rem' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = (e.target as HTMLInputElement).value.trim();
                        if (v) { up(w.id, (x) => ({ ...x, produtos: [...x.produtos, { id: pbId(), texto: v, ordem: x.produtos.length }] })); (e.target as HTMLInputElement).value = ''; }
                      }
                    }}
                  />
                )}
              </div>
            </div>
            <div><L>Observações</L><CampoBlur area valor={w.obs ?? ''} onSalvar={(v) => up(w.id, (x) => ({ ...x, obs: v }))} desabilitado={!podeEditar} /></div>
          </div>
        ))}
      </div>
      {podeEditar && (
        <button
          onClick={() => salvar({ lista: [...lista, { id: pbId(), tema: '', ordem: lista.reduce((a, x) => Math.max(a, x.ordem), 0) + 1, produtos: [] }] })}
          className="tf-btn tf-btn-ghost" style={{ marginTop: 14 }}
        >
          + Novo workshop
        </button>
      )}
    </section>
  );
}
