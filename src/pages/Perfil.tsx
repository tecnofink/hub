/** B2 · Perfil (RF-06..08): e-mail bloqueado, papéis como selos, campos editáveis. */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { ehFluxAdmin, ehHubAdmin } from '../lib/roles';
import { Avatar, L } from '../components/ui';

const EMPRESAS = ['Tecnofink LTDA', 'Tecnofink Engenharia', 'Grupo Tecnofink Participações'];

export default function Perfil() {
  const { me, cor, salvarPerfil } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState(() => ({ nome: me!.nome, cargo: me!.cargo, empresa: me!.empresa, depto: me!.depto, niver: me!.niver, apres: me!.apres }));
  if (!me) return null;

  const on = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const chips: { label: string; bg: string; fg: string }[] = [{ label: 'Usuário', bg: 'var(--tf-bg-3)', fg: 'var(--tf-ink-3)' }];
  if (me.roles.includes('avaliador')) chips.push({ label: 'Comitê', bg: 'rgba(232,93,46,0.14)', fg: 'var(--tf-warn)' });
  if (ehFluxAdmin(me)) chips.push({ label: 'Admin do Flux', bg: 'var(--tf-accent-soft)', fg: 'var(--tf-accent)' });
  if (ehHubAdmin(me)) chips.push({ label: 'Admin do Hub', bg: 'var(--tf-accent-soft)', fg: 'var(--tf-accent)' });

  return (
    <div className="anim-in" style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 32px 80px' }}>
      <span className="tf-mono">[ MEU PERFIL ]</span>
      <h1 className="tf-h2" style={{ margin: '12px 0 34px' }}>Perfil</h1>
      <div className="g-1col-760" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="tf-card" style={{ padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Avatar nome={f.nome || me.nome} cor={cor(me.id)} foto={me.foto} size={84} fontSize="1.3rem" />
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--tf-bg-pure)', border: '1px solid var(--tf-line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-display)', fontWeight: 800, fontSize: '0.76rem', color: 'var(--tf-accent)' }}>G</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.25rem' }}>{me.nome}</div>
            <div className="tf-small">{me.cargo}{me.depto ? ' · ' + me.depto : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {chips.map((b) => (
              <span key={b.label} style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: b.bg, color: b.fg }}>{b.label}</span>
            ))}
          </div>
          <p className="tf-small" style={{ fontSize: '0.74rem', margin: '6px 0 0' }}>Foto e nome sincronizados da sua conta Google Workspace no login.</p>
        </div>
        <div className="tf-card" style={{ padding: 30 }}>
          <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div><L>Nome</L><input className="f-input" value={f.nome} onChange={on('nome')} /></div>
            <div><L>E-mail · não editável</L><input className="f-input" value={me.email} disabled /></div>
            <div><L>Cargo</L><input className="f-input" value={f.cargo} onChange={on('cargo')} placeholder="Ex.: Analista" /></div>
            <div>
              <L>Empresa do grupo</L>
              <select className="f-select" value={f.empresa} onChange={on('empresa')}>
                {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div><L>Departamento</L><input className="f-input" value={f.depto} onChange={on('depto')} placeholder="Ex.: Operações" /></div>
            <div><L>Aniversário · opcional</L><input className="f-input" value={f.niver} onChange={on('niver')} placeholder="dd/mm" /></div>
          </div>
          <div style={{ marginTop: 18 }}>
            <L>Apresentação · opcional</L>
            <textarea className="f-textarea" rows={3} value={f.apres} onChange={on('apres')} placeholder="Conte em uma frase o que você faz" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button onClick={() => nav('/')} className="tf-btn tf-btn-ghost">Cancelar</button>
            <button onClick={() => salvarPerfil({ nome: f.nome || me.nome, cargo: f.cargo, empresa: f.empresa, depto: f.depto, niver: f.niver, apres: f.apres })} className="tf-btn tf-btn-accent">Salvar alterações</button>
          </div>
        </div>
      </div>
    </div>
  );
}
