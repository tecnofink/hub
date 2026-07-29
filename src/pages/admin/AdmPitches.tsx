/** E5 · Acesso dos pitches (RF-24, P12): triagem com os mesmos poderes do comitê. */
import React from 'react';
import { useStore, useUI } from '../../store/AppStore';
import { dbr, mesesDoCiclo } from '../../lib/dates';
import { brl } from '../../lib/format';
import { catNome } from '../../lib/scoring';
import { Avatar, Vazio } from '../../components/ui';
import PitchComentarios from '../../components/PitchComentarios';

const DESC_MAX = 400; // descrição do pitch clampada; excedente atrás de "mostrar mais"

function Descricao({ texto }: { texto: string }) {
  const [aberta, setAberta] = React.useState(false);
  const longa = texto.length > DESC_MAX;
  // corta em limite de palavra para não partir termo no meio
  const curta = longa ? texto.slice(0, DESC_MAX).replace(/\s+\S*$/, '') + '…' : texto;
  return (
    <p style={{ fontSize: '0.86rem', color: 'var(--tf-ink-2)', lineHeight: 1.5, margin: '10px 0 0', maxWidth: 640 }}>
      {aberta ? texto : curta}
      {longa && (
        <>
          {' '}
          <button type="button" className="acao foco-tf" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--tf-accent)' }}
            onClick={() => setAberta((v) => !v)}>
            {aberta ? 'mostrar menos' : 'mostrar mais'}
          </button>
        </>
      )}
    </p>
  );
}

export default function AdmPitches() {
  const store = useStore();
  const ui = useUI();
  const { state, cicloAtivo: c } = store;
  const fila = state.projects.filter((p) => c && p.ciclo === c.id && !p.tier && !p.reprovado);
  const meses = c ? mesesDoCiclo(c.inicio, c.fim) : 3.5;
  const [comentandoId, setComentandoId] = React.useState<string | null>(null);
  const comentando = comentandoId ? fila.find((p) => p.id === comentandoId) ?? null : null;

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Avaliação de acesso dos pitches</h1>
      <p className="tf-body" style={{ margin: '0 0 22px' }}>
        Todo mundo começa sem acesso: o tier definido aqui libera o Claude do colaborador para executar o pitch neste ciclo, até o encerramento. Comitê e administradores têm os mesmos poderes — vale a primeira decisão registrada.
      </p>
      {fila.length === 0 && (
        <Vazio mono="[ FILA VAZIA ]" texto="Todos os pitches inscritos já têm tier definido. Novos pitches aparecem aqui automaticamente." />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {fila.map((p) => {
          const u = store.byId(p.uid)!;
          return (
            <div key={p.id} className="tf-card" style={{ padding: '24px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <Avatar nome={u.nome} cor={store.cor(u.id)} size={38} fontSize="0.66rem" />
                <div style={{ flex: 1, minWidth: 'min(280px, 100%)' }}>
                  <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.25 }}>{p.nome}</div>
                  <div className="tf-small" style={{ fontSize: '0.8rem', marginTop: 3 }}>{u.nome} · {u.depto || u.cargo} · {catNome(p.cat)}</div>
                  <div className="tf-mono" style={{ fontSize: '0.6rem', marginTop: 6 }}>
                    {brl(p.estimPer === 'mes' ? p.estimValor * meses : p.estimValor)} POR CICLO · DEADLINE {dbr(p.deadline)}
                  </div>
                  <Descricao texto={p.just} />
                </div>
                <div style={{ display: 'flex', gap: 8, flex: 'none', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => ui.confirmar({
                      titulo: 'Enviar pitch para o backlog?',
                      texto: '"' + p.nome + '" sai deste ciclo e fica guardado no Backlog de Projetos. O titular pode reativá-lo quando um novo ciclo abrir as inscrições.',
                      cta: 'Enviar para o backlog',
                      onConfirm: () => store.enviarBacklog(p.id),
                    })}
                    className="tf-btn tf-btn-ghost" style={{ padding: '9px 13px', fontSize: '0.78rem' }}
                  >
                    Backlog
                  </button>
                  <button
                    onClick={() => ui.confirmar({
                      titulo: 'Reprovar este pitch?',
                      texto: '"' + p.nome + '" será marcado como Reprovado e não participa do ranking deste ciclo. A decisão fica registrada nos logs de auditoria.',
                      cta: 'Reprovar pitch', danger: true,
                      onConfirm: () => store.reprovarPitch(p.id, 'triagem'),
                    })}
                    className="tf-btn tf-btn-ghost tf-btn-danger" style={{ padding: '9px 13px', fontSize: '0.78rem' }}
                  >
                    Reprovar
                  </button>
                  <button onClick={() => store.definirTier(p.id, 'Basic')} className="tf-btn tf-btn-primary" style={{ padding: '10px 16px', fontSize: '0.82rem' }}>Definir Basic</button>
                  <button onClick={() => store.definirTier(p.id, 'Enterprise')} className="tf-btn tf-btn-accent" style={{ padding: '10px 16px', fontSize: '0.82rem' }}>Definir Enterprise</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                <button onClick={() => setComentandoId(p.id)} className="tf-btn tf-btn-ghost" style={{ padding: '12px 22px', fontSize: '0.9rem' }}>
                  💬 Comentários
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="tf-small" style={{ fontSize: '0.74rem', margin: '14px 0 0' }}>
        A concessão em si é manual, no console do Claude — acompanhe em Acessos ao Claude.
      </p>
      {comentando && <PitchComentarios pitch={comentando} onClose={() => setComentandoId(null)} />}
    </div>
  );
}
