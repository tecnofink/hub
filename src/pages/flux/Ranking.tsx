/**
 * C6 · Ranking global ao vivo (RF-42) e ranking congelado do histórico (RF-43).
 * Medalhas no top 3, destaque da própria linha e desempate pelo tangível.
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr } from '../../lib/dates';
import { brl, brlK, iniciais } from '../../lib/format';
import { catNome, critNota, isAvaliado, rankingDoCiclo, tangValidado } from '../../lib/scoring';
import { Avatar, Badge } from '../../components/ui';
import { AXEL } from '../../lib/axel';
import FluxPills from './FluxPills';

const MEDALS = ['🥇', '🥈', '🥉'];
const GRID = '64px 220px 1fr 130px 84px 84px 84px 90px 90px';

interface Row {
  key: string;
  pos: number;
  nome: string;
  setor: string;
  projeto: string;
  cat: string;
  tangL: string;
  tangPts: string;
  intg: string;
  imp: string;
  alc: string;
  pont: string;
  pts: number;
  mine: boolean;
}

export default function Ranking() {
  const store = useStore();
  const { me, state, cicloAtivo: c } = store;
  const { cicloId } = useParams();
  const nav = useNavigate();
  if (!me) return null;

  const hist = cicloId ? state.cycles.find((x) => x.id === cicloId && x.status === 'encerrado') : null;

  let rows: Row[];
  if (hist) {
    rows = (hist.frozen ?? []).map((r) => ({
      key: r.pos + r.nome, pos: r.pos, nome: r.nome, setor: r.setor, projeto: r.projeto, cat: catNome(r.cat),
      tangL: r.tangL, tangPts: r.tangPts + ' pts', intg: r.intg + '/5', imp: r.imp + '/5', alc: r.alc + '/5',
      pont: r.pont, pts: r.pts, mine: r.nome === me.nome,
    }));
  } else if (c) {
    rows = rankingDoCiclo(state.projects, c.id).map((x, i) => {
      const u = store.byId(x.p.uid)!;
      return {
        key: x.p.id, pos: i + 1, nome: u.nome, setor: u.depto, projeto: x.p.nome, cat: catNome(x.p.cat),
        tangL: brlK(tangValidado(x.p) ?? 0), tangPts: Math.round(x.s.T) + ' pts',
        intg: critNota(x.p, 'i') + '/5', imp: critNota(x.p, 'imp') + '/5', alc: critNota(x.p, 'alc') + '/5',
        pont: x.s.P + '%', pts: x.s.final, mine: x.p.uid === me.id,
      };
    });
  } else {
    rows = [];
  }

  const titulo = hist ? 'Ranking — ' + hist.nome : 'Ranking global';
  const sub = hist
    ? dbr(hist.inicio) + ' a ' + dbr(hist.fim)
    : c
      ? 'Ao vivo · ' + c.nome + ' · atualizado a cada avaliação do comitê'
      : 'Nenhum ciclo ativo';

  const statsL = hist
    ? (hist.frozen?.length ?? 0) + ' projetos avaliados'
    : c
      ? `${state.projects.filter((p) => p.ciclo === c.id).length} projetos inscritos · ${new Set(state.projects.filter((p) => p.ciclo === c.id).map((p) => store.byId(p.uid)?.depto)).size} setores · ${brl(state.projects.filter((p) => p.ciclo === c.id && isAvaliado(p)).reduce((a, p) => a + (tangValidado(p) ?? 0), 0))} de retorno validado`
      : '';

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 32px 80px' }}>
      <FluxPills comBadge />
      <div style={{ marginTop: 28 }}>
        <h1 className="tf-h2" style={{ margin: '0 0 8px' }}>{titulo}</h1>
        <p className="tf-body" style={{ margin: 0 }}>{sub}</p>
      </div>

      {hist && (
        <div style={{ marginTop: 20, background: 'var(--tf-bg-2)', border: '1px solid var(--tf-line)', borderRadius: 10, padding: '13px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <Badge kind="neutral">congelado</Badge>
          <span style={{ fontSize: '0.86rem', color: 'var(--tf-ink-2)' }}>Ranking congelado no encerramento do ciclo, em {dbr(hist.fim)}. Somente leitura.</span>
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <img src={AXEL.ranking} alt="Pódio do ranking ainda vazio — os projetos entram aqui assim que o comitê completa as avaliações" style={{ width: 'min(660px, 94%)', height: 'auto' }} />
        </div>
      ) : (
        <div className="tf-card" style={{ marginTop: 24, padding: 0, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, minWidth: 1020, gap: 0, padding: '12px 24px', borderBottom: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)' }}>
            {['#', 'COLABORADOR', 'PROJETO', 'TANGÍVEL', 'INTANG.', 'IMPACTO', 'ALCANCE', 'PONTUAL.', 'PONTOS'].map((h, i) => (
              <span key={h} className="tf-mono" style={{ fontSize: '0.58rem', textAlign: i >= 4 && i <= 7 ? 'center' : i === 3 || i === 8 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {rows.map((r, i) => {
            const top = i < 3;
            const fg = r.mine ? '#fff' : 'var(--tf-ink)';
            const sub2 = r.mine ? 'rgba(255,255,255,0.85)' : 'var(--tf-ink-3)';
            return (
              <div key={r.key} style={{ display: 'grid', gridTemplateColumns: GRID, minWidth: 1020, gap: 0, padding: '15px 24px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center', background: r.mine ? 'var(--tf-accent)' : top ? 'var(--tf-accent-soft)' : 'transparent' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {top ? (
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }} title={r.pos + 'º'}>{MEDALS[i]}</span>
                  ) : (
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: r.mine ? 'rgba(255,255,255,0.16)' : 'transparent', color: r.mine ? '#fff' : 'var(--tf-ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.68rem' }}>{r.pos}º</span>
                  )}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: store.corByNome(r.nome), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.6rem', flex: 'none' }}>{iniciais(r.nome)}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.2, color: fg }}>{r.nome}</span>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: sub2 }}>{r.setor}</span>
                  </span>
                </span>
                <span style={{ minWidth: 0, paddingRight: 16 }}>
                  <span style={{ display: 'block', fontSize: '0.88rem', lineHeight: 1.3, color: fg }}>{r.projeto}</span>
                  <span className="tf-mono" style={{ display: 'block', fontSize: '0.56rem', marginTop: 2, color: sub2 }}>{r.cat.toUpperCase()}</span>
                </span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: fg }}>{r.tangL}</span>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: sub2 }}>{r.tangPts}</span>
                </span>
                <span style={{ textAlign: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.78rem', color: fg }}>{r.intg}</span>
                <span style={{ textAlign: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.78rem', color: fg }}>{r.imp}</span>
                <span style={{ textAlign: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.78rem', color: fg }}>{r.alc}</span>
                <span style={{ textAlign: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.78rem', color: fg }}>{r.pont}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.5rem', color: r.mine ? '#fff' : 'var(--tf-accent)' }}>{r.pts}</span>
              </div>
            );
          })}
          <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <span className="tf-mono" style={{ fontSize: '0.62rem' }}>{statsL}</span>
            {hist && <button type="button" onClick={() => nav('/flux/historico')} className="acao foco-tf" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tf-accent)' }}>← Voltar ao histórico</button>}
          </div>
        </div>
      )}

      <p className="tf-small" style={{ fontSize: '0.76rem', margin: '16px 0 0', maxWidth: 820 }}>
        O Retorno Tangível usa normalização relativa: o maior retorno validado do ciclo vale 100 pts. Um novo resultado validado que o supere recalcula retroativamente a nota de todos os projetos. O valor validado é a média das validações dos 3 membros do comitê.
      </p>
    </div>
  );
}
