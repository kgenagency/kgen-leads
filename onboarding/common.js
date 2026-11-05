// Shared helpers for client form + admin panel.
window.KG = (function () {
  const URL_ = window.KGEN_SUPABASE_URL || '';
  const KEY = window.KGEN_SUPABASE_ANON_KEY || '';
  const DEMO = !URL_ || URL_.includes('REPLACE_ME');
  const sb = DEMO ? null : window.supabase.createClient(URL_, KEY);
  const TABLE = 'onboarding_submissions';
  const DEMO_KEY = 'kgen_onb_demo_rows';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Selected services, in priority order
  function servicesOf(data) {
    return Array.isArray(data.services) ? data.services.slice() : [];
  }

  // Human-readable value for a field (used in review + admin)
  function fmt(f, data) {
    const v = data[f.k];
    switch (f.type) {
      case 'checks': {
        const arr = (Array.isArray(v) ? v : []).slice();
        if (f.other && data[f.k + '_other']) arr.push(data[f.k + '_other']);
        return arr.join(', ');
      }
      case 'pickrank':
      case 'rank':
        return (Array.isArray(v) ? v : []).map((x, i) => `${i + 1}. ${x}`).join('\n');
      case 'offers':
        return Object.entries(v || {}).filter(([, o]) => o && o.trim()).map(([s, o]) => `${s}: ${o}`).join('\n');
      case 'access':
        return f.rows.map((r) => {
          const a = (v || {})[r] || {};
          if (!a.status && !a.id) return null;
          return `${r}: ${a.status || '-'}${a.id ? ' (ID ' + a.id + ')' : ''}`;
        }).filter(Boolean).join('\n');
      case 'zones':
        return (Array.isArray(v) ? v : []).filter((z) => z.city).map((z) => `${z.city}${z.radius ? ' - ' + z.radius + ' mi' : ''}`).join('\n');
      default:
        return v == null ? '' : String(v);
    }
  }

  async function insert(row) {
    if (DEMO) {
      const rows = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
      rows.unshift({ id: crypto.randomUUID(), created_at: new Date().toISOString(), status: 'new', internal: {}, ...row });
      localStorage.setItem(DEMO_KEY, JSON.stringify(rows));
      return { error: null };
    }
    return sb.from(TABLE).insert(row); // no .select(): anon has insert-only rights
  }

  function toast(msg, bad) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600);
  }

  return { sb, DEMO, TABLE, DEMO_KEY, esc, fmt, servicesOf, insert, toast };
})();
