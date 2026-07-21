/**
 * B1 · Hub (RF-09, RF-10): saudação e cards das ferramentas ativas por perfil.
 * O FLUX é fixo em código (permanente, sempre primeiro — alterações só via
 * app); as demais vêm do Firestore, ordenáveis pelo Admin do Hub. O card
 * inteiro é um link real: clique navega na mesma aba; Ctrl+click/botão do
 * meio abrem em nova aba (padrão do navegador).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { dbr, diffDias, hojeExtenso, todayISO } from '../lib/dates';
import { primeiroNome } from '../lib/format';
import { faviconDe, iconeNativo, rotaNormalizada } from '../lib/roles';
import { faseDoFlux } from '../lib/faseFlux';
import { AXEL } from '../lib/axel';
import { Badge } from '../components/ui';
import ALink from '../components/ALink';
import type { Ciclo, Ferramenta } from '../lib/types';

const FLUX_FIXO = {
  nome: 'Flux',
  desc: 'Programa de inovação com IA: inscreva seu pitch, execute com prazo definido e acompanhe o ranking do ciclo em tempo real.',
  rota: '/flux',
};

function CardFerramenta({ rota, externa, children }: { rota: string; externa: boolean; children: React.ReactNode }) {
  const estilo: React.CSSProperties = {
    background: 'var(--tf-bg-pure)', padding: 28, display: 'flex', flexDirection: 'column', gap: 12,
    minHeight: 216, cursor: 'pointer', color: 'inherit', textDecoration: 'none',
  };
  // externa: mesma aba por padrão (Ctrl+click/meio abrem nova aba, como em qualquer link)
  return externa
    ? <a href={rota} className="hover-accent" style={estilo}>{children}</a>
    : <ALink to={rota} className="hover-accent" style={estilo}>{children}</ALink>;
}

/** Flux em destaque: linha inteira, com indicador da fase do ciclo (RF-09). */
function CardFluxDestaque({ c }: { c: Ciclo | null }) {
  const nav = useNavigate();
  const hoje = todayISO();
  const f = faseDoFlux(c, hoje);
  const plural = (n: number) => (n === 1 ? '1 dia' : n + ' dias');

  const ind =
    f.fase === 'inscricoes' ? { badge: 'live' as const, rotulo: '● INSCRIÇÕES ABERTAS', valor: f.dias === 0 ? 'último dia' : plural(f.dias), linha: 'para inscrever um pitch · até ' + dbr(c!.limite) }
    : f.fase === 'execucao' ? { badge: 'live' as const, rotulo: '● CICLO ATIVO', valor: f.dias === 0 ? 'termina hoje' : plural(f.dias), linha: 'até o fim do ciclo · ' + dbr(c!.fim) }
    : f.fase === 'abre' ? { badge: 'warn' as const, rotulo: '● NOVO CICLO', valor: f.dias === 0 ? 'abre hoje' : plural(f.dias), linha: 'para a abertura das inscrições · ' + dbr(c!.inicio) }
    : f.fase === 'apuracao' ? { badge: 'warn' as const, rotulo: '● EM APURAÇÃO', valor: 'encerrado', linha: 'aguardando o ranking final do ciclo' }
    : { badge: 'neutral' as const, rotulo: 'PRÓXIMO CICLO', valor: 'em breve', linha: 'a abertura do novo ciclo será anunciada aqui' };

  const total = c ? diffDias(c.inicio, c.fim) : 0;
  const pctDe = (alvo: string) => (total > 0 ? Math.min(100, Math.max(0, Math.round((diffDias(c!.inicio, alvo) / total) * 100))) : 0);

  return (
    <ALink to="/flux" className="hover-accent" style={{ gridColumn: '1 / -1', background: 'var(--tf-bg-pure)', padding: '26px 32px', display: 'flex', flexDirection: 'column', gap: 18, cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}>
      <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        <img src="/brand/flux-badge.png" alt="Flux" style={{ width: 54, height: 54, flex: 'none' }} />
        <div style={{ flex: 1, minWidth: 'min(280px, 100%)' }}>
          <span className="tf-mono" style={{ fontSize: '0.6rem', color: 'var(--tf-accent)' }}>[ FERRAMENTA EM DESTAQUE · PROGRAMA DE INOVAÇÃO COM IA ]</span>
          <h3 className="tf-h3" style={{ margin: '6px 0 6px' }}>Flux</h3>
          <p className="tf-small" style={{ margin: 0, maxWidth: 620, color: 'var(--tf-ink)', fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 }}>{FLUX_FIXO.desc}</p>
          <span style={{ display: 'inline-flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tf-accent)' }}>Abrir o Flux →</span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav('/flux/como-funciona'); }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--tf-font-body)', fontSize: '0.84rem', fontWeight: 700, color: 'var(--tf-ink-3)', textDecoration: 'underline' }}
            >
              Como funciona?
            </button>
          </span>
        </div>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 18, minWidth: 'min(230px, 100%)' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9, textAlign: 'right' }}>
            <Badge kind={ind.badge}>{ind.rotulo}</Badge>
            <span style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.9rem', letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--tf-accent)' }}>{ind.valor}</span>
            <span className="tf-mono" style={{ fontSize: '0.6rem' }}>{ind.linha.toUpperCase()}</span>
          </div>
          {/* Axel voando — só com ciclo ativo, à direita da informação de dias */}
          {c && <img src={AXEL.ciclo} alt="" aria-hidden="true" style={{ height: 112, width: 'auto', flex: 'none' }} />}
        </div>
      </div>

      {c && (
        <div>
          <div style={{ position: 'relative', height: 7, background: 'var(--tf-bg-3)', borderRadius: 999 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: pctDe(hoje) + '%', background: 'linear-gradient(90deg,var(--tf-accent-2),var(--tf-accent))', borderRadius: 999 }} />
            <div title={'Fim das inscrições · ' + dbr(c.limite)} style={{ position: 'absolute', top: -2, bottom: -2, left: 'calc(' + pctDe(c.limite) + '% - 1px)', width: 2, background: 'var(--tf-ink-3)', opacity: 0.7, borderRadius: 2 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="tf-mono" style={{ fontSize: '0.58rem' }}>INÍCIO · {dbr(c.inicio)}</span>
            <span className="tf-mono" style={{ fontSize: '0.58rem', color: 'var(--tf-accent)' }}>{c.nome.toUpperCase()} · INSCRIÇÕES ATÉ {dbr(c.limite)}</span>
            <span className="tf-mono" style={{ fontSize: '0.58rem' }}>FIM · {dbr(c.fim)}</span>
          </div>
        </div>
      )}
    </ALink>
  );
}

