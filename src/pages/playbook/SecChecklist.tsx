/**
 * [03] Página da Feira — seletor de feiras + abas Logística & Stand /
 * Checklist / Captação de Leads / Portal do Expositor.
 * A árvore do checklist (setores → categorias → itens) é global; as marcações,
 * a logística, os leads e o portal são por feira (playbookFeira/{eventoId}).
 */
import React, { useState } from 'react';
import type { PbDocChecklist, PbEvento, PbFeira } from '../../lib/playbook';
import { useStore } from '../../store/AppStore';
import { pbId, useFeira } from './usePlaybook';
import { CampoBlur, SecHead } from './comum';
import AbasFeira from './AbasFeira';

type Aba = 'logistica' | 'checklist' | 'leads' | 'portal';
const ABAS: [Aba, string][] = [
  ['logistica', 'Logística & Stand'],
  ['checklist', 'Checklist'],
  ['leads', 'Captação de Leads'],
  ['portal', 'Portal do Expositor'],
];

export default function SecChecklist({ eventos, arvore, podeEditar, salvarArvore }: {
  eventos: PbEvento[];
  arvore: PbDocChecklist;
  podeEditar: boolean;
  salvarArvore: (d: PbDocChecklist) => void;
}) {
  const [feiraId, setFeiraId] = useState<string | null>(eventos[0]?.id ?? null);
  const [aba, setAba] = useState<Aba>('checklist');
  const { feira, salvar: salvarFeira } = useFeira(feiraId);

  const evento = eventos.find((e) => e.id === feiraId) ?? null;
  const totalItens = arvore.itens.length;

  return (
    <section>
      <SecHead id="checklist" num="03" titulo="Página da Feira" sub="Tudo de cada feira em um lugar: logística, checklist de materiais, leads e o portal do expositor." />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {eventos.map((ev, i) => {
          const on = ev.id === feiraId;
          return (
            <button
              key={ev.id}
              onClick={() => setFeiraId(ev.id)}
              style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', padding: '10px 16px', borderRadius: 10, border: '1px solid ' + (on ? 'var(--tf-accent)' : 'var(--tf-line-2)'), background: on ? 'var(--tf-accent)' : 'var(--tf-bg-pure)', color: on ? '#fff' : 'var(--tf-ink-2)', cursor: 'pointer', minWidth: 130 }}
            >
              <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.54rem', opacity: 0.75 }}>
                [{String(i + 1).padStart(2, '0')}]{ev.status === 'CONCLUÍDO' ? ' ✓' : ''}
              </span>
              <span style={{ fontFamily: 'var(--tf-font-body)', fontWeight: 700, fontSize: '0.86rem' }}>{ev.nome}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{ev.data}</span>
            </button>
          );
        })}
      </div>

      {evento && (
        <div className="tf-card" style={{ marginTop: 16, padding: '22px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h3 className="tf-h4" style={{ margin: 0 }}>{evento.nome}</h3>
              <span className="tf-small" style={{ fontSize: '0.78rem' }}>{[evento.local, evento.data].filter(Boolean).join(' · ')}</span>
            </div>
            <span className="tf-mono" style={{ fontSize: '0.62rem' }}>
              {Object.values(feira.checklist).filter((m) => m.marcado).length} DE {totalItens} ITENS MARCADOS
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5, borderBottom: '1px solid var(--tf-line)', margin: '16px 0 20px', overflowX: 'auto' }}>
            {ABAS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                style={{ padding: '9px 15px', border: 'none', borderBottom: '2px solid ' + (aba === id ? 'var(--tf-accent)' : 'transparent'), background: 'none', color: aba === id ? 'var(--tf-accent)' : 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-body)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* key remonta os campos não-controlados ao trocar de feira */}
          <div key={feiraId ?? ''}>
            {aba === 'checklist' && (
              <AbaChecklist arvore={arvore} feira={feira} podeEditar={podeEditar} salvarFeira={salvarFeira} salvarArvore={salvarArvore} />
            )}
            {aba !== 'checklist' && (
              <AbasFeira aba={aba} eventoId={feiraId!} feira={feira} salvar={salvarFeira} podeEditar={podeEditar} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Aba Checklist: árvore global + marcações da feira ── */
function AbaChecklist({ arvore, feira, podeEditar, salvarFeira, salvarArvore }: {
  arvore: PbDocChecklist;
  feira: PbFeira;
  podeEditar: boolean;
  salvarFeira: (f: PbFeira) => void;
  salvarArvore: (d: PbDocChecklist) => void;
}) {
  const [estruturaOn, setEstruturaOn] = useState(false);

  const setMarcacao = (itemId: string, patch: Partial<{ marcado: boolean; qtd?: number }>) => {
    const atual = feira.checklist[itemId] ?? { marcado: false };
    salvarFeira({ ...feira, checklist: { ...feira.checklist, [itemId]: { ...atual, ...patch } } });
  };

  const marcarCategoria = (catId: string, marcado: boolean) => {
    const itens = arvore.itens.filter((i) => i.categoriaId === catId);
    const novo = { ...feira.checklist };
    itens.forEach((i) => { novo[i.id] = { ...(novo[i.id] ?? {}), marcado }; });
    salvarFeira({ ...feira, checklist: novo });
  };

  const categoriasDe = (setorId?: string) =>
    arvore.categorias
      .filter((c) => (setorId ? c.setorId === setorId : !c.setorId || !arvore.setores.some((s) => s.id === c.setorId)))
      .sort((a, b) => a.ordem - b.ordem);

  const blocoCategoria = (catId: string, nome: string) => {
    const itens = arvore.itens.filter((i) => i.categoriaId === catId).sort((a, b) => a.ordem - b.ordem);
    const marcados = itens.filter((i) => feira.checklist[i.id]?.marcado).length;
    return (
      <div key={catId} style={{ border: '1px solid var(--tf-line)', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{nome}</span>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="tf-mono" style={{ fontSize: '0.56rem' }}>{marcados}/{itens.length}</span>
            {podeEditar && itens.length > 0 && (
              <button type="button" className="acao foco-tf" onClick={() => marcarCategoria(catId, marcados < itens.length)} style={{ fontSize: '0.72rem', color: 'var(--tf-accent)' }}>
                {marcados < itens.length ? 'marcar tudo' : 'desmarcar'}
              </button>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {itens.map((i) => {
            const m = feira.checklist[i.id];
            return (
              <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem', color: m?.marcado ? 'var(--tf-ink-3)' : 'var(--tf-ink)', cursor: podeEditar ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={!!m?.marcado} disabled={!podeEditar} onChange={(e) => setMarcacao(i.id, { marcado: e.target.checked })} />
                <input
                  type="number" min={0} defaultValue={m?.qtd ?? ''} disabled={!podeEditar} placeholder="—"
                  onBlur={(e) => { const v = e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)); if (v !== m?.qtd) setMarcacao(i.id, { qtd: v }); }}
                  style={{ width: 54, padding: '3px 6px', border: '1px solid var(--tf-line)', borderRadius: 5, background: 'var(--tf-bg-pure)', color: 'var(--tf-ink)', fontFamily: 'var(--tf-font-mono)', fontSize: '0.72rem' }}
                  onClick={(e) => e.preventDefault()}
                />
                <span style={{ textDecoration: m?.marcado ? 'line-through' : 'none' }}>{i.nome}</span>
              </label>
            );
          })}
          {itens.length === 0 && <span className="tf-small" style={{ fontSize: '0.74rem' }}>Sem itens.</span>}
        </div>
      </div>
    );
  };

  return (
    <div>
      {arvore.setores.sort((a, b) => a.ordem - b.ordem).map((s) => {
        const cats = categoriasDe(s.id);
        if (!cats.length) return null;
        return (
          <div key={s.id} style={{ marginBottom: 18 }}>
            <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 8 }}>[ {s.nome.toUpperCase()} ]</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 10 }}>
              {cats.map((c) => blocoCategoria(c.id, c.nome))}
            </div>
          </div>
        );
      })}
      {categoriasDe(undefined).length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 8 }}>[ GERAL ]</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 10 }}>
            {categoriasDe(undefined).map((c) => blocoCategoria(c.id, c.nome))}
          </div>
        </div>
      )}

      {podeEditar && (
        <div style={{ borderTop: '1px dashed var(--tf-line-2)', paddingTop: 14 }}>
          <button type="button" className="acao foco-tf" onClick={() => setEstruturaOn((v) => !v)} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tf-accent)' }}>
            {estruturaOn ? '▾ Ocultar edição da estrutura' : '▸ Editar estrutura do checklist (vale para todas as feiras)'}
          </button>
          {estruturaOn && <EditorEstrutura arvore={arvore} salvar={salvarArvore} />}
        </div>
      )}
      {!podeEditar && <p className="tf-small" style={{ fontSize: '0.74rem', margin: '10px 0 0' }}>Somente editores marcam itens e alteram a estrutura.</p>}
    </div>
  );
}

