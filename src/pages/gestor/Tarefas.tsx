/**
 * C9 · Quadro do projeto (RF-45..49), reconciliado com o gestor do CRM (P15):
 * anel de progresso, resumo por etapa, distribuição por status, Gantt de etapas
 * com preenchimento de progresso e marcador de hoje, quadro com visões
 * "Por etapa" / "Por status", drag-and-drop com Desfazer (5 s), alerta de
 * atrasadas por projeto/dia e papéis admin/editor/leitor.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr, dbrCurto, diffDias, mesesNoIntervalo, mesAbrevAno, todayISO } from '../../lib/dates';
import { Badge, L, Pill } from '../../components/ui';
import type { Tarefa, TaskStatusDerivado } from '../../lib/types';
import TaskModal from './TaskModal';
import { exibirResponsavel, ST_COLS, ST_LABEL, stCor, stDe } from './taskUtils';

const ITENS_POR_COLUNA = 10;

/** Setas de rolagem do quadro (mesmo estilo do kanban do Flux). */
function setaStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', [side]: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 5,
    width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--tf-line-2)',
    background: 'color-mix(in srgb, var(--tf-bg-pure) 60%, transparent)', color: 'var(--tf-ink)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: 'var(--tf-shadow)', fontSize: '1.45rem', lineHeight: 1, padding: '0 0 3px',
  } as React.CSSProperties;
}

