import { navigate } from './app.js';

// ── Avatar injected into .page-head after view renders ───────────────────────
export function injectHeadAvatar(session, content) {
  const head = content.querySelector('.page-head');
  if (!head || head.dataset.navStep) return;
  head.querySelector('[data-account-avatar]')?.remove();

  const roleLabel = { instructor: 'Ski Instructor', supervisor: 'Supervisor' }[session.role] ?? null;

  window.__snowShowAccount = () => openModal('account', 'My Account', `
    <div style="text-align:center;padding:8px 0 24px;">
      ${av(session.avatar, 'lg')}
      <div style="font-weight:600;font-size:18px;color:#000;margin-top:14px;">${session.name}</div>
      <div style="font-size:14px;color:#777;margin-top:4px;">${session.email}</div>
      ${roleLabel ? `<div style="font-size:13px;color:#888;margin-top:4px;">${roleLabel}</div>` : ''}
    </div>
    <div class="div" style="margin-bottom:4px;"></div>
    <button onclick="window.__snowLogout()"
      style="display:flex;align-items:center;gap:10px;width:100%;padding:16px;
      background:none;border:none;cursor:pointer;color:#BF2F17;font-size:15px;
      font-weight:500;font-family:'Inter',sans-serif;border-radius:10px;">
      ${iLogout()} Sign out
    </button>
    <button onclick="window.__snowResetData()"
      style="display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;
      background:none;border:none;cursor:pointer;color:#999;font-size:13px;
      font-weight:500;font-family:'Inter',sans-serif;border-radius:10px;">
      ${iRefresh()} Reset mock data
    </button>
  `);

  const titleRow = head.querySelector('div');
  titleRow.style.alignItems = 'center';
  const btn = document.createElement('button');
  btn.dataset.accountAvatar = 'true';
  btn.style.cssText = 'margin-left:auto;flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent;';
  btn.innerHTML = av(session.avatar, 'md');
  btn.addEventListener('click', () => window.__snowShowAccount());
  titleRow.appendChild(btn);
}

// ── Bottom navigation ────────────────────────────────────────────────────────
const NAV_CONFIG = {
  guest: [
    { href: '/guest/dashboard', label: 'Home',       icon: iHome() },
    { href: '/guest/book',      label: 'Book',       icon: iPlus() },
    { href: '/guest/bookings',  label: 'Lessons',    icon: iCalendar() },
  ],
  instructor: [
    { href: '/instructor/dashboard', label: 'Today',    icon: iHome() },
    { href: '/instructor/schedule',  label: 'Schedule', icon: iCalendar() },
  ],
  supervisor: [
    { href: '/supervisor/today',       label: 'Today',       icon: iHome() },
    { href: '/supervisor/plan',        label: 'Plan',        icon: iCalendar() },
    { href: '/supervisor/instructors', label: 'Instructors', icon: iPeople() },
    { href: '/supervisor/school',      label: 'School',      icon: iSchool() },
  ],
};

function positionIndicator(nav) {
  const indicator = nav.querySelector('.nav-indicator');
  const activeTab = nav.querySelector('.nav-tab.active');
  if (!indicator || !activeTab) return;
  indicator.style.width     = activeTab.offsetWidth  + 'px';
  indicator.style.height    = activeTab.offsetHeight + 'px';
  indicator.style.transform = `translate(${activeTab.offsetLeft}px, ${activeTab.offsetTop}px)`;
}

export function renderNav(session, backHref = null) {
  const tabs = NAV_CONFIG[session.role];
  if (!tabs) return;

  const hash       = window.location.hash.slice(1);
  const existing   = document.getElementById('bottom-nav');
  const isBackMode = !!backHref;
  document.getElementById('content')?.classList.remove('nav-hidden-offset');

  // Nav already exists for this role — update in place if mode hasn't changed.
  if (existing && existing.dataset.role === session.role) {
    const wasBackMode = existing.dataset.back === 'true';
    if (isBackMode === wasBackMode) {
      if (isBackMode) {
        existing.querySelector('.nav-back-pill')?.setAttribute('href', '#' + backHref);
      } else {
        existing.querySelectorAll('.nav-tab').forEach(a => {
          const href = a.getAttribute('href').slice(1);
          a.classList.toggle('active', hash === href || hash.startsWith(href + '/'));
        });
        positionIndicator(existing);
      }
      return;
    }
  }

  // Build from scratch (first render or mode changed).
  existing?.remove();
  const nav        = document.createElement('nav');
  nav.id           = 'bottom-nav';
  nav.dataset.role = session.role;
  nav.dataset.back = String(isBackMode);

  if (isBackMode) {
    nav.classList.add('nav-back');
    nav.innerHTML = `
      <div class="nav-inner nav-inner-back">
        <div class="nav-indicator"></div>
        <a href="#${backHref}" class="nav-tab active">${iBack()}<span>Back</span></a>
      </div>`;
  } else {
    nav.innerHTML = `
      <div class="nav-inner">
        <div class="nav-indicator"></div>
        ${tabs.map(t => {
          const active = hash === t.href || hash.startsWith(t.href + '/');
          return `<a href="#${t.href}" class="nav-tab${active ? ' active' : ''}">${t.icon}<span>${t.label}</span></a>`;
        }).join('')}
      </div>`;
  }

  document.getElementById('app').appendChild(nav);

  const indicator = nav.querySelector('.nav-indicator');
  indicator.style.transition = 'none';
  positionIndicator(nav);
  requestAnimationFrame(() => { indicator.style.transition = ''; });
}

