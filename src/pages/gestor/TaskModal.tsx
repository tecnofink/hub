/**
 * Painel de detalhes da tarefa (RF-48, reconciliado com o TaskModal do CRM):
 * abas Detalhes / Comentários / Anexos, edição completa por editores,
 * somente leitura para o papel leitor.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/AppStore';
import { dbr } from '../../lib/dates';
import type { Comentario, PapelProjeto, QuadroProjeto, Tarefa, TaskStatus, Usuario } from '../../lib/types';
import { Avatar, L, Pill } from '../../components/ui';
import { exibirResponsavel, ST_LABEL_1, ST_MOVEIS, stCor, stDe, tamanhoLegivel, tempoRelativo } from './taskUtils';

interface Props {
  pid: string;
  tarefa: Tarefa;
  quadro: QuadroProjeto;
  membros: Usuario[];        // membros do projeto (para atribuição)
  papel: PapelProjeto;       // papel efetivo do usuário atual
  onFechar: () => void;
}

type Aba = 'detalhes' | 'comentarios' | 'anexos';

/** Converte texto com URLs em fragmentos com links clicáveis (CRM). */
function TextoComLinks({ texto }: { texto: string }) {
  const partes = texto.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {partes.map((p, i) =>
        /^https?:\/\//.test(p)
          ? <a key={i} href={p} target="_blank" rel="noreferrer" style={{ color: 'var(--tf-accent)', wordBreak: 'break-all' }}>{p}</a>
          : <span key={i}>{p}</span>,
      )}
    </>
  );
}

