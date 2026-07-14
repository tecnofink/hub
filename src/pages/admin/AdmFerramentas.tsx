/**
 * E7 · Ferramentas do hub (RF-57): cadastro, ordem, ativação e exclusão.
 * O FLUX é permanente e definido em código — não aparece nem é editável aqui.
 * O ícone das ferramentas é automático (favicon do site da rota externa).
 */
import React, { useState } from 'react';
import { useStore } from '../../store/AppStore';
import { faviconDe, iconeNativo } from '../../lib/roles';
import { Badge, L, Mono } from '../../components/ui';

export default function AdmFerramentas() {
  const store = useStore();
  const { state } = store;
  const [f, setF] = useState({ nome: '', desc: '', rota: '' });
  const [erro, setErro] = useState<string | null>(null);

  // o Flux é fixo em código; qualquer resquício dele no banco fica oculto
  const ordenadas = [...state.tools]
    .filter((t) => t.id !== 'flux' && t.rota !== '/flux')
    .sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99) || a.nome.localeCompare(b.nome));

  const cadastrar = () => {
    if (!f.nome.trim() || !f.desc.trim() || !f.rota.trim()) return setErro('Preencha nome, descrição e rota.');
    store.addFerramenta(f);
    setF({ nome: '', desc: '', rota: '' });
    setErro(null);
  };

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Ferramentas do hub</h1>
      <p className="tf-body" style={{ margin: '0 0 22px' }}>
        Cadastre ferramentas sem alterar o código do hub. O ícone é automático (favicon do site da rota). O <strong>Flux é permanente</strong> e só muda via código do app.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Flux — fixo, somente informativo */}
        <div className="tf-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'var(--tf-bg-2)' }}>
          <span style={{ width: 22, textAlign: 'center', color: 'var(--tf-ink-3)', flex: 'none' }} title="Fixado — sempre primeiro">📌</span>
          <img src="/brand/flux-badge.png" alt="Flux" style={{ width: 34, height: 34, flex: 'none' }} />
          <Badge kind="live" style={{ flex: 'none' }}>● PERMANENTE</Badge>
          <div style={{ flex: 1, minWidth: 260 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Flux</span>
            <span className="tf-mono" style={{ fontSize: '0.62rem', marginLeft: 10 }}>/flux</span>
            <div className="tf-small" style={{ fontSize: '0.78rem', marginTop: 2 }}>Ferramenta permanente do hub — alterações exclusivamente via código do app.</div>
          </div>
        </div>

        {ordenadas.map((t, i) => (
          <div key={t.id} className="tf-card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 'none' }}>
              <button type="button"
                className="acao foco-tf" title="Mover para cima"
                onClick={() => i > 0 && store.moverFerramenta(t.id, -1)}
                style={{ color: i > 0 ? 'var(--tf-accent)' : 'var(--tf-line-2)', fontSize: '0.8rem', lineHeight: 1, cursor: i > 0 ? 'pointer' : 'default', padding: '4px 8px', margin: '-4px -8px' }}
              >▲</button>
              <button type="button"
                className="acao foco-tf" title="Mover para baixo"
                onClick={() => i < ordenadas.length - 1 && store.moverFerramenta(t.id, 1)}
                style={{ color: i < ordenadas.length - 1 ? 'var(--tf-accent)' : 'var(--tf-line-2)', fontSize: '0.8rem', lineHeight: 1, cursor: i < ordenadas.length - 1 ? 'pointer' : 'default', padding: '4px 8px', margin: '-4px -8px' }}
              >▼</button>
            </span>
            {iconeNativo(t.rota) ? (
              <img src={iconeNativo(t.rota)!} alt={t.nome} style={{ height: 26, maxWidth: 46, objectFit: 'contain', flex: 'none' }} />
            ) : faviconDe(t.rota) ? (
              <img src={faviconDe(t.rota)!} alt={t.nome} style={{ width: 30, height: 30, borderRadius: 7, flex: 'none' }} />
            ) : (
              <span style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--tf-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '0.78rem', flex: 'none' }}>{t.sigla}</span>
            )}
            <Badge kind={t.ativo ? 'live' : 'neutral'} style={{ flex: 'none' }}>{t.ativo ? '● ATIVA' : 'DESATIVADA'}</Badge>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.nome}</span>
              <span className="tf-mono" style={{ fontSize: '0.62rem', marginLeft: 10 }}>{t.rota}</span>
              {t.fixa && <span className="tf-mono" style={{ fontSize: '0.58rem', marginLeft: 10, color: 'var(--tf-accent)' }}>NATIVA</span>}
              {t.importada && <span className="tf-mono" style={{ fontSize: '0.58rem', marginLeft: 10, color: 'var(--tf-warn)' }}>IMPORTADA</span>}
              <div className="tf-small" style={{ fontSize: '0.78rem', marginTop: 2 }}>{t.desc}</div>
            </div>
            <button type="button" onClick={() => store.toggleFerramenta(t.id)} className="acao foco-tf" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tf-accent)', flex: 'none' }}>
              {t.ativo ? 'Desativar' : 'Ativar'}
            </button>
            {!t.fixa && (
              <button type="button"
                onClick={() => store.confirmar({
                  titulo: 'Excluir ferramenta?',
                  texto: '"' + t.nome + '" será removida do hub em definitivo.',
                  cta: 'Excluir', danger: true,
                  onConfirm: () => store.excluirFerramenta(t.id),
                })}
                className="acao foco-tf" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tf-crit)', flex: 'none' }}
              >
                Excluir
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button type="button"
          onClick={() => store.confirmar({
            titulo: 'Restaurar ferramentas nativas?',
            texto: 'Todos os cadastros atuais serão removidos e o Produtividade (/tarefas) e o Marketing (/playbook) serão recriados. O Flux não é afetado (fixo em código).',
            cta: 'Restaurar', danger: true,
            onConfirm: () => store.restaurarFerramentas(),
          })}
          className="acao foco-tf" style={{ fontSize: '0.78rem', color: 'var(--tf-ink-3)' }}
        >
          Restaurar ferramentas nativas
        </button>
      </div>

      <div className="tf-card" style={{ padding: 26, marginTop: 14, borderStyle: 'dashed' }}>
        <Mono accent>[ CADASTRAR FERRAMENTA ]</Mono>
        <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
          <div><L>Nome</L><input className="f-input" style={{ padding: '10px 13px', fontSize: '0.9rem' }} value={f.nome} onChange={(e) => { setF((s) => ({ ...s, nome: e.target.value })); setErro(null); }} placeholder="Ex.: Assistente de Propostas" /></div>
          <div><L>Rota / URL</L><input className="f-input" style={{ padding: '10px 13px', fontFamily: 'var(--tf-font-mono)', fontSize: '0.82rem' }} value={f.rota} onChange={(e) => { setF((s) => ({ ...s, rota: e.target.value })); setErro(null); }} placeholder="https://ferramenta.tecnofink.com ou /rota-interna" /></div>
          <div style={{ gridColumn: '1 / -1' }}><L>Descrição</L><input className="f-input" style={{ padding: '10px 13px', fontSize: '0.9rem' }} value={f.desc} onChange={(e) => { setF((s) => ({ ...s, desc: e.target.value })); setErro(null); }} placeholder="O que a ferramenta faz, em uma frase" /></div>
        </div>
        {erro && <div style={{ color: 'var(--tf-crit)', fontSize: '0.8rem', marginTop: 12 }}>{erro}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={cadastrar} className="tf-btn tf-btn-accent">Cadastrar no hub</button>
        </div>
        <p className="tf-small" style={{ fontSize: '0.72rem', margin: '12px 0 0' }}>
          O ícone é obtido automaticamente do site da rota (favicon). Rotas internas usam a sigla do nome até o módulo ser construído.
        </p>
      </div>
    </div>
  );
}
