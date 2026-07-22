/** Componentes de UI compartilhados — primitivas do DS Tecnofink. */
import React, { useEffect, useRef, useState } from 'react';
import { iniciais, fotoNaMedida } from '../lib/format';

/** Badge de status (tf-badge do DS). */
export function Badge({ kind, children, style }: { kind: 'live' | 'warn' | 'crit' | 'neutral'; children: React.ReactNode; style?: React.CSSProperties }) {
  return <span className={`tf-badge tf-badge-${kind}`} style={style}>{children}</span>;
}

/** Indicador numérico (MetricStat do DS). */
export function MetricStat({ value, label, critical }: { value: string; label: string; critical?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '2.1rem', letterSpacing: '-0.02em', lineHeight: 1, color: critical ? 'var(--tf-crit)' : 'var(--tf-accent)' }}>{value}</div>
      <div className="tf-mono" style={{ fontSize: '0.66rem', marginTop: 10, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

/** Avatar circular — foto do Google Workspace (RF-06) ou iniciais coloridas. */
export function Avatar({ nome, cor, foto, size = 30, fontSize }: { nome: string; cor: string; foto?: string; size?: number; fontSize?: string }) {
  // se a foto do Google não carregar (403 por referrer, expirada, rede), cai
  // nas iniciais em vez de mostrar imagem quebrada; reseta se a URL mudar
  const [erroFoto, setErroFoto] = useState(false);
  useEffect(() => { setErroFoto(false); }, [foto]);
  if (foto && !erroFoto) {
    return <img src={fotoNaMedida(foto, size)} alt={nome} referrerPolicy="no-referrer" onError={() => setErroFoto(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />;
  }
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: cor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: fontSize ?? '0.6rem', flex: 'none' }}>
      {iniciais(nome)}
    </span>
  );
}

/** Botão-pílula selecionável (categorias, intangíveis, filtros, notas...). */
export function Pill({ on, onClick, children, style }: { on: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        padding: '7px 13px', borderRadius: 999,
        border: '1px solid ' + (on ? 'var(--tf-accent)' : 'var(--tf-line-2)'),
        background: on ? 'var(--tf-accent)' : 'var(--tf-bg-pure)',
        color: on ? '#fff' : 'var(--tf-ink-2)',
        fontFamily: 'var(--tf-font-body)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Modal acessível compartilhado: overlay + card, fecha com Escape ou clique no
 * fundo, foco inicial no primeiro controle, focus trap (Tab cicla dentro) e
 * semântica de diálogo (role=dialog + aria-modal). Substitui o boilerplate de
 * overlay repetido pelas telas. `top` ancora no topo (avisos); senão centraliza.
 */
export function Modal({ onClose, children, maxWidth = 480, top, labelId }: { onClose: () => void; children: React.ReactNode; maxWidth?: number; top?: boolean; labelId?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  // guarda o onClose mais recente sem re-assinar o efeito: se dependêssemos de
  // [onClose], um pai que recria a função a cada render devolveria o foco ao 1º
  // campo a cada tecla digitada (o efeito rodava de novo e chamava foco).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const foco = () => cardRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    foco()?.[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key === 'Tab') {
        const els = foco(); if (!els || els.length === 0) return;
        const primeiro = els[0]; const ultimo = els[els.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); anterior?.focus?.(); };
    // montagem-única: foco inicial + trap; onClose acessado via ref (acima)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={onClose} role="presentation"
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,0,62,0.45)', zIndex: 250, display: 'flex', alignItems: top ? 'flex-start' : 'center', justifyContent: 'center', padding: top ? '84px 24px 24px' : 24, overflowY: 'auto', animation: 'tfIn .2s ease' }}
    >
      <div
        ref={cardRef} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby={labelId}
        className="tf-card" style={{ maxWidth, width: '100%', padding: 28, boxShadow: 'var(--tf-shadow-lg)' }}
      >
        {children}
      </div>
    </div>
  );
}

/** Rótulo mono entre colchetes — assinatura do DS. */
export function Mono({ children, accent, style }: { children: React.ReactNode; accent?: boolean; style?: React.CSSProperties }) {
  return <span className="tf-mono" style={{ ...(accent ? { color: 'var(--tf-accent)' } : {}), ...style }}>{children}</span>;
}

/** Rótulo de campo de formulário. */
export function L({ children }: { children: React.ReactNode }) {
  return <label className="f-label">{children}</label>;
}

/** Caixa de erro de formulário. */
export function Erro({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="f-erro">{msg}</div>;
}

/** Estado vazio tracejado. */
export function Vazio({ titulo, texto, mono }: { titulo?: string; texto: string; mono?: string }) {
  return (
    <div style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 12, padding: '48px clamp(16px, 5vw, 32px)', textAlign: 'center', background: 'var(--tf-bg-pure)' }}>
      {mono && <span className="tf-mono">{mono}</span>}
      {titulo && <h3 className="tf-h4" style={{ margin: '12px 0 8px' }}>{titulo}</h3>}
      <p className="tf-small" style={{ margin: '0 auto', maxWidth: 480 }}>{texto}</p>
    </div>
  );
}
