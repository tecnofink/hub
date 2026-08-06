/**
 * [02] Catálogos — estoque, consumo por evento e projeção de compra.
 * Cálculos (saldo, compra, críticos) são derivados na tela; persistem apenas
 * estoque e o consumo por evento (modelo do playbook original).
 */
import React, { useState } from 'react';
import type { PbCatalogo, PbDocCatalogos, PbGrupoCatalogo } from '../../lib/playbook';
import { MetricStat } from '../../components/ui';
import { useUI } from '../../store/AppStore';
import { pbId } from './usePlaybook';
import { BotaoRemover, NumeroBlur, SecHead } from './comum';

const LIMIAR_ATENCAO = 200;

/**
 * Data de início do evento em ISO. Usa o campo estruturado (dataISO) e, na
 * falta dele, lê o rótulo legado da planilha ("27-29/05", "08-10/07",
 * "12/11/2026"), pegando o PRIMEIRO dia do período. Sem ano no texto, assume o
 * ANO CORRENTE — a projeção é do calendário do ano (a tabela é "CONSUMO
 * <ano>"), então jogar um evento já realizado para o ano seguinte enganaria.
 * Para outro ano, o editor define a data no campo próprio.
 */
export function eventoISO(ev: { dataISO?: string; data?: string }): string | null {
  if (ev.dataISO) return ev.dataISO;
  const txt = (ev.data ?? '').trim();
  const m = txt.match(/(\d{1,2})\s*(?:[-–a]\s*\d{1,2})?\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?/);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;
  const ano = m[3] ? Number(m[3].length === 2 ? '20' + m[3] : m[3]) : new Date().getFullYear();
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** yyyy-mm-dd → dd/mm/aaaa */
const dBR = (iso: string) => iso.split('-').reverse().join('/');

export default function SecCatalogos({ dados, podeEditar, salvar }: {
  dados: PbDocCatalogos;
  podeEditar: boolean;
  salvar: (d: PbDocCatalogos) => void;
}) {
  const ui = useUI();
  const [consumoAberto, setConsumoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoGrupo, setNovoGrupo] = useState<PbGrupoCatalogo>('gerais');

  const eventos = [...dados.eventos].sort((a, b) => a.ordem - b.ordem);

  const consumoFuturo = (c: PbCatalogo) => eventos.reduce((a, ev) => a + (dados.consumo[c.id]?.[ev.id] ?? 0), 0);
  const historico = (c: PbCatalogo) => Math.max(0, c.consumoAnual - consumoFuturo(c));
  const saldoFinal = (c: PbCatalogo) => c.estoque - consumoFuturo(c);
  // primeiro evento em que o estoque fica negativo: é ANTES dele que a compra
  // precisa chegar. Mostra a data do evento em dd/mm/aaaa (antes exibia o
  // rótulo cru da planilha, "21-24/09", que não dizia o ano nem o dia da compra)
  const comprarAntesDe = (c: PbCatalogo): { texto: string; titulo: string } | null => {
    let saldo = c.estoque;
    for (const ev of eventos) {
      saldo -= dados.consumo[c.id]?.[ev.id] ?? 0;
      if (saldo < 0) {
        const iso = eventoISO(ev);
        return {
          texto: iso ? dBR(iso) : (ev.data ?? ev.nome),
          titulo: ev.nome + (ev.data ? ' · ' + ev.data : ''),
        };
      }
    }
    return null;
  };

  const setDataEvento = (evId: string, iso: string) =>
    salvar({ ...dados, eventos: dados.eventos.map((e) => (e.id === evId ? { ...e, dataISO: iso || undefined } : e)) });

  const todos = [...dados.catalogos].sort((a, b) => a.ordem - b.ordem);
  const estoqueTotal = todos.reduce((a, c) => a + c.estoque, 0);
  const consumoPrevisto = todos.reduce((a, c) => a + consumoFuturo(c), 0);
  const necessidade = todos.reduce((a, c) => a + Math.max(0, -saldoFinal(c)), 0);
  const criticos = todos.filter((c) => saldoFinal(c) < 0).length;

  const setEstoque = (c: PbCatalogo, v: number | undefined) =>
    salvar({ ...dados, catalogos: dados.catalogos.map((x) => (x.id === c.id ? { ...x, estoque: v ?? 0 } : x)) });

  const setConsumo = (c: PbCatalogo, evId: string, v: number | undefined) =>
    salvar({ ...dados, consumo: { ...dados.consumo, [c.id]: { ...dados.consumo[c.id], [evId]: v ?? 0 } } });

  const tabelaProjecao = (grupo: PbGrupoCatalogo, titulo: string) => {
    const cats = todos.filter((c) => c.grupo === grupo);
    if (!cats.length) return null;
    return (
      <div className="tf-card" style={{ padding: 0, overflow: 'auto', marginTop: 14 }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)' }}>
          <span className="tf-mono" style={{ fontSize: '0.6rem' }}>{titulo.toUpperCase()}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `220px 100px 110px 110px 1fr 60px`, minWidth: 760, gap: 0, padding: '10px 20px', borderBottom: '1px solid var(--tf-line)' }}>
          {['CATÁLOGO', 'ESTOQUE', 'CONSUMO 2026', 'SALDO FINAL', 'COMPRAR ANTES DE', ''].map((h, i) => (
            <span key={i} className="tf-mono" style={{ fontSize: '0.56rem' }}>{h}</span>
          ))}
        </div>
        {cats.map((c) => {
          const saldo = saldoFinal(c);
          const compra = comprarAntesDe(c);
          const cor = saldo < 0 ? 'var(--tf-crit)' : saldo <= LIMIAR_ATENCAO ? 'var(--tf-warn)' : 'var(--tf-live)';
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: `220px 100px 110px 110px 1fr 60px`, minWidth: 760, gap: 0, padding: '9px 20px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{c.nome}</span>
              <span>{podeEditar ? <NumeroBlur valor={c.estoque} onSalvar={(v) => setEstoque(c, v)} largura={78} /> : <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.8rem' }}>{c.estoque}</span>}</span>
              <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.8rem' }}>{consumoFuturo(c)}</span>
              <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.8rem', fontWeight: 700, color: cor }}>{saldo}</span>
              <span title={compra?.titulo} style={{ fontFamily: compra ? 'var(--tf-font-mono)' : undefined, fontSize: '0.78rem', color: compra ? 'var(--tf-crit)' : 'var(--tf-ink-3)' }}>{compra?.texto ?? '—'}</span>
              <span style={{ textAlign: 'right' }}>
                {c.isCustom && (
                  <BotaoRemover
                    podeEditar={podeEditar} titulo="Remover catálogo?"
                    texto={`"${c.nome}" e o consumo previsto dele serão removidos.`}
                    onConfirmar={() => {
                      const { [c.id]: _, ...resto } = dados.consumo;
                      salvar({ ...dados, catalogos: dados.catalogos.filter((x) => x.id !== c.id), consumo: resto });
                    }}
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section>
      <SecHead id="catalogos" num="02" titulo="Catálogos" sub="Projeção de estoque ao longo dos eventos do ano — o saldo considera o consumo previsto por evento." />
      <div className="g-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: '1px solid var(--tf-line)', borderRadius: 10, background: 'var(--tf-bg-pure)', overflow: 'hidden' }}>
        {[
          { v: estoqueTotal.toLocaleString('pt-BR'), l: 'estoque total', crit: false },
          { v: consumoPrevisto.toLocaleString('pt-BR'), l: 'consumo previsto 2026', crit: false },
          { v: necessidade.toLocaleString('pt-BR'), l: 'necessidade de compra', crit: necessidade > 0 },
          { v: String(criticos), l: 'produtos críticos', crit: criticos > 0 },
        ].map((st, i) => (
          <div key={i} style={{ padding: '18px 22px', borderRight: i < 3 ? '1px solid var(--tf-line)' : 'none' }}>
            <MetricStat value={st.v} label={st.l} critical={st.crit} />
          </div>
        ))}
      </div>

      {tabelaProjecao('gerais', 'Catálogos gerais')}
      {tabelaProjecao('powerpoxi', 'PowerPoxi')}

      {podeEditar && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="f-input" style={{ maxWidth: 260, padding: '9px 12px', fontSize: '0.86rem' }} value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Novo catálogo…" />
          <select className="f-select" style={{ width: 140, padding: '9px 10px' }} value={novoGrupo} onChange={(e) => setNovoGrupo(e.target.value as PbGrupoCatalogo)}>
            <option value="gerais">Gerais</option>
            <option value="powerpoxi">PowerPoxi</option>
          </select>
          <button
            onClick={() => {
              if (!novoNome.trim()) return ui.showToast('Dê um nome ao catálogo.');
              salvar({ ...dados, catalogos: [...dados.catalogos, { id: pbId(), nome: novoNome.trim(), grupo: novoGrupo, estoque: 0, consumoAnual: 0, isCustom: true, ordem: todos.reduce((a, c) => Math.max(a, c.ordem), 0) + 1 }] });
              setNovoNome('');
            }}
            className="tf-btn tf-btn-ghost" style={{ padding: '8px 14px' }}
          >
            + Adicionar
          </button>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <button type="button" className="acao foco-tf" onClick={() => setConsumoAberto((v) => !v)} style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--tf-accent)' }}>
          {consumoAberto ? '▾ Ocultar consumo previsto por evento' : '▸ Consumo previsto por evento'}
        </button>
        {consumoAberto && (
          <div className="tf-card" style={{ padding: 0, overflow: 'auto', marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: `200px 90px repeat(${eventos.length}, 90px)`, minWidth: 300 + eventos.length * 90, gap: 0, padding: '10px 20px', borderBottom: '1px solid var(--tf-line)', background: 'var(--tf-bg-2)' }}>
              <span className="tf-mono" style={{ fontSize: '0.56rem' }}>CATÁLOGO</span>
              <span className="tf-mono" style={{ fontSize: '0.56rem' }}>FBCC (HIST.)</span>
              {eventos.map((ev) => <span key={ev.id} className="tf-mono" style={{ fontSize: '0.56rem' }}>{ev.nome.toUpperCase()}</span>)}
            </div>
            {/* data de início de cada evento — base do "comprar antes de".
                Sem data definida, o sistema lê o rótulo antigo da planilha. */}
            <div style={{ display: 'grid', gridTemplateColumns: `200px 90px repeat(${eventos.length}, 90px)`, minWidth: 300 + eventos.length * 90, gap: 0, padding: '7px 20px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
              <span className="tf-mono" style={{ fontSize: '0.54rem', color: 'var(--tf-ink-3)' }}>DATA DO EVENTO</span>
              <span />
              {eventos.map((ev) => {
                const iso = eventoISO(ev);
                return (
                  <span key={ev.id}>
                    {podeEditar ? (
                      <input type="date" className="f-input" value={ev.dataISO ?? iso ?? ''}
                        onChange={(e) => setDataEvento(ev.id, e.target.value)}
                        style={{ padding: '4px 6px', fontSize: '0.7rem', width: 84 }} />
                    ) : (
                      <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.7rem', color: 'var(--tf-ink-3)' }}>{iso ? dBR(iso) : '—'}</span>
                    )}
                  </span>
                );
              })}
            </div>
            {todos.map((c) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: `200px 90px repeat(${eventos.length}, 90px)`, minWidth: 300 + eventos.length * 90, gap: 0, padding: '7px 20px', borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.nome}</span>
                <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.78rem', color: 'var(--tf-ink-3)' }}>{historico(c)}</span>
                {eventos.map((ev) => (
                  <span key={ev.id}>
                    {podeEditar
                      ? <NumeroBlur valor={dados.consumo[c.id]?.[ev.id] ?? 0} onSalvar={(v) => setConsumo(c, ev.id, v)} largura={70} />
                      : <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.78rem' }}>{dados.consumo[c.id]?.[ev.id] ?? 0}</span>}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
