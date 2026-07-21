/**
 * "Como funciona?" — apresentação do programa Flux dentro do portal, para
 * novos usuários (conteúdo da apresentação ranking_ia_final, reusando as
 * constantes oficiais de scoring como fonte única de verdade).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/AppStore';
import { dbr, todayISO } from '../../lib/dates';
import { CATS, INTANGIVEIS, RUBRICA } from '../../lib/scoring';
import { AXEL } from '../../lib/axel';
import FluxPills from './FluxPills';

const PILARES = [
  { t: 'Movimento', d: 'Projetos que saem do papel e geram resultado real.' },
  { t: 'Transformação', d: 'A IA como estado permanente de evolução do trabalho.' },
  { t: 'Energia com direção', d: 'Flux não é movimento aleatório — é impacto mensurável.' },
];

const PASSOS = [
  { n: '1', t: 'Inscrição', d: 'Você inscreve seu pitch: nome do projeto, categoria, justificativa, retorno financeiro estimado e o seu próprio deadline de entrega.', img: AXEL.inscrever },
  { n: '2', t: 'Execução', d: 'O projeto é executado dentro do prazo que você definiu. Ao concluir, você registra o resultado real obtido.', img: AXEL.dev },
  { n: '3', t: 'Avaliação', d: 'O comitê valida o retorno tangível e dá notas de 0 a 5 para impacto, alcance e retorno intangível. A pontualidade é automática.', img: AXEL.aval },
  { n: '4', t: 'Ranking', d: 'A pontuação pondera os 5 critérios. O ranking global e por categoria é publicado em tempo real, e zera a cada novo ciclo.', img: AXEL.ranking },
];

const CRITERIOS = [
  { nome: 'Retorno Tangível', peso: 40, desc: 'Valor financeiro real (R$) gerado após a execução, validado pelo comitê. Principal critério — moeda comum entre todas as áreas.' },
  { nome: 'Retorno Intangível', peso: 20, desc: 'Ganhos não financeiros: satisfação, qualidade, reputação, cultura. Nota de 0 a 5 pelo comitê.' },
  { nome: 'Impacto', peso: 15, desc: 'O quanto o projeto transformou o processo ou o resultado. Nota de 0 a 5 pelo comitê.' },
  { nome: 'Alcance', peso: 15, desc: 'Quantas pessoas ou áreas foram beneficiadas. Nota de 0 a 5 pelo comitê.' },
  { nome: 'Pontualidade', peso: 10, desc: 'Binária e automática: 100% se o resultado entrou dentro do deadline da inscrição; 0% se não.' },
];

const RETORNOS_ACEITOS = [
  ['Economia de horas', 'horas salvas × custo/hora × período'],
  ['Redução de custo direto', 'ferramentas, retrabalho eliminado'],
  ['Aumento de receita', 'conversão, upsell, novos clientes'],
  ['Evitar contratação', 'a IA absorveu a demanda de uma nova vaga'],
  ['Redução de erros com custo', 'multas e reembolsos evitados'],
];

const REGRAS = [
  { t: 'Acesso ao Claude vinculado a projetos', d: 'Quem não inscreve nenhum projeto no ciclo não terá acesso ao Claude.' },
  { t: 'Tier definido pelo desempenho', d: 'O comitê avalia cada projeto e define se o colaborador terá acesso Basic ou Enterprise para desenvolver seu projeto.' },
  { t: 'Mínimo de um projeto por ciclo', d: 'Cada colaborador inscreve pelo menos um projeto por ciclo para manter o acesso ativo. O mesmo colaborador pode ter mais de um projeto.' },
  { t: 'Resultado real obrigatório', d: 'Projetos sem registro de resultado real ao final do prazo são desclassificados automaticamente.' },
  { t: 'Prazo definido por você', d: 'Cada um estipula seu deadline na inscrição. Pontualidade é 100% se cumprido, 0% se não.' },
  { t: 'Projetos são individuais', d: 'Cada inscrição tem um único titular responsável — colaborações precisam eleger um titular.' },
  { t: 'Ranking renovado a cada ciclo', d: 'A pontuação não acumula entre ciclos. Cada período é uma nova oportunidade para todos.' },
  { t: 'Boas práticas viram referência', d: 'Projetos bem avaliados são compartilhados com toda a empresa como casos de sucesso.' },
];

/** Cabeçalho de seção; o mascote opcional vagueia pela página — ora colado ao
    título (lado 'esq'), ora na borda direita — para o passeio ficar orgânico. */
