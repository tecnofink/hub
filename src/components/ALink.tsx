/**
 * Link de navegação real (<a href>): Ctrl/Cmd+click, Shift+click e clique do
 * meio abrem em nova aba/janela como o navegador manda; clique normal navega
 * pelo router sem recarregar a página.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: React.ReactNode;
}

export default function ALink({ to, children, onClick, style, ...rest }: Props) {
  const nav = useNavigate();
  return (
    <a
      href={to}
      style={{ textDecoration: 'none', ...style }}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        nav(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
