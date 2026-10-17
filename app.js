/* TradeNow app */
const SB_URL = 'https://jydtlyrfnskjydmpibed.supabase.co';
const SB_KEY = 'sb_publishable_TUr7NkKa2GdUBENI8ipZag_UIdXgVuX';
const sb = supabase.createClient(SB_URL, SB_KEY, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true, autoRefreshToken: true } });

// פרטי העסק: חובה לפי חוק הגנת הצרכן לפני שמתחילים לגבות תשלום. למלא כאן ולפרוס מחדש.
const BIZ = { name: '', id: '', address: '', email: '', phone: '', a11yName: '' };
const bizFilled = () => !!(BIZ.name && BIZ.id && BIZ.address);
function bizBlock() {
  if (!bizFilled()) return '<p>פרטי מפעיל האתר (שם, מספר עוסק וכתובת) יפורסמו כאן לפני פתיחת התשלום באתר. עד אז אפשר לפנות דרך <a href="#/contact">צור קשר</a>.</p>';
  return `<ul><li>שם העסק: ${esc(BIZ.name)}</li><li>מספר עוסק: ${esc(BIZ.id)}</li><li>כתובת: ${esc(BIZ.address)}</li>${BIZ.email ? `<li>אימייל: <span dir="ltr">${esc(BIZ.email)}</span></li>` : ''}${BIZ.phone ? `<li>טלפון: <span dir="ltr">${esc(BIZ.phone)}</span></li>` : ''}</ul>`;
}
const UPDATED = 'עודכן ב-17 באוקטובר 2026';

