/** E3 · Domínios liberados (RF-02, RF-56): adicionar com validação e remover. */
import React, { useState } from 'react';
import { useStore } from '../../store/AppStore';

export default function AdmDominios() {
  const store = useStore();
  const { state } = store;
  const [novo, setNovo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const adicionar = () => {
    const e = store.addDominio(novo);
    if (e) return setErro(e);
    setNovo('');
    setErro(null);
  };

  return (
    <div>
      <h1 className="tf-h3" style={{ margin: '0 0 6px' }}>Domínios liberados</h1>
      <p className="tf-body" style={{ margin: '0 0 22px' }}>
        Somente contas Google Workspace destes domínios conseguem acessar o portal. Domínios fora da lista são bloqueados no login, com mensagem orientativa.
      </p>
      <div className="tf-card" style={{ padding: 26 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {state.domains.map((d) => (
            <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--tf-font-mono)', fontSize: '0.78rem', padding: '9px 16px', border: '1px solid var(--tf-line-2)', borderRadius: 999, color: 'var(--tf-ink)' }}>
              @{d}
              <button type="button" onClick={() => store.removeDominio(d)} title="Remover domínio" className="acao foco-tf" style={{ color: 'var(--tf-crit)', fontWeight: 700 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, maxWidth: 340 }}>
            <input
              className="f-input" style={{ fontFamily: 'var(--tf-font-mono)', fontSize: '0.85rem' }}
              value={novo} onChange={(e) => { setNovo(e.target.value); setErro(null); }} placeholder="novodominio.com.br"
            />
            {erro && <div style={{ color: 'var(--tf-crit)', fontSize: '0.78rem', marginTop: 6 }}>{erro}</div>}
          </div>
          <button onClick={adicionar} className="tf-btn tf-btn-accent">Adicionar domínio</button>
        </div>
      </div>
      <p className="tf-small" style={{ fontSize: '0.74rem', margin: '14px 0 0' }}>
        Teste ao vivo: adicione um domínio, saia e tente entrar com um e-mail dele na tela de login (campo "outra conta").
      </p>
    </div>
  );
}
