/**
 * Modal de conclusão de perfil (RF-07 estendido). Aparece após o login enquanto
 * o usuário estiver com `perfilPendente` — cobre tanto o primeiro acesso (conta
 * criada com a flag) quanto quem já usava o portal (marcado pela migração).
 * Salvar limpa a flag no banco; "Preencher depois" adia só para esta sessão.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { EMPRESAS, DEPTOS, perfilCompleto } from '../lib/opcoesPerfil';
import { Modal, L } from './ui';

const CHAVE_ADIAR = 'pf-perfil-adiado';

export default function PerfilPendenteModal() {
  const { me, salvarPerfil } = useStore();
  const nav = useNavigate();
  const [adiado, setAdiado] = useState(() => {
    try { return sessionStorage.getItem(CHAVE_ADIAR) === (me?.id ?? ''); } catch { return false; }
  });
  const [f, setF] = useState(() => ({
    nome: me?.nome ?? '', cargo: me?.cargo ?? '', empresa: me?.empresa ?? '', depto: me?.depto ?? '',
  }));

  if (!me || !me.perfilPendente || adiado) return null;

  const on = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  const valido = f.nome.trim() !== '' && perfilCompleto(f);

  const adiar = () => {
    try { sessionStorage.setItem(CHAVE_ADIAR, me.id); } catch { /* sem storage */ }
    setAdiado(true);
  };

  return (
    <Modal onClose={adiar} maxWidth={540} labelId="perfil-pend-titulo">
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <img src="/brand/axel/axel-gestor.png" alt="" aria-hidden="true" style={{ height: 92, width: 'auto' }} />
      </div>
      <h3 id="perfil-pend-titulo" className="tf-h3" style={{ margin: '0 0 6px', textAlign: 'center' }}>Complete seu perfil</h3>
      <p className="tf-body" style={{ margin: '0 auto 18px', textAlign: 'center', fontSize: '0.92rem', maxWidth: 400 }}>
        Leva 30 segundos e ajuda o time a te reconhecer no portal. Confirme seus dados abaixo.
      </p>
      <div style={{ display: 'grid', gap: 14 }}>
        <div><L>Nome</L><input className="f-input" value={f.nome} onChange={on('nome')} /></div>
        <div><L>Cargo</L><input className="f-input" value={f.cargo} onChange={on('cargo')} placeholder="Ex.: Analista de Dados" /></div>
        <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <L>Empresa / unidade</L>
            <select className="f-select" value={f.empresa} onChange={on('empresa')}>
              {!EMPRESAS.includes(f.empresa) && <option value={f.empresa}>{f.empresa || 'Selecione…'}</option>}
              {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <L>Departamento</L>
            <select className="f-select" value={f.depto} onChange={on('depto')}>
              {!DEPTOS.includes(f.depto) && <option value={f.depto}>{f.depto || 'Selecione…'}</option>}
              {DEPTOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
        <button onClick={() => { adiar(); nav('/perfil'); }} className="tf-btn tf-btn-ghost">Abrir perfil completo →</button>
        <button
          onClick={() => { if (valido) salvarPerfil({ nome: f.nome.trim(), cargo: f.cargo.trim(), empresa: f.empresa, depto: f.depto }); }}
          disabled={!valido}
          className="tf-btn tf-btn-accent"
          style={{ opacity: valido ? 1 : 0.55, cursor: valido ? 'pointer' : 'not-allowed' }}
        >
          Salvar e continuar
        </button>
      </div>
      <button
        onClick={adiar}
        className="foco-tf"
        style={{ display: 'block', margin: '14px auto 0', fontSize: '0.78rem', color: 'var(--tf-ink-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--tf-font-body)' }}
      >
        Preencher depois
      </button>
    </Modal>
  );
}
