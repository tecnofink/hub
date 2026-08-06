/**
 * Edição do pitch pelo admin do Flux (pedido do VP) + histórico de edições.
 * O admin pode ajustar o conteúdo ANTES de liberar o Claude; cada mudança é
 * registrada em projects/{id}/edicoes e fica visível ao titular e aos admins.
 * `editavel` liga o formulário (admin, pitch pendente); sem ele, é só o histórico.
 */
import React, { useEffect, useState } from 'react';
import { useStore, useUI } from '../store/AppStore';
import type { EdicaoPitch, Projeto } from '../lib/types';
import { CATS, INTANGIVEIS } from '../lib/scoring';
import { Modal } from './ui';

export default function PitchEdicao({ pitch, editavel, onClose }: { pitch: Projeto; editavel: boolean; onClose: () => void }) {
  const store = useStore();
  const ui = useUI();
  const [edicoes, setEdicoes] = useState<EdicaoPitch[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    cat: pitch.cat as string,
    estimValor: String(pitch.estimValor ?? ''),
    estimPer: pitch.estimPer,
    deadline: pitch.deadline ?? '',
    intang: [...(pitch.intang ?? [])],
    just: pitch.just,
  });

  useEffect(() => store.observarEdicoesPitch(pitch.id, setEdicoes), [pitch.id]);

  // limites do deadline vêm do ciclo do pitch (a regra exige a mesma janela)
  const ciclo = store.state.cycles.find((c) => c.id === pitch.ciclo);
  const toggleIntang = (item: string) => setForm((f) => ({
    ...f,
    intang: f.intang.includes(item) ? f.intang.filter((x) => x !== item) : [...f.intang, item],
  }));

  const salvar = async () => {
    if (salvando) return;
    // valida no cliente o que a regra exige — mensagem clara em vez de
    // "ação não permitida para o seu perfil" (v6)
    if (!form.just.trim()) return ui.showToast('A justificativa não pode ficar vazia.');
    if (!(Number(form.estimValor) > 0)) return ui.showToast('Informe o valor estimado do retorno.');
    if (!form.intang.length) return ui.showToast('Escolha ao menos um ganho intangível.');
    if (!pitch.tier) {
      if (!form.deadline) return ui.showToast('Informe o deadline.');
      if (ciclo && (form.deadline < ciclo.inicio || form.deadline > ciclo.fim)) {
        return ui.showToast('O deadline precisa ficar dentro do ciclo (' + ciclo.inicio.split('-').reverse().join('/') + ' a ' + ciclo.fim.split('-').reverse().join('/') + ').');
      }
    }
    setSalvando(true);
    try {
      await store.editarPitch(pitch.id, {
        cat: form.cat as Projeto['cat'],
        estimValor: Number(form.estimValor),
        estimPer: form.estimPer as Projeto['estimPer'],
        // com o acesso já liberado o deadline está congelado — nem enviamos
        ...(pitch.tier ? {} : { deadline: form.deadline || null }),
        intang: form.intang,
        just: form.just.trim(),
      });
      onClose(); // só fecha quando o servidor confirma
    } catch { setSalvando(false); }
  };

  const dtBR = (iso: string) => { try { return new Date(iso).toLocaleString('pt-BR'); } catch { return iso; } };

  return (
    <Modal onClose={onClose} maxWidth={720} labelId="pe-titulo">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 id="pe-titulo" className="tf-h3" style={{ margin: 0, fontSize: '1.15rem' }}>{editavel ? 'Editar pitch' : 'Histórico de edições'}</h2>
        <button type="button" aria-label="Fechar" onClick={onClose} className="foco-tf"
          style={{ flex: 'none', width: 32, height: 32, borderRadius: 8, border: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)', color: 'var(--tf-ink-2)', fontSize: '1.3rem', lineHeight: 1, cursor: 'pointer' }}>×</button>
      </div>
      <p className="tf-small" style={{ margin: '4px 0 16px', fontSize: '0.78rem' }}>{pitch.nome}</p>

      {editavel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22, paddingBottom: 20, borderBottom: '1px solid var(--tf-line)' }}>
          <p className="tf-small" style={{ fontSize: '0.72rem', margin: 0, color: 'var(--tf-ink-3)' }}>
            O título do pitch não pode ser alterado. Edição liberada só nas etapas Inscrito e Em desenvolvimento.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="tf-mono" style={{ fontSize: '0.56rem' }}>CATEGORIA</label>
              <select className="f-select" style={{ width: '100%' }} value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
                {CATS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="tf-mono" style={{ fontSize: '0.56rem' }}>DEADLINE</label>
              {/* congelado após a triagem: mudar a data depois do acesso liberado
                  reescreveria a Pontualidade (10% da nota) */}
              <input type="date" className="f-input" value={form.deadline} disabled={!!pitch.tier}
                min={ciclo?.inicio} max={ciclo?.fim}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              {!!pitch.tier && <span className="tf-small" style={{ fontSize: '0.68rem' }}>Fixado na liberação do acesso.</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="tf-mono" style={{ fontSize: '0.56rem' }}>VALOR ESTIMADO (R$)</label>
              <input className="f-input" inputMode="numeric" value={form.estimValor} onChange={(e) => setForm({ ...form, estimValor: e.target.value.replace(/[^\d]/g, '') })} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="tf-mono" style={{ fontSize: '0.56rem' }}>PERIODICIDADE</label>
              <select className="f-select" style={{ width: '100%' }} value={form.estimPer} onChange={(e) => setForm({ ...form, estimPer: e.target.value as Projeto['estimPer'] })}>
                <option value="mes">por mês</option>
                <option value="ciclo">por ciclo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="tf-mono" style={{ fontSize: '0.56rem' }}>GANHOS INTANGÍVEIS PREVISTOS</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {INTANGIVEIS.flatMap((g) => g.itens).map((item) => {
                const on = form.intang.includes(item);
                return (
                  <button key={item} type="button" onClick={() => toggleIntang(item)} className="foco-tf"
                    style={{
                      fontSize: '0.74rem', padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
                      border: '1px solid ' + (on ? 'var(--tf-accent)' : 'var(--tf-line-2)'),
                      background: on ? 'var(--tf-accent)' : 'transparent',
                      color: on ? '#fff' : 'var(--tf-ink-2)',
                    }}>
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="tf-mono" style={{ fontSize: '0.56rem' }}>JUSTIFICATIVA</label>
            <textarea className="f-textarea" rows={4} value={form.just} onChange={(e) => setForm({ ...form, just: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={onClose} className="tf-btn tf-btn-ghost" disabled={salvando}>Cancelar</button>
            <button onClick={() => void salvar()} className="tf-btn tf-btn-accent" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar edição'}</button>
          </div>
          <p className="tf-small" style={{ fontSize: '0.72rem', margin: 0 }}>
            Edição liberada só nas etapas Inscrito e Em desenvolvimento (antes de registrar o resultado). Cada mudança fica registrada abaixo, visível a você e aos admins.
          </p>
        </div>
      )}

      <span className="tf-mono" style={{ fontSize: '0.56rem' }}>[ HISTÓRICO DE EDIÇÕES ]</span>
      {edicoes.length === 0 ? (
        <p className="tf-small" style={{ fontSize: '0.8rem', color: 'var(--tf-ink-3)', margin: '10px 0 0' }}>Nenhuma edição registrada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {edicoes.map((e) => (
            <div key={e.id} style={{ border: '1px solid var(--tf-line)', borderRadius: 10, padding: '10px 13px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{e.porNome} <span className="tf-small" style={{ fontWeight: 400, fontSize: '0.72rem' }}>· {dtBR(e.em)}</span></div>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {e.mudancas.map((m, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                    <strong>{m.campo}:</strong> <span style={{ color: 'var(--tf-ink-3)', textDecoration: 'line-through' }}>{m.de}</span> → <span style={{ color: 'var(--tf-ink)' }}>{m.para}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
