/**
 * G1 · Gestor de Tarefas — Meus projetos (RF-44, reconciliado com o CRM/P15):
 * projetos do Flux + projetos livres multi-membro, com papel por projeto,
 * descrição e filtro de arquivados.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { Badge, L } from '../../components/ui';
import ALink from '../../components/ALink';
import { statusDe } from '../flux/statusProjeto';
import { stDe } from './taskUtils';
import { AXEL } from '../../lib/axel';

const PAPEL_L: Record<string, string> = { admin: 'ADMIN', editor: 'EDITOR', leitor: 'LEITOR' };

export default function Gestor() {
  const store = useStore();
  const { me, state, cicloAtivo: c } = store;
  const nav = useNavigate();
  const [npOn, setNpOn] = useState(false);
  const [npNome, setNpNome] = useState('');
  const [npDesc, setNpDesc] = useState('');
  const [verArquivados, setVerArquivados] = useState(false);
  if (!me) return null;

  const arquivados = state.extraProjs.filter((e) => e.arquivado).length;
  const meus = [
    ...state.projects.filter((p) => p.uid === me.id).map((p) => ({ id: p.id, nome: p.nome, desc: undefined as string | undefined, flux: p, livre: undefined })),
    ...state.extraProjs
      .filter((e) => verArquivados || !e.arquivado)
      .map((e) => ({ id: e.id, nome: e.nome, desc: e.descricao, flux: undefined, livre: e })),
  ];

  const criar = () => {
    if (!npNome.trim()) return store.showToast('Dê um nome ao projeto.');
    const id = store.criarProjetoLivre(npNome, npDesc);
    setNpOn(false);
    setNpNome('');
    setNpDesc('');
    nav('/tarefas/' + id);
  };

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 32px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/brand/produtividade-badge.png" alt="Produtividade" style={{ height: 42 }} />
            <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ PRODUTIVIDADE ]</span>
          </div>
          <h1 className="tf-h2" style={{ margin: '12px 0 8px' }}>Meus projetos</h1>
          <p className="tf-body" style={{ margin: 0, maxWidth: 640 }}>
            Etapas, prazos e tarefas de todos os seus projetos. Pitches do Flux criam um projeto aqui automaticamente — e projetos livres podem ser compartilhados com a equipe, com papéis por pessoa.
          </p>
        </div>
        <button onClick={() => setNpOn(true)} className="tf-btn tf-btn-accent" style={{ padding: '12px 22px' }}>+ Novo projeto</button>
      </div>

      {npOn && (
        <div className="tf-card" style={{ marginTop: 26, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
            <div>
              <L>Nome do projeto</L>
              <input className="f-input" value={npNome} onChange={(e) => setNpNome(e.target.value)} placeholder="Ex.: Reorganização do arquivo técnico" autoFocus />
            </div>
            <div>
              <L>Descrição · opcional</L>
              <input className="f-input" value={npDesc} onChange={(e) => setNpDesc(e.target.value)} placeholder="Em uma frase, o objetivo do projeto" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="tf-small" style={{ fontSize: '0.76rem' }}>Você entra como administrador — depois convide membros em "Gerenciar projeto".</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setNpOn(false); setNpNome(''); setNpDesc(''); }} className="tf-btn tf-btn-ghost">Cancelar</button>
              <button onClick={criar} className="tf-btn tf-btn-accent">Criar projeto</button>
            </div>
          </div>
        </div>
      )}

      {meus.length === 0 && (
        <div style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 12, padding: '36px 32px', textAlign: 'center', background: 'var(--tf-bg-pure)', marginTop: 26 }}>
          <img src={AXEL.gestor} alt="Axel no skate, pronto para acelerar seus projetos" loading="lazy" style={{ height: 175, width: 'auto', marginBottom: 12 }} />
          <h3 className="tf-h4" style={{ margin: '0 0 8px' }}>Nenhum projeto ainda</h3>
          <p className="tf-small" style={{ margin: '0 auto', maxWidth: 480 }}>Inscreva um pitch no Flux — ele aparece aqui automaticamente — ou crie um projeto livre com o botão acima.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(340px,100%),1fr))', gap: 16, marginTop: 26 }}>
        {meus.map((x) => {
          const q = store.quadroDe(x.id);
          const total = q.tasks.length;
          const done = q.tasks.filter((t) => stDe(t) === 'conc').length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const st = x.flux ? statusDe(x.flux) : null;
          const papel = x.livre ? x.livre.papeis[me.id] : null;
          const origem = x.flux
            ? x.flux.ciclo === 'backlog'
              ? '[ FLUX · BACKLOG ]'
              : '[ FLUX · ' + (c ? c.nome.toUpperCase() : 'CICLO') + ' ]'
            : '[ PROJETO LIVRE ]';
          return (
            <ALink key={x.id} to={'/tarefas/' + x.id} className="tf-card hover-accent" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer', transition: 'border-color .2s', opacity: x.livre?.arquivado ? 0.6 : 1, color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span className="tf-mono" style={{ fontSize: '0.6rem', color: 'var(--tf-accent)' }}>{origem}</span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {x.livre?.arquivado && <Badge kind="neutral">arquivado</Badge>}
                  {st && <Badge kind={st.badge}>{st.label}</Badge>}
                  {papel && (
                    <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.56rem', letterSpacing: '0.05em', padding: '3px 9px', borderRadius: 999, background: papel === 'admin' ? 'var(--tf-accent-soft)' : 'var(--tf-bg-3)', color: papel === 'admin' ? 'var(--tf-accent)' : 'var(--tf-ink-3)' }}>
                      {PAPEL_L[papel]}
                    </span>
                  )}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.15rem', lineHeight: 1.25 }}>{x.nome}</div>
                {x.desc && <div className="tf-small" style={{ fontSize: '0.78rem', marginTop: 4 }}>{x.desc}</div>}
                {x.livre && x.livre.membrosIds.length > 1 && (
                  <div className="tf-mono" style={{ fontSize: '0.58rem', marginTop: 6 }}>{x.livre.membrosIds.length} MEMBROS</div>
                )}
              </div>
              <div>
                <div style={{ height: 6, background: 'var(--tf-bg-3)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: 'var(--tf-accent)', borderRadius: 999 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                  <span className="tf-small" style={{ fontSize: '0.78rem' }}>{total ? `${done} de ${total} tarefas concluídas` : 'Sem tarefas ainda'}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tf-accent)' }}>Abrir tarefas →</span>
                </div>
              </div>
            </ALink>
          );
        })}
      </div>

      {arquivados > 0 && (
        <div style={{ marginTop: 18 }}>
          <button type="button" className="acao foco-tf" onClick={() => setVerArquivados((v) => !v)} style={{ fontSize: '0.82rem', color: 'var(--tf-ink-3)' }}>
            {verArquivados ? 'Ocultar arquivados' : `Mostrar ${arquivados} projeto${arquivados > 1 ? 's' : ''} arquivado${arquivados > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