export function setNavHidden(hidden) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  nav.classList.toggle('is-hidden', hidden);
  document.getElementById('content')?.classList.toggle('nav-hidden-offset', hidden);
}

// ── Toast ────────────────────────────────────────────────────────────────────
export function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 320);
  }, 2700);
}

// ── Modal (bottom sheet) ─────────────────────────────────────────────────────
const MODAL_CLOSE_MS = 240;

export function dismissModal(id, cb) {
  const overlay = document.getElementById(`modal-${id}`);
  if (!overlay) { cb?.(); return; }
  overlay.classList.add('closing');
  setTimeout(() => { overlay.remove(); cb?.(); }, MODAL_CLOSE_MS);
}

export function openModal(id, title, body, { onClose } = {}) {
  closeModal(id);
  const overlay = document.createElement('div');
  overlay.id        = `modal-${id}`;
  overlay.className = 'modal-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'modal-sheet';
  sheet.innerHTML = `
    <div style="flex-shrink:0;">
      <div class="modal-handle-wrap"><div class="modal-handle"></div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px 16px;">
        <h3 style="font-family:'Newsreader',serif;font-size:22px;font-weight:700;color:#000;margin:0;">${title}</h3>
        <button data-modal-close
          style="background:none;border:none;padding:6px;cursor:pointer;color:#888;border-radius:50%;display:flex;">
          ${iX()}
        </button>
      </div>
    </div>
    <div id="modal-${id}-body"
      style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 20px;"></div>
  `;

  // Populate body and auto-detect a trailing btn-full to pin as footer
  const bodyEl = sheet.querySelector(`#modal-${id}-body`);
  bodyEl.innerHTML = body;

  const last = bodyEl.lastElementChild;
  let footerBtn = null;
  if (last?.classList.contains('btn-full')) {
    footerBtn = last;
  } else if (last?.lastElementChild?.classList.contains('btn-full')) {
    footerBtn = last.lastElementChild;
  }
  if (footerBtn) {
    footerBtn.style.marginTop = '0';
    const footer = document.createElement('div');
    footer.style.cssText = 'flex-shrink:0;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line-soft);';
    footer.appendChild(footerBtn);
    sheet.appendChild(footer);
  } else {
    // No pinned footer — add bottom padding to body scroll area
    bodyEl.style.paddingBottom = 'calc(24px + env(safe-area-inset-bottom,0px))';
  }

  overlay.appendChild(sheet);
  overlay.querySelector('[data-modal-close]').addEventListener('click', () => dismissModal(id, onClose));
  overlay.addEventListener('click', e => { if (e.target === overlay) dismissModal(id, onClose); });
  document.body.appendChild(overlay);
}

export function closeModal(id) {
  document.getElementById(`modal-${id}`)?.remove();
}

// ── Shared page header ───────────────────────────────────────────────────────
export function pageHead(title, subtitle = '', backHref = null) {
  if (backHref) {
    return `
    <div class="page-head page-head-step" data-nav-step="true">
      <div style="display:flex;align-items:center;gap:10px;">
        <a href="#${backHref}" style="flex-shrink:0;padding:6px;background:var(--bg-section-soft);border:1px solid var(--line-soft);border-radius:999px;display:inline-flex;color:#1E2643;text-decoration:none;" aria-label="Back">
          ${iBack()}
        </a>
        <h1 class="page-title page-title-step" style="flex:1;">${title}</h1>
      </div>
      ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ''}
    </div>
    <div style="height:16px;"></div>`;
  }
  return `
    <div class="page-head">
      <div style="display:flex;align-items:flex-end;gap:10px;">
        <h1 class="page-title" style="flex:1;">${title}</h1>
      </div>
      ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ''}
    </div>
    <div style="height:28px;"></div>`;
}


