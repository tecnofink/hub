/** Abas da Página da Feira: Logística & Stand · Captação de Leads · Portal do Expositor. */
import React, { useState } from 'react';
import type { PbFeira, PbLeadManual, PbLeadOrigem, PbLogisticaDoc } from '../../lib/playbook';
import { brl } from '../../lib/format';
import { useStore } from '../../store/AppStore';
import { pbId } from './usePlaybook';
import { CampoBlur, NumeroBlur, UploadCampo } from './comum';
import { L } from '../../components/ui';

const DOC_SLOTS: { slot: PbLogisticaDoc['slot']; rotulo: string }[] = [
  { slot: 'stand', rotulo: '📐 Projeto do stand' },
  { slot: 'buffet', rotulo: '🍽️ Contrato de buffet' },
  { slot: 'organizacao', rotulo: '🤝 Contrato com a organização' },
  { slot: 'planta', rotulo: '🗺️ Planta baixa da feira' },
];

const ORIGENS: PbLeadOrigem[] = ['Cartão de visita', 'Aplicativo', 'Outro'];

export default function AbasFeira({ aba, eventoId, feira, salvar, podeEditar }: {
  aba: 'logistica' | 'leads' | 'portal';
  eventoId: string;
  feira: PbFeira;
  salvar: (f: PbFeira) => void;
  podeEditar: boolean;
}) {
  if (aba === 'logistica') return <AbaLogistica eventoId={eventoId} feira={feira} salvar={salvar} podeEditar={podeEditar} />;
  if (aba === 'leads') return <AbaLeads eventoId={eventoId} feira={feira} salvar={salvar} podeEditar={podeEditar} />;
  return <AbaPortal feira={feira} salvar={salvar} podeEditar={podeEditar} />;
}

