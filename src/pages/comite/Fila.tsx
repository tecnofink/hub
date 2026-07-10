/** D1 · Fila de avaliação (RF-37): resultados registrados com avaliação incompleta. */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr } from '../../lib/dates';
import { brl } from '../../lib/format';
import { isAvaliado, nNotas, nValidacoes } from '../../lib/scoring';
import { Avatar, Badge, Vazio } from '../../components/ui';

export default function Fila() {
  const store = useStore();
  const { me, state } = store;
  const nav = useNavigate();
  if (!me) return null;

  const fila = state.projects.filter((p) => p.ciclo !== 'backlog' && !p.reprovado && p.resultado && !isAvaliado(p));

  return (
    <div style={{ marginTop: 30 }}>
      <p className="tf-body" style={{ margin: '0 0 20px' }}>
        Projetos com resultado registrado aguardando as validações do tangível e as notas dos três membros do comitê.
      </p>
      {fila.length === 0 && (
        <Vazio mono="[ FILA VAZIA ]" titulo="Nenhuma avaliação pendente" texto="Quando um colaborador registrar o resultado de um projeto, ele aparece aqui para validação do tangível e notas." />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fila.map((p) => {
          const u = store.byId(p.uid)!;
          const minhaNota = !!p.notas[me.id];
          const minhaVal = p.resultado!.validacoes[me.id] !== undefined;
          const completo = minhaNota && minhaVal;
          return (
            <div key={p.id} className="tf-card" style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <Avatar nome={u.nome} cor={store.cor(u.id)} size={40} fontSize="0.68rem" />
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.25 }}>{p.nome}</div>
                <div className="tf-small" style={{ fontSize: '0.8rem', marginTop: 3 }}>{u.nome} · {u.depto || u.cargo} · Registrado em {dbr(p.resultado!.data)}</div>
                <div className="tf-mono" style={{ fontSize: '0.6rem', marginTop: 6 }}>
                  {brl(p.resultado!.tang)} POR CICLO DECLARADOS · {nNotas(p)} DE 3 NOTAS · {nValidacoes(p)} DE 3 VALIDAÇÕES DO TANGÍVEL
                </div>
              </div>
              <Badge kind={completo ? 'live' : 'warn'} style={{ flex: 'none' }}>
                {completo ? 'sua avaliação: enviada' : 'sua avaliação: pendente'}
              </Badge>
              <button onClick={() => nav('/comite/avaliar/' + p.id)} className="tf-btn tf-btn-accent" style={{ flex: 'none' }}>Avaliar →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
