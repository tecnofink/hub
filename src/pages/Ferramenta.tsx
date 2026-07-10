/**
 * Página genérica de ferramenta cadastrada no hub (RF-57): quando a rota
 * interna configurada ainda não tem módulo construído, este é o ponto de
 * montagem — mostra o ícone e o contexto da ferramenta no cabeçalho.
 * Rotas desconhecidas (sem ferramenta) voltam ao hub.
 */
import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { faviconDe, iconeNativo, rotaNormalizada } from '../lib/roles';

export default function Ferramenta() {
  const { state } = useStore();
  const loc = useLocation();
  const nav = useNavigate();

  const t = state.tools.find((x) => {
    const r = rotaNormalizada(x.rota);
    return r.startsWith('/') && r.length > 1
      && (loc.pathname === r || loc.pathname.startsWith(r + '/'));
  });

  if (!t) return <Navigate to="/" replace />;

  const externa = /^https?:\/\//.test(rotaNormalizada(t.rota));

  return (
    <div className="anim-in" style={{ maxWidth: 760, margin: '0 auto', padding: '48px 32px 80px' }}>
      <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
        {iconeNativo(t.rota) ? (
          <img src={iconeNativo(t.rota)!} alt={t.nome} style={{ height: 56, maxWidth: 100, objectFit: 'contain' }} />
        ) : faviconDe(t.rota) ? (
          <span style={{ width: 64, height: 64, borderRadius: 14, background: 'var(--tf-accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={faviconDe(t.rota)!} alt={t.nome} style={{ width: 36, height: 36, borderRadius: 8 }} />
          </span>
        ) : (
          <span style={{ width: 64, height: 64, borderRadius: 14, background: 'var(--tf-accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--tf-font-display)', fontWeight: 700, fontSize: '1.5rem' }}>{t.sigla}</span>
        )}
        <h1 className="tf-h2" style={{ margin: '20px 0 12px' }}>{t.nome}</h1>
        <p className="tf-body" style={{ margin: '0 0 10px' }}>{t.desc}</p>
        <p className="tf-small" style={{ margin: '0 0 26px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          {externa
            ? 'Esta ferramenta abre fora do portal.'
            : 'Ferramenta cadastrada no hub — o módulo desta rota (' + t.rota + ') ainda não foi construído. Este é o ponto de montagem dele.'}
        </p>
        <button onClick={() => nav('/')} className="tf-btn tf-btn-ghost">← Voltar ao hub</button>
      </div>
    </div>
  );
}
