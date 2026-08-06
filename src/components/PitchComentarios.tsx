/**
 * Chat de triagem do pitch (pedido do VP): conversa RESTRITA entre os admins
 * do Flux e o titular — canal para tirar dúvidas e pedir comprovações antes
 * de definir o acesso. Estrutura de chat: balões (meus à direita), anexos
 * vinculados à mensagem (miniatura para imagens), separador por dia.
 * Sem exclusão de mensagens — o histórico da triagem fica íntegro.
 * A notificação por e-mail (admin → titular, titular → admins) é feita por
 * Cloud Function no create da mensagem.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useStore, useUI } from '../store/AppStore';
import type { AnexoTarefa, ComentarioPitch, Projeto } from '../lib/types';
import { ehFluxAdmin } from '../lib/roles';
import { tamanhoLegivel } from '../pages/gestor/taskUtils';
import { Avatar, Modal } from './ui';

const MAX_ARQ = 20 * 1024 * 1024; // 20 MB — mesmo teto do storage.rules
const EH_IMAGEM = /\.(png|jpe?g|gif|webp|bmp|avif)$/i;

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

function horaDe(iso: string): string {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function diaDe(iso: string): string {
  try {
    const d = new Date(iso);
    const hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) return 'HOJE';
    return d.toLocaleDateString('pt-BR');
  } catch { return ''; }
}

/** Anexos dentro do balão: miniatura clicável p/ imagens, chip p/ demais. */
function AnexosDaMensagem({ anexos }: { anexos: AnexoTarefa[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
      {anexos.map((a) =>
        EH_IMAGEM.test(a.n) ? (
          <a key={a.url} href={a.url} target="_blank" rel="noreferrer" title={a.n} style={{ display: 'block', lineHeight: 0 }}>
            <img src={a.url} alt={a.n} loading="lazy"
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '1px solid var(--tf-line)' }} />
          </a>
        ) : (
          <a key={a.url} href={a.url} target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: '0.78rem', color: 'var(--tf-accent)',
              border: '1px solid var(--tf-line)', borderRadius: 9, padding: '7px 10px', background: 'var(--tf-bg-pure)',
            }}>
            📄 <span style={{ wordBreak: 'break-all' }}>{a.n}</span>
            <span className="tf-small" style={{ fontSize: '0.66rem', flex: 'none' }}>{tamanhoLegivel(a.tamanho)}</span>
          </a>
        ),
      )}
    </div>
  );
}

/**
 * Corpo do chat (sem moldura): usado inline na ficha do projeto e dentro do
 * modal em /admin/flux/pitches. `onClose` só é passado no modal — nesse caso
 * o cabeçalho ganha o X de fechar e o nome do pitch (redundante inline).
 * `onMaximizar` (ficha): abre a conversa inteira no modal.
 */