const S = { user: null, profile: null, admin: false, channel: null, routeId: 0 };
const V = document.getElementById('view');

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function ic(n, s = 22, c = 'currentColor', w = 1.8) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`; }
const CATS = { electronics: ['אלקטרוניקה', 'device-laptop'], fashion: ['בגדים ואופנה', 'shirt'], vehicles: ['רכב ודו-גלגלי', 'bike'], home: ['בית וגינה', 'armchair'], sport: ['ספורט', 'ball-football'], gaming: ['גיימינג', 'device-gamepad-2'], kids: ['תינוקות וילדים', 'baby-carriage'], other: ['אחר', 'package'] };
const COND = { new: 'חדש', like_new: 'כמו חדש', used: 'יד שנייה' };
const GRADS = ['linear-gradient(135deg,#1E40AF,#2E8BFF)', 'linear-gradient(135deg,#9A3412,#FB923C)', 'linear-gradient(135deg,#581C87,#C084FC)', 'linear-gradient(135deg,#0F766E,#2DD4BF)'];
const price = p => p === 0 ? 'חינם' : '₪' + Number(p).toLocaleString('en-US');
const imgUrl = p => `${SB_URL}/storage/v1/object/public/listing-images/${p}`;
// smaller copies for lists/gallery (falls back to the original file if resizing is unavailable)
const thumbUrl = p => `${SB_URL}/storage/v1/render/image/public/listing-images/${p}?width=480&height=480&resize=cover&quality=70`;
const bigUrl = p => `${SB_URL}/storage/v1/render/image/public/listing-images/${p}?width=1100&height=1100&resize=contain&quality=75`;
const imgFallback = p => `onerror="this.onerror=null;this.src='${imgUrl(p)}'"`;
function ago(d) { const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return 'לפני רגע'; if (s < 3600) return `לפני ${Math.floor(s / 60)} דק׳`; if (s < 86400) { const h = Math.floor(s / 3600); return h === 1 ? 'לפני שעה' : `לפני ${h} שעות`; } const dd = Math.floor(s / 86400); return dd === 1 ? 'אתמול' : dd < 30 ? `לפני ${dd} ימים` : new Date(d).toLocaleDateString('he-IL'); }
const isTop = l => l.top_until && new Date(l.top_until) > new Date();
const isPromo = l => l.promoted_until && new Date(l.promoted_until) > new Date();
const rank = l => isTop(l) ? 2 : isPromo(l) ? 1 : 0;
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800); }
function loading() { V.innerHTML = `<div class="loading"><div class="spin"></div>טוען...</div>`; }
function qparams() { const h = location.hash.split('?')[1] || ''; return Object.fromEntries(new URLSearchParams(h)); }
function go(h) { if (location.hash === h) route(); else location.hash = h; }
function needLogin() { if (S.user) return false; go('#/login?next=' + encodeURIComponent(location.hash || '#/')); return true; }
function initial(n) { return esc((n || '?').trim().charAt(0) || '?'); }
function errMsg(e) { const m = (e && (e.message || e.error_description)) || ''; if (/Invalid login/i.test(m)) return 'אימייל או סיסמה לא נכונים'; if (/Email not confirmed/i.test(m)) return 'צריך לאשר את המייל קודם. בדוק את תיבת הדואר'; if (/already registered/i.test(m)) return 'המייל הזה כבר רשום. נסה להתחבר'; if (/Password should be/i.test(m)) return 'הסיסמה צריכה להיות לפחות 6 תווים'; if (/rate limit/i.test(m)) return 'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות'; return 'משהו השתבש. נסה שוב.'; }
function modal(html) { S.lastFocus = document.activeElement; const m = document.getElementById('modal'); m.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; m.onclick = e => { if (e.target === m) closeModal(); }; const f = m.querySelector('input,textarea,button'); if (f) f.focus(); return m; }
function closeModal() { const m = document.getElementById('modal'); if (m.hidden) return; m.hidden = true; m.innerHTML = ''; if (S.lastFocus && S.lastFocus.focus) S.lastFocus.focus(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.getElementById('modal').hidden) closeModal(); });

function card(l) {
  const img = l.images && l.images[0];
  const r = rank(l);
  return `<a class="card ${r === 2 ? 'top' : r === 1 ? 'promo' : ''}" href="#/item/${l.id}">
  <div class="ph">${img ? `<img loading="lazy" decoding="async" src="${thumbUrl(img)}" ${imgFallback(img)} alt="${esc(l.title)}">` : `<div class="noimg">${ic('photo', 44, '#94A3B8')}</div>`}
  <span class="badge ${l.condition === 'new' ? 'new' : ''}">${COND[l.condition]}</span>
  ${r ? `<span class="pbadge">${ic('bolt', 13, '#0F172A', 2.2)}${r === 2 ? 'בראש' : 'מקודם'}</span>` : ''}
  ${l.status === 'sold' ? '<span class="soldtag">נמכר</span>' : ''}</div>
  <div class="cb"><div class="ct">${esc(l.title)}</div><div class="cp">${price(l.price)}</div><div class="cm">${ic('map-pin', 13, '#5B6576', 2)}${esc(l.city)} · ${ago(l.created_at)}</div></div></a>`;
}
function grid(list) { return `<div class="grid">${list.map(card).join('')}</div>`; }
function sortRanked(list) { return list.sort((a, b) => rank(b) - rank(a) || new Date(b.created_at) - new Date(a.created_at)); }

// ---------- header / nav ----------
function renderNav() {
  const n = document.getElementById('hnav');
  n.innerHTML = (S.user ? `
    <a class="ib" href="#/messages" aria-label="הודעות">${ic('message', 23, '#E2E8F0')}</a>
    <a class="ib" href="#/me" aria-label="הפרופיל שלי">${ic('user', 23, '#E2E8F0')}</a>
    ${S.admin ? `<a class="ib hide-m" href="#/admin" aria-label="ניהול">${ic('chart-bar', 23, '#FFC233')}</a>` : ''}`
    : `<a class="txt" href="#/login">התחברות</a>`) +
    `<a class="btn btn-p" href="#/sell" style="margin-right:6px">${ic('plus', 18, '#fff', 2.6)}מכירה</a>`;
  const h = (location.hash || '#/').split('?')[0];
  const on = p => (h === p || (p !== '#/' && h.startsWith(p))) ? 'on' : '';
  document.getElementById('bnav').innerHTML = `
    <a href="#/" class="${on('#/')}">${ic('home', 24)}בית</a>
    <a href="#/search" class="${on('#/search')}">${ic('search', 24)}חיפוש</a>
    <a href="#/sell" class="sellb" aria-label="מכירה"><span class="c">${ic('plus', 24, '#fff', 2.6)}</span>מכירה</a>
    <a href="#/messages" class="${on('#/messages') || on('#/chat')}">${ic('message', 24)}הודעות</a>
    <a href="${S.user ? '#/me' : '#/login'}" class="${on('#/me') || on('#/login')}">${ic('user', 24)}${S.user ? 'פרופיל' : 'כניסה'}</a>`;
}
document.querySelector('.hsbtn').innerHTML = ic('search', 20, '#fff', 2.4);
document.getElementById('hsearch').addEventListener('submit', e => { e.preventDefault(); const q = document.getElementById('hq').value.trim(); go('#/search' + (q ? '?q=' + encodeURIComponent(q) : '')); });

async function loadMe() {
  if (!S.user) { S.profile = null; S.admin = false; return; }
  const [{ data: p }, { data: a }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', S.user.id).maybeSingle(),
    sb.rpc('is_admin')]);
  S.profile = p; S.admin = !!a;
}

// ---------- router ----------
const ROUTES = [
  [/^#?\/?$/, pHome], [/^#\/search$/, pSearch], [/^#\/item\/([\w-]+)$/, pItem], [/^#\/sell$/, pSell], [/^#\/edit\/([\w-]+)$/, pSell],
  [/^#\/messages$/, pMessages], [/^#\/chat\/([\w-]+)$/, pChat], [/^#\/me$/, pMe], [/^#\/user\/([\w-]+)$/, pUser], [/^#\/promote\/([\w-]+)$/, pPromote],
  [/^#\/login$/, pLogin], [/^#\/reset$/, pReset], [/^#\/admin$/, pAdmin], [/^#\/terms$/, pTerms], [/^#\/privacy$/, pPrivacy], [/^#\/safety$/, pSafety], [/^#\/contact$/, pContact], [/^#\/accessibility$/, pA11y]];
async function route() {
  if (S.channel) { sb.removeChannel(S.channel); S.channel = null; }
  if (S.poll) { clearInterval(S.poll); S.poll = null; }
  closeModal();
  const path = (location.hash || '#/').split('?')[0];
  const id = ++S.routeId;
  renderNav();
  setTitle(TITLES[path] || (path.startsWith('#/edit') ? 'עריכת מודעה' : path.startsWith('#/chat') ? 'שיחה' : path.startsWith('#/promote') ? 'קידום מודעה' : ''));
  for (const [re, fn] of ROUTES) { const m = path.match(re); if (m) { window.scrollTo(0, 0); if (S.booted) V.focus({ preventScroll: true }); S.booted = true; try { await fn(m[1], id); } catch (e) { console.error(e); if (id === S.routeId) V.innerHTML = `<div class="empty"><h3>משהו השתבש</h3><p>נסה לרענן את העמוד.</p></div>`; } return; } }
  V.innerHTML = `<div class="empty">${ic('alert-triangle', 48, '#94A3B8')}<h3>העמוד לא נמצא</h3><a class="btn btn-p" href="#/">לדף הבית</a></div>`;
}
const stale = id => id !== S.routeId;
const TITLES = { '#/search': 'חיפוש', '#/sell': 'פרסום מוצר', '#/messages': 'הודעות', '#/me': 'הפרופיל שלי', '#/login': 'התחברות', '#/reset': 'סיסמה חדשה', '#/admin': 'ניהול', '#/terms': 'תקנון', '#/privacy': 'מדיניות פרטיות', '#/safety': 'קנייה בטוחה', '#/contact': 'צור קשר', '#/accessibility': 'הצהרת נגישות' };
function setTitle(t) { document.title = t ? `${t} | TradeNow` : 'TradeNow: קונים ומוכרים הכל, בקלות'; }

// ---------- pages ----------
async function pHome(_, id) {
  loading();
  const [{ data: list }, { data: trends }] = await Promise.all([
    sb.from('listings').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(48),
    sb.rpc('top_searches', { days: 14, lim: 8 })]);
  if (stale(id)) return;
  const items = sortRanked(list || []);
  const promoted = items.filter(l => rank(l) > 0).slice(0, 8);
  const tiles = [['device-mobile', 0], ['shoe', 1], ['headphones', 2]].map(([n, g], k) => `<div class="tile" style="width:${[110, 130, 100][k]}px;height:${[110, 130, 100][k]}px;background:${GRADS[g]}">${ic(n, [62, 74, 56][k], '#fff', 1.5)}</div>`).join('');
  V.innerHTML = `
  <section class="hero"><div style="position:relative">
    <h1>קונים ומוכרים<br>הכל, בקלות.</h1>
    <p>יד שנייה, מוצרים חדשים ומותגים קטנים. מפרסמים בחינם תוך דקה ומדברים ישירות עם המוכר.</p>
    <div class="row-actions"><a class="btn btn-p" href="#/sell">${ic('plus', 18, '#fff', 2.6)}לפרסם מוצר</a><a class="btn" style="background:transparent;color:#fff;border:1.5px solid #3A4A6B" href="#/search">${ic('search', 18, '#fff', 2.2)}לחפש</a></div>
  </div><div class="tiles">${tiles}</div></section>
  <section class="sec"><div class="cats">${Object.entries(CATS).map(([k, [t, i]]) => `<a class="cat" href="#/search?cat=${k}"><span class="ci">${ic(i, 28, '#0A64E8')}</span>${t}</a>`).join('')}</div></section>
  ${trends && trends.length ? `<section class="sec panel" style="padding:16px 18px"><div class="chips" style="align-items:center"><strong style="display:flex;align-items:center;gap:6px;margin-left:6px">${ic('flame', 20, '#E8590C')}מה מחפשים עכשיו</strong>${trends.map(t => `<a class="chip" href="#/search?q=${encodeURIComponent(t.query)}">${esc(t.query)}</a>`).join('')}</div></section>` : ''}
  ${promoted.length ? `<section class="sec"><div class="sech"><h2>מודעות מקודמות</h2></div>${grid(promoted)}</section>` : ''}
  <section class="sec"><div class="sech"><h2>מודעות חדשות</h2><a href="#/search">הכל ›</a></div>
  ${items.length ? grid(items.filter(l => !promoted.includes(l))) : `<div class="panel empty">${ic('shopping-bag', 52, '#94A3B8')}<h3>עוד אין מודעות באתר</h3><p>האתר רק נפתח. תהיה הראשון לפרסם!</p><a class="btn btn-p" href="#/sell">לפרסם מוצר ראשון</a></div>`}</section>`;
}

async function pSearch(_, id) {
  const q = qparams();
  const text = (q.q || '').trim();
  document.getElementById('hq').value = text;
  loading();
  let query = sb.from('listings').select('*').eq('status', 'active');
  if (text) { const s = text.replace(/[%,()*"\\:.]/g, ' ').trim(); if (s) query = query.or(`title.ilike."*${s}*",description.ilike."*${s}*"`); }
  if (q.cat && CATS[q.cat]) query = query.eq('category', q.cat);
  if (q.cond && COND[q.cond]) query = query.eq('condition', q.cond);
  if (q.min) query = query.gte('price', parseInt(q.min) || 0);
  if (q.max) query = query.lte('price', parseInt(q.max) || 0);
  if (q.city) { const c = q.city.replace(/[%,()*"\\]/g, ' ').trim(); if (c) query = query.ilike('city', `%${c}%`); }
  const sort = q.sort || 'new';
  query = sort === 'cheap' ? query.order('price', { ascending: true }) : sort === 'exp' ? query.order('price', { ascending: false }) : query.order('created_at', { ascending: false });
  const { data } = await query.limit(120);
  if (stale(id)) return;
  let list = data || [];
  if (sort === 'new') list = sortRanked(list);
  if (text.length >= 2) { const key = 'sl:' + text.toLowerCase(); try { if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); sb.from('search_log').insert({ query: text.slice(0, 60), results: list.length }).then(() => { }); } } catch (e) { } }
  const link = (k, v) => { const p = { ...q, [k]: v }; if (!v) delete p[k]; const s = new URLSearchParams(p).toString(); return '#/search' + (s ? '?' + s : ''); };
  const title = text ? `תוצאות עבור "${esc(text)}"` : q.cat ? esc(CATS[q.cat]?.[0] || 'כל המודעות') : 'כל המודעות';
  V.innerHTML = `<div class="layout">
  <details class="side panel" ${window.innerWidth > 760 ? 'open' : ''}><summary style="cursor:pointer;font-weight:800;font-size:20px;display:flex;align-items:center;gap:8px">${ic('adjustments-horizontal', 22)}סינון</summary><form id="flt" style="margin-top:14px">
    <div class="field"><label for="f-cat">קטגוריה</label><select id="f-cat" class="inp"><option value="">הכל</option>${Object.entries(CATS).map(([k, [t]]) => `<option value="${k}" ${q.cat === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label for="f-cond">מצב</label><select id="f-cond" class="inp"><option value="">הכל</option>${Object.entries(COND).map(([k, t]) => `<option value="${k}" ${q.cond === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="field"><span class="lbl">מחיר (₪)</span><div class="two"><input id="f-min" class="inp" type="number" min="0" inputmode="numeric" placeholder="מ-" aria-label="מחיר מינימלי" value="${esc(q.min || '')}"><input id="f-max" class="inp" type="number" min="0" inputmode="numeric" placeholder="עד" aria-label="מחיר מקסימלי" value="${esc(q.max || '')}"></div></div>
    <div class="field"><label for="f-city">עיר</label><input id="f-city" class="inp" placeholder="למשל: חיפה" value="${esc(q.city || '')}"></div>
    <div class="row-actions"><button class="btn btn-p" type="submit">החל סינון</button><a class="btn btn-g" href="#/search${text ? '?q=' + encodeURIComponent(text) : ''}">ניקוי</a></div>
  </form></details>
  <section class="mainc">
    <div class="sech" style="flex-wrap:wrap"><h1 style="margin:0;font-size:24px">${title} <span style="color:var(--muted);font-weight:500;font-size:16px">(${list.length})</span></h1>
    <div class="chips"><a class="chip ${sort === 'new' ? 'on' : ''}" href="${link('sort', '')}">חדש ביותר</a><a class="chip ${sort === 'cheap' ? 'on' : ''}" href="${link('sort', 'cheap')}">זול ביותר</a><a class="chip ${sort === 'exp' ? 'on' : ''}" href="${link('sort', 'exp')}">יקר ביותר</a></div></div>
    ${list.length ? grid(list) : `<div class="panel empty">${ic('search', 48, '#94A3B8')}<h3>לא מצאנו תוצאות</h3><p>נסה מילה אחרת או הסר חלק מהסינונים.</p></div>`}
  </section></div>`;
  document.getElementById('flt').onsubmit = e => {
    e.preventDefault(); const p = {};
    if (text) p.q = text; const v = x => document.getElementById(x).value.trim();
    if (v('f-cat')) p.cat = v('f-cat'); if (v('f-cond')) p.cond = v('f-cond'); if (v('f-min')) p.min = v('f-min'); if (v('f-max')) p.max = v('f-max'); if (v('f-city')) p.city = v('f-city'); if (q.sort) p.sort = q.sort;
    const s = new URLSearchParams(p).toString(); go('#/search' + (s ? '?' + s : ''));
  };
}

async function pItem(lid, id) {
  loading();
  const { data: l } = await sb.from('listings').select('*, seller:profiles!listings_seller_id_fkey(id,display_name,city,created_at)').eq('id', lid).maybeSingle();
  if (stale(id)) return;
  if (!l) { V.innerHTML = `<div class="empty">${ic('alert-triangle', 48, '#94A3B8')}<h3>המודעה לא נמצאה</h3><p>ייתכן שהיא נמחקה.</p><a class="btn btn-p" href="#/">לדף הבית</a></div>`; return; }
  try { const k = 'v:' + lid; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, '1'); sb.rpc('add_view', { lid }).then(() => { }); } } catch (e) { }
  setTitle(l.title);
  const mine = S.user && S.user.id === l.seller_id;
  const imgs = l.images || [];
  const sel = l.seller || {};
  V.innerHTML = `<nav class="meta" style="margin-bottom:14px"><a href="#/">דף הבית</a>›<a href="#/search?cat=${l.category}">${(CATS[l.category] || CATS.other)[0]}</a></nav>
  ${l.status === 'sold' ? '<div class="banner sold" style="margin-bottom:14px">המוצר הזה כבר נמכר</div>' : ''}
  ${l.status === 'removed' ? '<div class="banner sold" style="margin-bottom:14px">המודעה הוסרה על ידי הנהלת האתר</div>' : ''}
  <div class="item">
    <div class="gal"><div class="gmain" id="gmain">${imgs.length ? `<img src="${bigUrl(imgs[0])}" ${imgFallback(imgs[0])} alt="${esc(l.title)}">` : `<div class="noimg">${ic('photo', 80, '#94A3B8')}</div>`}</div>
    ${imgs.length > 1 ? `<div class="gthumbs">${imgs.map((p, i) => `<button type="button" data-i="${i}" aria-label="תמונה ${i + 1}" aria-current="${i === 0}"><img loading="lazy" src="${thumbUrl(p)}" ${imgFallback(p)} alt=""></button>`).join('')}</div>` : ''}</div>
    <div class="info">
      <div class="chips"><span class="pill ${l.condition === 'new' ? 'ok' : ''}">${COND[l.condition]}</span><span class="pill">${(CATS[l.category] || CATS.other)[0]}</span>${rank(l) ? '<span class="pill gold">מקודם</span>' : ''}</div>
      <h1>${esc(l.title)}</h1>
      <div class="bigprice">${price(l.price)}</div>
      <div class="meta"><span>${ic('map-pin', 16, '#5B6576', 2)} ${esc(l.city)}</span><span>${ic('clock', 16, '#5B6576', 2)} ${ago(l.created_at)}</span><span>${ic('eye', 16, '#5B6576', 2)} ${l.views === 1 ? 'צפייה אחת' : `${l.views} צפיות`}</span></div>
      ${l.description ? `<div class="desc">${esc(l.description)}</div>` : ''}
      <a class="seller" href="${sel.id ? '#/user/' + sel.id : '#/'}" style="color:inherit"><span class="av">${initial(sel.display_name)}</span><span><b>${esc(sel.display_name)}</b><br><span class="hint">${sel.city ? esc(sel.city) + ' · ' : ''}באתר מ-${new Date(sel.created_at).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</span></span></a>
      ${mine ? `<div class="row-actions">
        <a class="btn btn-gold" href="#/promote/${l.id}">${ic('bolt', 18, '#0F172A', 2.2)}קדם מודעה</a>
        <a class="btn btn-o" href="#/edit/${l.id}">${ic('edit', 18)}עריכה</a>
        ${l.status === 'active' ? `<button class="btn btn-g" id="sold">${ic('check', 18)}סמן כנמכר</button>` : l.status === 'sold' ? `<button class="btn btn-g" id="unsold">${ic('refresh', 18)}החזר למכירה</button>` : ''}
        <button class="btn btn-d" id="del">${ic('trash', 18)}מחיקה</button></div>`
      : l.status === 'active' ? `<button class="btn btn-p w100 sq" id="contact" style="min-height:54px;font-size:18px">${ic('message', 22, '#fff', 2)}שלח הודעה למוכר</button>` : ''}
      <div class="tip">${ic('shield-check', 18, '#7A5300', 2)} <b>קנייה בטוחה:</b> תיפגשו במקום ציבורי, תבדקו את המוצר לפני התשלום, ואל תעבירו כסף מראש למי שלא הכרתם. <a href="#/safety">עוד טיפים</a></div>
      <p class="hint" style="margin:0">המודעה פורסמה על ידי משתמש. TradeNow מספק את הפלטפורמה בלבד ואינו צד לעסקה. מוכר שהוא עסק חייב לפעול לפי חוק הגנת הצרכן.</p>
      ${!mine ? `<button class="btn btn-g" id="report" style="align-self:flex-start">${ic('flag', 16)}דיווח על המודעה</button>` : ''}
    </div></div>`;
  V.querySelectorAll('.gthumbs button').forEach(b => b.onclick = () => { document.getElementById('gmain').innerHTML = `<img src="${bigUrl(imgs[+b.dataset.i])}" ${imgFallback(imgs[+b.dataset.i])} alt="${esc(l.title)}">`; V.querySelectorAll('.gthumbs button').forEach(x => x.setAttribute('aria-current', x === b)); });
  const c = document.getElementById('contact');
  if (c) c.onclick = async () => {
    if (needLogin()) return;
    c.disabled = true;
    let { data: conv } = await sb.from('conversations').select('id').eq('listing_id', l.id).eq('buyer_id', S.user.id).maybeSingle();
    if (!conv) { const r = await sb.from('conversations').insert({ listing_id: l.id, buyer_id: S.user.id, seller_id: l.seller_id }).select('id').single(); if (r.error) { c.disabled = false; toast('לא הצלחנו לפתוח שיחה'); return; } conv = r.data; }
    go('#/chat/' + conv.id);
  };
  const setStatus = async st => { const { error } = await sb.from('listings').update({ status: st }).eq('id', l.id); if (error) toast('לא נשמר'); else { toast(st === 'sold' ? 'סומן כנמכר. מזל טוב!' : 'המודעה חזרה למכירה'); route(); } };
  const sd = document.getElementById('sold'); if (sd) sd.onclick = () => setStatus('sold');
  const us = document.getElementById('unsold'); if (us) us.onclick = () => setStatus('active');
  const dl = document.getElementById('del'); if (dl) dl.onclick = () => {
    const m = modal(`<h2 style="margin-top:0">למחוק את המודעה?</h2><p>אי אפשר לבטל את זה. גם השיחות על המודעה יימחקו.</p><div class="row-actions"><button class="btn btn-d" id="yes">כן, למחוק</button><button class="btn btn-g" id="no">ביטול</button></div>`);
    m.querySelector('#no').onclick = closeModal;
    m.querySelector('#yes').onclick = async () => { const { error } = await sb.from('listings').delete().eq('id', l.id); if (error) { toast('המחיקה נכשלה'); return; } if (imgs.length) sb.storage.from('listing-images').remove(imgs).then(() => { }); closeModal(); toast('המודעה נמחקה'); go('#/me'); };
  };
  const rp = document.getElementById('report'); if (rp) rp.onclick = () => {
    if (needLogin()) return;
    const m = modal(`<h2 style="margin-top:0">דיווח על מודעה</h2><div class="field"><label for="rr">מה הבעיה?</label><textarea id="rr" class="inp" maxlength="300" placeholder="למשל: הונאה, מוצר אסור, מודעה כפולה"></textarea></div><div class="row-actions"><button class="btn btn-p" id="send">שליחה</button><button class="btn btn-g" id="no">ביטול</button></div>`);
    m.querySelector('#no').onclick = closeModal;
    m.querySelector('#send').onclick = async () => { const reason = m.querySelector('#rr').value.trim(); if (reason.length < 2) { toast('כתוב בקצרה מה הבעיה'); return; } const { error } = await sb.from('reports').insert({ listing_id: l.id, reporter_id: S.user.id, reason }); closeModal(); toast(error ? 'הדיווח לא נשלח' : 'תודה! הדיווח הועבר לבדיקה'); };
  };
}

async function compress(file) {
  const bmp = await createImageBitmap(file);
  const sc = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
}

async function pSell(editId, id) {
  if (needLogin()) return;
  let l = null;
  if (editId) { loading(); const r = await sb.from('listings').select('*').eq('id', editId).maybeSingle(); if (stale(id)) return; l = r.data; if (!l || l.seller_id !== S.user.id) { V.innerHTML = `<div class="empty"><h3>אין לך הרשאה לערוך את המודעה הזו</h3></div>`; return; } }
  const st = { existing: l ? [...l.images] : [], files: [], cond: l ? l.condition : '' };
  V.innerHTML = `<div style="max-width:760px;margin:0 auto"><h1 style="margin:0 0 6px">${l ? 'עריכת מודעה' : 'פרסום מוצר'}</h1><p class="hint" style="margin:0 0 18px">${l ? 'משנים מה שצריך ושומרים.' : 'בחינם. ממלאים פרטים, מעלים תמונות, וזה באוויר.'}</p>
  <form id="sf" class="panel" novalidate>
    <div class="field"><span class="lbl">תמונות (עד 8)</span>
      <label class="upbox" for="pics">${ic('photo', 44, '#0A64E8')}הוספת תמונות<span class="hint" style="font-weight:400">התמונה הראשונה תהיה התמונה הראשית</span></label>
      <input id="pics" type="file" accept="image/*" multiple class="sr"><div id="thumbs" class="thumbs"></div></div>
    <div class="field"><label for="t">שם המוצר</label><input id="t" class="inp" maxlength="80" placeholder="למשל: אופניים חשמליים כמו חדשים" value="${esc(l?.title || '')}"></div>
    <div class="two"><div class="field"><label for="c">קטגוריה</label><select id="c" class="inp"><option value="">בחר קטגוריה</option>${Object.entries(CATS).map(([k, [t]]) => `<option value="${k}" ${l?.category === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label for="p">מחיר (₪)</label><input id="p" class="inp" type="number" min="0" inputmode="numeric" placeholder="0 = חינם" value="${l ? l.price : ''}"></div></div>
    <div class="field"><span class="lbl" id="condl">מצב המוצר</span><div class="seg" role="group" aria-labelledby="condl">${Object.entries(COND).map(([k, t]) => `<button type="button" data-c="${k}" aria-pressed="${st.cond === k}">${t}</button>`).join('')}</div></div>
    <div class="field"><label for="city">עיר</label><input id="city" class="inp" maxlength="40" placeholder="איפה המוצר נמצא?" value="${esc(l?.city || S.profile?.city || '')}"></div>
    <div class="field"><label for="d">תיאור</label><textarea id="d" class="inp" maxlength="2000" placeholder="מצב, מה כלול, למה מוכרים...">${esc(l?.description || '')}</textarea></div>
    <div id="ferr" class="err" role="alert"></div>
    <button class="btn btn-p w100 sq" id="sbtn" type="submit" style="min-height:54px;font-size:18px">${l ? 'שמירת שינויים' : 'פרסום המודעה'}</button>
    <p class="hint" style="text-align:center">בפרסום אתה מאשר את <a href="#/terms">התקנון</a>, שהמוצר מותר למכירה, ושהתמונות שלך או שיש לך רשות להשתמש בהן.</p>
  </form></div>`;
  const th = document.getElementById('thumbs');
  const drawThumbs = () => {
    const all = [...st.existing.map(p => ({ src: imgUrl(p), kind: 'e', key: p })), ...st.files.map((f, i) => ({ src: f.url, kind: 'f', key: i }))];
    th.innerHTML = all.map((x, i) => `<div class="thumb"><img src="${x.src}" alt=""><button type="button" data-k="${x.kind}" data-key="${esc(String(x.key))}" aria-label="הסרת תמונה">${ic('x', 18, '#fff', 2.4)}</button>${i === 0 ? '<span class="first">ראשית</span>' : ''}</div>`).join('');
    th.querySelectorAll('button').forEach(b => b.onclick = () => { if (b.dataset.k === 'e') st.existing = st.existing.filter(p => p !== b.dataset.key); else st.files.splice(+b.dataset.key, 1); drawThumbs(); });
  };
  drawThumbs();
  document.getElementById('pics').onchange = async e => {
    const fs = [...e.target.files]; e.target.value = '';
    for (const f of fs) {
      if (st.existing.length + st.files.length >= 8) { toast('אפשר עד 8 תמונות'); break; }
      if (!f.type.startsWith('image/')) continue;
      try { const b = await compress(f); st.files.push({ blob: b, url: URL.createObjectURL(b) }); } catch (err) { toast('לא הצלחנו לקרוא את אחת התמונות'); }
    }
    drawThumbs();
  };
  V.querySelectorAll('.seg button').forEach(b => b.onclick = () => { st.cond = b.dataset.c; V.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  document.getElementById('sf').onsubmit = async e => {
    e.preventDefault();
    const v = x => document.getElementById(x).value.trim();
    const errEl = document.getElementById('ferr');
    const title = v('t'), cat = v('c'), pr = v('p'), city = v('city'), desc = v('d');
    const problems = [];
    if (title.length < 2) problems.push('שם המוצר'); if (!cat) problems.push('קטגוריה'); if (pr === '' || isNaN(+pr) || +pr < 0) problems.push('מחיר'); if (!st.cond) problems.push('מצב המוצר'); if (city.length < 2) problems.push('עיר');
    if (problems.length) { errEl.textContent = 'חסר: ' + problems.join(', '); return; }
    if (!st.existing.length && !st.files.length) { errEl.textContent = 'כדאי להוסיף לפחות תמונה אחת. מודעות עם תמונה נמכרות הרבה יותר מהר.'; if (!errEl.dataset.warned) { errEl.dataset.warned = 1; return; } }
    errEl.textContent = '';
    const btn = document.getElementById('sbtn'); btn.disabled = true; btn.textContent = 'מעלה...';
    const uploaded = [];
    try {
      for (const f of st.files) {
        const path = `${S.user.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from('listing-images').upload(path, f.blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (error) throw error; uploaded.push(path);
      }
      const row = { title, category: cat, price: Math.round(+pr), condition: st.cond, city, description: desc, images: [...st.existing, ...uploaded] };
      let res;
      if (l) res = await sb.from('listings').update(row).eq('id', l.id).select('id').single();
      else res = await sb.from('listings').insert({ ...row, seller_id: S.user.id }).select('id').single();
      if (res.error) throw res.error;
      if (l) { const removed = l.images.filter(p => !st.existing.includes(p)); if (removed.length) sb.storage.from('listing-images').remove(removed).then(() => { }); }
      if (!S.profile?.city) sb.from('profiles').update({ city }).eq('id', S.user.id).then(() => { });
      toast(l ? 'השינויים נשמרו' : 'המודעה באוויר!');
      go('#/item/' + res.data.id);
    } catch (err) {
      console.error(err); if (uploaded.length) sb.storage.from('listing-images').remove(uploaded).then(() => { });
      errEl.textContent = 'לא הצלחנו לשמור. בדוק את החיבור ונסה שוב.'; btn.disabled = false; btn.textContent = l ? 'שמירת שינויים' : 'פרסום המודעה';
    }
  };
}

async function pMessages(_, id) {
  if (needLogin()) return;
  loading();
  const { data } = await sb.from('conversations').select('*, listing:listings(id,title,images,price,status), buyer:profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name)').order('last_message_at', { ascending: false });
  if (stale(id)) return;
  const list = data || [];
  V.innerHTML = `<div style="max-width:760px;margin:0 auto"><h1 style="margin:0 0 16px">הודעות</h1>
  ${list.length ? `<div class="convs">${list.map(c => { const other = c.buyer_id === S.user.id ? c.seller : c.buyer; const img = c.listing?.images?.[0]; return `<a class="conv" href="#/chat/${c.id}">${img ? `<img loading="lazy" src="${thumbUrl(img)}" ${imgFallback(img)} alt="">` : '<span class="ph0"></span>'}<span style="flex:1;min-width:0"><b>${esc(other?.display_name)}</b> · <span class="hint">${c.buyer_id === S.user.id ? 'אתה קונה' : 'אתה מוכר'}</span><br><span class="hint">${esc(c.listing?.title || 'מודעה שנמחקה')} · ${ago(c.last_message_at)}</span></span>${ic('chevron-left', 20, '#94A3B8')}</a>`; }).join('')}</div>`
      : `<div class="panel empty">${ic('message', 48, '#94A3B8')}<h3>עוד אין הודעות</h3><p>כשתשלח הודעה למוכר, או שמישהו יכתוב לך על מוצר, השיחה תופיע כאן.</p><a class="btn btn-p" href="#/">לגלוש במוצרים</a></div>`}</div>`;
}

async function pChat(cid, id) {
  if (needLogin()) return;
  loading();
  const { data: c } = await sb.from('conversations').select('*, listing:listings(id,title,images,price), buyer:profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name)').eq('id', cid).maybeSingle();
  if (stale(id)) return;
  if (!c) { V.innerHTML = `<div class="empty"><h3>השיחה לא נמצאה</h3><a class="btn btn-p" href="#/messages">לכל ההודעות</a></div>`; return; }
  const other = c.buyer_id === S.user.id ? c.seller : c.buyer;
  const img = c.listing?.images?.[0];
  V.innerHTML = `<div style="max-width:820px;margin:0 auto"><div class="chatwrap">
  <div class="chathead"><a href="#/messages" aria-label="חזרה">${ic('arrow-right', 24, '#334155')}</a><span class="av" style="width:40px;height:40px;font-size:17px">${initial(other?.display_name)}</span><b>${esc(other?.display_name)}</b>
  ${c.listing ? `<a class="mini" href="#/item/${c.listing.id}">${img ? `<img src="${thumbUrl(img)}" ${imgFallback(img)} alt="">` : '<span class="ph0"></span>'}<span><b>${esc(c.listing.title)}</b><br>${price(c.listing.price)}</span></a>` : ''}</div>
  <div class="msgs" id="msgs" aria-live="polite"></div>
  <form class="chatform" id="cf"><label for="mi" class="sr">הודעה</label><input id="mi" class="inp" maxlength="1000" placeholder="כתוב הודעה..." autocomplete="off"><button class="btn btn-p" aria-label="שליחה" style="padding:0 16px">${ic('send', 20, '#fff', 2)}</button></form></div>
  <p class="hint" style="text-align:center">אל תעבירו כסף מראש ואל תשתפו פרטי אשראי בצ׳אט.</p></div>`;
  const box = document.getElementById('msgs'); const seen = new Set();
  const add = m => { if (seen.has(m.id)) return; seen.add(m.id); const d = document.createElement('div'); d.className = 'bub ' + (m.sender_id === S.user.id ? 'me' : 'them'); d.innerHTML = `${esc(m.body)}<small>${new Date(m.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</small>`; box.appendChild(d); box.scrollTop = box.scrollHeight; };
  const { data: msgs } = await sb.from('messages').select('*').eq('conversation_id', cid).order('created_at').limit(500);
  if (stale(id)) return;
  (msgs || []).forEach(add);
  if (!(msgs || []).length) box.innerHTML = `<div class="hint" style="text-align:center;margin:auto" id="first">${c.buyer_id === S.user.id ? 'כתוב למוכר, למשל: "היי, זה עדיין זמין?"' : 'עוד אין הודעות בשיחה'}</div>`;
  S.channel = sb.channel('conv-' + cid).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${cid}` }, p => addT(p.new)).subscribe();
  let lastAt = (msgs && msgs.length) ? msgs[msgs.length - 1].created_at : '1970-01-01T00:00:00Z';
  const addT = m => { if (m.created_at > lastAt) lastAt = m.created_at; const f = document.getElementById('first'); if (f) f.remove(); add(m); };
  S.poll = setInterval(async () => { if (document.hidden) return; const { data: nm } = await sb.from('messages').select('*').eq('conversation_id', cid).gt('created_at', lastAt).order('created_at'); if (stale(id)) return; (nm || []).forEach(addT); }, 4000);
  const mi = document.getElementById('mi');
  document.getElementById('cf').onsubmit = async e => {
    e.preventDefault(); const body = mi.value.trim(); if (!body) return; mi.value = '';
    const { data, error } = await sb.from('messages').insert({ conversation_id: cid, sender_id: S.user.id, body }).select().single();
    if (error) { toast('ההודעה לא נשלחה'); mi.value = body; return; }
    addT(data);
  };
  mi.focus();
}

async function pMe(_, id) {
  if (needLogin()) return;
  loading();
  const { data } = await sb.from('listings').select('*').eq('seller_id', S.user.id).order('created_at', { ascending: false });
  if (stale(id)) return;
  const list = data || []; const p = S.profile || {};
  const act = list.filter(l => l.status === 'active').length, sold = list.filter(l => l.status === 'sold').length;
  V.innerHTML = `<div class="layout">
  <aside class="side panel">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><span class="av" style="width:60px;height:60px;font-size:26px">${initial(p.display_name)}</span><div><b style="font-size:20px">${esc(p.display_name)}</b><br><span class="hint">${esc(S.user.email)}</span></div></div>
    <div class="stats" style="grid-template-columns:1fr 1fr;margin-bottom:16px"><div class="stat"><b>${act}</b><span>פעילות</span></div><div class="stat"><b>${sold}</b><span>נמכרו</span></div></div>
    <form id="pf"><div class="field"><label for="pn">שם לתצוגה</label><input id="pn" class="inp" maxlength="40" value="${esc(p.display_name || '')}"></div>
    <div class="field"><label for="pc">עיר</label><input id="pc" class="inp" maxlength="40" value="${esc(p.city || '')}"></div>
    <button class="btn btn-g w100">שמירת פרטים</button></form>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
      <a class="btn btn-o" href="#/messages">${ic('message', 18)}ההודעות שלי</a>
      ${S.admin ? `<a class="btn btn-gold" href="#/admin">${ic('chart-bar', 18, '#0F172A')}ניהול האתר</a>` : ''}
      <button class="btn btn-g" id="lo">${ic('logout', 18)}התנתקות</button></div>
  </aside>
  <section class="mainc"><div class="sech"><h1 style="margin:0;font-size:24px">המודעות שלי</h1><a class="btn btn-p" href="#/sell">${ic('plus', 18, '#fff', 2.6)}מודעה חדשה</a></div>
  ${list.length ? grid(list) : `<div class="panel empty">${ic('tag', 48, '#94A3B8')}<h3>עוד לא פרסמת מודעות</h3><p>יש לך משהו שאתה כבר לא צריך? זה הזמן.</p><a class="btn btn-p" href="#/sell">לפרסם מוצר</a></div>`}
  ${list.length ? '<p class="hint">לחיצה על מודעה פותחת אותה. משם אפשר לערוך, לקדם, לסמן כנמכר או למחוק.</p>' : ''}</section></div>`;
  document.getElementById('pf').onsubmit = async e => { e.preventDefault(); const dn = document.getElementById('pn').value.trim(), city = document.getElementById('pc').value.trim(); if (!dn) { toast('צריך שם לתצוגה'); return; } const { error } = await sb.from('profiles').update({ display_name: dn, city: city || null }).eq('id', S.user.id); if (error) toast('לא נשמר'); else { toast('הפרטים נשמרו'); await loadMe(); } };
  document.getElementById('lo').onclick = async () => { await sb.auth.signOut(); toast('התנתקת'); go('#/'); };
}

async function pUser(uid, id) {
  loading();
  const [{ data: p }, { data: list }] = await Promise.all([sb.from('profiles').select('*').eq('id', uid).maybeSingle(), sb.from('listings').select('*').eq('seller_id', uid).eq('status', 'active').order('created_at', { ascending: false })]);
  if (stale(id)) return;
  if (!p) { V.innerHTML = `<div class="empty"><h3>המשתמש לא נמצא</h3></div>`; return; }
  V.innerHTML = `<div class="panel" style="display:flex;align-items:center;gap:14px;margin-bottom:20px"><span class="av" style="width:64px;height:64px;font-size:28px">${initial(p.display_name)}</span><div><h1 style="margin:0;font-size:24px">${esc(p.display_name)}</h1><span class="hint">${p.city ? esc(p.city) + ' · ' : ''}באתר מ-${new Date(p.created_at).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })} · ${(list || []).length} מודעות פעילות</span></div></div>
  ${(list || []).length ? grid(sortRanked(list)) : '<div class="panel empty"><h3>אין מודעות פעילות כרגע</h3></div>'}`;
}

const PLANS = [
  { id: 'boost', name: 'קידום מודעה', price: 9, days: 7, perks: ['תגית "מקודם" ומסגרת בולטת', 'מופיעה גבוה יותר בחיפוש ובדף הבית'] },
  { id: 'top', name: 'מקום בראש הדף', price: 16, days: 3, perks: ['בראש התוצאות ובדף הבית', 'כולל את כל מה שיש בקידום רגיל'] },
  { id: 'store', name: 'קידום חנות', price: 23, days: 14, perks: ['כל המודעות שלך מקודמות', 'לעסקים עם כמה מוצרים'], soon: true }];
async function pPromote(lid, id) {
  if (needLogin()) return;
  loading();
  const { data: l } = await sb.from('listings').select('*').eq('id', lid).maybeSingle();
  if (stale(id)) return;
  if (!l || l.seller_id !== S.user.id) { V.innerHTML = `<div class="empty"><h3>אפשר לקדם רק מודעה שלך</h3></div>`; return; }
  let sel = null;
  const draw = () => {
    const p = PLANS.find(x => x.id === sel);
    V.innerHTML = `<div style="max-width:900px;margin:0 auto"><h1 style="margin:0 0 4px">איך לקדם את המודעה?</h1><p class="hint" style="margin:0 0 16px">תשלום חד-פעמי. אין מנוי ואין חידוש אוטומטי.</p>
    <div class="panel" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px">${l.images[0] ? `<img src="${thumbUrl(l.images[0])}" ${imgFallback(l.images[0])} alt="" style="width:64px;height:64px;border-radius:12px;object-fit:cover">` : ''}<span><span class="hint">המודעה שתקודם</span><br><b>${esc(l.title)} · ${price(l.price)}</b></span>
    ${rank(l) ? `<span class="pill gold" style="margin-right:auto">מקודמת עד ${new Date(l.top_until && new Date(l.top_until) > new Date(l.promoted_until || 0) ? l.top_until : l.promoted_until).toLocaleDateString('he-IL')}</span>` : ''}</div>
    <div class="plans" role="radiogroup" aria-label="סוג קידום">${PLANS.map(x => `<button type="button" class="plan" role="radio" aria-checked="${x.id === sel}" data-p="${x.id}" ${x.soon ? 'disabled' : ''}><b style="font-size:19px">${x.name}${x.soon ? ' · בקרוב' : ''}</b><span class="pp">₪${x.price}</span><span class="hint">ל-${x.days} ימים</span><ul>${x.perks.map(k => `<li>${k}</li>`).join('')}</ul></button>`).join('')}</div>
    ${p ? `<div class="panel" style="margin-top:16px"><h2 style="margin-top:0;font-size:20px">סיכום לפני תשלום</h2>
      <p style="margin:0 0 8px"><b>${p.name}</b> ל-${p.days} ימים · מתחיל מיד אחרי אישור התשלום · <b>סה"כ ₪${p.price}</b></p>
      <ul class="hint" style="margin:0 0 12px"><li>חיוב אחד בלבד. אין חידוש אוטומטי.</li><li>ביטול: אפשר לבטל תוך 14 יום מהרכישה, בפנייה דרך <a href="#/contact">צור קשר</a>, ולקבל החזר יחסי לזמן שנשאר בניכוי דמי ביטול של עד 5% או 100 ₪ (הנמוך מביניהם), כפי שמותר בחוק. <a href="#/terms">פרטים בתקנון</a>.</li><li>המחיר הוא המחיר הסופי לתשלום.</li></ul>${bizFilled() ? `<p class="hint" style="margin:0 0 12px">מפעיל האתר: ${esc(BIZ.name)} · עוסק ${esc(BIZ.id)} · ${esc(BIZ.address)}</p>` : ''}
      <div class="banner info" style="display:flex;gap:8px;align-items:flex-start">${ic('info-circle', 20, '#0A4FB8', 2)}<span>התשלום באתר ייפתח בקרוב. בינתיים אפשר לבקש קידום בעמוד <a href="#/contact">צור קשר</a>.</span></div>
      <button class="btn btn-p" disabled style="margin-top:12px">לתשלום ₪${p.price}</button></div>` : ''}</div>`;
    V.querySelectorAll('.plan').forEach(b => b.onclick = () => { if (b.disabled) return; sel = b.dataset.p; draw(); });
  };
  draw();
}

async function pLogin() {
  if (S.user) { go(decodeURIComponent(qparams().next || '#/me')); return; }
  const next = decodeURIComponent(qparams().next || '#/');
  let mode = 'in';
  const draw = () => {
    V.innerHTML = `<div style="max-width:440px;margin:10px auto"><div class="panel">
    <div class="seg" style="margin-bottom:18px"><button type="button" data-m="in" aria-pressed="${mode === 'in'}">התחברות</button><button type="button" data-m="up" aria-pressed="${mode === 'up'}">הרשמה</button></div>
    <h1 style="margin:0 0 14px;font-size:26px">${mode === 'in' ? 'ברוך שובך' : 'פתיחת חשבון'}</h1>
    <form id="af">${mode === 'up' ? `<div class="field"><label for="an">שם לתצוגה</label><input id="an" class="inp" maxlength="40" autocomplete="nickname" placeholder="איך יקראו לך באתר"></div>` : ''}
    <div class="field"><label for="ae">אימייל</label><input id="ae" class="inp" type="email" autocomplete="email" dir="ltr"></div>
    <div class="field"><label for="ap">סיסמה</label><input id="ap" class="inp" type="password" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" dir="ltr">${mode === 'up' ? '<span class="hint">לפחות 8 תווים</span>' : ''}</div>
    ${mode === 'up' ? `<label style="display:flex;gap:10px;align-items:flex-start;margin-bottom:14px"><input type="checkbox" id="aok" style="width:20px;height:20px;margin-top:2px"><span>אני בן/בת 18 ומעלה ומסכים/ה ל<a href="#/terms">תקנון</a> ול<a href="#/privacy">מדיניות הפרטיות</a></span></label>` : ''}
    <div id="aerr" class="err" role="alert"></div>
    <button class="btn btn-p w100 sq" id="abtn">${mode === 'in' ? 'התחברות' : 'הרשמה'}</button></form>
    ${mode === 'in' ? '<button class="btn btn-g w100" id="forgot" style="margin-top:10px;border:0">שכחתי סיסמה</button>' : ''}</div></div>`;
    V.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    const fg = document.getElementById('forgot'); if (fg) fg.onclick = async () => { const em = document.getElementById('ae').value.trim(); if (!em) { document.getElementById('aerr').textContent = 'כתוב קודם את האימייל שלך'; return; } await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/' }); toast('אם המייל רשום, שלחנו קישור לאיפוס'); };
    document.getElementById('af').onsubmit = async e => {
      e.preventDefault();
      const em = document.getElementById('ae').value.trim(), pw = document.getElementById('ap').value, err = document.getElementById('aerr'), btn = document.getElementById('abtn');
      if (!em || !pw) { err.textContent = 'מלא אימייל וסיסמה'; return; }
      btn.disabled = true;
      if (mode === 'in') {
        const { error } = await sb.auth.signInWithPassword({ email: em, password: pw });
        if (error) { err.textContent = errMsg(error); btn.disabled = false; return; }
        toast('התחברת'); go(next);
      } else {
        const name = document.getElementById('an').value.trim();
        if (!name) { err.textContent = 'בחר שם לתצוגה'; btn.disabled = false; return; }
        if (!document.getElementById('aok').checked) { err.textContent = 'צריך לאשר את התקנון'; btn.disabled = false; return; }
        if (pw.length < 8) { err.textContent = 'הסיסמה צריכה להיות לפחות 8 תווים'; btn.disabled = false; return; }
        const { data, error } = await sb.auth.signUp({ email: em, password: pw, options: { data: { display_name: name }, emailRedirectTo: location.origin + '/' } });
        if (error) { err.textContent = errMsg(error); btn.disabled = false; return; }
        if (data.session) { toast('ברוך הבא ל-TradeNow!'); go(next); }
        else V.innerHTML = `<div class="panel empty" style="max-width:520px;margin:20px auto">${ic('mail', 52, '#0A64E8')}<h3>כמעט סיימנו!</h3><p>שלחנו מייל ל-<b dir="ltr">${esc(em)}</b>.<br>לחץ על הקישור שבמייל כדי לאשר את החשבון, ואז התחבר.</p><p class="hint">לא מוצא? בדוק בתיקיית הספאם.</p><a class="btn btn-p" href="#/login">להתחברות</a></div>`;
      }
    };
  };
  draw();
}

async function pReset() {
  if (!S.user) { V.innerHTML = `<div class="panel empty" style="max-width:480px;margin:20px auto"><h3>הקישור לא תקף</h3><p>בקש קישור חדש מעמוד ההתחברות.</p><a class="btn btn-p" href="#/login">להתחברות</a></div>`; return; }
  V.innerHTML = `<div style="max-width:440px;margin:10px auto" class="panel"><h1 style="margin-top:0;font-size:24px">סיסמה חדשה</h1><form id="rf"><div class="field"><label for="np">סיסמה חדשה</label><input id="np" class="inp" type="password" autocomplete="new-password" dir="ltr"></div><div id="rerr" class="err"></div><button class="btn btn-p w100">שמירה</button></form></div>`;
  document.getElementById('rf').onsubmit = async e => { e.preventDefault(); const np = document.getElementById('np').value; if (np.length < 8) { document.getElementById('rerr').textContent = 'לפחות 8 תווים'; return; } const { error } = await sb.auth.updateUser({ password: np }); if (error) document.getElementById('rerr').textContent = errMsg(error); else { toast('הסיסמה עודכנה'); go('#/me'); } };
}

async function pAdmin(_, id) {
  if (needLogin()) return;
  if (!S.admin) { V.innerHTML = `<div class="empty">${ic('lock', 48, '#94A3B8')}<h3>האזור הזה רק למנהל האתר</h3></div>`; return; }
  loading();
  const [st, tops, recent, reps, contacts] = await Promise.all([
    sb.rpc('admin_stats'), sb.rpc('top_searches', { days: 30, lim: 15 }),
    sb.from('listings').select('*, seller:profiles!listings_seller_id_fkey(display_name)').order('created_at', { ascending: false }).limit(60),
    sb.from('reports').select('*, listing:listings(id,title)').eq('handled', false).order('created_at', { ascending: false }),
    sb.from('contact_messages').select('*').eq('handled', false).order('created_at', { ascending: false })]);
  if (stale(id)) return;
  const s = st.data || {};
  const stat = (v, t) => `<div class="stat"><b>${v ?? 0}</b><span>${t}</span></div>`;
  V.innerHTML = `<h1 style="margin:0 0 16px">ניהול האתר</h1>
  <div class="stats">${stat(s.users, 'משתמשים')}${stat(s.users_7d, 'נרשמו השבוע')}${stat(s.listings_active, 'מודעות פעילות')}${stat(s.listings_7d, 'מודעות השבוע')}${stat(s.sold, 'נמכרו')}${stat(s.messages_7d, 'הודעות השבוע')}${stat(s.searches_7d, 'חיפושים השבוע')}${stat(s.open_reports, 'דיווחים פתוחים')}</div>
  <div class="layout" style="margin-top:20px">
    <section class="panel" style="flex:1 1 300px"><h2 style="margin-top:0;font-size:19px">מה אנשים מחפשים (30 יום)</h2>${(tops.data || []).length ? `<table class="tbl" style="min-width:0"><tbody>${tops.data.map(t => `<tr><td>${esc(t.query)}</td><td style="text-align:left"><b>${t.total}</b></td></tr>`).join('')}</tbody></table>` : '<p class="hint">עוד אין מספיק חיפושים. חיפוש מופיע כאן אחרי שחיפשו אותו לפחות פעמיים.</p>'}</section>
    <section class="panel" style="flex:1 1 300px"><h2 style="margin-top:0;font-size:19px">דיווחים פתוחים</h2>${(reps.data || []).length ? reps.data.map(r => `<div style="border-bottom:1px solid var(--line);padding:10px 0"><a href="#/item/${r.listing?.id}"><b>${esc(r.listing?.title || 'מודעה')}</b></a><br><span>${esc(r.reason)}</span><br><span class="hint">${ago(r.created_at)}</span> <button class="btn btn-g" data-rep="${r.id}" style="min-height:34px;padding:4px 12px;margin-top:6px">טופל</button></div>`).join('') : '<p class="hint">אין דיווחים פתוחים.</p>'}</section>
    <section class="panel" style="flex:1 1 300px"><h2 style="margin-top:0;font-size:19px">פניות מ"צור קשר"</h2>${(contacts.data || []).length ? contacts.data.map(c => `<div style="border-bottom:1px solid var(--line);padding:10px 0"><b>${esc(c.name)}</b> · <span dir="ltr">${esc(c.reply_to)}</span><br><span style="white-space:pre-wrap">${esc(c.body)}</span><br><span class="hint">${ago(c.created_at)}</span> <button class="btn btn-g" data-con="${c.id}" style="min-height:34px;padding:4px 12px;margin-top:6px">טופל</button></div>`).join('') : '<p class="hint">אין פניות חדשות.</p>'}</section>
  </div>
  <section class="panel" style="margin-top:20px"><h2 style="margin-top:0;font-size:19px">מודעות אחרונות</h2><p class="hint">מכאן אפשר להסיר מודעה בעייתית, או לתת קידום ידנית (למשל למי ששילם לך בביט עד שהתשלום באתר ייפתח).</p>
  <div class="scrollx"><table class="tbl"><thead><tr><th>מודעה</th><th>מוכר</th><th>מחיר</th><th>מצב</th><th>קידום</th><th>פעולות</th></tr></thead><tbody>
  ${(recent.data || []).map(l => `<tr><td><a href="#/item/${l.id}">${esc(l.title)}</a><br><span class="hint">${ago(l.created_at)}</span></td><td>${esc(l.seller?.display_name)}</td><td>${price(l.price)}</td>
  <td><span class="pill ${l.status === 'active' ? 'ok' : l.status === 'removed' ? 'bad' : ''}">${{ active: 'פעילה', sold: 'נמכרה', removed: 'הוסרה' }[l.status]}</span></td>
  <td>${isTop(l) ? '<span class="pill gold">בראש</span>' : isPromo(l) ? '<span class="pill gold">מקודמת</span>' : '–'}</td>
  <td style="white-space:nowrap"><button class="btn btn-g" data-boost="${l.id}" style="min-height:34px;padding:4px 10px">+7 ימי קידום</button> <button class="btn btn-g" data-top="${l.id}" style="min-height:34px;padding:4px 10px">+3 ימים בראש</button> ${l.status === 'removed' ? `<button class="btn btn-g" data-restore="${l.id}" style="min-height:34px;padding:4px 10px">החזרה</button>` : `<button class="btn btn-d" data-remove="${l.id}" style="min-height:34px;padding:4px 10px">הסרה</button>`}</td></tr>`).join('')}
  </tbody></table></div></section>`;
  const upd = async (lid, row, msg) => { const { error } = await sb.from('listings').update(row).eq('id', lid); toast(error ? 'הפעולה נכשלה' : msg); if (!error) route(); };
  const plus = (base, d) => new Date(Math.max(Date.now(), base ? new Date(base).getTime() : 0) + d * 864e5).toISOString();
  const rows = recent.data || [];
  V.querySelectorAll('[data-boost]').forEach(b => b.onclick = () => { const l = rows.find(x => x.id === b.dataset.boost); upd(l.id, { promoted_until: plus(l.promoted_until, 7) }, 'נוספו 7 ימי קידום'); });
  V.querySelectorAll('[data-top]').forEach(b => b.onclick = () => { const l = rows.find(x => x.id === b.dataset.top); upd(l.id, { top_until: plus(l.top_until, 3) }, 'נוספו 3 ימים בראש הדף'); });
  V.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => upd(b.dataset.remove, { status: 'removed' }, 'המודעה הוסרה מהאתר'));
  V.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => upd(b.dataset.restore, { status: 'active' }, 'המודעה הוחזרה'));
  V.querySelectorAll('[data-rep]').forEach(b => b.onclick = async () => { await sb.from('reports').update({ handled: true }).eq('id', b.dataset.rep); route(); });
  V.querySelectorAll('[data-con]').forEach(b => b.onclick = async () => { await sb.from('contact_messages').update({ handled: true }).eq('id', b.dataset.con); route(); });
}

function prose(html) { V.innerHTML = `<article class="prose panel">${html}</article>`; }
function pTerms() {
  prose(`<h1>תקנון האתר</h1><p class="hint">${UPDATED}</p>
  <h2>1. מה זה TradeNow</h2><p>TradeNow הוא לוח מודעות מקוון שבו אנשים פרטיים ועסקים מפרסמים מוצרים, וקונים יוצרים איתם קשר. העסקה עצמה (המחיר, התשלום, המסירה ובדיקת המוצר) נעשית ישירות בין הקונה למוכר. TradeNow מספק את הפלטפורמה בלבד, אינו צד לעסקה, ואינו אחראי למוצרים, לתיאורם, למצבם, לחוקיותם או לתשלום ביניכם.</p>
  <h2>2. מי יכול להשתמש</h2><p>פתיחת חשבון ופרסום מודעות מותרים מגיל 18 ומעלה. אתם אחראים לשמור על הסיסמה שלכם ולכל מה שנעשה מהחשבון.</p>
  <h2>3. מה אסור לפרסם</h2><ul><li>כל מוצר שמכירתו אסורה או מוגבלת לפי החוק, כולל נשק ותחמושת, זיקוקים, סמים, תרופות מרשם, אלכוהול וטבק, מוצרים גנובים, מזויפים או שמפרים סימן מסחר.</li><li>בעלי חיים, תוכן למבוגרים, הימורים, תוכניות פירמידה ו"השקעות".</li><li>תמונות או טקסטים שאין לכם זכות להשתמש בהם (למשל תמונות שהועתקו מאתר אחר).</li><li>תוכן פוגעני, מטעה, מודעות כפולות, ומודעות שאינן למכירת מוצר אמיתי.</li><li>פרטים אישיים של אנשים אחרים.</li></ul>
  <h2>4. אחריות המפרסם</h2><p>המפרסם אחראי לכך שהמודעה נכונה, שהמוצר שלו ומותר למכירה, ושיש לו זכות בתמונות ובטקסט. מוכר שהוא עסק אחראי לעמוד בחובות שחלות עליו לפי חוק הגנת הצרכן, בין היתר הצגת מחיר כולל מע"מ, מסירת פרטי העסק וזכות הביטול של הקונה.</p>
  <h2>5. הסרת תוכן ודיווח</h2><p>אפשר לדווח על כל מודעה בכפתור "דיווח על המודעה", ובעלי זכויות יכולים לפנות דרך <a href="#/contact">צור קשר</a> בבקשה להסרת תוכן שמפר את זכויותיהם. נבדוק כל דיווח ונסיר תוכן שמפר את התקנון או את החוק. אנחנו רשאים להסיר מודעות ולחסום חשבונות שמפרים את התקנון.</p>
  <h2>6. רישיון לתוכן</h2><p>הזכויות בתוכן שאתם מפרסמים נשארות שלכם. בפרסום אתם מרשים ל-TradeNow להציג את המודעה והתמונות באתר ובקידום האתר, כל עוד המודעה פעילה.</p>
  <h2>7. קידום מודעות בתשלום</h2><p>קידום הוא שירות בתשלום חד-פעמי, למשך הזמן והמחיר שמוצגים לפני התשלום. אין מנוי ואין חידוש אוטומטי, ולא יתבצע חיוב בלי אישור מפורש שלכם.</p><p><b>ביטול:</b> אפשר לבטל רכישת קידום תוך 14 יום מיום הרכישה, בפנייה דרך <a href="#/contact">צור קשר</a> (בכתב). נחזיר את התשלום באופן יחסי לזמן הקידום שלא נוצל, בניכוי דמי ביטול של 5% מהמחיר או 100 ₪ (הנמוך מביניהם), ונבצע את ההחזר תוך 14 יום מקבלת הודעת הביטול, באותו אמצעי תשלום.</p>
  <h2>8. הגבלת אחריות</h2><p>השירות ניתן כמו שהוא (AS IS). ככל שהחוק מתיר, TradeNow לא יהיה אחראי לנזק שנגרם מעסקה בין משתמשים, ממידע במודעות או מהפסקות בשירות.</p>
  <h2>9. שינויים בתקנון</h2><p>אנחנו עשויים לעדכן את התקנון. תאריך העדכון האחרון מופיע בראש העמוד, ושינוי מהותי יפורסם באתר.</p>
  <h2>10. דין וסמכות שיפוט</h2><p>על התקנון חלים דיני מדינת ישראל, וסמכות השיפוט נתונה לבתי המשפט המוסמכים בישראל.</p>
  <h2>11. פרטי מפעיל האתר ופניות</h2>${bizBlock()}<p>לכל שאלה, בקשה, ביטול או תלונה, דרך עמוד <a href="#/contact">צור קשר</a>.</p>`);
}
function pPrivacy() {
  prose(`<h1>מדיניות פרטיות</h1><p class="hint">${UPDATED}</p>
  <p>המדיניות מסבירה איזה מידע נאסף ב-TradeNow, למה, ומה הזכויות שלכם לפי חוק הגנת הפרטיות.</p>
  <h2>איזה מידע נאסף ולמה</h2><ul><li><b>אימייל וסיסמה</b>: לפתיחת חשבון והתחברות. הסיסמה נשמרת מוצפנת ואיננו יכולים לראות אותה.</li><li><b>שם לתצוגה ועיר</b>: מוצגים ליד המודעות שלכם.</li><li><b>מודעות ותמונות</b>: מוצגות לכל מבקרי האתר.</li><li><b>הודעות בצ׳אט</b>: גלויות רק לכם ולצד השני בשיחה. אנחנו ניגשים אליהן רק אם יש דיווח על הונאה או לפי דרישה חוקית.</li><li><b>פניות "צור קשר" ודיווחים</b>: כדי לטפל בהם.</li><li><b>מילות חיפוש</b>: נשמרות בלי שיוך אליכם, כדי להבין מה מחפשים באתר.</li></ul>
  <h2>האם חובה למסור את המידע</h2><p>אין חובה חוקית למסור מידע. בלי אימייל וסיסמה אי אפשר לפתוח חשבון, אבל אפשר לגלוש ולחפש בלי חשבון.</p>
  <h2>עם מי המידע משותף</h2><p>אנחנו לא מוכרים מידע אישי ולא מעבירים אותו לצורכי שיווק. המידע נשמר אצל ספקי תשתית שעובדים עבורנו: Supabase (מסד נתונים ואחסון, שרתים באירופה, בפרנקפורט) ו-Netlify (אחסון האתר). מסירת מידע לרשויות תיעשה רק לפי חוק או צו.</p>
  <h2>דיוור ופרסומות</h2><p>לא נשלח אליכם הודעות פרסומיות במייל, ב-SMS או בכל דרך אחרת בלי הסכמה מפורשת שלכם מראש. הודעות שירות (כמו אישור הרשמה ואיפוס סיסמה) נשלחות כחלק מהשירות.</p>
  <h2>עוגיות</h2><p>האתר משתמש רק באחסון מקומי שנדרש לפעולתו: שמירת ההתחברות שלכם, ומניעת ספירה כפולה של צפיות וחיפושים באותו ביקור. אין עוגיות פרסום או מעקב. אם יתווספו בעתיד, נבקש את הסכמתכם קודם.</p>
  <h2>אבטחה ושמירת מידע</h2><p>הגישה למידע מוגבלת בהרשאות, והתקשורת מוצפנת (HTTPS). מידע נשמר כל עוד החשבון פעיל. במחיקת חשבון נמחקים הפרטים, המודעות וההודעות, למעט מה שנדרש לשמור לפי חוק.</p>
  <h2>הזכויות שלכם</h2><p>אתם רשאים לעיין במידע שלכם, לבקש לתקן אותו או למחוק את החשבון, בפנייה דרך <a href="#/contact">צור קשר</a>. נשיב תוך 30 יום.</p>
  <h2>קטינים</h2><p>השירות מיועד לגילאי 18 ומעלה ואיננו אוספים ביודעין מידע על קטינים.</p>
  <h2>האחראי על המידע</h2>${bizBlock()}`);
}
function pSafety() {
  prose(`<h1>טיפים לקנייה ומכירה בטוחה</h1><ul>
  <li><b>נפגשים במקום ציבורי</b> ומוארים, ועדיף לא לבד.</li><li><b>בודקים את המוצר</b> לפני שמשלמים: מדליקים, מנסים, מוודאים שזה מה שהובטח.</li>
  <li><b>לא משלמים מראש</b> למי שלא פגשתם, ולא שולחים "מקדמה" כדי לשמור מוצר.</li><li><b>לא משתפים פרטי אשראי</b>, סיסמאות או קודים שמגיעים ב-SMS. אף פעם, גם לא בצ׳אט.</li>
  <li><b>מחיר טוב מדי</b> לאמת הוא סימן אזהרה.</li><li><b>מוכרים?</b> וודאו שהכסף באמת התקבל לפני שמוסרים את המוצר.</li><li>משהו מרגיש לא בסדר? <b>לחצו על "דיווח על המודעה"</b>.</li></ul>`);
}
function pA11y() {
  prose(`<h1>הצהרת נגישות</h1><p class="hint">${UPDATED}</p>
  <p>אנחנו רוצים ש-TradeNow יהיה נוח לשימוש לכל אחד, כולל אנשים עם מוגבלות. האתר נבנה במטרה לעמוד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ובתקן הישראלי ת"י 5568 ברמה AA (המבוסס על הנחיות WCAG 2.0).</p>
  <h2>מה עשינו באתר</h2><ul><li>האתר עובד עם מקלדת בלבד, וכל כפתור וקישור מקבל מסגרת פוקוס בולטת.</li><li>קישור "דלג לתוכן" בתחילת כל עמוד.</li><li>תגיות ותיאורים לקוראי מסך: כותרות מסודרות, תוויות לשדות, תיאור לכפתורי אייקון, ותיאור טקסט לתמונות המוצרים.</li><li>ניגודיות צבעים מספקת בין טקסט לרקע, וטקסט שאפשר להגדיל עד 200% בלי לאבד תוכן.</li><li>התאמה מלאה לנייד ולמסכים בגדלים שונים.</li><li>הודעות מערכת מוקראות לקוראי מסך.</li></ul>
  <h2>מגבלות ידועות</h2><p>תמונות ותיאורים במודעות נכתבים על ידי המשתמשים, ולכן ייתכן שחלקם לא יהיו נגישים במלואם. אנחנו ממשיכים לבדוק ולשפר את האתר.</p>
  <h2>נתקלתם בבעיה?</h2><p>אם משהו באתר לא נגיש לכם, נשמח לשמוע ולתקן. פנו אלינו דרך <a href="#/contact">צור קשר</a> וכתבו באיזה עמוד הבעיה ומה קרה. נחזור אליכם בהקדם.</p>
  ${BIZ.a11yName ? `<p>רכז/ת נגישות: ${esc(BIZ.a11yName)}${BIZ.email ? ` · <span dir="ltr">${esc(BIZ.email)}</span>` : ''}${BIZ.phone ? ` · <span dir="ltr">${esc(BIZ.phone)}</span>` : ''}</p>` : ''}`);
}
function pContact() {
  prose(`<h1>צור קשר</h1><p>שאלות, בקשה לקידום, בקשה למחיקת חשבון או כל דבר אחר? כתבו לנו ונחזור אליכם.</p>
  <form id="cf2" style="max-width:520px"><div class="field"><label for="cn">שם</label><input id="cn" class="inp" maxlength="60" value="${esc(S.profile?.display_name || '')}"></div>
  <div class="field"><label for="cr">אימייל או טלפון לחזרה</label><input id="cr" class="inp" maxlength="120" dir="ltr" value="${esc(S.user?.email || '')}"></div>
  <div class="field"><label for="cb">ההודעה</label><textarea id="cb" class="inp" maxlength="2000"></textarea></div><div id="cerr" class="err"></div><button class="btn btn-p">שליחה</button></form>`);
  document.getElementById('cf2').onsubmit = async e => {
    e.preventDefault(); const name = document.getElementById('cn').value.trim(), reply_to = document.getElementById('cr').value.trim(), body = document.getElementById('cb').value.trim();
    if (!name || reply_to.length < 3 || body.length < 2) { document.getElementById('cerr').textContent = 'מלא את כל השדות'; return; }
    const { error } = await sb.from('contact_messages').insert({ name, reply_to, body });
    if (error) { document.getElementById('cerr').textContent = 'לא נשלח, נסה שוב'; return; }
    V.innerHTML = `<div class="panel empty">${ic('circle-check', 52, '#15803D')}<h3>ההודעה נשלחה</h3><p>נחזור אליך בהקדם.</p><a class="btn btn-p" href="#/">לדף הבית</a></div>`;
  };
}

// ---------- boot ----------
window.addEventListener('hashchange', route);
(async () => {
  const { data } = await sb.auth.getSession();
  S.user = data.session?.user || null;
  await loadMe();
  if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + (location.hash || '#/'));
  route();
  sb.auth.onAuthStateChange((ev, session) => {
    setTimeout(async () => {
      const was = S.user?.id; S.user = session?.user || null;
      if (ev === 'PASSWORD_RECOVERY') { await loadMe(); go('#/reset'); return; }
      if (was !== S.user?.id) { await loadMe(); if (location.search.includes('code=')) history.replaceState(null, '', location.pathname + '#/'); route(); }
    }, 0);
  });
})();