export default function TaskModal({ pid, tarefa, quadro, membros, papel, onFechar }: Props) {
  const store = useStore();
  const { me, state } = store;
  const [aba, setAba] = useState<Aba>('detalhes');
  const podeEditar = papel === 'admin' || papel === 'editor';
  const k = stDe(tarefa);

  const [f, setF] = useState(() => ({
    ti: tarefa.ti, desc: tarefa.desc ?? '', et: tarefa.et,
    respId: tarefa.respId ?? '', inicio: tarefa.inicio ?? '', prazo: tarefa.prazo,
    prio: tarefa.prio, st: tarefa.st as TaskStatus,
  }));

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onFechar]);

  const salvar = () => {
    if (!f.ti.trim() || !f.prazo) return store.showToast('Título e prazo são obrigatórios.');
    const respNome = f.respId ? (store.byId(f.respId)?.nome ?? '') : tarefa.resp;
    store.editarTarefa(pid, tarefa.id, {
      ti: f.ti.trim(), desc: f.desc.trim() || undefined, et: f.et,
      respId: f.respId || undefined, resp: respNome,
      inicio: f.inicio || undefined, prazo: f.prazo, prio: f.prio, st: f.st,
    });
    store.showToast('Tarefa atualizada.');
    onFechar();
  };

  const respLegado = !tarefa.respId && tarefa.resp && !membros.some((m) => m.nome === tarefa.resp);

  return (
    <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(8,0,62,0.45)', zIndex: 265, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'tfIn .2s ease both' }}>
      <div onClick={(e) => e.stopPropagation()} className="tf-card" style={{ maxWidth: 620, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 28, boxShadow: 'var(--tf-shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span className="tf-mono" style={{ fontSize: '0.62rem' }}>{tarefa.id} · {tarefa.et}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--tf-font-mono)', fontSize: '0.62rem', color: stCor(k) }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: stCor(k) }} />
            {ST_LABEL_1[k]}
          </span>
        </div>
        <h3 className="tf-h4" style={{ margin: '10px 0 14px' }}>{tarefa.ti}</h3>

        <div style={{ display: 'flex', gap: 5, borderBottom: '1px solid var(--tf-line)', marginBottom: 18, overflowX: 'auto' }}>
          {([['detalhes', 'Detalhes'], ['comentarios', 'Comentários'], ['anexos', `Anexos${tarefa.anexos?.length ? ' · ' + tarefa.anexos.length : ''}`]] as [Aba, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              style={{ padding: '9px 15px', border: 'none', borderBottom: '2px solid ' + (aba === id ? 'var(--tf-accent)' : 'transparent'), background: 'none', color: aba === id ? 'var(--tf-accent)' : 'var(--tf-ink-2)', fontFamily: 'var(--tf-font-body)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>

        {aba === 'detalhes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><L>Título</L><input className="f-input" value={f.ti} onChange={(e) => setF((s) => ({ ...s, ti: e.target.value }))} disabled={!podeEditar} /></div>
            <div><L>Descrição · opcional</L><textarea className="f-textarea" rows={3} value={f.desc} onChange={(e) => setF((s) => ({ ...s, desc: e.target.value }))} disabled={!podeEditar} placeholder="Contexto, critérios de aceite, links…" /></div>
            <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <L>Etapa</L>
                <select className="f-select" value={f.et} onChange={(e) => setF((s) => ({ ...s, et: e.target.value }))} disabled={!podeEditar}>
                  {quadro.etapas.map((e2) => <option key={e2.id} value={e2.id}>{e2.id} · {e2.nome}</option>)}
                </select>
              </div>
              <div>
                <L>Responsável</L>
                <select className="f-select" value={f.respId} onChange={(e) => setF((s) => ({ ...s, respId: e.target.value }))} disabled={!podeEditar}>
                  <option value="">— selecionar —</option>
                  {membros.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                {respLegado && !f.respId && (
                  <div className="tf-small" style={{ fontSize: '0.72rem', marginTop: 5 }}>Valor antigo: "{tarefa.resp}". Selecione um membro acima para atualizar.</div>
                )}
              </div>
              <div><L>Data de início · opcional</L><input type="date" className="f-input" value={f.inicio} onChange={(e) => setF((s) => ({ ...s, inicio: e.target.value }))} disabled={!podeEditar} /></div>
              <div><L>Prazo</L><input type="date" className="f-input" value={f.prazo} onChange={(e) => setF((s) => ({ ...s, prazo: e.target.value }))} disabled={!podeEditar} /></div>
            </div>
            <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <L>Prioridade</L>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {(['Alta', 'Média', 'Baixa'] as const).map((pr) => (
                    <Pill key={pr} on={f.prio === pr} onClick={() => podeEditar && setF((s) => ({ ...s, prio: pr }))} style={{ fontSize: '0.76rem' }}>{pr}</Pill>
                  ))}
                </div>
              </div>
              <div>
                <L>Status · "Atrasada" é automática</L>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {ST_MOVEIS.map((st) => (
                    <Pill key={st} on={f.st === st} onClick={() => podeEditar && setF((s) => ({ ...s, st }))} style={{ fontSize: '0.74rem' }}>{ST_LABEL_1[st]}</Pill>
                  ))}
                </div>
              </div>
            </div>
            {k === 'atras' && (
              <div style={{ background: 'rgba(214,43,43,0.08)', border: '1px solid rgba(214,43,43,0.3)', borderRadius: 8, padding: '10px 13px', fontSize: '0.8rem', color: 'var(--tf-crit)' }}>
                Prazo vencido — a tarefa aparece como atrasada até ser concluída.
              </div>
            )}
            {tarefa.conclusao && <div className="tf-mono" style={{ fontSize: '0.62rem' }}>CONCLUÍDA EM {dbr(tarefa.conclusao)}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 6, borderTop: '1px solid var(--tf-line)', paddingTop: 16, flexWrap: 'wrap' }}>
              {podeEditar ? (
                <button
                  onClick={() => store.confirmar({
                    titulo: 'Excluir esta tarefa?',
                    texto: `"${tarefa.ti}" será removida do quadro, com seus comentários e anexos. Essa ação não pode ser desfeita.`,
                    cta: 'Excluir tarefa', danger: true,
                    onConfirm: () => { store.excluirTarefa(pid, tarefa.id); onFechar(); },
                  })}
                  className="tf-btn tf-btn-ghost tf-btn-danger"
                >
                  Excluir tarefa
                </button>
              ) : <span className="tf-small" style={{ alignSelf: 'center', fontSize: '0.76rem' }}>Somente leitura — seu papel neste projeto é Leitor.</span>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onFechar} className="tf-btn tf-btn-ghost">Fechar</button>
                {podeEditar && <button onClick={salvar} className="tf-btn tf-btn-accent">Salvar alterações</button>}
              </div>
            </div>
          </div>
        )}

        {aba === 'comentarios' && <AbaComentarios pid={pid} tarefaId={tarefa.id} podeEditar={podeEditar} papel={papel} />}
        {aba === 'anexos' && <AbaAnexos pid={pid} tarefa={tarefa} podeEditar={podeEditar} papel={papel} />}

        {aba === 'detalhes' && (
          <p className="tf-small" style={{ fontSize: '0.7rem', margin: '14px 0 0' }}>
            Responsável atual: {exibirResponsavel(tarefa, state.users)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Comentários (thread em tempo real — CRM) ── */
function AbaComentarios({ pid, tarefaId, podeEditar, papel }: { pid: string; tarefaId: string; podeEditar: boolean; papel: PapelProjeto }) {
  const store = useStore();
  const { me } = store;
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');

  useEffect(() => store.observarComentarios(pid, tarefaId, setComentarios), [pid, tarefaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = () => {
    if (!texto.trim()) return;
    store.addComentario(pid, tarefaId, texto);
    setTexto('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {comentarios.length === 0 && <p className="tf-small" style={{ margin: 0 }}>Nenhum comentário ainda.</p>}
      {comentarios.map((c) => {
        const meu = c.autorId === me?.id;
        const podeExcluir = meu || papel === 'admin';
        return (
          <div key={c.id} style={{ border: '1px solid var(--tf-line)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar nome={c.autorNome} cor={store.cor(c.autorId)} foto={store.byId(c.autorId)?.foto} size={24} fontSize="0.52rem" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{c.autorNome}</span>
              <span className="tf-small" style={{ fontSize: '0.7rem' }}>
                {tempoRelativo(c.criadoEm)}{c.editadoEm ? ' · (editado)' : ''}
              </span>
              <span style={{ flex: 1 }} />
              {meu && editando !== c.id && (
                <a className="acao" onClick={() => { setEditando(c.id); setTextoEdicao(c.texto); }} style={{ fontSize: '0.72rem', color: 'var(--tf-ink-3)' }}>editar</a>
              )}
              {podeExcluir && (
                <a
                  className="acao"
                  onClick={() => store.confirmar({ titulo: 'Excluir comentário?', texto: 'O comentário será removido da conversa.', cta: 'Excluir', danger: true, onConfirm: () => store.excluirComentario(pid, c.id) })}
                  style={{ fontSize: '0.72rem', color: 'var(--tf-crit)' }}
                >
                  excluir
                </a>
              )}
            </div>
            {editando === c.id ? (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <input className="f-input" style={{ padding: '8px 12px', fontSize: '0.86rem' }} value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} autoFocus />
                <button onClick={() => { if (textoEdicao.trim()) { store.editarComentario(pid, c.id, textoEdicao); } setEditando(null); }} className="tf-btn tf-btn-accent" style={{ padding: '8px 14px', flex: 'none' }}>Salvar</button>
                <button onClick={() => setEditando(null)} className="tf-btn tf-btn-ghost" style={{ padding: '8px 12px', flex: 'none' }}>Cancelar</button>
              </div>
            ) : (
              <p style={{ margin: '8px 0 0', fontSize: '0.88rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', color: 'var(--tf-ink-2)' }}>
                <TextoComLinks texto={c.texto} />
              </p>
            )}
          </div>
        );
      })}
      {podeEditar ? (
        <div>
          <textarea
            className="f-textarea" rows={2} value={texto} placeholder="Escreva um comentário… (Ctrl+Enter envia)"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') enviar(); }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={enviar} className="tf-btn tf-btn-accent" style={{ padding: '9px 16px' }}>Comentar</button>
          </div>
        </div>
      ) : (
        <p className="tf-small" style={{ margin: 0, fontSize: '0.76rem' }}>Seu papel neste projeto é Leitor — sem permissão para comentar.</p>
      )}
    </div>
  );
}

/* ── Anexos (upload real no Storage — CRM) ── */
function AbaAnexos({ pid, tarefa, podeEditar, papel }: { pid: string; tarefa: Tarefa; podeEditar: boolean; papel: PapelProjeto }) {
  const store = useStore();
  const { me } = store;
  const fileInput = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const anexos = tarefa.anexos ?? [];

  const enviar = async (files: File[]) => {
    const grandes = files.filter((f) => f.size > 20 * 1024 * 1024);
    if (grandes.length) return store.showToast('Arquivos acima de 20 MB: ' + grandes.map((f) => f.name).join(', '));
    if (!files.length) return;
    setEnviando(true);
    try { await store.addAnexosTarefa(pid, tarefa.id, files); } finally { setEnviando(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {anexos.length === 0 && <p className="tf-small" style={{ margin: 0 }}>Nenhum anexo ainda.</p>}
      {anexos.map((a) => {
        const podeRemover = podeEditar && (a.por === me?.id || papel === 'admin');
        return (
          <div key={a.url} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--tf-line)', borderRadius: 10, padding: '10px 14px' }}>
            <a href={a.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, fontFamily: 'var(--tf-font-mono)', fontSize: '0.76rem', color: 'var(--tf-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ⇩ {a.n}
            </a>
            <span className="tf-small" style={{ fontSize: '0.7rem', flex: 'none' }}>
              {tamanhoLegivel(a.tamanho)}{a.em ? ' · ' + dbr(a.em) : ''}
            </span>
            {podeRemover && (
              <a
                className="acao"
                onClick={() => store.confirmar({ titulo: 'Remover anexo?', texto: `"${a.n}" será removido da tarefa e do armazenamento.`, cta: 'Remover', danger: true, onConfirm: () => store.removerAnexoTarefa(pid, tarefa.id, a) })}
                style={{ fontSize: '0.78rem', color: 'var(--tf-crit)', flex: 'none', fontWeight: 700 }}
              >
                ×
              </a>
            )}
          </div>
        );
      })}
      {podeEditar ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void enviar(Array.from(e.dataTransfer.files)); }}
          onClick={() => fileInput.current?.click()}
          style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', opacity: enviando ? 0.6 : 1 }}
        >
          <input ref={fileInput} type="file" multiple style={{ display: 'none' }} onChange={(e) => { void enviar(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
          <span className="tf-small" style={{ fontSize: '0.8rem' }}>{enviando ? 'Enviando…' : 'Arraste arquivos aqui ou clique para enviar · até 20 MB'}</span>
        </div>
      ) : (
        <p className="tf-small" style={{ margin: 0, fontSize: '0.76rem' }}>Seu papel neste projeto é Leitor — sem permissão para anexar.</p>
      )}
    </div>
  );
}
