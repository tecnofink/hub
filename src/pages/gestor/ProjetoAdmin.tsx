/**
 * Administração do projeto livre (reconciliado com o CRM):
 * gestão de membros com papéis admin/editor/leitor + Zona Perigosa
 * (arquivar/desarquivar e exclusão permanente com confirmação pelo nome).
 */
import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import type { PapelProjeto } from '../../lib/types';
import { Avatar, Erro, L, Mono } from '../../components/ui';

const PAPEIS: { id: PapelProjeto; nome: string; desc: string }[] = [
  { id: 'admin', nome: 'Administrador', desc: 'Edita tudo, gerencia membros e pode arquivar/excluir o projeto' },
  { id: 'editor', nome: 'Editor', desc: 'Edita tarefas, comentários e anexos' },
  { id: 'leitor', nome: 'Leitor', desc: 'Apenas visualiza — sem permissão de edição' },
];

export default function ProjetoAdmin() {
  const store = useStore();
  const { me, state } = store;
  const { id } = useParams();
  const nav = useNavigate();

  const [novoMembro, setNovoMembro] = useState('');
  const [papelNovo, setPapelNovo] = useState<PapelProjeto>('editor');
  const [erro, setErro] = useState<string | null>(null);
  const [editandoPapel, setEditandoPapel] = useState<string | null>(null);
  const [nomeConfirma, setNomeConfirma] = useState('');

  const p = id ? state.extraProjs.find((x) => x.id === id) : undefined;
  if (!me || !id || !p) return <Navigate to="/tarefas" replace />;
  if (p.papeis[me.id] !== 'admin') return <Navigate to={'/tarefas/' + id} replace />;

  const membros = p.membrosIds.map((m) => ({ u: store.byId(m), papel: p.papeis[m] })).filter((x) => x.u);
  const admins = p.membrosIds.filter((m) => p.papeis[m] === 'admin');
  // colaboradores do hub que ainda não são membros (contas ativas)
  const candidatos = state.users
    .filter((u) => u.ativo && !p.membrosIds.includes(u.id))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const adicionar = () => {
    const u = candidatos.find((x) => x.id === novoMembro);
    if (!u) return setErro('Selecione o colaborador que entra no projeto.');
    const e = store.addMembroPorEmail(id, u.email, papelNovo);
    if (e) return setErro(e);
    setNovoMembro('');
    setErro(null);
  };

  return (
    <div className="anim-in" style={{ maxWidth: 860, margin: '0 auto', padding: '48px 32px 80px' }}>
      <button type="button" onClick={() => nav('/tarefas/' + id)} className="back-link foco-tf">← PRODUTIVIDADE / {p.nome.toUpperCase()}</button>
      <h1 className="tf-h2" style={{ margin: '14px 0 8px' }}>Gerenciar projeto</h1>
      <p className="tf-body" style={{ margin: '0 0 28px', maxWidth: 620 }}>
        Membros e papéis de "{p.nome}". O seletor lista as contas já criadas no portal — quem ainda não fez o primeiro login não aparece.
      </p>

      <div className="tf-card" style={{ padding: 26 }}>
        <Mono accent>[ MEMBROS DO PROJETO ]</Mono>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {membros.map(({ u, papel }) => {
            const ultimoAdmin = papel === 'admin' && admins.length === 1;
            return (
              <div key={u!.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--tf-line)', borderRadius: 10, padding: '12px 16px', flexWrap: 'wrap' }}>
                <Avatar nome={u!.nome} cor={store.cor(u!.id)} foto={u!.foto} size={32} fontSize="0.6rem" />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{u!.nome}{u!.id === me.id ? ' · você' : ''}</div>
                  <div className="tf-small" style={{ fontSize: '0.74rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u!.email}</div>
                </div>
                {editandoPapel === u!.id ? (
                  <select
                    className="f-select" style={{ width: '100%', maxWidth: 170, padding: '8px 10px' }} autoFocus value={papel}
                    onChange={(e) => {
                      const err = store.alterarPapelMembro(id, u!.id, e.target.value as PapelProjeto);
                      if (err) store.showToast(err);
                      setEditandoPapel(null);
                    }}
                    onBlur={() => setEditandoPapel(null)}
                  >
                    {PAPEIS.map((pp) => <option key={pp.id} value={pp.id}>{pp.nome}</option>)}
                  </select>
                ) : (
                  <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.6rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 999, background: papel === 'admin' ? 'var(--tf-accent-soft)' : 'var(--tf-bg-3)', color: papel === 'admin' ? 'var(--tf-accent)' : 'var(--tf-ink-3)', flex: 'none' }}>
                    {PAPEIS.find((pp) => pp.id === papel)?.nome}
                  </span>
                )}
                <a
                  className="acao"
                  onClick={() => !ultimoAdmin && setEditandoPapel(u!.id)}
                  title={ultimoAdmin ? 'O projeto precisa de ao menos um administrador' : 'Alterar papel'}
                  style={{ fontSize: '0.76rem', color: ultimoAdmin ? 'var(--tf-ink-3)' : 'var(--tf-accent)', cursor: ultimoAdmin ? 'not-allowed' : 'pointer', flex: 'none' }}
                >
                  papel
                </a>
                <a
                  className="acao"
                  onClick={() => {
                    if (ultimoAdmin) return;
                    const ehEu = u!.id === me.id;
                    store.confirmar({
                      titulo: ehEu ? 'Sair do projeto?' : 'Remover membro?',
                      texto: ehEu
                        ? 'Você perderá o acesso a "' + p.nome + '" — outro administrador precisará convidá-lo de novo.'
                        : u!.nome + ' perderá o acesso ao projeto e às tarefas.',
                      cta: ehEu ? 'Sair do projeto' : 'Remover', danger: true,
                      onConfirm: () => {
                        const err = store.removerMembro(id, u!.id);
                        if (err) store.showToast(err);
                        else if (ehEu) nav('/tarefas');
                      },
                    });
                  }}
                  title={ultimoAdmin ? 'O projeto precisa de ao menos um administrador' : 'Remover do projeto'}
                  style={{ fontSize: '0.76rem', color: ultimoAdmin ? 'var(--tf-ink-3)' : 'var(--tf-crit)', cursor: ultimoAdmin ? 'not-allowed' : 'pointer', flex: 'none' }}
                >
                  remover
                </a>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <L>Colaborador</L>
            <select className="f-select" value={novoMembro} onChange={(e) => { setNovoMembro(e.target.value); setErro(null); }}>
              <option value="">Selecione o colaborador…</option>
              {candidatos.map((u) => <option key={u.id} value={u.id}>{u.nome} — {u.email}</option>)}
            </select>
          </div>
          <div style={{ width: 170 }}>
            <L>Papel</L>
            <select className="f-select" value={papelNovo} onChange={(e) => setPapelNovo(e.target.value as PapelProjeto)}>
              {PAPEIS.map((pp) => <option key={pp.id} value={pp.id}>{pp.nome}</option>)}
            </select>
          </div>
          <button onClick={adicionar} className="tf-btn tf-btn-accent" style={{ flex: 'none' }}>Adicionar</button>
        </div>
        {erro && <div style={{ marginTop: 12 }}><Erro msg={erro} /></div>}
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PAPEIS.map((pp) => (
            <span key={pp.id} className="tf-small" style={{ fontSize: '0.74rem' }}>
              <strong>{pp.nome}</strong> — {pp.desc}
            </span>
          ))}
        </div>
      </div>

      <div className="tf-card" style={{ padding: 26, marginTop: 20, borderColor: 'rgba(214,43,43,0.35)' }}>
        <span className="tf-mono" style={{ color: 'var(--tf-crit)' }}>[ ZONA PERIGOSA ]</span>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.arquivado ? 'Desarquivar projeto' : 'Arquivar projeto'}</div>
            <p className="tf-small" style={{ margin: '3px 0 0', fontSize: '0.78rem' }}>
              {p.arquivado ? 'O projeto volta a aparecer na lista de todos os membros.' : 'Sai da lista de projetos, mas os dados permanecem — dá para desarquivar depois.'}
            </p>
          </div>
          <button
            onClick={() => store.confirmar({
              titulo: (p.arquivado ? 'Desarquivar' : 'Arquivar') + ' "' + p.nome + '"?',
              texto: p.arquivado ? 'O projeto volta a aparecer para todos os membros.' : 'O projeto sai da lista de todos os membros. Os dados permanecem e é possível desarquivar depois.',
              cta: p.arquivado ? 'Desarquivar' : 'Arquivar projeto',
              onConfirm: () => { store.arquivarProjeto(id, !p.arquivado); if (!p.arquivado) nav('/tarefas'); },
            })}
            className="tf-btn tf-btn-ghost" style={{ flex: 'none' }}
          >
            {p.arquivado ? 'Desarquivar' : 'Arquivar'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--tf-line)', marginTop: 18, paddingTop: 18 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--tf-crit)' }}>Excluir permanentemente</div>
          <p className="tf-small" style={{ margin: '3px 0 12px', fontSize: '0.78rem' }}>
            Apaga o projeto, as tarefas, os comentários e os anexos — sem volta. Digite <strong>{p.nome}</strong> para confirmar.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="f-input" style={{ maxWidth: 320 }} value={nomeConfirma} onChange={(e) => setNomeConfirma(e.target.value)} placeholder={p.nome} />
            <button
              disabled={nomeConfirma !== p.nome}
              onClick={() => store.confirmar({
                titulo: 'Excluir "' + p.nome + '" permanentemente?',
                texto: 'Projeto, tarefas, comentários e anexos serão apagados em definitivo para todos os membros.',
                cta: 'Excluir permanentemente', danger: true,
                onConfirm: () => { store.excluirProjetoLivre(id); nav('/tarefas'); },
              })}
              className="tf-btn tf-btn-ghost tf-btn-danger"
              style={{ opacity: nomeConfirma === p.nome ? 1 : 0.5, cursor: nomeConfirma === p.nome ? 'pointer' : 'not-allowed', flex: 'none' }}
            >
              Excluir permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
