(function () {
  const AUTH_DOMAIN = window.KGEN_AUTH_DOMAIN || 'kgen-crm.local'; // same logins as the KGEN Lead CRM
  const { sb, DEMO, TABLE, DEMO_KEY, esc, fmt } = KG;
  const SECTIONS = window.KGEN_FORM;
  const $ = (id) => document.getElementById(id);
  let rows = []; let current = null; let me = '';

  const INTERNAL = [
    { k: 'coordinates', label: 'Coordinates (lat, lng)', ph: '43.6532, -79.3832' },
    { k: 'location_callout', label: 'Location callout (ad copy)', ph: 'Serving Oakville and the GTA' },
    { k: 'exclude_zones', label: 'Exclude zones (targeting)', ph: 'Zip codes / areas' },
    { k: 'ghl_location', label: 'GHL sub-account / location ID' },
    { k: 'slack_channel', label: 'Slack channel', ph: '#client-leads' },
    { k: 'notes', label: 'Internal notes', area: true },
  ];

  /* ---------- auth ---------- */
  async function login(e) {
    e.preventDefault();
    const u = $('lu').value.trim().toLowerCase(); const p = $('lp').value;
    $('lbtn').disabled = true; $('lerr').style.display = 'none';
    if (DEMO) { me = u || 'demo'; return enter(); }
    const { data, error } = await sb.auth.signInWithPassword({ email: `${u}@${AUTH_DOMAIN}`, password: p });
    $('lbtn').disabled = false;
    if (error) { $('lerr').textContent = 'Wrong username or password.'; $('lerr').style.display = 'block'; return; }
    me = data.user.user_metadata?.display_name || u; enter();
  }
  async function enter() {
    $('loginView').style.display = 'none'; $('app').style.display = 'block';
    $('who').textContent = 'Signed in as ' + me + (DEMO ? ' (demo)' : '');
    await load();
  }
  async function logout() { if (!DEMO) await sb.auth.signOut(); location.reload(); }

  /* ---------- data ---------- */
  async function load() {
    if (DEMO) rows = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
    else {
      const { data, error } = await sb.from(TABLE).select('*').order('created_at', { ascending: false });
      if (error) { KG.toast('Could not load submissions', true); console.error(error); return; }
      rows = data || [];
    }
    render();
  }
  async function patch(id, fields) {
    const r = rows.find((x) => x.id === id); Object.assign(r, fields);
    if (DEMO) { localStorage.setItem(DEMO_KEY, JSON.stringify(rows)); return true; }
    const { error } = await sb.from(TABLE).update(fields).eq('id', id);
    if (error) { KG.toast('Save failed', true); console.error(error); return false; }
    return true;
  }
  async function remove(id) {
    if (!confirm('Delete this submission permanently?')) return;
    if (DEMO) { rows = rows.filter((x) => x.id !== id); localStorage.setItem(DEMO_KEY, JSON.stringify(rows)); }
    else { const { error } = await sb.from(TABLE).delete().eq('id', id); if (error) return KG.toast('Delete failed', true); rows = rows.filter((x) => x.id !== id); }
    closeDrawer(); render(); KG.toast('Deleted');
  }

  /* ---------- list ---------- */
  const when = (iso) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const label = (s) => ({ new: 'New', reviewed: 'Reviewed', onboarded: 'Onboarded', archived: 'Archived' }[s] || s);

  function render() {
    const c = (s) => rows.filter((r) => r.status === s).length;
    const week = rows.filter((r) => Date.now() - new Date(r.created_at) < 7 * 864e5).length;
    $('stats').innerHTML = [
      ['Total submissions', rows.length, ''], ['New, not reviewed', c('new'), 'hot'], ['This week', week, ''], ['Onboarded', c('onboarded'), ''],
    ].map(([l, n, cl]) => `<div class="stat ${cl}"><b>${n}</b><span>${l}</span></div>`).join('');

    const q = $('q').value.trim().toLowerCase(); const st = $('fStatus').value;
    const list = rows.filter((r) => (!st || r.status === st) &&
      (!q || [r.business_name, r.contact_name, r.email, r.client_ref].join(' ').toLowerCase().includes(q)));
    $('list').innerHTML = list.length ? list.map((r) => `<div class="row ${r.status === 'new' ? 'is-new' : ''}" data-id="${r.id}">
        <div><div class="r-biz">${esc(r.business_name || 'Unnamed business')}</div><div class="r-sub">${esc(r.data?.instagram || r.data?.website || r.client_ref || '')}</div></div>
        <div class="r-contact"><div>${esc(r.contact_name || '')}</div><div class="r-sub">${esc(r.email || '')}</div></div>
        <div class="r-date">${when(r.created_at)}</div>
        <div><span class="pill st-${r.status}">${label(r.status)}</span></div>
        <div class="r-sub" style="text-align:right">${esc(r.data?.ad_budget || '')}</div></div>`).join('')
      : `<div class="empty-big">${rows.length ? 'No matches.' : 'No submissions yet. Copy the client link above and send it to your next client.'}</div>`;
  }

  /* ---------- drawer ---------- */
  function open(id) {
    current = rows.find((r) => r.id === id); if (!current) return;
    const d = current.data || {}; const internal = current.internal || {};
    $('dTitle').textContent = current.business_name || 'Unnamed business';
    $('dSub').textContent = `${current.contact_name || ''} · submitted ${when(current.created_at)}${current.client_ref ? ' · ref: ' + current.client_ref : ''}`;
    $('dStatus').value = current.status;
    $('dBody').innerHTML =
      `<div class="internal"><h3>KGEN INTERNAL (client never sees this)</h3><div class="grid">${INTERNAL.map((f) =>
        `<div class="f ${f.area ? '' : 'half'}"><label>${esc(f.label)}</label>${f.area
          ? `<textarea class="inp" rows="3" data-int="${f.k}">${esc(internal[f.k] || '')}</textarea>`
          : `<input class="inp" data-int="${f.k}" placeholder="${esc(f.ph || '')}" value="${esc(internal[f.k] || '')}">`}</div>`).join('')}</div></div>` +
      SECTIONS.map((s) => `<div class="review-sec"><h3>${esc(s.title)}</h3><dl class="kv">${s.fields.map((f) => {
        const v = fmt(f, d);
        const isUrl = f.type === 'url' && /^https?:\/\//i.test(v);
        return `<dt>${esc(f.label)}</dt><dd class="${v ? '' : 'no'}">${v ? (isUrl ? `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>` : esc(v)) : '—'}</dd>`;
      }).join('')}</dl></div>`).join('');
    $('drawer').classList.add('on'); $('scrim').classList.add('on'); $('drawer').setAttribute('aria-hidden', 'false');
    if (current.status === 'new') { patch(current.id, { status: 'reviewed' }).then(() => { $('dStatus').value = 'reviewed'; render(); }); }
  }
  function closeDrawer() { $('drawer').classList.remove('on'); $('scrim').classList.remove('on'); $('drawer').setAttribute('aria-hidden', 'true'); current = null; }

  function asText(r) {
    const d = r.data || {}; const i = r.internal || {};
    let out = `ONBOARDING - ${r.business_name || ''}\nSubmitted: ${when(r.created_at)}\n`;
    SECTIONS.forEach((s) => {
      out += `\n# ${s.title.toUpperCase()}\n`;
      s.fields.forEach((f) => { const v = fmt(f, d); out += `${f.label}: ${v.includes('\n') ? '\n' + v : v}\n`; });
    });
    const ints = INTERNAL.filter((f) => i[f.k]);
    if (ints.length) { out += `\n# KGEN INTERNAL\n`; ints.forEach((f) => (out += `${f.label}: ${i[f.k]}\n`)); }
    return out;
  }

  /* ---------- events ---------- */
  $('loginForm').addEventListener('submit', login);
  $('logout').addEventListener('click', logout);
  $('refresh').addEventListener('click', load);
  $('q').addEventListener('input', render);
  $('fStatus').addEventListener('change', render);
  $('list').addEventListener('click', (e) => { const r = e.target.closest('.row'); if (r) open(r.dataset.id); });
  $('scrim').addEventListener('click', closeDrawer);
  $('dClose').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  $('dStatus').addEventListener('change', async (e) => { if (current && await patch(current.id, { status: e.target.value })) { render(); KG.toast('Status updated'); } });
  $('dDel').addEventListener('click', () => current && remove(current.id));
  $('dCopy').addEventListener('click', async () => { if (!current) return; await navigator.clipboard.writeText(asText(current)); KG.toast('Copied, paste into ClickUp or Slack'); });
  $('dJson').addEventListener('click', () => {
    if (!current) return;
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (current.business_name || 'onboarding').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.json'; a.click();
  });
  let tInt;
  $('dBody').addEventListener('input', (e) => {
    const k = e.target.dataset.int; if (!k || !current) return;
    current.internal = { ...(current.internal || {}), [k]: e.target.value };
    clearTimeout(tInt); const id = current.id, internal = current.internal;
    tInt = setTimeout(async () => { if (await patch(id, { internal })) KG.toast('Saved'); }, 700);
  });
  $('copyLink').addEventListener('click', async () => {
    const base = location.href.replace(/admin\.html.*$/, '');
    const ref = $('refIn').value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const link = base + (ref ? '?client=' + ref : '');
    await navigator.clipboard.writeText(link); KG.toast('Link copied: ' + link);
  });

  /* ---------- init ---------- */
  if (DEMO) $('demoTag').style.display = 'inline-block';
  if (!DEMO) sb.auth.getSession().then(({ data }) => {
    if (data.session) { me = data.session.user.user_metadata?.display_name || data.session.user.email.split('@')[0]; enter(); }
  });
})();
