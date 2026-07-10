/** Componentes de UI compartilhados — primitivas do DS Tecnofink. */
import React from 'react';
import { iniciais } from '../lib/format';

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
  if (foto) {
    return <img src={foto} alt={nome} referrerPolicy="no-referrer" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />;
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
    <div style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 12, padding: '48px 32px', textAlign: 'center', background: 'var(--tf-bg-pure)' }}>
      {mono && <span className="tf-mono">{mono}</span>}
      {titulo && <h3 className="tf-h4" style={{ margin: '12px 0 8px' }}>{titulo}</h3>}
      <p className="tf-small" style={{ margin: '0 auto', maxWidth: 480 }}>{texto}</p>
    </div>
  );
}
