/**
 * Marketing (antigo Playbook) — ferramenta importada do projeto Supabase
 * (P15/P17), reconstruída na stack do hub com o DS Tecnofink. Página única
 * com âncoras: Eventos · Catálogos · Página da Feira · Associações ·
 * Prospecção · Brindes · Stands 2027 · Workshops.
 *
 * Papéis (geridos pelos editores; admin do hub tem socorro):
 *   · editor     — edita todo o conteúdo e gere os papéis;
 *   · observador — somente leitura, vê tudo;
 *   · leitor     — somente leitura e NÃO vê Página da Feira nem Stands 2027.
 */
import React, { useState } from 'react';
import { useStore } from '../store/AppStore';
import { Avatar, Badge, Mono } from '../components/ui';
import { usePlaybook, type PapelPlaybook } from './playbook/usePlaybook';
import SecEventos from './playbook/SecEventos';
import SecCatalogos from './playbook/SecCatalogos';
import SecChecklist from './playbook/SecChecklist';
import { SecAssociacoes, SecBrindes, SecProspeccao } from './playbook/SecListas';
import { SecStands, SecWorkshops } from './playbook/SecStandsWorkshops';

// âncora → [id, rótulo, restrita?]  (restrita = só editor/observador)
const ANCORAS: [string, string, boolean][] = [
  ['eventos', 'Eventos', false],
  ['catalogos', 'Catálogos', false],
  ['checklist', 'Página da Feira', true],
  ['associacoes', 'Associações', false],
  ['avaliacao', 'Prospecção', false],
  ['brindes', 'Brindes', false],
  ['stands2027', 'Stands 2027', true],
  ['workshops', 'Workshops', false],
];

const PAPEIS: { id: PapelPlaybook; nome: string }[] = [
  { id: 'editor', nome: 'Editor' },
  { id: 'observador', nome: 'Observador' },
  { id: 'leitor', nome: 'Leitor' },
];

export default function Playbook() {
  const store = useStore();
  const { state } = store;
  const pb = usePlaybook();
  const [papeisOn, setPapeisOn] = useState(false);

  if (!pb.pronto) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="tf-mono">[ CARREGANDO MARKETING… ]</span>
      </div>
    );
  }

  const editores = pb.docs.config.editores ?? [];
  const observadores = pb.docs.config.observadores ?? [];
  const papelDe = (uid: string): PapelPlaybook =>
    editores.includes(uid) ? 'editor' : observadores.includes(uid) ? 'observador' : 'leitor';
  const definirPapel = (uid: string, papel: PapelPlaybook) => {
    const eds = editores.filter((x) => x !== uid);
    const obs = observadores.filter((x) => x !== uid);
    if (papel === 'editor') eds.push(uid);
    if (papel === 'observador') obs.push(uid);
    pb.salvar('config', { editores: eds, observadores: obs });
  };

  const ancorasVisiveis = ANCORAS.filter(([, , restrita]) => pb.podeVerTudo || !restrita);

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 32px 90px' }}>
      {/* navegação interna por âncoras — fixada abaixo do cabeçalho superior */}
      <div className="pb-ancoras" style={{ position: 'sticky', top: 64, zIndex: 40, background: 'var(--tf-bg)', padding: '10px 0 12px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--tf-line)' }}>
        {ancorasVisiveis.map(([id, label]) => (
          <a
            key={id} href={'#' + id}
            style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid var(--tf-line-2)', background: 'var(--tf-bg-pure)', color: 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-body)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
          >
            {label}
          </a>
        ))}
        <span style={{ flex: 1 }} />
        {pb.papel === 'editor'
          ? <Badge kind="live">✎ modo editor</Badge>
          : pb.papel === 'observador'
            ? <Badge kind="neutral">observador · vê tudo</Badge>
            : <Badge kind="neutral">leitor</Badge>}
        {pb.podeGerirEditores && (
          <a className="acao" onClick={() => setPapeisOn((v) => !v)} style={{ fontSize: '0.78rem', color: 'var(--tf-accent)', fontWeight: 700 }}>
            papéis
          </a>
        )}
      </div>

      {papeisOn && pb.podeGerirEditores && (
        <div className="tf-card" style={{ marginTop: 14, padding: '18px 22px' }}>
          <Mono accent>[ PAPÉIS DO MARKETING ]</Mono>
          <p className="tf-small" style={{ margin: '6px 0 4px', fontSize: '0.78rem' }}>
            <strong>Editor</strong> altera o conteúdo e gere esta lista · <strong>Observador</strong> vê tudo (somente leitura) · <strong>Leitor</strong> vê tudo, exceto Página da Feira e Stands 2027.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {state.users.filter((u) => u.ativo).map((u) => {
              const atual = papelDe(u.id);
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--tf-line)', borderRadius: 10, padding: '9px 12px', flexWrap: 'wrap' }}>
                  <Avatar nome={u.nome} cor={store.cor(u.id)} foto={u.foto} size={26} fontSize="0.56rem" />
                  <span style={{ flex: 1, minWidth: 160, fontSize: '0.86rem', fontWeight: 600 }}>{u.nome}</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {PAPEIS.map((pp) => {
                      const on = atual === pp.id;
                      return (
                        <button
                          key={pp.id}
                          onClick={() => !on && definirPapel(u.id, pp.id)}
                          className="foco-tf"
                          style={{ fontFamily: 'var(--tf-font-body)', fontSize: '0.76rem', fontWeight: 600, padding: '6px 13px', borderRadius: 999, cursor: on ? 'default' : 'pointer', border: '1px solid ' + (on ? 'var(--tf-accent)' : 'var(--tf-line-2)'), background: on ? 'var(--tf-accent)' : 'var(--tf-bg-pure)', color: on ? '#fff' : 'var(--tf-ink-2)' }}
                        >
                          {pp.nome}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* hero */}
      <div style={{ margin: '34px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <img src="/brand/playbook-badge.png" alt="Marketing" style={{ height: 46 }} />
          <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ MARKETING · TECNOFINK · 2026 ]</span>
        </div>
        <h1 className="tf-h2" style={{ margin: '10px 0 8px' }}>Marketing de feiras e eventos</h1>
        <p className="tf-lead" style={{ margin: 0, maxWidth: 760 }}>
          O manual vivo do time: eventos do ano, estoque de catálogos e brindes, checklist de cada feira, leads captados e o planejamento de stands.
        </p>
      </div>

      <SecEventos lista={pb.docs.eventos.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('eventos', d)} />
      <SecCatalogos dados={pb.docs.catalogos} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('catalogos', d)} />
      {pb.podeVerTudo && (
        <SecChecklist eventos={pb.docs.eventos.lista} arvore={pb.docs.checklist} podeEditar={pb.podeEditar} salvarArvore={(d) => pb.salvar('checklist', d)} />
      )}
      <SecAssociacoes lista={pb.docs.associacoes.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('associacoes', d)} />
      <SecProspeccao dados={pb.docs.prospeccao} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('prospeccao', d)} />
      <SecBrindes lista={pb.docs.brindes.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('brindes', d)} />
      {pb.podeVerTudo && (
        <SecStands lista={pb.docs.stands2027.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('stands2027', d)} />
      )}
      <SecWorkshops lista={pb.docs.workshops.lista} podeEditar={pb.podeEditar} salvar={(d) => pb.salvar('workshops', d)} />
    </div>
  );
}
