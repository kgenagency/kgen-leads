(function () {
  const SECTIONS = window.KGEN_FORM;
  const { esc, fmt, servicesOf } = KG;
  const params = new URLSearchParams(location.search);
  const CLIENT_REF = (params.get('client') || '').trim(); // optional: ?client=pristine
  const LS = 'kgen_onb_draft' + (CLIENT_REF ? '_' + CLIENT_REF : '');

  let data = {};
  try { data = JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { data = {}; }
  let step = Math.min(data.__step || 0, SECTIONS.length);
  const TOTAL = SECTIONS.length + 1; // + review

  const form = document.getElementById('form');
  const $ = (id) => document.getElementById(id);

  function save() {
    data.__step = step;
    try { localStorage.setItem(LS, JSON.stringify(data)); $('saved').textContent = 'Progress saved'; } catch (e) {}
  }

  /* ---------- field renderers ---------- */
  function fieldHTML(f) {
    const v = data[f.k];
    const id = 'f_' + f.k;
    const lab = `<label for="${id}">${esc(f.label)}${f.req ? '<span class="req">*</span>' : ''}</label>`;
    const hint = f.hint ? `<div class="hint">${esc(f.hint)}</div>` : '';
    const err = `<div class="errmsg">This one is required.</div>`;
    const cls = `f${f.half ? ' half' : ''}`;
    const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : '';
    let inner = '';
    switch (f.type) {
      case 'textarea':
        inner = `<textarea class="inp" id="${id}" data-k="${f.k}" rows="${f.rows || 3}"${ph}>${esc(v || '')}</textarea>`; break;
      case 'select':
        inner = `<select class="inp" id="${id}" data-k="${f.k}"><option value="">Select...</option>${f.opts.map((o) => `<option${v === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`; break;
      case 'radio':
        return `<div class="${cls}" data-f="${f.k}"><div class="lbl">${esc(f.label)}${f.req ? '<span class="req">*</span>' : ''}</div><div class="chips">${f.opts.map((o) => `<label class="chip radio"><input type="radio" name="${f.k}" value="${esc(o)}" data-k="${f.k}"${v === o ? ' checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>${hint}${err}</div>`;
      case 'checks': {
        const arr = Array.isArray(v) ? v : [];
        const other = f.other ? `<input class="inp other-inp" data-k="${f.k}_other" placeholder="Other (separate with commas)" value="${esc(data[f.k + '_other'] || '')}">` : '';
        return `<div class="${cls}" data-f="${f.k}"><div class="lbl">${esc(f.label)}</div><div class="chips">${f.opts.map((o) => `<label class="chip"><input type="checkbox" value="${esc(o)}" data-check="${f.k}"${arr.includes(o) ? ' checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>${other}${hint}</div>`;
      }
      case 'pickrank':
        return `<div class="${cls}" data-f="${f.k}"><div class="lbl">${esc(f.label)}${f.req ? '<span class="req">*</span>' : ''}</div>
          ${hint.replace('class="hint"', 'class="hint hint-top"')}<div class="chips pick" id="pick_${f.k}"></div>
          <div class="add-row"><input class="inp" id="svc_custom" placeholder="Missing a service? Type it here"><button type="button" class="btn btn-ghost btn-add" data-addsvc="${f.k}">Add</button></div>
          <div class="order-wrap"><div class="order-title">Your priority order</div><div class="rank" id="rank_${f.k}"></div></div>${err}</div>`;
      case 'offers':
        return `<div class="${cls}" data-f="${f.k}"><div class="lbl">${esc(f.label)}</div><div id="offers_${f.k}"></div>${hint}</div>`;
      case 'zones':
        return `<div class="${cls}" data-f="${f.k}"><div class="lbl">${esc(f.label)}</div><div id="zones_${f.k}"></div><button type="button" class="add-btn" data-addzone="${f.k}">+ Add another area</button>${hint}</div>`;
      case 'access': {
        const a = v || {};
        return `<div class="${cls}" data-f="${f.k}"><div class="access">${f.rows.map((r, i) => {
          const cur = a[r] || {};
          return `<div class="acc-row"><div class="acc-head"><div class="acc-name">${esc(r)}</div></div>
            <div class="chips">${f.statuses.map((s) => `<label class="chip radio"><input type="radio" name="acc_${i}" value="${esc(s)}" data-acc="${esc(r)}"${cur.status === s ? ' checked' : ''}><span>${esc(s)}</span></label>`).join('')}</div>
            <input class="inp acc-id" data-accid="${esc(r)}" placeholder="Account / Page ID (optional)" value="${esc(cur.id || '')}"></div>`;
        }).join('')}</div>${hint}</div>`;
      }
      default:
        inner = `<input class="inp" id="${id}" type="${f.type === 'url' ? 'url' : f.type}" data-k="${f.k}" value="${esc(v || '')}"${ph}${f.type === 'email' ? ' autocomplete="email"' : ''}${f.type === 'tel' ? ' autocomplete="tel"' : ''}>`;
    }
    return `<div class="${cls}" data-f="${f.k}">${lab}${inner}${hint}${err}</div>`;
  }

  function sectionHTML(s, i) {
    return `<section class="section" data-step="${i}"><div class="sec-num">Step ${i + 1} of ${TOTAL}</div><h2 class="sec-title">${esc(s.title)}</h2><p class="sec-sub">${esc(s.sub)}</p><div class="grid">${s.fields.map(fieldHTML).join('')}</div></section>`;
  }

  function reviewHTML() {
    return `<section class="section" data-step="${SECTIONS.length}"><div class="sec-num">Step ${TOTAL} of ${TOTAL}</div><h2 class="sec-title">Review and submit</h2><p class="sec-sub">Quick check before it goes to our team.</p><div id="reviewBody"></div></section>`;
  }

  /* ---------- dynamic parts (depend on selected services) ---------- */
  function pickField() { for (const sec of SECTIONS) for (const f of sec.fields) if (f.type === 'pickrank') return f; }
  function syncPick() {
    const f = pickField(); const box = $('pick_' + f.k); if (!box) return;
    const sel = Array.isArray(data[f.k]) ? data[f.k] : (data[f.k] = []);
    const custom = Array.isArray(data.services_custom) ? data.services_custom : [];
    const all = [...f.opts, ...custom.filter((c) => !f.opts.includes(c))];
    box.innerHTML = all.map((o) => {
      const n = sel.indexOf(o) + 1;
      return `<button type="button" class="pchip${n ? ' on' : ''}" data-pick="${esc(o)}" aria-pressed="${n ? 'true' : 'false'}">${n ? `<b>${n}</b>` : '<i></i>'}${esc(o)}</button>`;
    }).join('');
    const r = $('rank_' + f.k);
    r.parentElement.hidden = sel.length < 2;
    r.innerHTML = sel.map((s, i) => `<div class="rank-item"><div class="rank-n">${i + 1}</div><div class="rank-name">${esc(s)}</div><div class="rank-btns">
      <button type="button" class="mini" data-mv="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 15l6-6 6 6"/></svg></button>
      <button type="button" class="mini" data-mv="${i}" data-d="1" ${i === sel.length - 1 ? 'disabled' : ''} aria-label="Move down"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></button>
      <button type="button" class="mini" data-unpick="${esc(s)}" aria-label="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div>`).join('');
  }
  function togglePick(name) {
    const sel = data.services = Array.isArray(data.services) ? data.services : [];
    const i = sel.indexOf(name); i >= 0 ? sel.splice(i, 1) : sel.push(name);
    const fe = form.querySelector('[data-f="services"]'); if (fe) fe.classList.remove('err');
    syncPick(); save();
  }
  function addCustom() {
    const inp = $('svc_custom'); const v = inp.value.trim(); if (!v) return;
    data.services_custom = Array.isArray(data.services_custom) ? data.services_custom : [];
    const f = pickField();
    if (!f.opts.includes(v) && !data.services_custom.includes(v)) data.services_custom.push(v);
    if (!(data.services || []).includes(v)) togglePick(v); else syncPick();
    inp.value = ''; inp.focus();
  }

  function syncOffers() {
    const box = $('offers_offers');
    if (!box) return;
    const services = servicesOf(data);
    data.offers = data.offers || {};
    if (!services.length) { box.innerHTML = '<div class="empty">Pick your services in the Ad Setup step first.</div>'; return; }
    box.innerHTML = services.map((s) => `<div class="offer"><label>${esc(s)}</label><input class="inp" data-offer="${esc(s)}" placeholder="e.g. Free interior detail with any coating package" value="${esc(data.offers[s] || '')}"></div>`).join('');
  }

  function syncZones() {
    const box = $('zones_zones_include');
    if (!box) return;
    if (!Array.isArray(data.zones_include) || !data.zones_include.length) data.zones_include = [{ city: '', radius: '' }];
    box.innerHTML = data.zones_include.map((z, i) => `<div class="zone">
      <input class="inp" data-zone="${i}" data-zf="city" placeholder="City, State" value="${esc(z.city)}">
      <input class="inp" data-zone="${i}" data-zf="radius" inputmode="numeric" placeholder="Radius (mi)" value="${esc(z.radius)}">
      <button type="button" class="mini" data-rmzone="${i}" aria-label="Remove" ${data.zones_include.length === 1 ? 'disabled' : ''}>×</button></div>`).join('');
  }

  function renderReview() {
    $('reviewBody').innerHTML = SECTIONS.map((s, i) => `<div class="review-sec"><h3>${esc(s.title)}<button type="button" data-goto="${i}">Edit</button></h3><dl class="kv">${s.fields.map((f) => {
      const val = fmt(f, data);
      return `<dt>${esc(f.label)}</dt><dd class="${val ? '' : 'no'}">${val ? esc(val) : 'Not provided'}</dd>`;
    }).join('')}</dl></div>`).join('');
  }

  /* ---------- navigation ---------- */
  function show() {
    document.querySelectorAll('.section[data-step]').forEach((el) => el.classList.toggle('on', +el.dataset.step === step));
    $('intro').style.display = step === 0 ? '' : 'none';
    $('back').style.visibility = step === 0 ? 'hidden' : 'visible';
    $('next').textContent = step === SECTIONS.length ? 'Submit' : step === SECTIONS.length - 1 ? 'Review' : 'Continue';
    const label = step === SECTIONS.length ? 'Review' : SECTIONS[step].title;
    $('pLabel').textContent = `Step ${step + 1} of ${TOTAL} · ${label}`;
    const pct = Math.round((step / (TOTAL - 1)) * 100);
    $('pPct').textContent = pct + '%';
    $('pBar').style.width = pct + '%';
    $('pSteps').innerHTML = [...SECTIONS.map((s) => s.title), 'Review'].map((t, i) =>
      `<button type="button" class="step-pill ${i === step ? 'on' : i < step ? 'done' : ''}" data-goto="${i}">${esc(t)}</button>`).join('');
    const on = $('pSteps').querySelector('.on');
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (step === SECTIONS.length) renderReview();
    if (step < SECTIONS.length) { syncPick(); syncOffers(); syncZones(); }
  }

  function validate(i) {
    if (i >= SECTIONS.length) return true;
    let ok = true; let first = null;
    SECTIONS[i].fields.forEach((f) => {
      const el = form.querySelector(`[data-f="${f.k}"]`);
      if (!el) return;
      let bad = false;
      const raw = data[f.k]; const v = Array.isArray(raw) ? raw.join(',') : (raw || '').toString().trim();
      if (f.req && !v) bad = true;
      if (!bad && v && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) bad = true;
      el.classList.toggle('err', bad);
      if (bad) { el.querySelector('.errmsg').textContent = f.type === 'pickrank' ? 'Pick at least one service.' : v ? 'Please enter a valid email.' : 'This one is required.'; ok = false; first = first || el; }
    });
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return ok;
  }

  function go(n) {
    if (n > step) { for (let i = step; i < n; i++) if (!validate(i)) { if (i !== step) { step = i; show(); validate(i); } return; } }
    step = Math.max(0, Math.min(n, SECTIONS.length));
    save(); show();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit() {
    for (let i = 0; i < SECTIONS.length; i++) if (!validate(i)) { step = i; show(); validate(i); return; }
    const btn = $('next');
    btn.disabled = true; btn.textContent = 'Submitting...';
    const clean = { ...data }; delete clean.__step;
    const row = {
      client_ref: CLIENT_REF || null,
      business_name: data.business_name || null,
      contact_name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
      email: data.business_email || null,
      data: clean,
    };
    const { error } = await KG.insert(row);
    if (error) {
      btn.disabled = false; btn.textContent = 'Submit';
      KG.toast('Something went wrong. Please try again.', true);
      console.error(error);
      return;
    }
    localStorage.removeItem(LS);
    form.style.display = 'none'; $('nav').style.display = 'none'; $('progress').style.display = 'none'; $('intro').style.display = 'none';
    $('done').classList.add('on'); $('done').style.display = 'block';
    window.scrollTo({ top: 0 });
  }

  /* ---------- events ---------- */
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.k) data[t.dataset.k] = t.value;
    if (t.dataset.offer) { data.offers = data.offers || {}; data.offers[t.dataset.offer] = t.value; }
    if (t.dataset.accid) { data.access = data.access || {}; (data.access[t.dataset.accid] = data.access[t.dataset.accid] || {}).id = t.value; }
    if (t.dataset.zone) data.zones_include[+t.dataset.zone][t.dataset.zf] = t.value;
    const fEl = t.closest('.f'); if (fEl) fEl.classList.remove('err');
    save();
  });
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.check) {
      const arr = new Set(Array.isArray(data[t.dataset.check]) ? data[t.dataset.check] : []);
      t.checked ? arr.add(t.value) : arr.delete(t.value);
      data[t.dataset.check] = [...arr];
    }
    if (t.type === 'radio' && t.dataset.k) data[t.dataset.k] = t.value;
    if (t.dataset.acc) { data.access = data.access || {}; (data.access[t.dataset.acc] = data.access[t.dataset.acc] || {}).status = t.value; }
    save();
  });
  document.addEventListener('click', (e) => {
    const pk = e.target.closest('[data-pick]');
    if (pk) { togglePick(pk.dataset.pick); return; }
    const up = e.target.closest('[data-unpick]');
    if (up) { togglePick(up.dataset.unpick); return; }
    if (e.target.closest('[data-addsvc]')) { addCustom(); return; }
    const mv = e.target.closest('[data-mv]');
    if (mv) { const i = +mv.dataset.mv, j = i + +mv.dataset.d; const r = data.services; [r[i], r[j]] = [r[j], r[i]]; syncPick(); save(); return; }
    const az = e.target.closest('[data-addzone]');
    if (az) { data.zones_include.push({ city: '', radius: '' }); syncZones(); save(); return; }
    const rz = e.target.closest('[data-rmzone]');
    if (rz) { data.zones_include.splice(+rz.dataset.rmzone, 1); syncZones(); save(); return; }
    const g = e.target.closest('[data-goto]');
    if (g) { const n = +g.dataset.goto; if (n <= step) go(n); else go(n); }
  });
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'svc_custom') { e.preventDefault(); addCustom(); }
  });
  $('next').addEventListener('click', () => (step === SECTIONS.length ? submit() : go(step + 1)));
  $('back').addEventListener('click', () => go(step - 1));

  /* ---------- init ---------- */
  form.innerHTML = SECTIONS.map(sectionHTML).join('') + reviewHTML();
  $('done').style.display = 'none';
  if (localStorage.getItem(LS)) $('saved').textContent = 'Draft restored';
  show();
})();