const Secao = ({ num, titulo, mascote, children }: {
  num: string; titulo: string;
  mascote?: { img: string; h?: number; lado?: 'esq' | 'dir' };
  children?: React.ReactNode;
}) => (
  <div style={{ marginTop: 40 }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, justifyContent: mascote?.lado === 'esq' ? 'flex-start' : 'space-between' }}>
      <span className="tf-mono" style={{ color: 'var(--tf-accent)', order: mascote?.lado === 'esq' ? 1 : 0 }}>[ {num} · {titulo} ]</span>
      {mascote && <img src={mascote.img} alt="" aria-hidden="true" loading="lazy" style={{ height: mascote.h ?? 104, width: 'auto', flex: 'none', marginBottom: -10, order: mascote.lado === 'esq' ? 0 : 1 }} />}
    </div>
    {children}
  </div>
);

export default function ComoFunciona() {
  const { me, cicloAtivo: c } = useStore();
  const nav = useNavigate();
  if (!me) return null;

  const inscAbertas = !!c && todayISO() >= c.inicio && todayISO() <= c.limite;

  return (
    <div className="anim-in" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 80px' }}>
      <FluxPills comBadge />

      {/* hero — o significado do nome (slide 1), com o Axel em pleno voo */}
      <div style={{ margin: '40px 0 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 26, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 'min(520px, 100%)' }}>
          <span className="tf-mono" style={{ color: 'var(--tf-accent)' }}>[ FLUX · PROGRAMA DE INOVAÇÃO COM IA ]</span>
          <h1 className="tf-h2" style={{ margin: '12px 0 10px' }}>Como funciona o Flux?</h1>
          <p className="tf-lead" style={{ margin: 0, maxWidth: 760 }}>
            Do latim <em>fluxus</em> — fluxo, movimento contínuo, estado de transformação constante. Na física, <em>flux</em> é a medida da energia em movimento: força com direção e propósito. É o que este programa propõe — transformar a IA em energia real dentro da Tecnofink, projeto a projeto, colaborador a colaborador.
          </p>
        </div>
        <img src={AXEL.ciclo} alt="Axel, o mascote do Flux, voando" style={{ height: 'clamp(130px, 16vw, 188px)', width: 'auto', flex: 'none' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginTop: 22 }}>
        {PILARES.map((p) => (
          <div key={p.t} className="tf-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.02rem', color: 'var(--tf-accent)' }}>{p.t}</div>
            <p className="tf-small" style={{ margin: '5px 0 0', fontSize: '0.82rem' }}>{p.d}</p>
          </div>
        ))}
      </div>

      {/* 4 passos (slide 3) */}
      <Secao num="01" titulo="O PROGRAMA EM 4 PASSOS">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginTop: 16 }}>
          {PASSOS.map((p) => (
            <div key={p.n} className="tf-card" style={{ padding: '20px 20px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ display: 'inline-flex', width: 34, height: 34, borderRadius: '50%', background: 'var(--tf-accent)', color: '#fff', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-display)', fontWeight: 700, flex: 'none' }}>{p.n}</span>
                <img src={p.img} alt="" aria-hidden="true" loading="lazy" style={{ height: 66, width: 'auto', flex: 'none', marginTop: -4 }} />
              </div>
              <div style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.05rem', margin: '10px 0 6px' }}>{p.t}</div>
              <p className="tf-small" style={{ margin: 0, fontSize: '0.82rem' }}>{p.d}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* critérios e pesos (slides 2 e 6) */}
      <Secao num="02" titulo="OS 5 CRITÉRIOS E SEUS PESOS" mascote={{ img: AXEL.conc, h: 116 }}>
        <div className="tf-card" style={{ marginTop: 16, padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CRITERIOS.map((cr) => (
            <div key={cr.nome} className="g-1col" style={{ display: 'grid', gridTemplateColumns: '170px 64px 1fr', gap: 14, alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cr.nome}</span>
              <span style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--tf-accent)' }}>{cr.peso}%</span>
              <div>
                <div style={{ height: 6, background: 'var(--tf-bg-3)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: (cr.peso / 40) * 100 + '%', background: 'linear-gradient(90deg,var(--tf-accent-2),var(--tf-accent))', borderRadius: 999 }} />
                </div>
                <span className="tf-small" style={{ fontSize: '0.78rem' }}>{cr.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Secao>

      {/* tangível (slide 7) */}
      <Secao num="03" titulo="COMO PONTUA O RETORNO TANGÍVEL" mascote={{ img: AXEL.enterprise, h: 108, lado: 'esq' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12, marginTop: 16 }}>
          <div className="tf-card" style={{ padding: '20px 22px' }}>
            <span className="tf-mono" style={{ fontSize: '0.6rem' }}>FÓRMULA · NORMALIZAÇÃO RELATIVA</span>
            <div style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.86rem', background: 'var(--tf-bg-2)', border: '1px solid var(--tf-line)', borderRadius: 8, padding: '14px 16px', margin: '12px 0' }}>
              pontos = (retorno do projeto ÷ maior retorno do ciclo) × 100
            </div>
            <p className="tf-small" style={{ margin: 0, fontSize: '0.8rem' }}>
              O retorno considerado é o <strong>validado pelo comitê</strong> (média das três validações) após a execução. O melhor projeto do ciclo sempre vale 100 pts — projetos de áreas menores competem de forma justa, sem teto fixo arbitrário.
            </p>
          </div>
          <div className="tf-card" style={{ padding: '20px 22px' }}>
            <span className="tf-mono" style={{ fontSize: '0.6rem' }}>TIPOS DE RETORNO ACEITOS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {RETORNOS_ACEITOS.map(([t, d]) => (
                <div key={t} style={{ fontSize: '0.84rem' }}>
                  <strong>{t}</strong> <span className="tf-small" style={{ fontSize: '0.8rem' }}>— {d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Secao>

      {/* intangível (slide 8) */}
      <Secao num="04" titulo="COMO O COMITÊ AVALIA O INTANGÍVEL" mascote={{ img: AXEL.basic, h: 110 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12, marginTop: 16 }}>
          <div className="tf-card" style={{ padding: '20px 22px' }}>
            <span className="tf-mono" style={{ fontSize: '0.6rem' }}>ESCALA DE AVALIAÇÃO · 0 A 5</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
              {RUBRICA.map((r) => (
                <div key={r.n} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--tf-font-display)', fontWeight: 700, color: 'var(--tf-accent)', width: 14, flex: 'none' }}>{r.n}</span>
                  <span className="tf-small" style={{ fontSize: '0.82rem' }}>{r.t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="tf-card" style={{ padding: '20px 22px' }}>
            <span className="tf-mono" style={{ fontSize: '0.6rem' }}>GANHOS INTANGÍVEIS POSSÍVEIS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              {INTANGIVEIS.map((g) => (
                <div key={g.g}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: 3 }}>{g.g}</div>
                  <span className="tf-small" style={{ fontSize: '0.78rem' }}>{g.itens.join(' · ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Secao>

      {/* categorias (slide 5 / RF-17) */}
      <Secao num="05" titulo="CATEGORIAS DE PROJETO" mascote={{ img: AXEL.back, h: 102, lado: 'esq' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginTop: 16 }}>
          {CATS.map((cat) => (
            <div key={cat.id} className="tf-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 5 }}>{cat.nome}</div>
              <span className="tf-small" style={{ fontSize: '0.78rem' }}>{cat.desc}</span>
            </div>
          ))}
        </div>
      </Secao>

      {/* regras gerais (slide 13) */}
      <Secao num="06" titulo="REGRAS GERAIS DO PROGRAMA" mascote={{ img: AXEL.rep, h: 88 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 12, marginTop: 16 }}>
          {REGRAS.map((r) => (
            <div key={r.t} className="tf-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{r.t}</div>
              <span className="tf-small" style={{ fontSize: '0.8rem' }}>{r.d}</span>
            </div>
          ))}
        </div>
      </Secao>

      {/* fecho (slides 14 e 15) */}
      <div className="tf-card" style={{ marginTop: 44, padding: '30px 32px 36px', textAlign: 'center', background: 'var(--tf-bg-2)' }}>
        <img src={AXEL.inscrito} alt="" aria-hidden="true" loading="lazy" style={{ height: 148, width: 'auto', marginBottom: 6 }} />
        <p style={{ fontFamily: 'var(--tf-font-display)', fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5, maxWidth: 680, margin: '0 auto', color: 'var(--tf-ink)' }}>
          “Não sabemos se nossa função será substituída pela IA. Mas certamente seremos substituídos por <span style={{ color: 'var(--tf-accent)' }}>alguém que sabe utilizá-la</span>.”
        </p>
        <h2 className="tf-h3" style={{ margin: '28px 0 8px' }}>Transforme sua ideia em impacto real.</h2>
        <p className="tf-body" style={{ margin: '0 auto 22px', maxWidth: 520 }}>
          Inscreva seu projeto e mostre como a IA pode gerar valor concreto para a empresa.
        </p>
        {inscAbertas ? (
          <div>
            <button onClick={() => nav('/flux/inscrever')} className="tf-btn tf-btn-accent" style={{ padding: '13px 26px' }}>Inscrever meu pitch →</button>
            <div className="tf-small" style={{ marginTop: 10, fontSize: '0.78rem' }}>Inscrições do {c!.nome} abertas até {dbr(c!.limite)}</div>
          </div>
        ) : (
          <div>
            <button onClick={() => nav('/flux/inscrever')} className="tf-btn tf-btn-accent" style={{ padding: '13px 26px' }}>Inscrever pitch →</button>
            {!c && <div className="tf-small" style={{ marginTop: 10, fontSize: '0.78rem' }}>A abertura do próximo ciclo será anunciada no portal.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
