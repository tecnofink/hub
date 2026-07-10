/** C5 · Registro de resultado (RF-34..36): tangível realizado, intangíveis e
 *  anexos de evidência reais, enviados ao Cloud Storage. */
import React, { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr, diasAte, mesesDoCiclo, todayISO } from '../../lib/dates';
import { brl, num } from '../../lib/format';
import { INTANGIVEIS } from '../../lib/scoring';
import { Badge, Erro, L, Mono, Pill } from '../../components/ui';

export default function Resultado() {
  const store = useStore();
  const { me, state } = store;
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState({ valor: '', per: 'mes' as 'mes' | 'ciclo', intang: [] as string[], desc: '' });
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const p = id ? store.proj(id) : undefined;
  const cc = p ? state.cycles.find((x) => x.id === p.ciclo) : undefined;
  // RF-34: ciclo ativo + tier definido + sem resultado
  if (!me || !p || !cc || p.uid !== me.id || cc.status !== 'ativo' || !p.tier || p.resultado || p.reprovado) {
    return <Navigate to="/flux" replace />;
  }

  const meses = mesesDoCiclo(cc.inicio, cc.fim);
  const atrasado = p.deadline ? diasAte(p.deadline) < 0 : false;
  const cicloValor = f.per === 'mes' ? num(f.valor) * meses : num(f.valor);

  const enviar = async () => {
    if (!num(f.valor)) return setErro('Informe o valor tangível realizado.');
    if (!f.intang.length) return setErro('Selecione ao menos um ganho intangível observado.');
    if (!f.desc.trim()) return setErro('Descreva o resultado obtido.');
    if (!arquivos.length) return setErro('Anexe ao menos uma evidência do resultado.');
    setEnviando(true);
    try {
      await store.registrarResultado(p.id, { valor: num(f.valor), per: f.per, tang: cicloValor, intang: [...f.intang], desc: f.desc.trim() }, arquivos);
      nav('/flux/projeto/' + p.id);
    } catch (e) {
      setErro('Falha ao enviar: ' + String((e as Error)?.message ?? e));
      setEnviando(false);
    }
  };

  const toggleIntang = (item: string) =>
    setF((s) => ({ ...s, intang: s.intang.includes(item) ? s.intang.filter((x) => x !== item) : [...s.intang, item] }));

  return (
    <div className="anim-in" style={{ maxWidth: 920, margin: '0 auto', padding: '48px 32px 80px' }}>
      <a onClick={() => nav('/flux/projeto/' + p.id)} className="back-link">← PROJETO / {p.nome.toUpperCase()}</a>
      <h1 className="tf-h2" style={{ margin: '14px 0 8px' }}>Registrar resultado</h1>
      <p className="tf-body" style={{ margin: '0 0 26px', maxWidth: 640 }}>
        Informe o que o projeto realmente entregou. O retorno tangível só entra no cálculo depois da <strong>validação dos três membros do comitê</strong>.
      </p>

      {atrasado && (
        <div style={{ background: 'rgba(214,43,43,0.08)', border: '1px solid rgba(214,43,43,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Badge kind="crit" style={{ flex: 'none', marginTop: 2 }}>fora do prazo</Badge>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--tf-ink-2)', lineHeight: 1.5 }}>
            O deadline ({dbr(p.deadline)}) já venceu. O registro continua possível, mas a Pontualidade será 0% — e cabe ao comitê aceitar ou desclassificar o projeto.
          </p>
        </div>
      )}

      <div className="tf-card" style={{ padding: 34, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div>
          <Mono accent>[ RETORNO REALIZADO ]</Mono>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, marginTop: 14, alignItems: 'end' }}>
            <div>
              <L>Base do valor</L>
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill on={f.per === 'mes'} onClick={() => setF((s) => ({ ...s, per: 'mes' }))} style={{ padding: '10px 16px', fontSize: '0.84rem' }}>R$ por mês</Pill>
                <Pill on={f.per === 'ciclo'} onClick={() => setF((s) => ({ ...s, per: 'ciclo' }))} style={{ padding: '10px 16px', fontSize: '0.84rem' }}>R$ por ciclo</Pill>
              </div>
            </div>
            <div>
              <L>Valor tangível realizado (R$)</L>
              <input className="f-input" value={f.valor} onChange={(e) => { setF((s) => ({ ...s, valor: e.target.value })); setErro(null); }} placeholder="Ex.: 14000" />
            </div>
          </div>
          {num(f.valor) > 0 && (
            <div style={{ marginTop: 10, background: 'var(--tf-accent-soft)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--tf-font-mono)', fontSize: '0.72rem', color: 'var(--tf-accent)' }}>
              = {f.per === 'mes'
                ? `${brl(num(f.valor))}/mês × ${meses.toLocaleString('pt-BR')} meses = ${brl(cicloValor)} por ciclo`
                : `${brl(cicloValor)} no ciclo (valor já padronizado)`}
            </div>
          )}
        </div>

        <div>
          <Mono accent>[ GANHOS INTANGÍVEIS OBSERVADOS ]</Mono>
          {INTANGIVEIS.map((gr) => (
            <div key={gr.g} style={{ marginTop: 12 }}>
              <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 8 }}>{gr.g.toUpperCase()}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {gr.itens.map((it) => (
                  <Pill key={it} on={f.intang.includes(it)} onClick={() => toggleIntang(it)}>{it}</Pill>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <L>Descrição do resultado</L>
          <textarea className="f-textarea" rows={4} value={f.desc} onChange={(e) => { setF((s) => ({ ...s, desc: e.target.value })); setErro(null); }} placeholder="O que mudou na prática? Números, antes e depois, aprendizados." />
        </div>

        <div>
          <Mono accent>[ ANEXOS DE EVIDÊNCIA ]</Mono>
          <p className="tf-small" style={{ fontSize: '0.78rem', margin: '8px 0 10px' }}>Planilhas, imagens ou documentos que comprovem o resultado (até 20 MB por arquivo).</p>
          <input
            ref={fileInput}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const novos = Array.from(e.target.files ?? []);
              setArquivos((s) => [...s, ...novos.filter((n) => !s.some((x) => x.name === n.name && x.size === n.size))]);
              setErro(null);
              e.target.value = '';
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {arquivos.map((a, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--tf-font-mono)', fontSize: '0.68rem', padding: '6px 12px', border: '1px solid var(--tf-line-2)', borderRadius: 999, color: 'var(--tf-ink-2)' }}>
                {a.name} · {(a.size / 1024).toFixed(0)} KB
                <a onClick={() => setArquivos((s) => s.filter((_, j) => j !== i))} style={{ cursor: 'pointer', color: 'var(--tf-crit)', fontWeight: 700 }}>×</a>
              </span>
            ))}
            <button
              onClick={() => fileInput.current?.click()}
              style={{ padding: '8px 14px', borderRadius: 999, border: '1px dashed var(--tf-line-2)', background: 'transparent', color: 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-body)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              + Adicionar anexo
            </button>
          </div>
        </div>

        <Erro msg={erro} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--tf-line)', paddingTop: 22 }}>
          <button onClick={() => nav('/flux/projeto/' + p.id)} className="tf-btn tf-btn-ghost" disabled={enviando}>Cancelar</button>
          <button onClick={() => { void enviar(); }} className="tf-btn tf-btn-accent" style={{ padding: '12px 24px', opacity: enviando ? 0.6 : 1 }} disabled={enviando}>
            {enviando ? 'Enviando anexos…' : 'Enviar para validação →'}
          </button>
        </div>
      </div>
    </div>
  );
}
