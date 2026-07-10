# Design System TecnoFink

Fonte da verdade visual da TecnoFink LTDA. Reúne tokens, tipografia, componentes
e regras de uso derivados do site institucional e do Playbook 2026 (Fernanda),
para que toda nova apresentação e aplicação HTML do time nasça com a identidade
da marca. Suporta **tema claro** (padrão) e **tema escuro**.

## Namespace

Os componentes compilados ficam expostos em:

```js
const { Button, StatusBadge, MonoTag, SectionHead, FeatureCard, MetricStat, ThemeToggle } =
  window.PadrODeDesignTecnofink_bd5de3;
```

## Estrutura

- **`styles.css`** — todos os tokens (cores, tipografia, raios, sombras), o reset,
  a grade de fundo de assinatura e as classes utilitárias `tf-*`. Comece por aqui.
- **`components/`** — componentes React (`.jsx` + `.d.ts` + card de exemplo `.html`).
- **`foundations/`** — cards de referência da aba Design System: cores, tipografia,
  marca, comparação claro/escuro e o guia de implantação.
- **`brand/`** — logos (wordmark, ícone, selo e versões transparentes).

## Tokens principais

| Papel | Token | Claro |
|---|---|---|
| Marca (navy) | `--tf-accent` | `#0C0059` |
| Navy claro / gradiente | `--tf-accent-2` | `#1F1675` |
| Texto | `--tf-ink` / `--tf-ink-2` / `--tf-ink-3` | `#18182A` … |
| Superfícies | `--tf-bg` / `--tf-bg-pure` / `--tf-bg-2` | `#F8F9FC` … |
| Linhas | `--tf-line` / `--tf-line-2` | `#E5E5EA` |
| Status | `--tf-live` / `--tf-warn` / `--tf-crit` | verde / laranja / vermelho |

Sempre use `var(--tf-*)` em vez de colar o hex — é o que faz o tema escuro
funcionar sem retrabalho.

## Tipografia

- **Bricolage Grotesque** — títulos / display (`--tf-font-display`)
- **Manrope** — corpo (`--tf-font-body`)
- **JetBrains Mono** — rótulos, números, metadados (`--tf-font-mono`), entre colchetes: `[ ASSIM ]`

## Uso em HTML

```html
<link rel="stylesheet" href="styles.css">
<span class="tf-mono">[ SETORES ]</span>
<h2 class="tf-h2">Integridade de ativos</h2>
<button class="tf-btn tf-btn-primary">Fale conosco →</button>
```

## Tema escuro

Adicione `data-theme="dark"` no `<html>` (ou em qualquer contêiner). Os tokens
trocam de valor automaticamente — não há CSS duplicado. Para o usuário alternar,
use o componente `ThemeToggle` (persiste em `localStorage`).

```html
<html lang="pt-BR" data-theme="dark">
```

## Princípios

1. **Grade sutil** de 64px como assinatura técnica.
2. **Hairlines** (linhas de 1px) separam cards e tabelas — sem sombras pesadas.
3. **Mono como rótulo** apenas — kickers, números, metadados.
4. **Navy é o herói**; neutros frios sustentam o resto; laranja é destaque, não preenchimento.
5. **Menos é mais** — sem ícones decorativos ou dados sem função.

Detalhes completos no card **Guia → Como implantar** (`foundations/guia.html`).
