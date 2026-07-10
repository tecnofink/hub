/** E4 · Ciclos (RF-58): editar datas, encerrar (congela ranking) e criar novo ciclo. */
import React, { useState } from 'react';
import { useStore } from '../../store/AppStore';
import { addDias, dbr, todayISO } from '../../lib/dates';
import { Badge, L, Mono } from '../../components/ui';

export default function AdmCiclos() {
  const store = useStore();
  const { state, cicloAtivo: c } = store;
  const [ce, setCe] = useState(() => (c ? { nome: c.nome, inicio: c.inicio, limite: c.limite, fim: c.fim } : { nome: '', inicio: '', limite: '', fim: '' }));
  const [nc, setNc] = useState(() => ({
    nome: 'Ciclo ' + (state.cycles.length + 1),
    inicio: todayISO(),
    limite: addDias(todayISO(), 45),
    fim: addDias(todayISO(), 110),
  }));

  const dateGrid = (v: typeof ce, set: (x: typeof ce) => void) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 14, alignItems: 'end' }}>
      <div><L>Nome</L><input className="f-input" style={{ padding: '10px 13px', fontSize: '0.9rem' }} value={v.nome} onChange={(e) => set({ ...v, nome: e.target.value })} /></div>
      <div><L>Abertura</L><input type="date" className="f-input" value={v.inicio} onChange={(e) => set({ ...v, inicio: e.target.value })} /></div>
      <div><L>Fim das inscrições</L><input type="date" className="f-input" value={v.limite} onChange={(e) => set({ ...v, limite: e.target.value })} /></div>
      <div><L>Encerramento</L><input type="date" className="f-input" value={v.fim} onChange={(e) => set({ ...v, fim: e.target.value })} /></div>
    </div>
  );

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Ciclos</h1>
      <p className="tf-body" style={{ margin: '0 0 22px' }}>Um ciclo ativo por vez. Encerrar um ciclo congela o ranking e o arquiva no histórico.</p>

      {c ? (
        <div className="tf-card" style={{ padding: 26, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Mono accent>[ CICLO VIGENTE ]</Mono>
            <Badge kind="live">● ativo</Badge>
          </div>
          {dateGrid(ce, setCe)}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button
              onClick={() => store.confirmar({
                titulo: 'Encerrar o ' + c.nome + '?',
                texto: 'O ranking será congelado e arquivado no histórico. Projetos sem resultado ficam fora do ranking até decisão do comitê. Um novo ciclo poderá ser criado em seguida.',
                cta: 'Encerrar ciclo', danger: true,
                onConfirm: () => store.encerrarCiclo(),
              })}
              className="tf-btn tf-btn-ghost tf-btn-danger"
            >
              Encerrar ciclo e congelar ranking
            </button>
            <button
              onClick={() => {
                if (!ce.nome.trim() || !ce.inicio || !ce.limite || !ce.fim) return store.showToast('Preencha nome e as três datas do ciclo.');
                store.salvarCiclo({ nome: ce.nome.trim(), inicio: ce.inicio, limite: ce.limite, fim: ce.fim });
              }}
              className="tf-btn tf-btn-accent"
            >
              Salvar alterações
            </button>
          </div>
        </div>
      ) : (
        <div className="tf-card" style={{ padding: 26, marginBottom: 16, borderStyle: 'dashed' }}>
          <Mono accent>[ CRIAR NOVO CICLO ]</Mono>
          <div style={{ marginTop: 16 }}>{dateGrid(nc, setNc)}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button
              onClick={() => {
                if (!nc.nome.trim() || !nc.inicio || !nc.limite || !nc.fim) return store.showToast('Preencha nome e as três datas do novo ciclo.');
                store.criarCiclo({ nome: nc.nome.trim(), inicio: nc.inicio, limite: nc.limite, fim: nc.fim });
              }}
              className="tf-btn tf-btn-accent"
            >
              Criar e ativar ciclo
            </button>
          </div>
        </div>
      )}

      <div className="tf-mono" style={{ margin: '24px 0 12px' }}>[ TODOS OS CICLOS ]</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {state.cycles.map((x) => (
          <div key={x.id} className="tf-card" style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge kind={x.status === 'ativo' ? 'live' : 'neutral'} style={{ flex: 'none' }}>{x.status === 'ativo' ? '● ATIVO' : 'ENCERRADO'}</Badge>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{x.nome}</span>
            <span className="tf-small" style={{ fontSize: '0.8rem' }}>{dbr(x.inicio)} a {dbr(x.fim)} · inscrições até {dbr(x.limite)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