function IconeFerramenta({ t }: { t: Ferramenta }) {
  const nativo = iconeNativo(t.rota);
  if (nativo) {
    return <img src={nativo} alt={t.nome} style={{ height: 38, maxWidth: 64, objectFit: 'contain' }} />;
  }
  const favicon = faviconDe(t.rota);
  if (favicon) {
    return (
      <span style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--tf-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={favicon} alt={t.nome} style={{ width: 26, height: 26, borderRadius: 6 }} />
      </span>
    );
  }
  return (
    <span style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--tf-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
      {t.sigla}
    </span>
  );
}

export default function Hub() {
  const { me, state, cicloAtivo } = useStore();
  if (!me) return null;

  // demais ferramentas do Firestore (o Flux fixo não passa pelo banco)
  const outras = state.tools
    .filter((t) => t.id !== 'flux' && t.rota !== '/flux')
    .filter((t) => t.ativo && t.perfis.some((r) => me.roles.includes(r) || r === 'user'))
    .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99) || a.nome.localeCompare(b.nome));

  return (
    <div className="anim-in" style={{ maxWidth: 1320, margin: '0 auto', padding: '56px 32px 80px' }}>
      <span className="tf-mono">[ {hojeExtenso()} ]</span>
      <h1 className="tf-h2" style={{ margin: '12px 0 8px' }}>Olá, {primeiroNome(me.nome)}.</h1>
      <p className="tf-lead" style={{ margin: 0 }}>Suas ferramentas de IA em um só lugar.</p>

      <div className="tf-mono" style={{ margin: '44px 0 16px' }}>[ FERRAMENTAS ]</div>
      <div className="tf-card-grid grid-hub" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {/* Flux — permanente e em destaque, definido em código */}
        <CardFluxDestaque c={cicloAtivo} />

        {outras.map((t) => (
          <CardFerramenta key={t.id} rota={rotaNormalizada(t.rota)} externa={/^https?:\/\//.test(rotaNormalizada(t.rota))}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <IconeFerramenta t={t} />
              <Badge kind="live">{t.importada ? '● importada' : '● ativa'}</Badge>
            </div>
            <h3 className="tf-h4" style={{ margin: '4px 0 0' }}>{t.nome}</h3>
            <p className="tf-small" style={{ margin: 0, flex: 1, color: 'var(--tf-ink)', fontSize: '0.95rem', fontWeight: 500 }}>{t.desc}</p>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tf-accent)' }}>Abrir →</span>
          </CardFerramenta>
        ))}

        <div style={{ background: 'var(--tf-bg-pure)', padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, minHeight: 216 }}>
          <div style={{ border: '1px dashed var(--tf-line-2)', borderRadius: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, textAlign: 'center' }}>
            <span className="tf-mono" style={{ fontSize: '0.6rem' }}>[ EM BREVE ]</span>
            <p className="tf-small" style={{ margin: 0, maxWidth: 230 }}>Os melhores projetos do Flux podem virar as próximas ferramentas deste hub.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
