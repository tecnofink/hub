/**
 * C4 · Ficha do projeto (RF-33): visível a qualquer usuário — pitch, tier,
 * linha de progresso em 5 passos, resultado com anexos e pontuação agregada.
 * Titular vê ações de registrar resultado (RF-34) e excluir pitch (RF-22).
 */
import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr, mesesDoCiclo, todayISO } from '../../lib/dates';
import { brl } from '../../lib/format';
import { catNome, nValidacoes, score, tangValidado } from '../../lib/scoring';
import { Avatar, Badge, Mono } from '../../components/ui';
import { statusDe } from './statusProjeto';

const PASSOS = ['Inscrito', 'Acesso definido', 'Em execução', 'Resultado registrado', 'Avaliado'];

export default function Projeto() {
  const store = useStore();
  const { me, state } = store;
  const { id } = useParams();
  const nav = useNavigate();

  const p = id ? store.proj(id) : undefined;
  if (!me || !p) return <Navigate to="/flux" replace />;

  const u = store.byId(p.uid)!;
  const st = statusDe(p);
  const sc = score(state.projects, p);
  const cc = state.cycles.find((x) => x.id === p.ciclo);
  const emBacklog = p.ciclo === 'backlog';
  const meses = cc ? mesesDoCiclo(cc.inicio, cc.fim) : 3.5;
  const tv = tangValidado(p);

  // RF-22 e RF-34: condições das ações do titular
  const podeExcluir = !emBacklog && p.uid === me.id && cc?.status === 'ativo' && todayISO() <= cc.limite && !p.resultado;
  const podeRegistrar = !emBacklog && p.uid === me.id && cc?.status === 'ativo' && !!p.tier && !p.resultado && !p.reprovado;

  const passo = st.k === 'inscrito' ? 0 : st.k === 'execucao' || st.k === 'atrasado' ? 2 : st.k === 'registrado' ? 3 : 4;
  const estimCiclo = p.estimPer === 'mes' ? p.estimValor * meses : p.estimValor;

  return (
    <div className="anim-in" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 80px' }}>
      <a onClick={() => nav('/flux')} className="back-link">← FLUX / {cc ? cc.nome : 'BACKLOG'}</a>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 'min(320px, 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Badge kind={st.badge}>{st.label}</Badge>
            <span className="tf-mono" style={{ fontSize: '0.62rem' }}>{catNome(p.cat).toUpperCase()}</span>
          </div>
          <h1 className="tf-h3" style={{ margin: '12px 0 10px', fontSize: '1.9rem' }}>{p.nome}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar nome={u.nome} cor={store.cor(u.id)} size={30} fontSize="0.62rem" />
            <span style={{ fontSize: '0.9rem', color: 'var(--tf-ink-2)' }}>
              <strong>{u.nome}</strong> · {u.depto || u.cargo} · inscrito em {dbr(p.criadoEm)}
            </span>
          </div>
        </div>
        {sc && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '3.4rem', color: 'var(--tf-accent)', lineHeight: 0.95 }}>{sc.final}</div>
            <div className="tf-mono" style={{ fontSize: '0.6rem' }}>PONTUAÇÃO FINAL</div>
          </div>
        )}
      </div>

      {st.k === 'reprovado' && (
        <div style={{ marginTop: 26, background: 'rgba(214,43,43,0.08)', border: '1px solid rgba(214,43,43,0.3)', borderRadius: 10, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Badge kind="crit" style={{ flex: 'none', marginTop: 2 }}>reprovado</Badge>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--tf-ink-2)', lineHeight: 1.5 }}>
            Projeto desclassificado pelo comitê — fora do ranking deste ciclo. O aprendizado fica registrado e uma nova ideia pode ser inscrita no próximo ciclo.
          </p>
        </div>
      )}

      {st.k !== 'reprovado' && (
        <div className="tf-card" style={{ marginTop: 26, padding: '22px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', rowGap: 16 }}>
            {PASSOS.map((label, i) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: i <= passo ? 'var(--tf-accent)' : 'var(--tf-bg-3)', color: i <= passo ? '#fff' : 'var(--tf-ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-mono)', fontSize: '0.62rem' }}>{i + 1}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: i <= passo ? 'var(--tf-ink)' : 'var(--tf-ink-3)', lineHeight: 1.2 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {st.k === 'atrasado' && (
        <div style={{ marginTop: 16, background: 'rgba(214,43,43,0.08)', border: '1px solid rgba(214,43,43,0.3)', borderRadius: 10, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Badge kind="crit" style={{ flex: 'none', marginTop: 2 }}>atrasado</Badge>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--tf-ink-2)', lineHeight: 1.5 }}>
            O deadline venceu sem registro de resultado. Não há desclassificação automática: o comitê decide entre aceitar o registro tardio (Pontualidade 0) ou desclassificar o projeto.
          </p>
        </div>
      )}
      {st.k === 'registrado' && (
        <div style={{ marginTop: 16, background: 'var(--tf-accent-soft)', border: '1px solid var(--tf-line)', borderRadius: 10, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Badge kind="neutral" style={{ flex: 'none', marginTop: 2 }}>em análise</Badge>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--tf-ink-2)', lineHeight: 1.5 }}>
            Resultado registrado em {dbr(p.resultado!.data)}. Aguardando as validações do tangível ({nValidacoes(p)} de 3) e as notas do comitê — o projeto entra no ranking assim que a avaliação for concluída.
          </p>
        </div>
      )}

      <div className="g-1col-900" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="tf-card" style={{ padding: 26 }}>
            <Mono accent>[ PITCH · SOMENTE LEITURA ]</Mono>
            <div className="g-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <div>
                <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>DEADLINE DEFINIDO</div>
                <div style={{ fontSize: '0.92rem' }}>{dbr(p.deadline)}</div>
              </div>
              <div>
                <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>TANGÍVEL ESTIMADO</div>
                <div style={{ fontSize: '0.92rem' }}>{p.estimValor ? brl(estimCiclo) + ' por ciclo' + (p.estimPer === 'mes' ? ' (' + brl(p.estimValor) + '/mês)' : '') : '—'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>GANHOS INTANGÍVEIS PREVISTOS</div>
                <div style={{ fontSize: '0.92rem' }}>{p.intang.length ? p.intang.join(' · ') : '—'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>JUSTIFICATIVA — POR QUE A IA FOI ESSENCIAL</div>
                <div style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--tf-ink-2)' }}>{p.just}</div>
              </div>
            </div>
          </div>

          {p.resultado && (
            <div className="tf-card" style={{ padding: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <Mono accent>[ RESULTADO REGISTRADO ]</Mono>
                {tv !== null && <Badge kind="live">tangível validado</Badge>}
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>TANGÍVEL DECLARADO</div>
                  <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 600, fontSize: '1.4rem', color: 'var(--tf-accent)' }}>
                    {brl(p.resultado.tang)} por ciclo{p.resultado.per === 'mes' ? ' (' + brl(p.resultado.valor) + '/mês)' : ''}
                  </div>
                  {tv !== null && tv !== p.resultado.tang && (
                    <div className="tf-small" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                      Valor validado pelo comitê (média das 3 validações): <strong>{brl(tv)}</strong> — é o que entra no cálculo.
                    </div>
                  )}
                </div>
                <div>
                  <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>INTANGÍVEIS OBSERVADOS</div>
                  <div style={{ fontSize: '0.92rem' }}>{p.resultado.intang.join(' · ')}</div>
                </div>
                <div>
                  <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 4 }}>DESCRIÇÃO DO RESULTADO</div>
                  <div style={{ fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--tf-ink-2)' }}>{p.resultado.desc}</div>
                </div>
                <div>
                  <div className="tf-mono" style={{ fontSize: '0.6rem', marginBottom: 6 }}>ANEXOS DE EVIDÊNCIA</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {p.resultado.anexos.map((a) => (
                      <a
                        key={a.n} href={a.url || undefined} target="_blank" rel="noreferrer"
                        style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.68rem', padding: '5px 11px', border: '1px solid var(--tf-line-2)', borderRadius: 999, color: 'var(--tf-ink-2)', textDecoration: 'none', cursor: a.url ? 'pointer' : 'default' }}
                      >
                        ⇩ {a.n}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="tf-card" style={{ padding: 24 }}>
            <Mono accent>[ ACESSO AO CLAUDE ]</Mono>
            <div style={{ marginTop: 12 }}>
              {p.tier ? (
                <>
                  <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 999, background: 'var(--tf-accent)', color: '#fff' }}>{p.tier}</span>
                  <p className="tf-small" style={{ fontSize: '0.76rem', margin: '12px 0 0' }}>
                    Acesso liberado para a execução do pitch — vale até o encerramento do ciclo. A concessão é manual, no console do Claude.
                  </p>
                </>
              ) : (
                <>
                  <Badge kind="neutral">aguardando definição</Badge>
                  <p className="tf-small" style={{ fontSize: '0.76rem', margin: '12px 0 0' }}>
                    Todo mundo começa sem acesso: o comitê avalia o pitch e libera o tier de Claude para a execução, válido até o fim do ciclo.
                  </p>
                </>
              )}
            </div>
          </div>

          {sc && (
            <div className="tf-card" style={{ padding: 24 }}>
              <Mono accent>[ PONTUAÇÃO POR CRITÉRIO ]</Mono>
              <div style={{ marginTop: 10 }}>
                {([
                  ['Retorno Tangível · peso 40%', Math.round(sc.T) + ' pts'],
                  ['Retorno Intangível · peso 20%', sc.I + ' pts'],
                  ['Impacto · peso 15%', sc.Im + ' pts'],
                  ['Alcance · peso 15%', sc.Al + ' pts'],
                  ['Pontualidade · peso 10%', sc.P + ' pts'],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--tf-line)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--tf-ink-2)' }}>{l}</span>
                    <span style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.78rem', color: 'var(--tf-ink)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <p className="tf-small" style={{ fontSize: '0.72rem', margin: '12px 0 0' }}>
                Apenas a pontuação final e as notas agregadas são exibidas — as notas individuais e a identidade dos avaliadores não aparecem (RF-33).
              </p>
            </div>
          )}

          {podeRegistrar && (
            <button onClick={() => nav('/flux/projeto/' + p.id + '/resultado')} className="tf-btn tf-btn-accent" style={{ justifyContent: 'center', padding: '13px 20px' }}>
              Registrar resultado →
            </button>
          )}
          {podeExcluir && cc && (
            <div>
              <button
                onClick={() =>
                  store.confirmar({
                    titulo: 'Excluir este pitch?',
                    texto: 'O pitch "' + p.nome + '" será removido do ciclo. Essa ação vale até o fim das inscrições e não pode ser desfeita.' + (p.tier ? '\n\nEste pitch já passou pela triagem de acesso — todos os administradores serão notificados para rever os acessos ao Claude.' : ''),
                    cta: 'Excluir pitch', danger: true,
                    onConfirm: () => { store.excluirPitch(p.id); nav('/flux'); },
                  })
                }
                className="tf-btn tf-btn-ghost tf-btn-danger"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Excluir pitch
              </button>
              <p className="tf-small" style={{ fontSize: '0.72rem', margin: '8px 0 0', textAlign: 'center' }}>Exclusão permitida até o fim das inscrições ({dbr(cc.limite)}) e antes do registro de resultado.</p>
            </div>
          )}
          {p.uid === me.id && !emBacklog && (
            <button onClick={() => nav('/tarefas/' + p.id)} className="tf-btn tf-btn-ghost" style={{ justifyContent: 'center' }}>
              Abrir em Produtividade →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