// ── Badges ───────────────────────────────────────────────────────────────────
export function statusBadge(status) {
  const map = {
    confirmed:      ['badge-confirmed',    'Confirmed'],
    cancelled:      ['badge-cancelled',    'Cancelled'],
    scheduled:      ['badge-scheduled',    'Scheduled'],
    'in-progress':  ['badge-in-progress',  'In Progress'],
    'on-mountain':  ['badge-on-mountain',  'On Mountain'],
    completed:      ['badge-completed',    'Report Due'],
    reported:       ['badge-reported',     'Reported'],
    pending:        ['badge-pending',      'Pending'],
  };
  const [cls, lbl] = map[status] || ['badge-scheduled', status];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

export function bookingDisplayStatus(booking, lesson = null) {
  if (!booking) return 'scheduled';
  if (booking.status === 'cancelled') return 'cancelled';
  return lesson?.status || 'scheduled';
}

export function sportBadge(sport) {
  return sport === 'ski'
    ? `<span class="badge badge-ski">⛷ Ski</span>`
    : `<span class="badge badge-snowboard">🏂 Snowboard</span>`;
}

export function audienceBadge(audience) {
  return audience === 'adult'
    ? `<span class="badge badge-adult">Adult</span>`
    : `<span class="badge badge-kids">Kids</span>`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function av(initials, size = 'md') {
  return `<div class="av av-${size}">${(initials||'?').slice(0,2).toUpperCase()}</div>`;
}

// ── Section label ─────────────────────────────────────────────────────────────
export function secLabel(text) {
  return `<div class="sec-label" style="padding:0 20px;margin-bottom:10px;">${text}</div>`;
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function emptyState(emoji, title, body, cta = '') {
  return `
    <div class="empty-state">
      <span class="empty-icon">${emoji}</span>
      <div class="empty-title">${title}</div>
      <div class="empty-body">${body}</div>
      ${cta ? `<div style="margin-top:20px;">${cta}</div>` : ''}
    </div>`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
export function fmtDate(dateStr) {
  // dateStr = YYYY-MM-DD, parse as local date
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric' });
}

export function fmtDateLong(dateStr) {
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric', year:'numeric' });
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function lessonTimes(tmpl) {
  if (!tmpl) return '';
  return `AM ${tmpl.amStart}–${tmpl.amEnd} · PM ${tmpl.pmStart}–${tmpl.pmEnd}`;
}

export function lessonTimeLabel(lesson, tmpl = null) {
  if (lesson?.lessonType === 'private') {
    if (lesson.privateTimeLabel) return lesson.privateTimeLabel;
    if (lesson.privateStart && lesson.privateEnd) return `${lesson.privateStart} - ${lesson.privateEnd}`;
  }
  return lessonTimes(tmpl);
}

export function lessonTitle(lesson, tmpl = null) {
  if (!lesson) return '';
  const base = tmpl?.name ?? lesson.templateId ?? 'Lesson';
  return lesson.lessonType === 'private' ? `Private · ${base}` : base;
}

export function privateBadge(lesson) {
  if (lesson?.lessonType !== 'private') return '';
  return `<span class="badge" style="background:linear-gradient(135deg,#2A334F,#1E2643);color:#F7E5B7;border:1px solid rgba(247,229,183,0.32);">Private</span>`;
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
export function tabBar(tabs, activeId) {
  return `
    <div class="tab-bar">
      ${tabs.map(t =>
        `<button class="tab-btn${t.id === activeId ? ' active' : ''}"
          data-tab="${t.id}">${t.label}</button>`
      ).join('')}
    </div>`;
}

// ── Inline error box ──────────────────────────────────────────────────────────
export function errBox(msg) {
  return `<div class="err-box">${msg}</div>`;
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
function svg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
export function iHome()     { return svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'); }
export function iCalendar() { return svg('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'); }
export function iPlus()     { return svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'); }
export function iList()     { return svg('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'); }
export function iPeople()   { return svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'); }
export function iBack()     { return svg('<polyline points="15 18 9 12 15 6"/>'); }
export function iX()        { return svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'); }
export function iCheck()    { return svg('<polyline points="20 6 9 17 4 12"/>'); }
export function iChevR()    { return svg('<polyline points="9 18 15 12 9 6"/>'); }
export function iUser()     { return svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'); }
export function iStar()     { return svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'); }
export function iWarn()     { return svg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'); }
export function iClipboard(){ return svg('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>'); }
export function iEdit()     { return svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'); }
export function iLogout()   { return svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'); }
export function iRefresh()  { return svg('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'); }
export function iPlay()     { return svg('<polygon points="5 3 19 12 5 21 5 3"/>'); }
export function iFlag()     { return svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'); }
export function iSchool()   { return svg('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>'); }
export function iSwap()     { return svg('<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>'); }
export function iTrash()    { return svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'); }
export function iUserPlus() { return svg('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>'); }
export function iChevDown() { return svg('<polyline points="6 9 12 15 18 9"/>'); }
export function iDownload() { return svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'); }
