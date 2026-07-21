/**
 * C1 · Home do Flux (RF-13, RF-14, RF-29..32): ciclo vigente, indicadores e
 * kanban público com movimentação automática. Backlog reativável pelo titular
 * quando um novo ciclo abre as inscrições (RF-27 / decisão P16).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr, diasAte, mesesDoCiclo, mesesLabel, todayISO, diffDias } from '../../lib/dates';
import { brl, brlK } from '../../lib/format';
import { catNome, isAvaliado, score, tangValidado } from '../../lib/scoring';
import type { Projeto } from '../../lib/types';
import { Avatar, Badge, MetricStat, Modal, L } from '../../components/ui';
import ALink from '../../components/ALink';
import FluxPills from './FluxPills';
import { colunaDe, statusDe, KB_COLS, ColunaId } from './statusProjeto';
import { AXEL, AXEL_COLUNA } from '../../lib/axel';

/** Altura do mascote por coluna, calibrada para o CAPACETE do Axel ter o mesmo
    tamanho em todas as artes (enquadramentos diferem: as verticais estreitas
    estouravam quando dimensionadas pela largura). Reprovado é deitado (arte
    larga) — fica no teto que a largura da coluna permite. */
const ALTURA_MASCOTE: Record<ColunaId, number> = {
  inscrito: 138, dev: 205, aval: 180, conc: 150, rep: 145, back: 142,
};

