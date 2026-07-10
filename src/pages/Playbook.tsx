/**
 * Playbook — ferramenta importada do projeto Supabase (P15/P17), reconstruída
 * na stack do hub com o design system Tecnofink. Página única com âncoras,
 * como o original: Eventos · Catálogos · Página da Feira · Associações ·
 * Prospecção · Brindes · Stands 2027 · Workshops.
 *
 * Leitura: qualquer colaborador logado. Edição: editores do Playbook
 * (gerenciados pelos admins do hub) — imposto nas regras do Firestore.
 */
import React, { useState } from 'react';
import { useStore } from '../store/AppStore';
import { Avatar, Badge, Mono } from '../components/ui';
import { usePlaybook } from './playbook/usePlaybook';
import SecEventos from './playbook/SecEventos';
import SecCatalogos from './playbook/SecCatalogos';
import SecChecklist from './playbook/SecChecklist';
import { SecAssociacoes, SecBrindes, SecProspeccao } from './playbook/SecListas';
import { SecStands, SecWorkshops } from './playbook/SecStandsWorkshops';

const ANCORAS: [string, string][] = [
  ['eventos', 'Eventos'],
  ['catalogos', 'Catálogos'],
  ['checklist', 'Página da Feira'],
  ['associacoes', 'Associações'],
  ['avaliacao', 'Prospecção'],
  ['brindes', 'Brindes'],
  ['stands2027', 'Stands 2027'],
  ['workshops', 'Workshops'],
];

export default function Playbook() {
  const store = useStore();
  const { state } = store;
  const pb = usePlaybook();
  const [editoresOn, setEditoresOn] = useState(false);

  if (!pb.pronto) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="tf-mono">[ CARREGANDO O PLAYBOOK… ]</span>
      </div>
    );
  }

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 32px 90px' }}>
      {/* navegação interna por âncoras (PlaybookNav do original) */}
      <div className="pb-ancoras" style={{ position: 'sticky', top: 64, zIndex: 40, background: 'var(--tf-bg)', padding: '10px 0 12px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--tf-line)' }}>
        {ANCORAS.map(([id, label]) => (
          <a
            key={id} href={'#' + id}
            style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid var(--tf-line-2)', background: 'var(--tf-bg-pure)', color: 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-body)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
          >
            {label}
          </a>
        ))}
        <span style={{ flex: 1 }} />
        {pb.podeEditar
          ? <Badge kind="live">✎ modo editor</Badge>
          : <Badge kind="neutral">somente leitura</Badge>}
        {pb.podeGerirEditores && (
          <a className="acao" onClick={() => setEditoresOn((v) => !v)} style={{ fontSize: '0.78rem', color: 'var(--tf-accent)', fontWeight: 700 }}>
            editores
          </a>
        )}
      </div>

      {editoresOn && pb.podeGerirEditores && (
        <div className="tf-card" style={{ marginTop: 14, padding: '18px 22px' }}>
          <Mono accent>[ EDITORES DO PLAYBOOK ]</Mono>
          <p className="tf-small" style={{ margin: '6px 0 12px', fontSize: '0.78rem' }}>
            Editores alteram todo o conteúdo do Playbook e gerem esta lista. Os demais colaboradores apenas visualizam.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {state.users.filter((u) => u.ativo).map((u) => {
              const editor = pb.docs.config.editores.includes(u.id);
              return (
                <a
                  key={u.id}
                  className="acao"
                  onClick={() => pb.salvar('config', { editores: editor ? pb.docs.config.editores.filter((x) => x !== u.id) : [...pb.docs.config.editores, u.id] })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 13px 6px 7px', borderRadius: 999, border: '1px solid ' + (editor ? 'var(--tf-accent)' : 'var(--tf-line-2)'), background: editor ? 'var(--tf-accent-soft)' : 'var(--tf-bg-pure)', color: editor ? 'var(--tf-accent)' : 'var(--tf-ink-2)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  <Avatar nome={u.nome} cor={store.cor(u.id)} foto={u.foto} size={22} fontSize="0.5rem" />
                  {u.nome}{editor ? ' ✎' : ''}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* hero */}
      <div style={{ margin: '34px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <img src="/brand/playbook-badge.png" alt="Playbook" style={{ height: 46 }} />
          <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ PLAYBOOK 2026 · TECNOFINK · MARKETING ]</span>
        </div>
        <h1 className="tf-h2" style={{ margin: '10px 0 8px' }}>Playbook de feiras e eventos</h1>
        <p className="tf-lead" style={{ margin: 0, maxWidth: 760 }}>
          O manual vivo do time: eventos do ano, estoque de catálogos e brindes, checklist de cada feira, leads captados e o planejamento de stands.
        </p>
      </div>

      <SecEventos lista={pb.docs.eventos.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('eventos', d)} />
      <SecCatalogos dados={pb.docs.catalogos} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('catalogos', d)} />
      <SecChecklist eventos={pb.docs.eventos.lista} arvore={pb.docs.checklist} podeEditar={pb.podeEditar} salvarArvore={(d) => pb.salvar('checklist', d)} />
      <SecAssociacoes lista={pb.docs.associacoes.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('associacoes', d)} />
      <SecProspeccao dados={pb.docs.prospeccao} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('prospeccao', d)} />
      <SecBrindes lista={pb.docs.brindes.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('brindes', d)} />
      <SecStands lista={pb.docs.stands2027.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('stands2027', d)} />
      <SecWorkshops lista={pb.docs.workshops.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('workshops', d)} />
    </div>
  );
}