export function ChatTriagem({ pitch, onClose, onMaximizar }: {
  pitch: Projeto; onClose?: () => void; onMaximizar?: () => void;
}) {
  const store = useStore();
  const ui = useUI();
  const { me } = store;
  const [mensagens, setMensagens] = useState<ComentarioPitch[]>([]);
  const [texto, setTexto] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => store.observarComentariosPitch(pitch.id, setMensagens), [pitch.id]);
  // rola só a CAIXA da conversa — scrollIntoView arrastava a página inteira ao
  // abrir a ficha (o chat fica no rodapé da tela) — v6
  useEffect(() => {
    const fim = fimRef.current;
    const caixa = fim?.parentElement?.parentElement; // wrapper com overflow-y
    if (caixa) caixa.scrollTop = caixa.scrollHeight;
  }, [mensagens.length]);

  if (!me) return null;
  const souAdmin = ehFluxAdmin(me);

  const escolher = (files: FileList | null) => {
    if (!files) return;
    const lista = [...files];
    const grandes = lista.filter((f) => f.size > MAX_ARQ);
    if (grandes.length) ui.showToast('Arquivo acima de 20 MB: ' + grandes.map((f) => f.name).join(', '));
    setArquivos((a) => [...a, ...lista.filter((f) => f.size <= MAX_ARQ)]);
  };

  const enviar = async () => {
    if ((!texto.trim() && !arquivos.length) || enviando) return;
    // guarda o que está sendo enviado: durante um upload lento a pessoa pode
    // continuar digitando/anexando — limpar às cegas apagava isso (v6)
    const textoEnviado = texto;
    const arquivosEnviados = arquivos;
    setEnviando(true);
    try {
      await store.addComentarioPitch(pitch.id, textoEnviado, arquivosEnviados);
      setTexto((atual) => (atual === textoEnviado ? '' : atual));
      setArquivos((atual) => atual.filter((f) => !arquivosEnviados.includes(f)));
    } catch { /* falha já vira toast no store */ }
    finally { setEnviando(false); }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h2 id="pc-titulo" className="tf-h3" style={{ margin: 0, fontSize: '1.15rem' }}>Chat da triagem</h2>
          <span className="tf-mono" style={{ fontSize: '0.58rem' }}>VISÍVEL SÓ AO TITULAR E AOS ADMINS DO FLUX</span>
        </div>
        {onClose && (
          <button type="button" aria-label="Fechar chat" onClick={onClose} className="foco-tf"
            style={{ flex: 'none', width: 32, height: 32, borderRadius: 8, border: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)', color: 'var(--tf-ink-2)', fontSize: '1.3rem', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        )}
        {!onClose && onMaximizar && (
          <button type="button" onClick={onMaximizar} className="tf-btn tf-btn-ghost foco-tf"
            style={{ flex: 'none', padding: '6px 12px', fontSize: '0.74rem' }} aria-label="Maximizar chat">
            ⤢ Maximizar
          </button>
        )}
      </div>
      {onClose && <p className="tf-small" style={{ margin: '4px 0 12px', fontSize: '0.78rem' }}>{pitch.nome}</p>}
      {!onClose && <div style={{ height: 12 }} />}

      <div style={{
        // no modal a thread ESTICA para preencher os 80vh; inline usa altura fixa
        ...(onClose ? { flex: 1, minHeight: 0 } : { minHeight: 160, maxHeight: 380 }),
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 4px 4px 0', background: 'var(--tf-bg-2)', borderRadius: 12, border: '1px solid var(--tf-line)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
          {mensagens.length === 0 && (
            <p className="tf-small" style={{ fontSize: '0.8rem', color: 'var(--tf-ink-3)', textAlign: 'center', padding: '28px 12px' }}>
              Nenhuma mensagem ainda. {souAdmin
                ? 'Use este chat para tirar dúvidas e pedir comprovações ao titular antes de definir o acesso — ele será avisado por e-mail.'
                : 'Use este chat para conversar com os admins do Flux sobre a triagem do seu pitch — eles serão avisados por e-mail.'}
            </p>
          )}
          {mensagens.map((c, i) => {
            const minha = c.autorId === me.id;
            const doTitular = c.autorId === pitch.uid;
            const diaAnterior = i > 0 ? diaDe(mensagens[i - 1].criadoEm) : null;
            const dia = diaDe(c.criadoEm);
            return (
              <React.Fragment key={c.id}>
                {dia !== diaAnterior && (
                  <div className="tf-mono" style={{ textAlign: 'center', fontSize: '0.56rem', color: 'var(--tf-ink-3)', margin: '8px 0 2px' }}>— {dia} —</div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: minha ? 'row-reverse' : 'row' }}>
                  {!minha && <Avatar nome={c.autorNome} cor={store.cor(c.autorId)} foto={store.byId(c.autorId)?.foto} size={24} fontSize="0.5rem" />}
                  <div style={{
                    maxWidth: '78%', borderRadius: minha ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    border: '1px solid ' + (minha ? 'var(--tf-accent)' : 'var(--tf-line)'),
                    background: minha ? 'color-mix(in srgb, var(--tf-accent) 12%, var(--tf-bg-pure))' : 'var(--tf-bg-pure)',
                    padding: '8px 12px',
                  }}>
                    {!minha && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 2 }}>
                        <strong style={{ fontSize: '0.76rem' }}>{c.autorNome}</strong>
                        <span className="tf-mono" style={{ fontSize: '0.5rem', color: doTitular ? 'var(--tf-ink-2)' : 'var(--tf-accent)' }}>
                          {doTitular ? 'TITULAR' : 'FLUX'}
                        </span>
                      </div>
                    )}
                    {editando === c.id ? (
                      <div style={{ minWidth: 220 }}>
                        <textarea className="f-textarea" rows={2} value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                          <button type="button" className="tf-btn tf-btn-ghost" style={{ padding: '6px 10px', fontSize: '0.72rem' }} onClick={() => setEditando(null)}>Cancelar</button>
                          <button type="button" className="tf-btn tf-btn-accent" style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                            onClick={() => { if (textoEdicao.trim()) { store.editarComentarioPitch(pitch.id, c.id, textoEdicao); setEditando(null); } }}>Salvar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {c.texto && <p style={{ fontSize: '0.86rem', lineHeight: 1.45, margin: 0, whiteSpace: 'pre-wrap' }}><TextoComLinks texto={c.texto} /></p>}
                        {!!c.anexos?.length && <AnexosDaMensagem anexos={c.anexos} />}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'baseline', marginTop: 4 }}>
                          {minha && editando !== c.id && (
                            <button type="button" className="acao foco-tf" style={{ fontSize: '0.64rem' }}
                              onClick={() => { setEditando(c.id); setTextoEdicao(c.texto); }}>editar</button>
                          )}
                          <span className="tf-small" style={{ fontSize: '0.62rem', color: 'var(--tf-ink-3)' }}>
                            {c.editadoEm ? 'editado · ' : ''}{horaDe(c.criadoEm)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={fimRef} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {!!arquivos.length && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {arquivos.map((f, i) => (
              <span key={i} className="tf-small" style={{ fontSize: '0.72rem', border: '1px solid var(--tf-line)', borderRadius: 8, padding: '3px 8px', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                {EH_IMAGEM.test(f.name) ? '🖼️' : '📄'} {f.name} · {tamanhoLegivel(f.size)}
                <button type="button" className="acao foco-tf" aria-label={'Remover ' + f.name} style={{ color: 'var(--tf-crit)' }}
                  onClick={() => setArquivos((a) => a.filter((_, j) => j !== i))}>×</button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => { escolher(e.target.files); e.target.value = ''; }} />
          <button type="button" className="tf-btn tf-btn-ghost" aria-label="Anexar arquivo" title="Anexar arquivo"
            style={{ padding: '10px 13px', flex: 'none' }} onClick={() => fileRef.current?.click()}>
            📎
          </button>
          <textarea
            className="f-textarea" rows={2} value={texto} style={{ flex: 1 }}
            placeholder="Escreva uma mensagem… (Ctrl+Enter envia)"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void enviar(); }}
          />
          <button type="button" className="tf-btn tf-btn-accent" style={{ padding: '10px 18px', flex: 'none' }} disabled={enviando} onClick={() => void enviar()}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </>
  );
}

/** Chat da triagem em modal (fila de /admin/flux/pitches e "Maximizar" da ficha):
    largura da tela do pitch (até 1100) e 80% da altura, com a thread esticando. */
export default function PitchComentarios({ pitch, onClose }: { pitch: Projeto; onClose: () => void }) {
  return (
    <Modal onClose={onClose} maxWidth={1100} labelId="pc-titulo"
      cardStyle={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <ChatTriagem pitch={pitch} onClose={onClose} />
    </Modal>
  );
}