/* ── Logística & Stand ── */
function AbaLogistica({ eventoId, feira, salvar, podeEditar }: { eventoId: string; feira: PbFeira; salvar: (f: PbFeira) => void; podeEditar: boolean }) {
  const store = useStore();
  const log = feira.logistica;
  const setLog = (patch: Partial<PbFeira['logistica']>) => salvar({ ...feira, logistica: { ...log, ...patch } });
  const totalCustos = log.custos.reduce((a, c) => a + c.valor, 0);

  const docDe = (slot: PbLogisticaDoc['slot']) => log.docs.find((d) => d.slot === slot);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
        {DOC_SLOTS.map(({ slot, rotulo }) => (
          <UploadCampo
            key={slot} rotulo={rotulo} valor={docDe(slot)} pathPrefix={`logistica/${eventoId}`} accept=".pdf,image/*" podeEditar={podeEditar}
            onSalvar={(arq) => {
              const outros = log.docs.filter((d) => d.slot !== slot);
              setLog({ docs: arq ? [...outros, { id: docDe(slot)?.id ?? pbId(), slot, ordem: 0, ...arq }] : outros });
            }}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div><L>Hotel</L><CampoBlur area valor={log.hotel ?? ''} onSalvar={(v) => setLog({ hotel: v })} desabilitado={!podeEditar} placeholder="Reserva, endereço, contato…" /></div>
        <div><L>Transporte</L><CampoBlur area valor={log.transporte ?? ''} onSalvar={(v) => setLog({ transporte: v })} desabilitado={!podeEditar} placeholder="Voos, carro, transfer…" /></div>
        <div><L>Observações</L><CampoBlur area valor={log.obs ?? ''} onSalvar={(v) => setLog({ obs: v })} desabilitado={!podeEditar} /></div>
      </div>

      <div>
        <L>Colaboradores na feira</L>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
          {log.colaboradores.map((c, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid var(--tf-line-2)', borderRadius: 999, padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
              {c}
              {podeEditar && <a className="acao" onClick={() => setLog({ colaboradores: log.colaboradores.filter((_, j) => j !== i) })} style={{ color: 'var(--tf-crit)', fontWeight: 700 }}>×</a>}
            </span>
          ))}
          {podeEditar && (
            <input
              className="f-input" placeholder="+ nome (Enter)" style={{ width: 160, padding: '6px 11px', fontSize: '0.8rem' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) { setLog({ colaboradores: [...log.colaboradores, v] }); (e.target as HTMLInputElement).value = ''; }
                }
              }}
            />
          )}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <L>Custos da feira</L>
          <span className="tf-mono" style={{ fontSize: '0.66rem', color: 'var(--tf-accent)' }}>TOTAL · {brl(totalCustos)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {log.custos.sort((a, b) => a.ordem - b.ordem).map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CampoBlur valor={c.descricao} onSalvar={(v) => setLog({ custos: log.custos.map((x) => (x.id === c.id ? { ...x, descricao: v } : x)) })} desabilitado={!podeEditar} placeholder="Descrição" style={{ flex: 1, padding: '8px 11px', fontSize: '0.84rem' }} />
              <NumeroBlur valor={c.valor} onSalvar={(v) => setLog({ custos: log.custos.map((x) => (x.id === c.id ? { ...x, valor: v ?? 0 } : x)) })} desabilitado={!podeEditar} largura={120} placeholder="R$" />
              {podeEditar && (
                <a className="acao" onClick={() => store.confirmar({ titulo: 'Remover custo?', texto: c.descricao || 'Item de custo', cta: 'Remover', danger: true, onConfirm: () => setLog({ custos: log.custos.filter((x) => x.id !== c.id) }) })} style={{ color: 'var(--tf-crit)', fontWeight: 700 }}>×</a>
              )}
            </div>
          ))}
          {podeEditar && (
            <button onClick={() => setLog({ custos: [...log.custos, { id: pbId(), descricao: '', valor: 0, ordem: log.custos.length }] })} className="tf-btn tf-btn-ghost" style={{ alignSelf: 'flex-start', padding: '7px 13px', fontSize: '0.78rem' }}>
              + Custo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Captação de Leads (PII — visível apenas dentro do portal logado) ── */
function AbaLeads({ eventoId, feira, salvar, podeEditar }: { eventoId: string; feira: PbFeira; salvar: (f: PbFeira) => void; podeEditar: boolean }) {
  const store = useStore();
  const leads = feira.leads;
  const setLeads = (patch: Partial<PbFeira['leads']>) => salvar({ ...feira, leads: { ...leads, ...patch } });

  const exportarCsv = () => {
    const linhas = [
      ['Nome', 'Empresa', 'Cargo', 'E-mail', 'Telefone', 'Origem', 'Obs'],
      ...leads.manuais.map((l) => [l.nome, l.empresa, l.cargo, l.email, l.telefone, l.origem, l.obs].map((x) => x ?? '')),
    ];
    const csv = '﻿' + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <UploadCampo rotulo="Planilha do coletor do evento" valor={leads.planilha} pathPrefix={`leads/${eventoId}`} accept=".xlsx,.xls,.csv" podeEditar={podeEditar} onSalvar={(arq) => setLeads({ planilha: arq })} />
        <UploadCampo rotulo="Planilha consolidada (manual)" valor={leads.manualPlanilha} pathPrefix={`leads/${eventoId}`} accept=".xlsx,.xls,.csv" podeEditar={podeEditar} onSalvar={(arq) => setLeads({ manualPlanilha: arq })} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <L>Captação manual · {leads.manuais.length} lead{leads.manuais.length === 1 ? '' : 's'}</L>
          <div style={{ display: 'flex', gap: 8 }}>
            {leads.manuais.length > 0 && <button onClick={exportarCsv} className="tf-btn tf-btn-ghost" style={{ padding: '7px 13px', fontSize: '0.78rem' }}>Exportar CSV</button>}
            {podeEditar && (
              <button
                onClick={() => setLeads({ manuais: [...leads.manuais, { id: pbId(), origem: 'Cartão de visita', ordem: leads.manuais.length } as PbLeadManual] })}
                className="tf-btn tf-btn-accent" style={{ padding: '7px 13px', fontSize: '0.78rem' }}
              >
                + Lead
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 150px 130px 180px 130px 140px 1fr 40px', minWidth: 960, gap: 0, padding: '9px 4px', borderBottom: '1px solid var(--tf-line)' }}>
            {['NOME', 'EMPRESA', 'CARGO', 'E-MAIL', 'TELEFONE', 'ORIGEM', 'OBS', ''].map((h, i) => <span key={i} className="tf-mono" style={{ fontSize: '0.54rem' }}>{h}</span>)}
          </div>
          {leads.manuais.sort((a, b) => a.ordem - b.ordem).map((l) => {
            const setLead = (patch: Partial<PbLeadManual>) => setLeads({ manuais: leads.manuais.map((x) => (x.id === l.id ? { ...x, ...patch } : x)) });
            const campo = (k: keyof PbLeadManual, ph: string) => (
              <CampoBlur valor={(l[k] as string) ?? ''} onSalvar={(v) => setLead({ [k]: v } as Partial<PbLeadManual>)} desabilitado={!podeEditar} placeholder={ph} style={{ padding: '6px 8px', fontSize: '0.78rem', border: 'none', background: 'transparent' }} />
            );
            return (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '150px 150px 130px 180px 130px 140px 1fr 40px', minWidth: 960, gap: 0, borderBottom: '1px solid var(--tf-line)', alignItems: 'center' }}>
                {campo('nome', 'Nome')}
                {campo('empresa', 'Empresa')}
                {campo('cargo', 'Cargo')}
                {campo('email', 'email@')}
                {campo('telefone', '(xx)')}
                <select
                  className="f-select" value={l.origem} disabled={!podeEditar}
                  onChange={(e) => setLead({ origem: e.target.value as PbLeadOrigem })}
                  style={{ padding: '5px 6px', fontSize: '0.76rem', border: 'none', background: 'transparent' }}
                >
                  {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                {campo('obs', '—')}
                <span style={{ textAlign: 'center' }}>
                  {podeEditar && (
                    <a className="acao" onClick={() => store.confirmar({ titulo: 'Remover lead?', texto: (l.nome || 'Lead sem nome') + ' será removido.', cta: 'Remover', danger: true, onConfirm: () => setLeads({ manuais: leads.manuais.filter((x) => x.id !== l.id) }) })} style={{ color: 'var(--tf-crit)', fontWeight: 700 }}>×</a>
                  )}
                </span>
              </div>
            );
          })}
          {leads.manuais.length === 0 && <p className="tf-small" style={{ margin: '10px 0 0', fontSize: '0.78rem' }}>Nenhum lead manual registrado nesta feira.</p>}
        </div>
        <p className="tf-small" style={{ fontSize: '0.7rem', margin: '10px 0 0' }}>Dados pessoais (LGPD) — visíveis apenas dentro do portal, para colaboradores logados.</p>
      </div>
    </div>
  );
}

/* ── Portal do Expositor (credenciais — visível apenas no portal logado) ── */
function AbaPortal({ feira, salvar, podeEditar }: { feira: PbFeira; salvar: (f: PbFeira) => void; podeEditar: boolean }) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const portal = feira.portal;
  const setPortal = (patch: Partial<PbFeira['portal']>) => salvar({ ...feira, portal: { ...portal, ...patch } });

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div><L>Link do portal do expositor</L><CampoBlur mono valor={portal.link ?? ''} onSalvar={(v) => setPortal({ link: v })} desabilitado={!podeEditar} placeholder="https://…" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div><L>Login</L><CampoBlur mono valor={portal.login ?? ''} onSalvar={(v) => setPortal({ login: v })} desabilitado={!podeEditar} /></div>
        <div>
          <L>Senha</L>
          <div style={{ display: 'flex', gap: 6 }}>
            <CampoBlur mono tipo={mostrarSenha ? 'text' : 'password'} valor={portal.senha ?? ''} onSalvar={(v) => setPortal({ senha: v })} desabilitado={!podeEditar} style={{ flex: 1 }} />
            <button onClick={() => setMostrarSenha((v) => !v)} className="tf-btn tf-btn-ghost" style={{ padding: '8px 12px', flex: 'none' }}>{mostrarSenha ? 'ocultar' : 'ver'}</button>
          </div>
        </div>
      </div>
      {portal.link && <a href={portal.link} target="_blank" rel="noreferrer" className="tf-btn tf-btn-ghost" style={{ alignSelf: 'flex-start' }}>Abrir portal ↗</a>}
      <p className="tf-small" style={{ fontSize: '0.7rem', margin: 0 }}>Credenciais visíveis apenas para colaboradores logados no portal.</p>
    </div>
  );
}
