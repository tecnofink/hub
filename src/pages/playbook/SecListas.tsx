/** [04] Associações · [05] Prospecção · [06] Brindes. */
import React from 'react';
import type { PbAssociacao, PbBrinde, PbDocProspeccao, PbParticipacao } from '../../lib/playbook';
import { useUI } from '../../store/AppStore';
import { pbId } from './usePlaybook';
import { BotaoRemover, CampoBlur, NumeroBlur, SecHead } from './comum';

/* ── [04] Associações ── */
export function SecAssociacoes({ lista, podeEditar, salvar }: { lista: PbAssociacao[]; podeEditar: boolean; salvar: (d: { lista: PbAssociacao[] }) => void }) {
  const up = (id: string, fn: (a: PbAssociacao) => PbAssociacao) => salvar({ lista: lista.map((a) => (a.id === id ? fn(a) : a)) });

  return (
    <section>
      <SecHead id="associacoes" num="04" titulo="Associações" sub="Entidades do setor e os descontos/benefícios que dão em stands e eventos." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
        {lista.sort((a, b) => a.ordem - b.ordem).map((a) => (
          <div key={a.id} className="tf-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CampoBlur valor={a.nome} onSalvar={(v) => up(a.id, (x) => ({ ...x, nome: v }))} desabilitado={!podeEditar} style={{ fontWeight: 700, fontSize: '1rem', padding: '7px 10px', flex: 1 }} />
              <BotaoRemover podeEditar={podeEditar} titulo="Remover associação?" texto={`"${a.nome}" e os benefícios dela serão removidos.`} onConfirmar={() => salvar({ lista: lista.filter((x) => x.id !== a.id) })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NumeroBlur valor={a.desconto} onSalvar={(v) => up(a.id, (x) => ({ ...x, desconto: v === undefined ? undefined : Math.min(100, v) }))} desabilitado={!podeEditar} largura={80} placeholder="—" />
              <span className="tf-small" style={{ fontSize: '0.78rem' }}>% de desconto em stands e eventos</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {a.beneficios.sort((x, y) => x.ordem - y.ordem).map((b) => (
                <div key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--tf-accent)', flex: 'none' }}>•</span>
                  <CampoBlur
                    valor={b.texto} desabilitado={!podeEditar} style={{ flex: 1, padding: '5px 9px', fontSize: '0.82rem', border: 'none', background: 'transparent' }}
                    onSalvar={(v) => up(a.id, (x) => ({ ...x, beneficios: v.trim() ? x.beneficios.map((y) => (y.id === b.id ? { ...y, texto: v } : y)) : x.beneficios.filter((y) => y.id !== b.id) }))}
                  />
                </div>
              ))}
              {podeEditar && (
                <input
                  className="f-input" placeholder="+ benefício (Enter)" style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value.trim();
                      if (v) { up(a.id, (x) => ({ ...x, beneficios: [...x.beneficios, { id: pbId(), texto: v, ordem: x.beneficios.length }] })); (e.target as HTMLInputElement).value = ''; }
                    }
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {podeEditar && (
        <button
          onClick={() => salvar({ lista: [...lista, { id: pbId(), nome: 'Nova associação', ordem: lista.reduce((a, x) => Math.max(a, x.ordem), 0) + 1, beneficios: [] }] })}
          className="tf-btn tf-btn-ghost" style={{ marginTop: 14 }}
        >
          + Nova associação
        </button>
      )}
    </section>
  );
}

/* ── [05] Prospecção ── */
const PARTICIPACOES: PbParticipacao[] = ['A avaliar', 'Stand', 'Presença de equipe', 'Stand + equipe'];

export function SecProspeccao({ dados, podeEditar, salvar }: { dados: PbDocProspeccao; podeEditar: boolean; salvar: (d: PbDocProspeccao) => void }) {
  const ui = useUI();
  return (
    <section>
      <SecHead id="avaliacao" num="05" titulo="Prospecção" sub="Sugestões de novos eventos por setor da indústria — avalie a forma de participação." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {dados.setores.sort((a, b) => a.ordem - b.ordem).map((s) => {
          const evs = dados.eventos.filter((e) => e.setorId === s.id).sort((a, b) => a.ordem - b.ordem);
          return (
            <div key={s.id} className="tf-card" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.05rem' }}>{s.nome}</span>
                <span className="tf-mono" style={{ fontSize: '0.58rem' }}>{evs.length} EVENTO{evs.length === 1 ? '' : 'S'}</span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {evs.map((e) => (
                  <div key={e.id} className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 170px 1fr 1fr 30px', gap: 8, alignItems: 'center' }}>
                    <CampoBlur valor={e.nome} onSalvar={(v) => salvar({ ...dados, eventos: dados.eventos.map((x) => (x.id === e.id ? { ...x, nome: v } : x)) })} desabilitado={!podeEditar} style={{ padding: '7px 10px', fontSize: '0.84rem', fontWeight: 600 }} />
                    <select
                      className="f-select" value={e.participacao} disabled={!podeEditar} style={{ padding: '7px 8px', fontSize: '0.78rem' }}
                      onChange={(ev2) => salvar({ ...dados, eventos: dados.eventos.map((x) => (x.id === e.id ? { ...x, participacao: ev2.target.value as PbParticipacao } : x)) })}
                    >
                      {PARTICIPACOES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <CampoBlur mono valor={e.link ?? ''} onSalvar={(v) => salvar({ ...dados, eventos: dados.eventos.map((x) => (x.id === e.id ? { ...x, link: v || undefined } : x)) })} desabilitado={!podeEditar} placeholder="https://…" style={{ flex: 1, padding: '7px 9px' }} />
                      {e.link && <a href={e.link} target="_blank" rel="noreferrer" className="tf-mono" style={{ fontSize: '0.66rem', color: 'var(--tf-accent)', flex: 'none' }}>↗</a>}
                    </div>
                    <CampoBlur valor={e.obs ?? ''} onSalvar={(v) => salvar({ ...dados, eventos: dados.eventos.map((x) => (x.id === e.id ? { ...x, obs: v } : x)) })} desabilitado={!podeEditar} placeholder="Obs" style={{ padding: '7px 10px', fontSize: '0.8rem' }} />
                    <BotaoRemover podeEditar={podeEditar} titulo="Remover evento?" texto={`"${e.nome}" sai da prospecção.`} onConfirmar={() => salvar({ ...dados, eventos: dados.eventos.filter((x) => x.id !== e.id) })} />
                  </div>
                ))}
                {podeEditar && (
                  <input
                    className="f-input" placeholder="+ evento neste setor (Enter)" style={{ maxWidth: 300, padding: '6px 11px', fontSize: '0.8rem' }}
                    onKeyDown={(ev2) => {
                      if (ev2.key === 'Enter') {
                        const v = (ev2.target as HTMLInputElement).value.trim();
                        if (v) {
                          salvar({ ...dados, eventos: [...dados.eventos, { id: pbId(), setorId: s.id, nome: v, participacao: 'A avaliar', obs: '', ordem: evs.length }] });
                          (ev2.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {podeEditar && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            className="f-input" placeholder="+ setor da indústria (Enter)" style={{ maxWidth: 280, padding: '8px 12px', fontSize: '0.84rem' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) {
                  salvar({ ...dados, setores: [...dados.setores, { id: pbId(), nome: v, ordem: dados.setores.reduce((a, x) => Math.max(a, x.ordem), 0) + 1 }] });
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
          {dados.setores.length > 0 && (
            <button
              onClick={() => {
                const ultimo = [...dados.setores].sort((a, b) => a.ordem - b.ordem)[dados.setores.length - 1];
                ui.confirmar({
                  titulo: 'Remover setor?', texto: `"${ultimo.nome}" e os eventos dele saem da prospecção.`, cta: 'Remover', danger: true,
                  onConfirm: () => salvar({ setores: dados.setores.filter((x) => x.id !== ultimo.id), eventos: dados.eventos.filter((x) => x.setorId !== ultimo.id) }),
                });
              }}
              className="tf-btn tf-btn-ghost tf-btn-danger" style={{ padding: '8px 13px', fontSize: '0.78rem' }}
            >
              Remover último setor
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ── [06] Brindes ── */
export function SecBrindes({ lista, podeEditar, salvar }: { lista: PbBrinde[]; podeEditar: boolean; salvar: (d: { lista: PbBrinde[] }) => void }) {
  const up = (id: string, fn: (b: PbBrinde) => PbBrinde) => salvar({ lista: lista.map((b) => (b.id === id ? fn(b) : b)) });

  return (
    <section>
      <SecHead id="brindes" num="06" titulo="Brindes" sub="Controle de estoque e saídas dos brindes de feira." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
        {lista.sort((a, b) => a.ordem - b.ordem).map((b) => {
          const usado = b.usos.reduce((a, u) => a + u.qtd, 0);
          const saldo = (b.estoqueInicial ?? 0) - usado;
          const cor = saldo < 0 ? 'var(--tf-crit)' : b.estoqueInicial && saldo <= b.estoqueInicial * 0.1 ? 'var(--tf-warn)' : 'var(--tf-accent)';
          return (
            <div key={b.id} className="tf-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <CampoBlur valor={b.nome} onSalvar={(v) => up(b.id, (x) => ({ ...x, nome: v }))} desabilitado={!podeEditar} style={{ fontWeight: 700, fontSize: '0.96rem', padding: '6px 9px', flex: 1 }} />
                <BotaoRemover podeEditar={podeEditar} titulo="Remover brinde?" texto={`"${b.nome}" e as saídas dele serão removidos.`} onConfirmar={() => salvar({ lista: lista.filter((x) => x.id !== b.id) })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                <div>
                  <div className="tf-mono" style={{ fontSize: '0.54rem' }}>ESTOQUE INICIAL</div>
                  {podeEditar
                    ? <NumeroBlur valor={b.estoqueInicial} onSalvar={(v) => up(b.id, (x) => ({ ...x, estoqueInicial: v }))} largura={86} placeholder="—" />
                    : <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.4rem' }}>{b.estoqueInicial ?? '—'}</div>}
                </div>
                <div>
                  <div className="tf-mono" style={{ fontSize: '0.54rem' }}>USADO</div>
                  <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.4rem' }}>{usado}</div>
                </div>
                <div>
                  <div className="tf-mono" style={{ fontSize: '0.54rem' }}>SALDO ATUAL</div>
                  <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.4rem', color: cor }}>{b.estoqueInicial === undefined ? '—' : saldo}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--tf-line)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="tf-mono" style={{ fontSize: '0.54rem' }}>SAÍDAS / USO</span>
                {b.usos.sort((x, y) => x.ordem - y.ordem).map((u) => (
                  <div key={u.id} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                    <CampoBlur valor={u.motivo ?? ''} onSalvar={(v) => up(b.id, (x) => ({ ...x, usos: x.usos.map((y) => (y.id === u.id ? { ...y, motivo: v } : y)) }))} desabilitado={!podeEditar} placeholder="Motivo" style={{ flex: 1, padding: '5px 9px', fontSize: '0.78rem' }} />
                    <NumeroBlur valor={u.qtd} onSalvar={(v) => up(b.id, (x) => ({ ...x, usos: x.usos.map((y) => (y.id === u.id ? { ...y, qtd: v ?? 0 } : y)) }))} desabilitado={!podeEditar} largura={70} />
                    {podeEditar && <button type="button" className="acao foco-tf" onClick={() => up(b.id, (x) => ({ ...x, usos: x.usos.filter((y) => y.id !== u.id) }))} style={{ color: 'var(--tf-crit)', fontWeight: 700 }}>×</button>}
                  </div>
                ))}
                {podeEditar && (
                  <button onClick={() => up(b.id, (x) => ({ ...x, usos: [...x.usos, { id: pbId(), qtd: 0, ordem: x.usos.length }] }))} className="tf-btn tf-btn-ghost" style={{ alignSelf: 'flex-start', padding: '5px 11px', fontSize: '0.74rem' }}>
                    + Saída
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {podeEditar && (
        <button
          onClick={() => salvar({ lista: [...lista, { id: pbId(), nome: 'Novo brinde', ordem: lista.reduce((a, x) => Math.max(a, x.ordem), 0) + 1, usos: [] }] })}
          className="tf-btn tf-btn-ghost" style={{ marginTop: 14 }}
        >
          + Novo brinde
        </button>
      )}
    </section>
  );
}
