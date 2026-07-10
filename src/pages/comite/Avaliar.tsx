/**
 * D2 · Avaliação de projeto (RF-38..41 / decisão P13):
 * 1) cada membro valida o tangível — integral ou valor ajustado (≤ declarado);
 *    a média das 3 validações entra no cálculo;
 * 2) notas 0–5 para Intangível, Impacto e Alcance, com rubrica de referência;
 * Pontualidade automática como selo; atraso → aceitar ou desclassificar.
 */
import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr, mesesDoCiclo } from '../../lib/dates';
import { brl, num, primeiroNome } from '../../lib/format';
import { catNome, comiteMembros, nValidacoes, pontualidade, RUBRICA, tangValidado } from '../../lib/scoring';
import { Avatar, Badge, Erro, Mono } from '../../components/ui';

export default function Avaliar() {
  const store = useStore();
  const { me, state } = store;
  const { id } = useParams();
  const nav = useNavigate();

  const p = id ? store.proj(id) : undefined;

  const [notas, setNotas] = useState<{ i: number | null; imp: number | null; alc: number | null }>(() => {
    const minha = p && me ? p.notas[me.id] : null;
    return { i: minha?.i ?? null, imp: minha?.imp ?? null, alc: minha?.alc ?? null };
  });
  const [erro, setErro] = useState<string | null>(null);
  const [ajusteOn, setAjusteOn] = useState(false);
  const [ajuste, setAjuste] = useState('');

  if (!me || !p || !p.resultado) return <Navigate to="/comite/fila" replace />;

  const u = store.byId(p.uid)!;
  const cc = state.cycles.find((x) => x.id === p.ciclo);
  const meses = cc ? mesesDoCiclo(cc.inicio, cc.fim) : 3.5;
  const pt = pontualidade(p);
  const declarado = p.resultado.tang;
  const minhaVal = p.resultado.validacoes[me.id];
  const tv = tangValidado(p);

  const salvar = () => {
    if (notas.i === null || notas.imp === null || notas.alc === null) {
      return setErro('Defina as três notas (0 a 5) antes de salvar.');
    }
    store.salvarNotas(p.id, { i: notas.i, imp: notas.imp, alc: notas.alc });
    nav('/comite/fila');
  };

  const confirmarAjuste = () => {
    const v = num(ajuste);
    if (!v || v <= 0) return store.showToast('Informe um valor válido em R$ por ciclo.');
    if (v >= declarado) return store.showToast('O valor ajustado precisa ser menor que o declarado (' + brl(declarado) + ').');
    store.validarTangivel(p.id, v);
    setAjusteOn(false);
    setAjuste('');
  };

  const notaBtns = (k: 'i' | 'imp' | 'alc') => (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {[0, 1, 2, 3, 4, 5].map((v) => {
        const on = notas[k] === v;
        return (
          <button
            key={v}
            onClick={() => { setNotas((s) => ({ ...s, [k]: v })); setErro(null); }}
            style={{ width: 38, height: 38, borderRadius: 8, border: '1px solid ' + (on ? 'var(--tf-accent)' : 'var(--tf-line-2)'), background: on ? 'var(--tf-accent)' : 'var(--tf-bg-pure)', color: on ? '#fff' : 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            {v}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ marginTop: 30 }}>
      <a onClick={() => nav('/comite/fila')} className="back-link">← FILA DE AVALIAÇÃO</a>
      <div className="tf-card" style={{ padding: 26, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Avatar nome={u.nome} cor={store.cor(u.id)} size={36} fontSize="0.64rem" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.2 }}>{p.nome}</div>
            <div className="tf-small" style={{ fontSize: '0.8rem' }}>{u.nome} · {u.depto || u.cargo} · {catNome(p.cat)}</div>
          </div>
          <Badge kind={pt === 100 ? 'live' : 'crit'}>PONTUALIDADE · {pt}%</Badge>
        </div>

        <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}>
          <div style={{ background: 'var(--tf-bg-2)', borderRadius: 10, padding: '14px 16px' }}>
            <div className="tf-mono" style={{ fontSize: '0.58rem', marginBottom: 4 }}>ESTIMADO NO PITCH</div>
            <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.2rem' }}>{brl(p.estimPer === 'mes' ? p.estimValor * meses : p.estimValor)}</div>
          </div>
          <div style={{ background: 'var(--tf-accent-soft)', borderRadius: 10, padding: '14px 16px' }}>
            <div className="tf-mono" style={{ fontSize: '0.58rem', marginBottom: 4, color: 'var(--tf-accent)' }}>REALIZADO · DECLARADO</div>
            <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.2rem', color: 'var(--tf-accent)' }}>{brl(declarado)}</div>
          </div>
        </div>

        {/* 1 · Validação do tangível — cada membro valida (P13) */}
        <div style={{ border: '1px solid var(--tf-line)', borderRadius: 10, padding: '14px 16px', marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <Mono accent>[ 1 · VALIDAÇÃO DO TANGÍVEL ]</Mono>
              <p className="tf-small" style={{ fontSize: '0.76rem', margin: '4px 0 0' }}>
                Cada um dos três membros valida o valor realizado — integral ou ajustado. A <strong>média dos três valores</strong> entra no cálculo e na normalização do ciclo.
              </p>
            </div>
            {minhaVal !== undefined ? (
              <Badge kind="live" style={{ flex: 'none' }}>
                {minhaVal === declarado ? '● você validou o valor integral' : '● você validou ' + brl(minhaVal)}
              </Badge>
            ) : ajusteOn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 'none' }}>
                <label className="tf-mono" style={{ fontSize: '0.56rem' }}>VALOR AJUSTADO · R$/CICLO</label>
                <input
                  className="f-input" style={{ width: 130, padding: '9px 12px', fontSize: '0.88rem' }}
                  value={ajuste} onChange={(e) => setAjuste(e.target.value)} placeholder="Ex.: 12000"
                />
                <button onClick={confirmarAjuste} className="tf-btn tf-btn-accent" style={{ padding: '9px 15px' }}>Confirmar ajuste</button>
                <button onClick={() => setAjusteOn(false)} className="tf-btn tf-btn-ghost" style={{ padding: '9px 12px' }}>Cancelar</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 'none' }}>
                <button onClick={() => store.validarTangivel(p.id, declarado)} className="tf-btn tf-btn-primary">Validar {brl(declarado)}</button>
                <button onClick={() => setAjusteOn(true)} className="tf-btn tf-btn-ghost">Validar com ajuste</button>
              </div>
            )}
          </div>
          <div className="tf-mono" style={{ fontSize: '0.62rem', marginTop: 12, color: 'var(--tf-ink-2)' }}>
            VALIDAÇÕES: {comiteMembros().map((m) => {
              const membro = store.byId(m);
              const val = p.resultado!.validacoes[m];
              return primeiroNome(membro?.nome ?? m) + (val !== undefined ? ' ✓' : ' —');
            }).join(' · ')}
            {tv !== null && <> · MÉDIA VALIDADA: {brl(tv)}</>}
            {tv === null && nValidacoes(p) > 0 && <> · {nValidacoes(p)} DE 3 — o valor só pontua com as três validações</>}
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>DESCRIÇÃO DO RESULTADO</div>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--tf-ink-2)' }}>{p.resultado.desc}</div>
          </div>
          <div>
            <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>INTANGÍVEIS OBSERVADOS</div>
            <div style={{ fontSize: '0.9rem' }}>{p.resultado.intang.join(' · ')}</div>
          </div>
          <div>
            <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 6 }}>ANEXOS DE EVIDÊNCIA</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {p.resultado.anexos.map((a) => (
                <a
                  key={a.n} href={a.url || undefined} target="_blank" rel="noreferrer"
                  style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.68rem', padding: '5px 11px', border: '1px solid var(--tf-line-2)', borderRadius: 999, color: 'var(--tf-ink-2)', textDecoration: 'none', cursor: a.url ? 'pointer' : 'default' }}
                >
                  ⇩ {a.n}
                </a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--tf-line)', paddingTop: 14 }}>
            <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>
              PITCH ORIGINAL · DEADLINE {dbr(p.deadline)} · REGISTRADO EM {dbr(p.resultado.data)}
            </div>
            <div style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--tf-ink-2)' }}>{p.just}</div>
          </div>
        </div>
      </div>

      {/* RF-41: registro em atraso — aceitar (Pontualidade 0) ou desclassificar */}
      {pt === 0 && (
        <div style={{ background: 'rgba(214,43,43,0.08)', border: '1px solid rgba(214,43,43,0.3)', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <span style={{ fontSize: '0.86rem', color: 'var(--tf-ink-2)', lineHeight: 1.5 }}>
            Resultado registrado após o deadline. Cabe ao comitê aceitar (Pontualidade 0) ou desclassificar — não há desclassificação automática.
          </span>
          <button
            onClick={() => store.confirmar({
              titulo: 'Desclassificar este projeto?',
              texto: '"' + p.nome + '" será marcado como Reprovado e sai do ranking do ciclo. A decisão é do comitê e fica registrada nos logs de auditoria.',
              cta: 'Desclassificar', danger: true,
              onConfirm: () => { store.reprovarPitch(p.id, 'avaliacao'); nav('/comite/fila'); },
            })}
            className="tf-btn tf-btn-ghost tf-btn-danger" style={{ alignSelf: 'flex-start' }}
          >
            Desclassificar projeto
          </button>
        </div>
      )}

      <div className="g-1col-760" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, alignItems: 'stretch' }}>
        <div className="tf-card" style={{ padding: 24, background: 'var(--tf-bg-2)' }}>
          <Mono accent>[ LEGENDA · COMO AVALIAR O RETORNO INTANGÍVEL ]</Mono>
          <p className="tf-small" style={{ fontSize: '0.72rem', margin: '8px 0 10px' }}>Nota de 0 a 5 · convertida em 0–100 pts · peso de 20% na nota final.</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {RUBRICA.map((rb) => (
              <div key={rb.n} style={{ display: 'flex', gap: 11, padding: '6px 0', borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--tf-bg-pure)', border: '1px solid var(--tf-line-2)', color: 'var(--tf-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.66rem', flex: 'none' }}>{rb.n}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--tf-ink-2)', lineHeight: 1.4 }}>{rb.t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="tf-card" style={{ padding: 24 }}>
          <Mono accent>[ 2 · MINHAS NOTAS · 0 A 5 ]</Mono>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Retorno Intangível</div>
              <div className="tf-small" style={{ fontSize: '0.72rem', margin: '2px 0 8px', lineHeight: 1.45 }}>Ganhos não financeiros: satisfação, qualidade, reputação, cultura — use a legenda ao lado.</div>
              {notaBtns('i')}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Impacto</div>
              <div className="tf-small" style={{ fontSize: '0.72rem', margin: '2px 0 8px', lineHeight: 1.45 }}>O quanto o projeto transformou o processo ou o resultado?</div>
              {notaBtns('imp')}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Alcance</div>
              <div className="tf-small" style={{ fontSize: '0.72rem', margin: '2px 0 8px', lineHeight: 1.45 }}>Quantas pessoas ou áreas foram beneficiadas?</div>
              {notaBtns('alc')}
            </div>
          </div>
          {erro && <div style={{ marginTop: 14 }}><Erro msg={erro} /></div>}
          <button onClick={salvar} className="tf-btn tf-btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>Salvar minhas notas</button>
          <p className="tf-small" style={{ fontSize: '0.7rem', margin: '12px 0 0' }}>
            Notas do comitê: {comiteMembros().map((m) => primeiroNome(store.byId(m)?.nome ?? m) + (p.notas[m] ? ' ✓' : ' —')).join(' · ')}
          </p>
          <p className="tf-small" style={{ fontSize: '0.7rem', margin: '6px 0 0' }}>
            A nota de cada critério é a média dos 3 avaliadores, arredondada para o inteiro mais próximo (0,5 para cima). O titular vê apenas a pontuação final e as notas agregadas.
          </p>
        </div>
      </div>
    </div>
  );
}