export default function Tarefas() {
  const store = useStore();
  const { me, state, cicloAtivo: c } = store;
  const { id } = useParams();
  const nav = useNavigate();
  const [view, setView] = useState<'etapa' | 'status'>(() => {
    try { return (localStorage.getItem('pf-kanban-view') as 'etapa' | 'status') ?? 'etapa'; } catch { return 'etapa'; }
  });
  const [tkModal, setTkModal] = useState<string | null>(null);
  const [ntOn, setNtOn] = useState(false);
  const [expandida, setExpandida] = useState<Record<string, boolean>>({});
  const [dragSobre, setDragSobre] = useState<string | null>(null);
  const [overdueOn, setOverdueOn] = useState(false);
  const kbRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  const flux = id ? store.proj(id) : undefined;
  const livre = id ? state.extraProjs.find((x) => x.id === id) : undefined;
  const papel = id ? store.papelNoProjeto(id) : null;

  const q = store.quadroDe(id ?? '');
  const atrasadas = useMemo(() => q.tasks.filter((t) => stDe(t) === 'atras').sort((a, b) => a.prazo.localeCompare(b.prazo)), [q.tasks]);

  // alerta de atrasadas: por projeto e por dia (CRM/OverduePopup)
  useEffect(() => {
    if (!id || !atrasadas.length) return;
    const chave = `pf-overdue-${id}-${todayISO()}`;
    try {
      if (!localStorage.getItem(chave)) {
        const t = window.setTimeout(() => setOverdueOn(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch { /* sem storage */ }
  }, [id, atrasadas.length]);

  useEffect(() => {
    try { localStorage.setItem('pf-kanban-view', view); } catch { /* sem storage */ }
  }, [view]);

  if (!me || !id || (!flux && !livre) || !papel) return <Navigate to="/tarefas" replace />;

  const nome = flux ? flux.nome : livre!.nome;
  const podeEditar = papel === 'admin' || papel === 'editor';
  const membros = flux
    ? [store.byId(flux.uid)].filter(Boolean) as NonNullable<ReturnType<typeof store.byId>>[]
    : livre!.membrosIds.map((m) => store.byId(m)).filter(Boolean) as NonNullable<ReturnType<typeof store.byId>>[];

  const counts: Record<TaskStatusDerivado, number> = { conc: 0, and: 0, rev: 0, atras: 0, nao: 0 };
  q.tasks.forEach((t) => { counts[stDe(t)]++; });
  const total = q.tasks.length;
  const pct = total ? Math.round((counts.conc / total) * 100) : 0;

  const rangeIni = flux && c ? c.inicio : q.etapas.reduce((a, e) => (e.inicio < a ? e.inicio : a), q.etapas[0]?.inicio ?? todayISO());
  const rangeFim = flux && c ? c.fim : q.etapas.reduce((a, e) => (e.fim > a ? e.fim : a), q.etapas[0]?.fim ?? todayISO());
  const pctOf = (iso: string) => {
    const span = Math.max(1, diffDias(rangeIni, rangeFim));
    return Math.min(100, Math.max(0, (diffDias(rangeIni, iso) / span) * 100));
  };

  const etapaTasks = (eid: string) => q.tasks.filter((t) => t.et === eid);
  const etapaState = (eid: string): TaskStatusDerivado => {
    const ts = etapaTasks(eid);
    if (!ts.length) return 'nao';
    if (ts.every((t) => stDe(t) === 'conc')) return 'conc';
    if (ts.some((t) => stDe(t) === 'atras')) return 'atras';
    if (ts.some((t) => stDe(t) !== 'nao')) return 'and';
    return 'nao';
  };

  const cols: { key: string; label: string; tasks: Tarefa[]; dropavel: boolean }[] = view === 'etapa'
    ? q.etapas.map((e) => ({ key: e.id, label: `${e.id} · ${e.nome.toUpperCase()}`, tasks: etapaTasks(e.id), dropavel: true }))
    : ST_COLS.map((k) => ({ key: k, label: ST_LABEL[k].toUpperCase(), tasks: q.tasks.filter((t) => stDe(t) === k), dropavel: k !== 'atras' }));

  const tarefaModal = tkModal ? q.tasks.find((t) => t.id === tkModal) : null;

  const soltar = (colKey: string, dropavel: boolean) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragSobre(null);
    if (!podeEditar || !dropavel) return;
    const tid = e.dataTransfer.getData('text/pf-tarefa');
    if (!tid) return;
    const destino = view === 'etapa' ? { et: colKey } : { st: colKey as 'nao' | 'and' | 'rev' | 'conc' };
    const desfazer = store.moverTarefa(id, tid, destino);
    if (desfazer) store.showToast('Tarefa movida.', { label: 'Desfazer', fn: desfazer });
  };

  const segs = (['conc', 'and', 'rev', 'atras', 'nao'] as TaskStatusDerivado[]).filter((k) => counts[k] > 0);

  // rolagem do quadro por hover nas setas — mesmo padrão do kanban do Flux
  const scrollStart = (dx: number) => {
    scrollStop();
    timer.current = window.setInterval(() => { if (kbRef.current) kbRef.current.scrollLeft += dx; }, 16);
  };
  const scrollStop = () => { if (timer.current) { window.clearInterval(timer.current); timer.current = null; } };

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 32px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <a onClick={() => nav('/tarefas')} className="back-link">← GESTOR DE TAREFAS / MEUS PROJETOS</a>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {livre && papel === 'admin' && (
            <button onClick={() => nav('/tarefas/' + id + '/admin')} className="tf-btn tf-btn-ghost">Gerenciar projeto</button>
          )}
          {flux && flux.ciclo !== 'backlog' && (
            <button onClick={() => nav('/flux/projeto/' + flux.id)} className="tf-btn tf-btn-ghost">Ver ficha do projeto no Flux →</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        {flux ? (
          <img src="/brand/flux-badge.png" alt="Projeto do Flux" style={{ width: 42, height: 42 }} />
        ) : (
          <img src="/brand/gestor-badge.png" alt="Projeto livre" style={{ height: 36 }} />
        )}
        <div style={{ flex: 1, minWidth: 240 }}>
          <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>
            [ {flux ? 'GESTOR DE TAREFAS · PROJETO DO FLUX' : 'GESTOR DE TAREFAS · PROJETO LIVRE'}{livre ? ' · ' + membros.length + ' MEMBRO' + (membros.length > 1 ? 'S' : '') : ''} ]
          </span>
          <h1 className="tf-h3" style={{ margin: '6px 0 0', fontSize: '1.7rem' }}>{nome}</h1>
          {livre?.descricao && <p className="tf-small" style={{ margin: '4px 0 0', maxWidth: 620 }}>{livre.descricao}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 56, height: 56 }} title={`${counts.conc} de ${total} concluídas`}>
            <svg width="56" height="56" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--tf-line)" strokeWidth="3.6" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--tf-accent)" strokeWidth="3.6" strokeLinecap="round" strokeDasharray={`${pct}, 100`} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.64rem', color: 'var(--tf-ink)' }}>{pct}%</span>
          </div>
          <span className="tf-mono" style={{ fontSize: '0.6rem', maxWidth: 120, lineHeight: 1.5 }}>{counts.conc} DE {total} TAREFAS CONCLUÍDAS</span>
        </div>
      </div>

      {/* resumo por etapa (RF-47 / PhasesRow do CRM) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(198px,1fr))', gap: 12, marginTop: 26 }}>
        {q.etapas.map((e) => {
          const ts = etapaTasks(e.id);
          const done = ts.filter((t) => stDe(t) === 'conc').length;
          const st = etapaState(e.id);
          const pc = ts.length ? Math.round((done / ts.length) * 100) : 0;
          return (
            <div key={e.id} style={{ background: st === 'conc' ? 'rgba(30,142,62,0.07)' : st === 'atras' ? 'rgba(214,43,43,0.05)' : 'var(--tf-bg-pure)', border: '1px solid var(--tf-line)', borderRadius: 12, padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="tf-mono" style={{ fontSize: '0.6rem' }}>{e.id}</span>
                {st === 'conc' && <span style={{ color: 'var(--tf-live)', fontSize: '0.85rem', fontWeight: 700 }}>✓</span>}
                {st === 'atras' && <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(214,43,43,0.12)', color: 'var(--tf-crit)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800 }}>!</span>}
              </div>
              <span style={{ fontFamily: 'var(--tf-font-body)', fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.3, minHeight: 38 }}>{e.nome}</span>
              <div>
                <div className="tf-mono" style={{ fontSize: '0.54rem', marginBottom: 3 }}>PRAZO FINAL</div>
                <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.05rem' }}>{dbr(e.fim)}</div>
              </div>
              <div>
                <div style={{ height: 4, background: 'var(--tf-bg-3)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pc + '%', background: stCor(st === 'nao' ? 'and' : st), borderRadius: 999 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span className="tf-mono" style={{ fontSize: '0.56rem' }}>{done}/{ts.length}</span>
                  <span className="tf-mono" style={{ fontSize: '0.56rem' }}>{pc}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* distribuição por status (StatusBar do CRM, com Em revisão) */}
      {total > 0 && (
        <div className="tf-card" style={{ marginTop: 14, padding: '18px 22px' }}>
          <div style={{ display: 'flex', height: 22, borderRadius: 999, overflow: 'hidden', background: 'var(--tf-bg-3)' }}>
            {segs.map((k) => {
              const p = Math.round((counts[k] / total) * 100);
              return (
                <div key={k} title={ST_LABEL[k] + ': ' + counts[k]} style={{ width: (counts[k] / total) * 100 + '%', background: stCor(k), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--tf-font-mono)', fontSize: '0.56rem' }}>
                  {p >= 8 ? p + '%' : ''}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap' }}>
            {(['conc', 'and', 'rev', 'atras', 'nao'] as TaskStatusDerivado[]).map((k) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: 'var(--tf-ink-2)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: stCor(k) }} />
                {ST_LABEL[k]}: {counts[k]} ({Math.round((counts[k] / total) * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* linha do tempo / Gantt de etapas (RF-47 + GanttChart do CRM) */}
      <div className="tf-card" style={{ marginTop: 14, padding: '24px 26px' }}>
        <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ 01 · LINHA DO TEMPO ]</span>
        <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 640 }}>
        <div style={{ position: 'relative', marginTop: 16 }}>
          <div style={{ position: 'relative', height: 20, marginLeft: 190 }}>
            {mesesNoIntervalo(rangeIni, rangeFim).map((m) => (
              <span key={m} className="tf-mono" style={{ position: 'absolute', left: pctOf(m) + '%', fontSize: '0.56rem', color: 'var(--tf-ink-3)' }}>{mesAbrevAno(m)}</span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {q.etapas.map((e) => {
              const left = pctOf(e.inicio);
              const w = Math.max(2, pctOf(e.fim) - left);
              const st = etapaState(e.id);
              const ts = etapaTasks(e.id);
              const done = ts.filter((t) => stDe(t) === 'conc').length;
              const prog = ts.length ? done / ts.length : 0;
              return (
                <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tf-ink-2)', textAlign: 'right', lineHeight: 1.25 }}>{e.nome}</span>
                  <div style={{ position: 'relative', height: 22, background: 'var(--tf-bg-2)', borderRadius: 6 }} title={`${done}/${ts.length} (${Math.round(prog * 100)}%)`}>
                    <div style={{ position: 'absolute', top: 3, bottom: 3, left: left + '%', width: w + '%', background: st === 'nao' ? 'var(--tf-bg-3)' : 'color-mix(in srgb, ' + stCor(st) + ' 30%, transparent)', border: '1px solid ' + (st === 'nao' ? 'var(--tf-line-2)' : stCor(st)), borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: prog * 100 + '%', background: stCor(st === 'nao' ? 'and' : st), opacity: 0.9 }} />
                    </div>
                    <span className="tf-mono" style={{ position: 'absolute', left: `calc(${left}% + ${w}% + 8px)`, top: 5, fontSize: '0.54rem', whiteSpace: 'nowrap', color: 'var(--tf-ink-3)' }}>
                      {dbrCurto(e.inicio)} → {dbrCurto(e.fim)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(190px + (100% - 190px) * ${pctOf(todayISO()) / 100})`, borderLeft: '2px dashed var(--tf-warn)' }}>
            <span className="tf-mono" style={{ position: 'absolute', top: -1, left: 5, fontSize: '0.54rem', color: 'var(--tf-warn)' }}>HOJE</span>
          </div>
        </div>
        </div>
        </div>
      </div>

      {/* quadro de tarefas (RF-47/48 + Kanban do CRM) */}
      <div className="tf-card" style={{ marginTop: 14, padding: '24px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ 02 · QUADRO DE TAREFAS ]</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <Pill on={view === 'etapa'} onClick={() => setView('etapa')} style={{ fontSize: '0.78rem' }}>Por etapa</Pill>
              <Pill on={view === 'status'} onClick={() => setView('status')} style={{ fontSize: '0.78rem' }}>Por status</Pill>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="tf-mono" style={{ fontSize: '0.56rem' }}>
              {podeEditar ? 'ARRASTE OS CARDS PARA MOVER · CLIQUE PARA DETALHES' : 'SOMENTE LEITURA — SEU PAPEL É LEITOR'}
            </span>
            {podeEditar && <button onClick={() => setNtOn(true)} className="tf-btn tf-btn-accent" style={{ padding: '9px 16px' }}>+ Nova tarefa</button>}
          </div>
        </div>
        {total === 0 && (
          <div style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 12, padding: 32, textAlign: 'center', marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <img src="/brand/flux-mascote.png" alt="Axel, mascote do Flux" style={{ height: 110 }} />
            <p className="tf-small" style={{ margin: 0, maxWidth: 420 }}>Nenhuma tarefa ainda — organize a execução criando as primeiras tarefas com o botão acima.</p>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button className="kb-seta" onMouseEnter={() => scrollStart(-9)} onMouseLeave={scrollStop} title="Rolar para a esquerda" style={setaStyle('left')}>‹</button>
          <button className="kb-seta" onMouseEnter={() => scrollStart(9)} onMouseLeave={scrollStop} title="Rolar para a direita" style={setaStyle('right')}>›</button>
        <div className="kb-scroll" ref={kbRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', padding: '18px 2px 6px', alignItems: 'flex-start' }}>
          {cols.map((col) => {
            const aberta = !!expandida[col.key];
            const visiveis = aberta ? col.tasks : col.tasks.slice(0, ITENS_POR_COLUNA);
            const bloqueada = !col.dropavel;
            return (
              <div
                key={col.key}
                onDragOver={(e) => { if (podeEditar && !bloqueada) { e.preventDefault(); setDragSobre(col.key); } }}
                onDragLeave={() => setDragSobre((s) => (s === col.key ? null : s))}
                onDrop={soltar(col.key, col.dropavel)}
                style={{ flex: 'none', width: 252, borderRadius: 10, outline: dragSobre === col.key ? '2px dashed var(--tf-accent)' : 'none', outlineOffset: 4, opacity: 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--tf-line-2)', padding: '0 2px 8px', gap: 8 }}>
                  <span className="tf-mono" style={{ fontSize: '0.56rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.label}{bloqueada ? ' · AUTO' : ''}
                  </span>
                  <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.6rem', background: 'var(--tf-bg-3)', borderRadius: 999, padding: '2px 8px', color: 'var(--tf-ink-2)', flex: 'none' }}>{col.tasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 10 }}>
                  {col.tasks.length === 0 && (
                    <div style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                      <span className="tf-mono" style={{ fontSize: '0.54rem' }}>[ VAZIO ]</span>
                    </div>
                  )}
                  {visiveis.map((t) => {
                    const k = stDe(t);
                    return (
                      <div
                        key={t.id}
                        draggable={podeEditar}
                        onDragStart={(e) => e.dataTransfer.setData('text/pf-tarefa', t.id)}
                        onClick={() => setTkModal(t.id)}
                        style={{ background: 'var(--tf-bg-pure)', border: '1px solid var(--tf-line)', borderLeft: '3px solid ' + stCor(k), borderRadius: 8, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 6, cursor: podeEditar ? 'grab' : 'pointer', boxShadow: 'var(--tf-shadow)' }}
                      >
                        <span className="tf-mono" style={{ fontSize: '0.54rem', color: 'var(--tf-ink-3)' }}>
                          {t.id} · {t.et}{t.anexos?.length ? ' · 📎' + t.anexos.length : ''}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.35 }}>{t.ti}</span>
                        <span className="tf-small" style={{ fontSize: '0.72rem' }}>{exibirResponsavel(t, state.users)}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--tf-font-mono)', fontSize: '0.6rem', color: stCor(k) }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: stCor(k) }} />{dbr(t.prazo)}
                          </span>
                          <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.52rem', letterSpacing: '0.05em', padding: '3px 8px', borderRadius: 4, background: t.prio === 'Alta' ? 'rgba(214,43,43,0.1)' : t.prio === 'Média' ? 'rgba(232,93,46,0.13)' : 'var(--tf-bg-3)', color: t.prio === 'Alta' ? 'var(--tf-crit)' : t.prio === 'Média' ? 'var(--tf-warn)' : 'var(--tf-ink-3)' }}>
                            {t.prio.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {col.tasks.length > ITENS_POR_COLUNA && (
                    <button onClick={() => setExpandida((s) => ({ ...s, [col.key]: !aberta }))} className="tf-btn tf-btn-ghost" style={{ justifyContent: 'center', padding: '7px 12px', fontSize: '0.76rem' }}>
                      {aberta ? 'Mostrar menos' : `Mostrar mais (${col.tasks.length - ITENS_POR_COLUNA})`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* lista de tarefas (TaskList do CRM) */}
      {total > 0 && (
        <div className="tf-card" style={{ marginTop: 14, padding: 0, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 150px 160px 110px 110px 130px', minWidth: 880, gap: 0, padding: '12px 24px', borderBottom: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)' }}>
            {['CÓDIGO', 'TAREFA', 'RESPONSÁVEL', 'ETAPA', 'PRAZO', 'PRIORIDADE', 'STATUS'].map((h) => (
              <span key={h} className="tf-mono" style={{ fontSize: '0.58rem' }}>{h}</span>
            ))}
          </div>
          {[...q.tasks].sort((a, b) => a.id.localeCompare(b.id)).map((t) => {
            const k = stDe(t);
            return (
              <div key={t.id} onClick={() => setTkModal(t.id)} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 150px 160px 110px 110px 130px', minWidth: 880, gap: 0, padding: '11px 24px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center', cursor: 'pointer' }}>
                <span className="tf-mono" style={{ fontSize: '0.66rem' }}>{t.id}</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, paddingRight: 12 }}>{t.ti}</span>
                <span className="tf-small" style={{ fontSize: '0.76rem' }}>{exibirResponsavel(t, state.users)}</span>
                <span className="tf-mono" style={{ fontSize: '0.62rem' }}>{t.et}</span>
                <span style={{ fontSize: '0.8rem' }}>{dbr(t.prazo)}</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: t.prio === 'Alta' ? 'var(--tf-crit)' : t.prio === 'Média' ? 'var(--tf-warn)' : 'var(--tf-ink-3)' }}>{t.prio}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--tf-font-mono)', fontSize: '0.62rem', color: stCor(k) }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: stCor(k) }} />{ST_LABEL[k]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {tarefaModal && (
        <TaskModal pid={id} tarefa={tarefaModal} quadro={q} membros={membros} papel={papel} onFechar={() => setTkModal(null)} />
      )}

      {ntOn && <NovaTarefa pid={id} onFechar={() => setNtOn(false)} membros={membros} />}

      {overdueOn && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,0,62,0.45)', zIndex: 260, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '84px 24px 24px', animation: 'tfIn .2s ease both' }}>
          <div className="tf-card" style={{ maxWidth: 480, width: '100%', padding: 28, boxShadow: 'var(--tf-shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge kind="crit">atenção</Badge>
              <h3 className="tf-h4" style={{ margin: 0 }}>{atrasadas.length} tarefa{atrasadas.length > 1 ? 's' : ''} atrasada{atrasadas.length > 1 ? 's' : ''}</h3>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {atrasadas.map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--tf-line)', borderRadius: 8, padding: '9px 12px' }}>
                  <span className="tf-mono" style={{ fontSize: '0.6rem', flex: 'none' }}>{t.id} · {t.et}</span>
                  <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.ti}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--tf-crit)', flex: 'none' }}>{dbr(t.prazo)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { try { localStorage.setItem(`pf-overdue-${id}-${todayISO()}`, '1'); } catch { /* ok */ } setOverdueOn(false); }}
                className="tf-btn tf-btn-ghost"
              >
                Não mostrar de novo hoje
              </button>
              <button onClick={() => setOverdueOn(false)} className="tf-btn tf-btn-accent">Ver tarefas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Nova tarefa (NewTaskModal do CRM: descrição, início, responsável, nova etapa) ── */
function NovaTarefa({ pid, membros, onFechar }: { pid: string; membros: { id: string; nome: string }[]; onFechar: () => void }) {
  const store = useStore();
  const q = store.quadroDe(pid);
  const [f, setF] = useState({ ti: '', desc: '', et: q.etapas[0]?.id ?? 'F0', prazo: '', inicio: '', prio: 'Média' as 'Alta' | 'Média' | 'Baixa', respId: store.me?.id ?? '' });
  const [novaEtapaOn, setNovaEtapaOn] = useState(false);
  const [novaEtapa, setNovaEtapa] = useState('');

  const salvar = () => {
    if (!f.ti.trim() || !f.prazo) return store.showToast('Dê um título e um prazo para a tarefa.');
    let et = f.et;
    let etapaNova: { id: string; nome: string; inicio: string; fim: string } | undefined;
    if (novaEtapaOn) {
      if (!novaEtapa.trim()) return store.showToast('Dê um nome à nova etapa.');
      et = 'F' + q.etapas.length;
      const inicio = todayISO();
      const fim = q.etapas.reduce((a, e) => (e.fim > a ? e.fim : a), f.prazo || todayISO());
      etapaNova = { id: et, nome: novaEtapa.trim(), inicio, fim: fim < inicio ? inicio : fim };
    }
    store.addTarefa(pid, { ti: f.ti, et, prazo: f.prazo, prio: f.prio, desc: f.desc || undefined, inicio: f.inicio || undefined, respId: f.respId || undefined, etapaNova });
    onFechar();
  };

  return (
    <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(8,0,62,0.45)', zIndex: 265, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'tfIn .2s ease both' }}>
      <div onClick={(e) => e.stopPropagation()} className="tf-card" style={{ maxWidth: 520, width: '100%', padding: 28, boxShadow: 'var(--tf-shadow-lg)' }}>
        <h3 className="tf-h4" style={{ margin: '0 0 6px' }}>Nova tarefa</h3>
        <p className="tf-small" style={{ margin: '0 0 18px', fontSize: '0.76rem' }}>A tarefa nasce com o status "Não iniciada".</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><L>Título</L><input className="f-input" value={f.ti} onChange={(e) => setF((s) => ({ ...s, ti: e.target.value }))} placeholder="O que precisa ser feito?" autoFocus /></div>
          <div><L>Descrição · opcional</L><textarea className="f-textarea" rows={2} value={f.desc} onChange={(e) => setF((s) => ({ ...s, desc: e.target.value }))} placeholder="Contexto, critérios de aceite, links…" /></div>
          <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <L>Etapa</L>
              {novaEtapaOn ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="f-input" style={{ padding: '9px 12px', fontSize: '0.86rem' }} value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)} placeholder="Nome da nova etapa" autoFocus />
                  <button onClick={() => setNovaEtapaOn(false)} className="tf-btn tf-btn-ghost" style={{ padding: '8px 10px', flex: 'none' }}>×</button>
                </div>
              ) : (
                <select className="f-select" value={f.et} onChange={(e) => { if (e.target.value === '__nova__') setNovaEtapaOn(true); else setF((s) => ({ ...s, et: e.target.value })); }}>
                  {q.etapas.map((e2) => <option key={e2.id} value={e2.id}>{e2.id} · {e2.nome}</option>)}
                  <option value="__nova__">+ Nova etapa…</option>
                </select>
              )}
            </div>
            <div>
              <L>Responsável</L>
              <select className="f-select" value={f.respId} onChange={(e) => setF((s) => ({ ...s, respId: e.target.value }))}>
                {membros.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div><L>Início · opcional</L><input type="date" className="f-input" value={f.inicio} onChange={(e) => setF((s) => ({ ...s, inicio: e.target.value }))} /></div>
            <div><L>Prazo</L><input type="date" className="f-input" value={f.prazo} onChange={(e) => setF((s) => ({ ...s, prazo: e.target.value }))} /></div>
          </div>
          <div>
            <L>Prioridade</L>
            <div style={{ display: 'flex', gap: 5 }}>
              {(['Alta', 'Média', 'Baixa'] as const).map((pr) => (
                <Pill key={pr} on={f.prio === pr} onClick={() => setF((s) => ({ ...s, prio: pr }))} style={{ fontSize: '0.76rem' }}>{pr}</Pill>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, borderTop: '1px solid var(--tf-line)', paddingTop: 18 }}>
          <button onClick={onFechar} className="tf-btn tf-btn-ghost">Cancelar</button>
          <button onClick={salvar} className="tf-btn tf-btn-accent">Adicionar tarefa</button>
        </div>
      </div>
    </div>
  );
}

