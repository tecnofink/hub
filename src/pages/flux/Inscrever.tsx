/** C2 · Inscrição de pitch (RF-16..19): formulário completo com conversor ao vivo. */
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr, mesesDoCiclo, todayISO } from '../../lib/dates';
import { brl, num } from '../../lib/format';
import { CATS, INTANGIVEIS } from '../../lib/scoring';
import { Erro, L, Mono, Pill } from '../../components/ui';

export default function Inscrever() {
  const store = useStore();
  const { me, cicloAtivo: c, pitchDraft: d, setPitchDraft } = store;
  const nav = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  if (!me || !c) return <Navigate to="/flux" replace />;
  // RF-16: botão/tela disponível apenas com inscrições abertas
  if (todayISO() > c.limite) return <Navigate to="/flux" replace />;

  const meses = mesesDoCiclo(c.inicio, c.fim);
  const cicloValor = d.per === 'mes' ? num(d.valor) * meses : num(d.valor);

  const revisar = () => {
    const falta: string[] = [];
    if (!d.nome.trim()) falta.push('nome do projeto');
    if (!d.cat) falta.push('categoria');
    if (!num(d.valor)) falta.push('ganho tangível estimado');
    if (!d.intang.length) falta.push('ganhos intangíveis');
    if (!d.deadline) falta.push('deadline');
    if (!d.just.trim()) falta.push('justificativa');
    if (falta.length) return setErro('Preencha: ' + falta.join(', ') + '.');
    // RF-19: deadline entre hoje e o encerramento do ciclo
    if (d.deadline < todayISO() || d.deadline > c.fim) return setErro('O deadline precisa estar dentro do ciclo vigente (entre hoje e ' + dbr(c.fim) + ').');
    nav('/flux/confirmar');
  };

  const up = (patch: Partial<typeof d>) => { setPitchDraft({ ...d, ...patch }); setErro(null); };
  const toggleIntang = (item: string) =>
    up({ intang: d.intang.includes(item) ? d.intang.filter((x) => x !== item) : [...d.intang, item] });

  return (
    <div className="anim-in" style={{ maxWidth: 920, margin: '0 auto', padding: '48px 32px 80px' }}>
      <a onClick={() => nav('/flux')} className="back-link">← FLUX / {c.nome}</a>
      <h1 className="tf-h2" style={{ margin: '14px 0 8px' }}>Inscrever pitch</h1>
      <p className="tf-body" style={{ margin: '0 0 30px', maxWidth: 640 }}>
        Descreva seu projeto de IA. Depois de enviado, o pitch <strong>não poderá ser editado</strong> — mas o produto final pode ser um pouco diferente do descrito.
      </p>

      <div className="tf-card" style={{ padding: 34, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div>
          <Mono accent>[ IDENTIFICAÇÃO ]</Mono>
          <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 14 }}>
            <div>
              <L>Colaborador · do perfil</L>
              <input className="f-input" value={me.nome + ' · ' + (me.depto || me.cargo)} disabled />
            </div>
            <div>
              <L>Nome do projeto</L>
              <input className="f-input" value={d.nome} onChange={(e) => up({ nome: e.target.value })} placeholder="Ex.: Automação de relatório semanal" />
            </div>
          </div>
        </div>

        <div>
          <L>Categoria · escolha uma</L>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
            {CATS.map((ct) => (
              <button
                key={ct.id}
                onClick={() => up({ cat: ct.id })}
                style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 10, border: '1px solid ' + (d.cat === ct.id ? 'var(--tf-accent)' : 'var(--tf-line)'), background: d.cat === ct.id ? 'var(--tf-accent-soft)' : 'var(--tf-bg-pure)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <span style={{ fontFamily: 'var(--tf-font-body)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--tf-ink)' }}>{ct.nome}</span>
                <span className="tf-small" style={{ fontSize: '0.74rem', lineHeight: 1.4 }}>{ct.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 380 }}>
          <L>Deadline de entrega · dentro do ciclo</L>
          <input type="date" className="f-input" value={d.deadline} min={todayISO()} max={c.fim} onChange={(e) => up({ deadline: e.target.value })} />
          <div className="tf-small" style={{ fontSize: '0.74rem', marginTop: 6 }}>Você define o prazo — até {dbr(c.fim)}. Pontualidade vale 10% da nota.</div>
        </div>

        <div>
          <Mono accent>[ RETORNO FINANCEIRO ]</Mono>
          <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, marginTop: 14, alignItems: 'end' }}>
            <div>
              <L>Como você estimou?</L>
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill on={d.per === 'mes'} onClick={() => up({ per: 'mes' })} style={{ padding: '10px 16px', fontSize: '0.84rem' }}>R$ por mês</Pill>
                <Pill on={d.per === 'ciclo'} onClick={() => up({ per: 'ciclo' })} style={{ padding: '10px 16px', fontSize: '0.84rem' }}>R$ por ciclo</Pill>
              </div>
            </div>
            <div>
              <L>Ganhos tangíveis estimados (R$)</L>
              <input className="f-input" value={d.valor} onChange={(e) => up({ valor: e.target.value })} placeholder="Ex.: 8000" />
            </div>
          </div>
          {cicloValor > 0 && (
            <div style={{ marginTop: 10, background: 'var(--tf-accent-soft)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--tf-font-mono)', fontSize: '0.72rem', color: 'var(--tf-accent)' }}>
              = {d.per === 'mes'
                ? `${brl(num(d.valor))}/mês × ${meses.toLocaleString('pt-BR')} meses do ciclo = ${brl(cicloValor)} por ciclo`
                : `${brl(cicloValor)} no ciclo (valor já padronizado)`}
            </div>
          )}
          <p className="tf-small" style={{ fontSize: '0.74rem', margin: '8px 0 0' }}>Todos os valores do programa são padronizados por ciclo. Valores mensais são convertidos automaticamente.</p>
        </div>

        <div>
          <Mono accent>[ GANHOS INTANGÍVEIS ]</Mono>
          <p className="tf-small" style={{ fontSize: '0.78rem', margin: '8px 0 4px' }}>Selecione os que se aplicam ao projeto — o comitê usa esta lista na nota de Retorno Intangível.</p>
          {INTANGIVEIS.map((gr) => (
            <div key={gr.g} style={{ marginTop: 12 }}>
              <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 8 }}>{gr.g.toUpperCase()}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {gr.itens.map((it) => (
                  <Pill key={it} on={d.intang.includes(it)} onClick={() => toggleIntang(it)}>{it}</Pill>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <L>Justificativa · por que a IA foi essencial?</L>
          <textarea className="f-textarea" rows={4} value={d.just} onChange={(e) => up({ just: e.target.value })} placeholder="Descreva brevemente o problema a ser resolvido e o papel da IA na solução." />
        </div>

        <Erro msg={erro} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--tf-line)', paddingTop: 22 }}>
          <button onClick={() => nav('/flux')} className="tf-btn tf-btn-ghost">Cancelar</button>
          <button onClick={revisar} className="tf-btn tf-btn-accent" style={{ padding: '12px 24px' }}>Revisar e enviar →</button>
        </div>
      </div>
    </div>
  );
}
