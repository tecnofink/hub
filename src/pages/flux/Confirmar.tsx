/** C3 · Confirmação de envio (RF-20/21): resumo + aviso de não-edição. */
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { PITCH_DRAFT_VAZIO, useStore, useUI } from '../../store/AppStore';
import { dbr, mesesDoCiclo } from '../../lib/dates';
import { brl, num } from '../../lib/format';
import { catNome } from '../../lib/scoring';
import { Badge } from '../../components/ui';

export default function Confirmar() {
  const store = useStore();
  const { me, cicloAtivo: c } = store;
  const { pitchDraft: d, setPitchDraft } = useUI();
  const nav = useNavigate();
  const [enviando, setEnviando] = React.useState(false);

  if (!me || !c || !d.nome.trim()) return <Navigate to="/flux" replace />;

  const meses = mesesDoCiclo(c.inicio, c.fim);
  const cicloValor = d.per === 'mes' ? num(d.valor) * meses : num(d.valor);

  const rows: [string, string][] = [
    ['COLABORADOR', me.nome + ' · ' + (me.depto || me.cargo)],
    ['PROJETO', d.nome],
    ['CATEGORIA', d.cat ? catNome(d.cat) : ''],
    ['TANGÍVEL ESTIMADO', brl(cicloValor) + ' por ciclo'],
    ['INTANGÍVEIS', d.intang.join(' · ')],
    ['DEADLINE', dbr(d.deadline)],
    ['JUSTIFICATIVA', d.just],
  ];

  const confirmar = async () => {
    if (enviando) return;
    setEnviando(true);
    try {
      // só limpa o rascunho e navega DEPOIS que a gravação confirma
      const novo = await store.inscreverPitch(d);
      setPitchDraft(PITCH_DRAFT_VAZIO);
      nav('/flux/projeto/' + novo.id);
    } catch {
      // erro já sinalizado por toast; mantém o rascunho intacto p/ reenviar
      setEnviando(false);
    }
  };

  return (
    <div className="anim-in" style={{ maxWidth: 760, margin: '0 auto', padding: '48px 32px 80px' }}>
      <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ REVISÃO FINAL ]</span>
      <h1 className="tf-h2" style={{ margin: '12px 0 8px' }}>Confirme seu pitch</h1>
      <p className="tf-body" style={{ margin: '0 0 24px' }}>Revise as informações antes do envio.</p>
      <div style={{ background: 'rgba(232,93,46,0.1)', border: '1px solid rgba(232,93,46,0.35)', borderRadius: 10, padding: '16px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Badge kind="warn" style={{ flex: 'none', marginTop: 2 }}>atenção</Badge>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--tf-ink-2)', lineHeight: 1.5 }}>
          Depois de enviado, <strong>o pitch não poderá ser editado</strong>. Você poderá excluí-lo até o fim das inscrições — e o produto final pode ser um pouco diferente do descrito aqui.
        </p>
      </div>
      <div className="tf-card" style={{ padding: '8px 28px' }}>
        {rows.map(([k, v]) => (
          <div key={k} className="g-1col" style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 18, padding: '14px 0', borderBottom: '1px solid var(--tf-line)' }}>
            <span className="tf-mono" style={{ fontSize: '0.62rem', paddingTop: 2 }}>{k}</span>
            <span style={{ fontSize: '0.92rem', color: 'var(--tf-ink)', lineHeight: 1.5 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
        <button onClick={() => nav('/flux/inscrever')} disabled={enviando} className="tf-btn tf-btn-ghost">← Voltar e editar</button>
        <button onClick={confirmar} disabled={enviando} className="tf-btn tf-btn-accent" style={{ padding: '12px 24px', opacity: enviando ? 0.7 : 1 }}>{enviando ? 'Enviando…' : 'Confirmar e enviar pitch →'}</button>
      </div>
    </div>
  );
}
