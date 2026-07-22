/** Componentes comuns do Playbook — campos de edição no padrão do DS Tecnofink. */
import React, { useEffect, useRef, useState } from 'react';
import type { PbArquivo } from '../../lib/playbook';
import { removerArquivoPb, subirArquivoPb } from './usePlaybook';
import { useUI } from '../../store/AppStore';

/** Cabeçalho de seção do playbook: [ NN · TÍTULO ]. */
export function SecHead({ id, num, titulo, sub }: { id: string; num: string; titulo: string; sub?: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: 120, margin: '54px 0 18px' }}>
      <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ {num} · {titulo.toUpperCase()} ]</span>
      {sub && <p className="tf-small" style={{ margin: '6px 0 0', maxWidth: 720 }}>{sub}</p>}
    </div>
  );
}

/** Input não-controlado que salva no blur (padrão do playbook antigo). */
export function CampoBlur({ valor, onSalvar, placeholder, tipo = 'text', desabilitado, style, area, mono }: {
  valor: string;
  onSalvar: (v: string) => void;
  placeholder?: string;
  tipo?: string;
  desabilitado?: boolean;
  style?: React.CSSProperties;
  area?: boolean;
  mono?: boolean;
}) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  useEffect(() => { if (ref.current && document.activeElement !== ref.current) ref.current.value = valor; }, [valor]);
  const comum = {
    defaultValue: valor,
    placeholder,
    disabled: desabilitado,
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.target.value !== valor) onSalvar(e.target.value);
    },
    style: { ...(mono ? { fontFamily: 'var(--tf-font-mono)', fontSize: '0.8rem' } : {}), ...style },
  };
  return area
    ? <textarea ref={(el) => { ref.current = el; }} className="f-textarea" rows={2} {...comum} />
    : <input ref={(el) => { ref.current = el; }} className="f-input" type={tipo} {...comum} />;
}

/** Número editável no blur (mantém vazio = null). */
export function NumeroBlur({ valor, onSalvar, desabilitado, largura = 90, placeholder }: {
  valor: number | undefined;
  onSalvar: (v: number | undefined) => void;
  desabilitado?: boolean;
  largura?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current && document.activeElement !== ref.current) ref.current.value = valor === undefined ? '' : String(valor); }, [valor]);
  return (
    <input
      ref={ref} className="f-input" type="number" min={0} placeholder={placeholder}
      defaultValue={valor === undefined ? '' : String(valor)} disabled={desabilitado}
      style={{ width: largura, padding: '8px 10px', fontSize: '0.86rem', fontFamily: 'var(--tf-font-mono)' }}
      onBlur={(e) => {
        const v = e.target.value.trim() === '' ? undefined : Math.max(0, Number(e.target.value));
        if (v !== valor) onSalvar(v);
      }}
    />
  );
}

/** Botão pequeno de remover (×) com confirmação. */
export function BotaoRemover({ onConfirmar, titulo, texto, podeEditar }: { onConfirmar: () => void; titulo: string; texto: string; podeEditar: boolean }) {
  const store = useUI();
  if (!podeEditar) return null;
  return (
    <button
      type="button"
      className="acao foco-tf"
      onClick={() => store.confirmar({ titulo, texto, cta: 'Remover', danger: true, onConfirm: onConfirmar })}
      style={{ color: 'var(--tf-crit)', fontWeight: 700, fontSize: '0.82rem', flex: 'none', padding: '6px 10px', margin: '-6px -10px' }}
      title="Remover"
    >
      ×
    </button>
  );
}

/**
 * Slot de documento (UploadCampo do playbook antigo): aceita ARQUIVO ou LINK.
 * Arquivo vai para o Storage (playbook/{pathPrefix}); link é gravado como está.
 */
export function UploadCampo({ rotulo, valor, pathPrefix, accept, podeEditar, onSalvar }: {
  rotulo: string;
  valor?: PbArquivo;
  pathPrefix: string;
  accept?: string;
  podeEditar: boolean;
  onSalvar: (arq?: PbArquivo) => void;
}) {
  const store = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOn, setLinkOn] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const tem = !!(valor && (valor.url || valor.link));

  const enviar = async (f: File) => {
    if (f.size > 20 * 1024 * 1024) return store.showToast('Arquivo acima de 20 MB.');
    setEnviando(true);
    try {
      const arq = await subirArquivoPb(pathPrefix, f);
      onSalvar({ ...valor, ...arq });
    } catch (e) {
      store.showToast('Falha no envio: ' + String((e as Error).message ?? e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ border: '1px solid var(--tf-line)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="tf-mono" style={{ fontSize: '0.58rem' }}>{rotulo.toUpperCase()}</span>
      {tem ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href={valor!.url || valor!.link} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, fontFamily: 'var(--tf-font-mono)', fontSize: '0.74rem', color: 'var(--tf-accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {valor!.url ? '⇩ ' + (valor!.n ?? 'arquivo') : '↗ ' + (valor!.link ?? '')}
          </a>
          {podeEditar && (
            <button
              type="button"
              className="acao foco-tf"
              onClick={() => store.confirmar({
                titulo: 'Remover documento?', texto: `"${valor!.n ?? valor!.link}" será removido de ${rotulo}.`, cta: 'Remover', danger: true,
                onConfirm: () => { removerArquivoPb(valor!.url); onSalvar(undefined); },
              })}
              style={{ color: 'var(--tf-crit)', fontWeight: 700 }}
            >
              ×
            </button>
          )}
        </div>
      ) : podeEditar ? (
        linkOn ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="f-input" style={{ padding: '7px 10px', fontSize: '0.78rem', fontFamily: 'var(--tf-font-mono)' }}
              placeholder="https://…" autoFocus
              onBlur={(e) => { const v = e.target.value.trim(); setLinkOn(false); if (v) onSalvar({ link: v }); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input ref={fileRef} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void enviar(f); e.target.value = ''; }} />
            <button onClick={() => fileRef.current?.click()} className="tf-btn tf-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.74rem' }} disabled={enviando}>
              {enviando ? 'Enviando…' : '+ Arquivo'}
            </button>
            <button onClick={() => setLinkOn(true)} className="tf-btn tf-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.74rem' }}>+ Link</button>
          </div>
        )
      ) : (
        <span className="tf-small" style={{ fontSize: '0.76rem' }}>—</span>
      )}
    </div>
  );
}
