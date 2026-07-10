/**
 * D0 · Triagem de acesso ao Claude (RF-24..28): Liberar Basic / Enterprise,
 * enviar ao backlog ou reprovar — mesmos poderes do comitê e dos admins (P12).
 */
import React from 'react';
import { useStore } from '../../store/AppStore';
import { dbr, mesesDoCiclo } from '../../lib/dates';
import { brl } from '../../lib/format';
import { catNome } from '../../lib/scoring';
import { Avatar, Vazio } from '../../components/ui';

export default function Acesso() {
  const store = useStore();
  const { state, cicloAtivo: c } = store;
  const acesso = state.projects.filter((p) => c && p.ciclo === c.id && !p.tier && !p.reprovado);
  const meses = c ? mesesDoCiclo(c.inicio, c.fim) : 3.5;

  return (
    <div style={{ marginTop: 30 }}>
      <p className="tf-body" style={{ margin: '0 0 20px' }}>
        Pitches inscritos aguardando avaliação: libere o tier de Claude para a execução — ou envie ao backlog / reprove. Vale a primeira decisão registrada.
      </p>
      {acesso.length === 0 && (
        <Vazio mono="[ FILA VAZIA ]" titulo="Nenhum pitch aguardando acesso" texto="Novos pitches inscritos aparecem aqui para o comitê definir o acesso ao Claude." />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {acesso.map((p) => {
          const u = store.byId(p.uid)!;
          return (
            <div key={p.id} className="tf-card" style={{ padding: '24px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <Avatar nome={u.nome} cor={store.cor(u.id)} size={38} fontSize="0.66rem" />
                <div style={{ flex: 1, minWidth: 'min(280px, 100%)' }}>
                  <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.25 }}>{p.nome}</div>
                  <div className="tf-small" style={{ fontSize: '0.8rem', marginTop: 3 }}>{u.nome} · {u.depto || u.cargo} · {catNome(p.cat)}</div>
                  <div className="tf-mono" style={{ fontSize: '0.6rem', marginTop: 6 }}>
                    {brl(p.estimPer === 'mes' ? p.estimValor * meses : p.estimValor)} POR CICLO ESTIMADOS · DEADLINE {dbr(p.deadline)}
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--tf-ink-2)', lineHeight: 1.5, margin: '10px 0 0', maxWidth: 640 }}>{p.just}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--tf-line)', marginTop: 16, paddingTop: 16 }}>
                <button onClick={() => store.definirTier(p.id, 'Basic')} className="tf-btn tf-btn-primary" style={{ padding: '9px 16px' }}>Liberar Basic</button>
                <button onClick={() => store.definirTier(p.id, 'Enterprise')} className="tf-btn tf-btn-accent" style={{ padding: '9px 16px' }}>Liberar Enterprise</button>
                <button
                  onClick={() => store.confirmar({
                    titulo: 'Enviar pitch para o backlog?',
                    texto: '"' + p.nome + '" sai deste ciclo e fica guardado no Backlog de Projetos. O titular pode reativá-lo quando um novo ciclo abrir as inscrições — e pode inscrever um novo pitch enquanto as inscrições deste ciclo estiverem abertas.',
                    cta: 'Enviar para o backlog',
                    onConfirm: () => store.enviarBacklog(p.id),
                  })}
                  className="tf-btn tf-btn-ghost" style={{ padding: '9px 14px' }}
                >
                  Enviar para o backlog
                </button>
                <button
                  onClick={() => store.confirmar({
                    titulo: 'Reprovar este pitch?',
                    texto: '"' + p.nome + '" será marcado como Reprovado e não participa do ranking deste ciclo. A decisão fica registrada nos logs de auditoria.',
                    cta: 'Reprovar pitch', danger: true,
                    onConfirm: () => store.reprovarPitch(p.id, 'triagem'),
                  })}
                  className="tf-btn tf-btn-ghost tf-btn-danger" style={{ padding: '9px 14px' }}
                >
                  Reprovar pitch
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="tf-small" style={{ fontSize: '0.74rem', margin: '14px 0 0' }}>
        O tier libera o Claude do colaborador para executar o pitch neste ciclo (a concessão em si é manual, no console). Backlog guarda a ideia para o próximo ciclo; reprovar tira o pitch do ranking.
      </p>
    </div>
  );
}
