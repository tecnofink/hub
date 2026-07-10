/* @ds-bundle: {"format":3,"namespace":"PadrODeDesignTecnofink_bd5de3","components":[{"name":"Button","sourcePath":"components/Button/Button.jsx"},{"name":"FeatureCard","sourcePath":"components/FeatureCard/FeatureCard.jsx"},{"name":"MetricStat","sourcePath":"components/MetricStat/MetricStat.jsx"},{"name":"MonoTag","sourcePath":"components/MonoTag/MonoTag.jsx"},{"name":"SectionHead","sourcePath":"components/SectionHead/SectionHead.jsx"},{"name":"StatusBadge","sourcePath":"components/StatusBadge/StatusBadge.jsx"},{"name":"ThemeToggle","sourcePath":"components/ThemeToggle/ThemeToggle.jsx"}],"sourceHashes":{"components/Button/Button.jsx":"3b1c56dba998","components/FeatureCard/FeatureCard.jsx":"34ddb94c8646","components/MetricStat/MetricStat.jsx":"06c0286e010c","components/MonoTag/MonoTag.jsx":"04f670572b6b","components/SectionHead/SectionHead.jsx":"8e733c2e9c7c","components/StatusBadge/StatusBadge.jsx":"32dbd9655c5c","components/ThemeToggle/ThemeToggle.jsx":"dc70ab640d9f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PadrODeDesignTecnofink_bd5de3 = window.PadrODeDesignTecnofink_bd5de3 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/Button/Button.jsx
try { (() => {
const React = window.React;
function Button({
  label,
  variant = 'primary',
  arrow = false,
  href,
  onClick,
  children
}) {
  const cls = 'tf-btn tf-btn-' + variant;
  const content = [children || label, arrow ? React.createElement('span', {
    key: 'a',
    'aria-hidden': true
  }, '\u2192') : null];
  if (href) {
    return React.createElement('a', {
      className: cls,
      href,
      onClick
    }, content);
  }
  return React.createElement('button', {
    className: cls,
    type: 'button',
    onClick
  }, content);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Button/Button.jsx", error: String((e && e.message) || e) }); }

// components/FeatureCard/FeatureCard.jsx
try { (() => {
const React = window.React;
function FeatureCard({
  num,
  title,
  description,
  tags = [],
  href
}) {
  const Tag = href ? 'a' : 'div';
  const arrow = React.createElement('svg', {
    width: 14,
    height: 14,
    viewBox: '0 0 14 14',
    fill: 'none',
    'aria-hidden': true
  }, React.createElement('path', {
    d: 'M3 11L11 3M11 3H5M11 3V9',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round'
  }));
  return React.createElement(Tag, {
    href,
    className: 'tf-feature-card',
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: '22px 22px 20px',
      textDecoration: 'none',
      color: 'inherit',
      background: 'var(--tf-bg-pure)',
      border: '1px solid var(--tf-line)',
      borderRadius: 'var(--tf-radius)',
      minHeight: '160px'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    }
  }, num ? React.createElement('span', {
    className: 'tf-mono',
    style: {
      color: 'var(--tf-accent)',
      fontSize: '0.68rem'
    }
  }, '/ ' + num) : React.createElement('span'), React.createElement('span', {
    style: {
      color: 'var(--tf-ink-3)'
    }
  }, arrow)), React.createElement('h4', {
    className: 'tf-h4',
    style: {
      marginBottom: '6px'
    }
  }, title), description ? React.createElement('p', {
    style: {
      fontSize: '0.85rem',
      color: 'var(--tf-ink-2)',
      lineHeight: 1.45,
      margin: 0
    }
  }, description) : null, tags.length ? React.createElement('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: 'auto',
      paddingTop: '14px'
    }
  }, tags.map((t, i) => React.createElement('span', {
    key: i,
    className: 'tf-tech'
  }, t))) : null);
}
Object.assign(__ds_scope, { FeatureCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/FeatureCard/FeatureCard.jsx", error: String((e && e.message) || e) }); }

// components/MetricStat/MetricStat.jsx
try { (() => {
const React = window.React;
function MetricStat({
  value,
  label,
  critical = false
}) {
  return React.createElement('div', {
    style: {
      background: 'var(--tf-bg-pure)',
      border: '1px solid var(--tf-line)',
      padding: '24px'
    }
  }, React.createElement('div', {
    style: {
      fontFamily: 'var(--tf-font-display)',
      fontWeight: 700,
      fontSize: '2.1rem',
      letterSpacing: '-0.02em',
      lineHeight: 1,
      color: critical ? 'var(--tf-crit)' : 'var(--tf-accent)'
    }
  }, value), React.createElement('div', {
    className: 'tf-mono',
    style: {
      fontSize: '0.66rem',
      marginTop: '10px',
      lineHeight: 1.4
    }
  }, label));
}
Object.assign(__ds_scope, { MetricStat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/MetricStat/MetricStat.jsx", error: String((e && e.message) || e) }); }

// components/MonoTag/MonoTag.jsx
try { (() => {
const React = window.React;
function MonoTag({
  label,
  brackets = true,
  tone = 'ink-3'
}) {
  const text = brackets ? '[ ' + label + ' ]' : label;
  return React.createElement('span', {
    className: 'tf-mono',
    style: {
      color: tone === 'accent' ? 'var(--tf-accent)' : 'var(--tf-ink-3)'
    }
  }, text);
}
Object.assign(__ds_scope, { MonoTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/MonoTag/MonoTag.jsx", error: String((e && e.message) || e) }); }

// components/SectionHead/SectionHead.jsx
try { (() => {
const React = window.React;
function SectionHead({
  num,
  title,
  intro
}) {
  return React.createElement('div', {
    className: 'tf-section-head'
  }, React.createElement('div', {
    className: 'tf-section-num'
  }, '/ ' + num), React.createElement('div', null, React.createElement('h2', {
    className: 'tf-h2'
  }, title), intro ? React.createElement('p', {
    className: 'tf-body',
    style: {
      marginTop: '18px',
      maxWidth: '720px'
    }
  }, intro) : null));
}
Object.assign(__ds_scope, { SectionHead });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/SectionHead/SectionHead.jsx", error: String((e && e.message) || e) }); }

// components/StatusBadge/StatusBadge.jsx
try { (() => {
const React = window.React;
function StatusBadge({
  label,
  kind = 'live',
  dot = true
}) {
  const dotColors = {
    live: 'var(--tf-live)',
    warn: 'var(--tf-warn)',
    crit: 'var(--tf-crit)',
    neutral: 'var(--tf-ink-3)'
  };
  return React.createElement('span', {
    className: 'tf-badge tf-badge-' + kind
  }, dot ? React.createElement('span', {
    key: 'd',
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: dotColors[kind],
      display: 'inline-block'
    }
  }) : null, label);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/StatusBadge/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/ThemeToggle/ThemeToggle.jsx
try { (() => {
const React = window.React;
function ThemeToggle({
  storageKey = 'tf-theme'
}) {
  const getInitial = () => {
    const root = document.documentElement;
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  };
  const [theme, setTheme] = React.useState(getInitial);
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
        setTheme(saved);
      }
    } catch (e) {}
  }, [storageKey]);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(storageKey, next);
    } catch (e) {}
    setTheme(next);
  };
  const isDark = theme === 'dark';
  const sun = React.createElement('svg', {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round'
  }, React.createElement('circle', {
    cx: 12,
    cy: 12,
    r: 4
  }), React.createElement('path', {
    d: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'
  }));
  const moon = React.createElement('svg', {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  }, React.createElement('path', {
    d: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'
  }));
  return React.createElement('button', {
    type: 'button',
    onClick: toggle,
    'aria-label': isDark ? 'Ativar tema claro' : 'Ativar tema escuro',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'var(--tf-font-mono)',
      fontSize: '0.66rem',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      padding: '9px 14px',
      borderRadius: 'var(--tf-radius-pill)',
      border: '1px solid var(--tf-line-2)',
      background: 'var(--tf-bg-pure)',
      color: 'var(--tf-ink-2)'
    }
  }, isDark ? sun : moon, isDark ? 'Claro' : 'Escuro');
}
Object.assign(__ds_scope, { ThemeToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ThemeToggle/ThemeToggle.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.FeatureCard = __ds_scope.FeatureCard;

__ds_ns.MetricStat = __ds_scope.MetricStat;

__ds_ns.MonoTag = __ds_scope.MonoTag;

__ds_ns.SectionHead = __ds_scope.SectionHead;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.ThemeToggle = __ds_scope.ThemeToggle;

})();