/* ── Edição da árvore global (setores → categorias → itens) ── */
function EditorEstrutura({ arvore, salvar }: { arvore: PbDocChecklist; salvar: (d: PbDocChecklist) => void }) {
  const store = useStore();
  const prox = (arr: { ordem: number }[]) => arr.reduce((a, x) => Math.max(a, x.ordem), 0) + 1;

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {arvore.setores.sort((a, b) => a.ordem - b.ordem).map((s) => (
        <div key={s.id} style={{ border: '1px solid var(--tf-line)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <CampoBlur valor={s.nome} onSalvar={(v) => salvar({ ...arvore, setores: arvore.setores.map((x) => (x.id === s.id ? { ...x, nome: v } : x)) })} style={{ maxWidth: 320, padding: '7px 10px', fontSize: '0.86rem', fontWeight: 700 }} />
            <span className="tf-mono" style={{ fontSize: '0.56rem', flex: 1 }}>SETOR</span>
            <button
              type="button"
              className="acao foco-tf"
              onClick={() => store.confirmar({
                titulo: 'Remover setor?', texto: `As categorias de "${s.nome}" ficam soltas na seção Geral (não são apagadas).`, cta: 'Remover', danger: true,
                onConfirm: () => salvar({ ...arvore, setores: arvore.setores.filter((x) => x.id !== s.id) }),
              })}
              style={{ color: 'var(--tf-crit)', fontWeight: 700 }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {arvore.categorias.filter((c) => c.setorId === s.id).sort((a, b) => a.ordem - b.ordem).map((c) => (
              <div key={c.id} style={{ paddingLeft: 14, borderLeft: '2px solid var(--tf-line)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <CampoBlur valor={c.nome} onSalvar={(v) => salvar({ ...arvore, categorias: arvore.categorias.map((x) => (x.id === c.id ? { ...x, nome: v } : x)) })} style={{ maxWidth: 300, padding: '6px 9px', fontSize: '0.82rem' }} />
                  <button
                    type="button"
                    className="acao foco-tf"
                    onClick={() => store.confirmar({
                      titulo: 'Remover categoria?', texto: `"${c.nome}" e os itens dela saem do checklist de todas as feiras.`, cta: 'Remover', danger: true,
                      onConfirm: () => salvar({ ...arvore, categorias: arvore.categorias.filter((x) => x.id !== c.id), itens: arvore.itens.filter((i) => i.categoriaId !== c.id) }),
                    })}
                    style={{ color: 'var(--tf-crit)', fontWeight: 700 }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 0' }}>
                  {arvore.itens.filter((i) => i.categoriaId === c.id).sort((a, b) => a.ordem - b.ordem).map((i) => (
                    <span key={i.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--tf-line)', borderRadius: 999, padding: '3px 10px', fontSize: '0.76rem' }}>
                      {i.nome}
                      <button type="button" className="acao foco-tf" onClick={() => salvar({ ...arvore, itens: arvore.itens.filter((x) => x.id !== i.id) })} style={{ color: 'var(--tf-crit)', fontWeight: 700 }}>×</button>
                    </span>
                  ))}
                  <input
                    className="f-input" placeholder="+ item (Enter)"
                    style={{ width: 150, padding: '4px 9px', fontSize: '0.76rem' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = (e.target as HTMLInputElement).value.trim();
                        if (v) {
                          salvar({ ...arvore, itens: [...arvore.itens, { id: pbId(), categoriaId: c.id, nome: v, ordem: prox(arvore.itens.filter((i) => i.categoriaId === c.id)) }] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ))}
            <input
              className="f-input" placeholder="+ categoria (Enter)"
              style={{ maxWidth: 240, padding: '5px 10px', fontSize: '0.78rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) {
                    salvar({ ...arvore, categorias: [...arvore.categorias, { id: pbId(), nome: v, setorId: s.id, ordem: prox(arvore.categorias) }] });
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        </div>
      ))}
      <input
        className="f-input" placeholder="+ setor (Enter)"
        style={{ maxWidth: 280, padding: '7px 12px', fontSize: '0.84rem' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const v = (e.target as HTMLInputElement).value.trim();
            if (v) {
              salvar({ ...arvore, setores: [...arvore.setores, { id: pbId(), nome: v, ordem: prox(arvore.setores) }] });
              (e.target as HTMLInputElement).value = '';
            }
          }
        }}
      />
    </div>
  );
}
