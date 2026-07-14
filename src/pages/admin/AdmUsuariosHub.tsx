/**
 * Usuários do PORTAL (área do Admin do Hub): ativar/desativar contas e
 * conceder "Admin do Hub". Papéis do Flux ficam no Admin do Flux; cada
 * ferramenta gere o próprio acesso (Playbook: editores; Gestor: por projeto).
 */
import React from 'react';
import { useStore } from '../../store/AppStore';
import { ehHubAdmin } from '../../lib/roles';
import { Avatar, Badge, Pill } from '../../components/ui';

const GRID = '280px 1fr 170px 110px 110px';

export default function AdmUsuariosHub() {
  const store = useStore();
  const { me, state } = store;
  if (!me) return null;

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Usuários do portal</h1>
      <p className="tf-body" style={{ margin: '0 0 22px' }}>
        Contas criadas no primeiro login com o e-mail corporativo. Desativar bloqueia o acesso imediatamente. "Admin do Hub" gere domínios, ferramentas e contas — o acesso a cada ferramenta é gerido nela própria.
      </p>
      <div className="tf-card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, minWidth: 900, gap: 0, padding: '12px 24px', borderBottom: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)' }}>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>COLABORADOR</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>E-MAIL · CARGO</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>PAPEL DO PORTAL</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem', textAlign: 'center' }}>STATUS</span>
          <span className="tf-mono" style={{ fontSize: '0.58rem', textAlign: 'right' }}>CONTA</span>
        </div>
        {state.users.map((u) => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, minWidth: 900, gap: 0, padding: '13px 24px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar nome={u.nome} cor={store.cor(u.id)} foto={u.foto} size={30} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{u.nome}{u.id === me.id ? ' · você' : ''}</span>
            </span>
            <span style={{ minWidth: 0, paddingRight: 12 }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--tf-ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
              <span className="tf-small" style={{ display: 'block', fontSize: '0.72rem' }}>{u.cargo || '—'}</span>
            </span>
            <span>
              <Pill on={ehHubAdmin(u)} onClick={() => store.toggleRole(u.id, 'hubAdmin')} style={{ padding: '6px 11px', fontSize: '0.72rem' }}>Admin do Hub</Pill>
            </span>
            <span style={{ textAlign: 'center' }}>
              <Badge kind={u.ativo ? 'live' : 'crit'}>{u.ativo ? '● ATIVA' : 'DESATIVADA'}</Badge>
            </span>
            <span style={{ textAlign: 'right' }}>
              {u.id !== me.id && ( // ninguém desativa a própria conta
                <button type="button" onClick={() => store.toggleAtivo(u.id)} className="acao foco-tf" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tf-crit)' }}>
                  {u.ativo ? 'Desativar' : 'Reativar'}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="tf-small" style={{ fontSize: '0.74rem', margin: '14px 0 0' }}>
        Admins do hub previstos: você e ti@tecnofink.com — conceda o papel quando a conta ti@ fizer o primeiro login.
      </p>
    </div>
  );
}