export default function FluxHome() {
  const store = useStore();
  const { me, state, cicloAtivo: c } = store;
  const nav = useNavigate();
  const kbRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const [reativar, setReativar] = useState<{ pid: string; deadline: string } | null>(null);
  const [avisoAtraso, setAvisoAtraso] = useState(false);

  // aviso (1×/dia) quando o próprio usuário tem projeto atrasado no ciclo
  useEffect(() => {
    if (!me || !c) return;
    const meus = state.projects.filter((p) => p.uid === me.id && p.ciclo === c.id && statusDe(p).k === 'atrasado');
    if (!meus.length) return;
    const chave = `pf-flux-atraso-${c.id}-${todayISO()}`;
    try {
      if (!localStorage.getItem(chave)) {
        const t = window.setTimeout(() => setAvisoAtraso(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch { /* sem storage */ }
  }, [me, c, state.projects]);

  if (!me) return null;

  if (!c) {
    return (
      <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 32px 80px' }}>
        <div style={{ maxWidth: 640, margin: '48px auto', textAlign: 'center' }}>
          <img src={AXEL.semCiclo} alt="Axel sentado no foguete, aguardando o próximo ciclo" style={{ height: 180, width: 'auto', marginBottom: 14 }} />
          <div><span className="tf-mono">[ FLUX ]</span></div>
          <h1 className="tf-h2" style={{ margin: '14px 0 12px' }}>Nenhum ciclo ativo</h1>
          <p className="tf-body" style={{ margin: '0 0 26px' }}>O próximo ciclo do programa de inovação ainda não foi aberto. O histórico dos ciclos anteriores continua disponível.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => nav('/flux/como-funciona')} className="tf-btn tf-btn-accent">Como funciona o Flux? →</button>
            <button onClick={() => nav('/flux/historico')} className="tf-btn tf-btn-ghost">Ver histórico de ciclos →</button>
          </div>
        </div>
      </div>
    );
  }

  const hoje = todayISO();
  const projs = state.projects.filter((p) => p.ciclo === c.id);
  const all = state.projects.filter((p) => p.ciclo === c.id || p.ciclo === 'backlog');
  const inscAbertas = hoje <= c.limite;
  const meses = mesesDoCiclo(c.inicio, c.fim);
  const progPct = Math.min(100, Math.max(0, Math.round((diffDias(c.inicio, hoje) / diffDias(c.inicio, c.fim)) * 100)));

  const stats = [
    { v: String(projs.length), l: 'projetos inscritos' },
    { v: String(projs.filter((p) => isAvaliado(p)).length), l: 'projetos avaliados' },
    { v: String(new Set(projs.map((p) => store.byId(p.uid)?.depto)).size), l: 'setores participantes' },
    { v: brlK(projs.filter((p) => !p.reprovado).reduce((a, p) => a + (p.estimPer === 'mes' ? p.estimValor * meses : p.estimValor), 0)), l: 'retorno estimado' },
  ];

  const scrollStart = (dx: number) => {
    scrollStop();
    timer.current = window.setInterval(() => { if (kbRef.current) kbRef.current.scrollLeft += dx; }, 16);
  };
  const scrollStop = () => { if (timer.current) { window.clearInterval(timer.current); timer.current = null; } };

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 32px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/brand/flux-badge.png" alt="Flux" style={{ width: 48, height: 48 }} />
            <div>
              <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ FLUX · PROGRAMA DE INOVAÇÃO COM IA ]</span>
              <h1 className="tf-h2" style={{ margin: '6px 0 0' }}>{c.nome}</h1>
            </div>
          </div>
          <p className="tf-body" style={{ margin: '10px 0 0' }}>{dbr(c.inicio)} — {dbr(c.fim)} · duração de {mesesLabel(meses)}</p>
        </div>
        {inscAbertas && (
          <div style={{ textAlign: 'right' }}>
            <button onClick={() => nav('/flux/inscrever')} className="tf-btn tf-btn-accent" style={{ padding: '13px 24px' }}>Inscrever pitch →</button>
            <div className="tf-small" style={{ marginTop: 8 }}>Inscrições abertas até {dbr(c.limite)}</div>
          </div>
        )}
      </div>

      <div className="tf-card" style={{ marginTop: 32, padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <span className="tf-mono" style={{ fontSize: '0.62rem' }}>INÍCIO · {dbr(c.inicio)}</span>
          <span style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.05rem', color: 'var(--tf-accent)' }}>{Math.max(0, diasAte(c.fim))} dias restantes</span>
          <span className="tf-mono" style={{ fontSize: '0.62rem' }}>ENCERRAMENTO · {dbr(c.fim)}</span>
        </div>
        <div style={{ position: 'relative', height: 8, background: 'var(--tf-bg-3)', borderRadius: 999, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: progPct + '%', background: 'linear-gradient(90deg,var(--tf-accent-2),var(--tf-accent))', borderRadius: 999 }} />
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>HOJE · {progPct}% DO CICLO</span>
        </div>
      </div>

      <div className="g-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: '1px solid var(--tf-line)', borderRadius: 10, background: 'var(--tf-bg-pure)', marginTop: 16, overflow: 'hidden' }}>
        {stats.map((st, i) => (
          <div key={i} style={{ padding: '22px 26px', borderRight: i < 3 ? '1px solid var(--tf-line)' : 'none' }}>
            <MetricStat value={st.v} label={st.l} />
          </div>
        ))}
      </div>

      <div style={{ margin: '44px 0 18px' }}>
        <FluxPills />
      </div>

      <div style={{ position: 'relative' }}>
        <button className="kb-seta" onMouseEnter={() => scrollStart(-9)} onMouseLeave={scrollStop} title="Rolar para a esquerda" style={setaStyle('left')}>‹</button>
        <button className="kb-seta" onMouseEnter={() => scrollStart(9)} onMouseLeave={scrollStop} title="Rolar para a direita" style={setaStyle('right')}>›</button>
        <div className="kb-scroll" ref={kbRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 10, alignItems: 'flex-start' }}>
          {KB_COLS.map((col) => {
            const cards = all
              .filter((p) => colunaDe(p) === col.id)
              .sort((a, b) => ((b.uid === me.id ? 1 : 0) - (a.uid === me.id ? 1 : 0)) || (a.criadoEm < b.criadoEm ? -1 : 1));
            return (
              <div key={col.id} style={{ flex: 'none', width: 260, background: 'var(--tf-bg-2)', border: '1px solid var(--tf-line)', borderRadius: 12, height: 539, overflowY: 'auto', scrollbarWidth: 'none' }} className="kb-scroll">
                <div style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--tf-bg-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px', borderBottom: '1px solid var(--tf-line)', borderRadius: '12px 12px 0 0' }}>
                  <span className="tf-mono" style={{ fontSize: '0.6rem' }}>{col.label.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.62rem', background: 'var(--tf-bg-pure)', border: '1px solid var(--tf-line)', borderRadius: 999, padding: '2px 9px', color: 'var(--tf-ink-2)' }}>{cards.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 12px 12px' }}>
                  {cards.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 8px 6px' }}>
                      <img src={AXEL_COLUNA[col.id]} alt={'Axel — nenhum projeto em ' + col.label} loading="lazy" style={{ height: ALTURA_MASCOTE[col.id], width: 'auto', maxWidth: '88%', objectFit: 'contain' }} />
                    </div>
                  )}
                  {cards.map((p) => (
                    <KanbanCard key={p.id} p={p} col={col.id} onReativar={() => setReativar({ pid: p.id, deadline: '' })} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="tf-small" style={{ fontSize: '0.76rem', margin: '12px 0 0', maxWidth: 880 }}>
        Os cards avançam sozinhos conforme o pitch evolui — ninguém arrasta: inscrição, liberação do acesso ao Claude, registro de resultado e avaliação do comitê movem o projeto de etapa. Clique no seu projeto (destacado em azul) para abrir o gestor de tarefas.
      </p>

      {reativar && (
        <Modal onClose={() => setReativar(null)} maxWidth={460}>
            <h3 className="tf-h4" style={{ margin: '0 0 10px' }}>Reativar pitch do backlog</h3>
            <p className="tf-body" style={{ margin: '0 0 18px', fontSize: '0.92rem' }}>
              "{store.proj(reativar.pid)?.nome}" será reinscrito no {c.nome} e passa de novo pela triagem de acesso (RF-27). Defina o novo deadline de entrega — entre hoje e {dbr(c.fim)}.
            </p>
            <L>Novo deadline</L>
            <input
              type="date" className="f-input" min={hoje} max={c.fim}
              value={reativar.deadline}
              onChange={(e) => setReativar({ ...reativar, deadline: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setReativar(null)} className="tf-btn tf-btn-ghost">Cancelar</button>
              <button
                onClick={() => {
                  if (!reativar.deadline || reativar.deadline < hoje || reativar.deadline > c.fim) {
                    store.showToast('O deadline precisa estar entre hoje e ' + dbr(c.fim) + '.');
                    return;
                  }
                  store.reativarBacklog(reativar.pid, reativar.deadline);
                  setReativar(null);
                }}
                className="tf-btn tf-btn-accent"
              >
                Reinscrever no ciclo →
              </button>
            </div>
        </Modal>
      )}

      {avisoAtraso && (() => {
        const meus = state.projects.filter((p) => p.uid === me.id && p.ciclo === c.id && statusDe(p).k === 'atrasado');
        if (!meus.length) return null;
        return (
          <Modal onClose={() => setAvisoAtraso(false)} maxWidth={460} top>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge kind="crit">atenção</Badge>
                <h3 className="tf-h4" style={{ margin: 0 }}>{meus.length === 1 ? '1 projeto seu está atrasado' : meus.length + ' projetos seus estão atrasados'}</h3>
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {meus.map((p) => {
                  const dias = p.deadline ? -diasAte(p.deadline) : 0;
                  return (
                    <div key={p.id} style={{ border: '1px solid var(--tf-line)', borderLeft: '3px solid var(--tf-crit)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 0 }}>{p.nome}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--tf-crit)', fontWeight: 600, whiteSpace: 'nowrap', flex: 'none' }}>venceu há {dias} dia{dias > 1 ? 's' : ''}</span>
                      </div>
                      <ALink to={'/flux/projeto/' + p.id + '/resultado'} onClick={() => setAvisoAtraso(false)} style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--tf-accent)', textDecoration: 'none' }}>Registrar resultado →</ALink>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                <button onClick={() => { try { localStorage.setItem(`pf-flux-atraso-${c.id}-${todayISO()}`, '1'); } catch { /* ok */ } setAvisoAtraso(false); }} className="tf-btn tf-btn-ghost">Não mostrar de novo hoje</button>
                <button onClick={() => setAvisoAtraso(false)} className="tf-btn tf-btn-accent">Ver no Flux</button>
              </div>
        </Modal>
        );
      })()}
    </div>
  );
}

function setaStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', [side]: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 5,
    width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--tf-line-2)',
    background: 'color-mix(in srgb, var(--tf-bg-pure) 60%, transparent)', color: 'var(--tf-ink)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: 'var(--tf-shadow)', fontSize: '1.45rem', lineHeight: 1, padding: '0 0 3px',
  } as React.CSSProperties;
}

/** Card do kanban (RF-31/32). */
function KanbanCard({ p, col, onReativar }: { p: Projeto; col: ColunaId; onReativar: () => void }) {
  const store = useStore();
  const nav = useNavigate();
  const { me, state, cicloAtivo } = store;
  const u = store.byId(p.uid)!;
  const mine = p.uid === me!.id;
  const sc = score(state.projects, p);

  let meta1 = '', meta2 = '', chip: string | null = null;
  if (col === 'inscrito') { meta1 = 'Aguardando acesso ao Claude'; meta2 = 'Inscrito em ' + dbr(p.criadoEm); }
  if (col === 'dev') {
    const d = p.deadline ? diasAte(p.deadline) : 0;
    meta1 = 'Deadline · ' + dbr(p.deadline);
    meta2 = d < 0 ? 'Vencido há ' + -d + ' dias' : d === 0 ? 'O deadline é hoje' : d + ' dias restantes';
    if (d < 0) chip = 'ATRASADO · ' + (-d) + 'D';
  }
  if (col === 'aval') {
    meta1 = 'Registrado em ' + dbr(p.resultado!.data);
    meta2 = 'Tangível declarado · ' + brl(p.resultado!.tang);
  }
  if (col === 'conc') {
    meta1 = 'Tangível validado · ' + brl(tangValidado(p) ?? 0);
    meta2 = 'Avaliação completa do comitê';
  }
  if (col === 'rep') {
    meta1 = 'Reprovado pelo comitê';
    meta2 = p.resultado ? 'Resultado fora do prazo do pitch' : 'Reprovado na avaliação de acesso';
    chip = 'REPROVADO';
  }
  if (col === 'back') { meta1 = 'Ideia guardada para uma próxima rodada'; meta2 = 'Registrada em ' + dbr(p.criadoEm); }

  // RF-27: reativação disponível ao titular quando um novo ciclo abre inscrições
  const reativavel = col === 'back' && mine && !!cicloAtivo && cicloAtivo.id !== p.backlogDe && todayISO() <= cicloAtivo.limite;
  const clickOn = col !== 'back';
  const destino = mine ? '/tarefas/' + p.id : '/flux/projeto/' + p.id;

  const atrasado = statusDe(p).k === 'atrasado';
  const fg = mine ? '#fff' : 'var(--tf-ink)';
  const sub = mine ? 'rgba(255,255,255,0.85)' : 'var(--tf-ink-3)';

  const cardStyle: React.CSSProperties = {
    background: atrasado
      ? (mine ? 'var(--tf-crit)' : 'color-mix(in srgb, var(--tf-crit) 8%, var(--tf-bg-pure))')
      : (mine ? 'var(--tf-accent)' : 'var(--tf-bg-pure)'),
    border: (atrasado && !mine)
      ? '2px solid var(--tf-crit)'
      : '1px solid ' + (atrasado ? 'var(--tf-crit)' : (mine ? 'var(--tf-accent)' : 'var(--tf-line)')),
    borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 9,
    cursor: clickOn ? 'pointer' : 'default', boxShadow: 'var(--tf-shadow)', color: 'inherit',
  };
  const Envelope = ({ children }: { children: React.ReactNode }) =>
    clickOn
      ? <ALink to={destino} style={cardStyle}>{children}</ALink>
      : <div style={cardStyle}>{children}</div>;

  return (
    <Envelope>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.56rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: mine ? 'rgba(255,255,255,0.78)' : 'var(--tf-ink-3)' }}>{catNome(p.cat)}</span>
        {mine && <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.54rem', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff', flex: 'none' }}>MEU PROJETO</span>}
      </div>
      <div style={{ fontFamily: 'var(--tf-font-body)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, color: fg }}>{p.nome}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar nome={u.nome} cor={store.cor(u.id)} foto={u.foto} size={24} fontSize="0.52rem" />
        <span style={{ fontSize: '0.78rem', color: sub }}>{u.nome}</span>
      </div>
      <div style={{ borderTop: '1px solid ' + (mine ? 'rgba(255,255,255,0.25)' : 'var(--tf-line)'), paddingTop: 9, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: sub }}>{meta1}</span>
          {sc && <span style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1, color: mine ? '#fff' : 'var(--tf-accent)', flex: 'none' }}>{sc.final}<span style={{ fontSize: '0.66rem', fontWeight: 600 }}> pts</span></span>}
          {chip && <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.54rem', letterSpacing: '0.05em', padding: '3px 8px', borderRadius: 999, background: mine ? 'rgba(255,255,255,0.16)' : 'rgba(214,43,43,0.1)', color: mine ? '#FFD8CF' : 'var(--tf-crit)', flex: 'none' }}>{chip}</span>}
        </div>
        <span style={{ fontSize: '0.74rem', color: sub }}>{meta2}</span>
      </div>
      {clickOn && (
        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: mine ? '#fff' : atrasado ? 'var(--tf-crit)' : 'var(--tf-accent)' }}>{mine ? 'Abrir em Produtividade →' : 'Ver ficha →'}</span>
      )}
      {reativavel && (
        <button onClick={(e) => { e.stopPropagation(); onReativar(); }} className="tf-btn tf-btn-accent" style={{ padding: '8px 14px', fontSize: '0.78rem', justifyContent: 'center' }}>
          Reativar neste ciclo →
        </button>
      )}
    </Envelope>
  );
}
