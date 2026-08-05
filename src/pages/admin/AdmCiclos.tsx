/** E4 · Ciclos (RF-58): editar datas, encerrar (congela ranking) e criar novo ciclo. */
import React, { useEffect, useState } from 'react';
import { useStore, useUI } from '../../store/AppStore';
import { addDias, dbr, todayISO } from '../../lib/dates';
import { Badge, L, Mono } from '../../components/ui';
import { KB_COLS } from '../flux/statusProjeto';

export default function AdmCiclos() {
  const store = useStore();
  const ui = useUI();
  const { state, cicloAtivo: c } = store;
  const [ce, setCe] = useState(() => (c ? { nome: c.nome, inicio: c.inicio, limite: c.limite, fim: c.fim } : { nome: '', inicio: '', limite: '', fim: '' }));
  // #28: re-sincroniza o formulário quando o CICLO ATIVO troca (encerrar + novo)
  // — sem isto, dados do ciclo antigo eram gravados no novo. Chaveado por id,
  // então edições no mesmo ciclo não são perdidas por updates do listener.
  useEffect(() => {
    setCe(c ? { nome: c.nome, inicio: c.inicio, limite: c.limite, fim: c.fim } : { nome: '', inicio: '', limite: '', fim: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id]);

  // rótulos custom do kanban — sincroniza com o config quando ele chega/muda
  const [rotulos, setRotulos] = useState<Record<string, string>>(state.kanbanLabels);
  useEffect(() => { setRotulos(state.kanbanLabels); }, [state.kanbanLabels]);
  const [nc, setNc] = useState(() => ({
    nome: 'Ciclo ' + (state.cycles.length + 1),
    inicio: todayISO(),
    limite: addDias(todayISO(), 45),
    fim: addDias(todayISO(), 110),
  }));

  const dateGrid = (v: typeof ce, set: (x: typeof ce) => void) => (
    <div className="g-datas" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 14, alignItems: 'end' }}>
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
              onClick={() => ui.confirmar({
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
                if (!ce.nome.trim() || !ce.inicio || !ce.limite || !ce.fim) return ui.showToast('Preencha nome e as três datas do ciclo.');
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
                if (!nc.nome.trim() || !nc.inicio || !nc.limite || !nc.fim) return ui.showToast('Preencha nome e as três datas do novo ciclo.');
                store.criarCiclo({ nome: nc.nome.trim(), inicio: nc.inicio, limite: nc.limite, fim: nc.fim });
              }}
              className="tf-btn tf-btn-accent"
            >
              Criar e ativar ciclo
            </button>
          </div>
        </div>
      )}

      {/* Rótulos das etapas do kanban — o admin renomeia; a lógica de avanço
          dos cards não muda (só o nome exibido nas colunas). */}
      <div className="tf-card" style={{ padding: 26, marginTop: 16 }}>
        <Mono accent>[ ETAPAS DO KANBAN ]</Mono>
        <p className="tf-small" style={{ fontSize: '0.78rem', margin: '6px 0 14px' }}>
          Renomeie as colunas do kanban do Flux. Só o rótulo muda — o avanço automático dos cards continua o mesmo. Deixe em branco para voltar ao nome padrão.
        </p>
        <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {KB_COLS.map((col) => (
            <div key={col.id}>
              <L>{col.label}</L>
              <input className="f-input" style={{ padding: '10px 13px', fontSize: '0.9rem' }} maxLength={40}
                placeholder={col.label} value={rotulos[col.id] ?? ''}
                onChange={(e) => setRotulos({ ...rotulos, [col.id]: e.target.value })} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={() => store.salvarKanbanLabels(rotulos)} className="tf-btn tf-btn-accent">Salvar nomes das etapas</button>
        </div>
      </div>

      <div className="tf-mono" style={{ margin: '24px 0 12px' }}>[ TODOS OS CICLOS ]</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {state.cycles.map((x) => (
          <div key={x.id} className="tf-card" style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Badge kind={x.status === 'ativo' ? 'live' : 'neutral'} style={{ flex: 'none' }}>{x.status === 'ativo' ? '● ATIVO' : 'ENCERRADO'}</Badge>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{x.nome}</span>
            <span className="tf-small" style={{ fontSize: '0.8rem' }}>{dbr(x.inicio)} a {dbr(x.fim)} · inscrições até {dbr(x.limite)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
