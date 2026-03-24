import { navigate } from './app.js';

// ── Top-right avatar (all roles, persists across tabs) ────────────────────────
// Sets a global trailing-action HTML string that pageHead picks up at render time.
// renderNav runs before the view, so the string is ready when pageHead is called.
function _renderTopAvatar(session) {
  const roleLabel = { instructor: 'Ski Instructor', supervisor: 'Supervisor' }[session.role] ?? null;

  // Register the modal opener so the inline onclick can call it.
  window.__snowShowAccount = () => openModal('account', 'My Account', `
    <div style="text-align:center;padding:8px 0 24px;">
      ${av(session.avatar, 'lg')}
      <div style="font-weight:600;font-size:18px;color:#000;margin-top:14px;">${session.name}</div>
      <div style="font-size:14px;color:#777;margin-top:4px;">${session.email}</div>
      ${roleLabel ? `<div style="font-size:13px;color:#888;margin-top:4px;">${roleLabel}</div>` : ''}
      ${session.level ? `<div style="margin-top:10px;">${levelBadge(session.level)}</div>` : ''}
    </div>
    <div class="div" style="margin-bottom:4px;"></div>
    <button onclick="window.__snowLogout()"
      style="display:flex;align-items:center;gap:10px;width:100%;padding:16px;
      background:none;border:none;cursor:pointer;color:#BF2F17;font-size:15px;
      font-weight:500;font-family:'Inter',sans-serif;border-radius:10px;">
      ${iLogout()} Sign out
    </button>
  `);

  window.__snowPageTrailing = `
    <button onclick="window.__snowShowAccount()"
      style="background:none;border:none;cursor:pointer;padding:4px;flex-shrink:0;
      -webkit-tap-highlight-color:transparent;display:flex;align-items:center;">
      ${av(session.avatar, 'md')}
    </button>`;
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
    { href: '/supervisor/dashboard',    label: 'Overview',    icon: iHome() },
    { href: '/supervisor/bookings',     label: 'Bookings',    icon: iList() },
    { href: '/supervisor/instructors',  label: 'Instructors', icon: iPeople() },
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

  _renderTopAvatar(session);

  const hash       = window.location.hash.slice(1);
  const existing   = document.getElementById('bottom-nav');
  const isBackMode = !!backHref;

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
export function openModal(id, title, body) {
  closeModal(id);
  const overlay = document.createElement('div');
  overlay.id        = `modal-${id}`;
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle-wrap"><div class="modal-handle"></div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:0 2px;">
        <h3 style="font-family:'Newsreader',serif;font-size:22px;font-weight:700;color:#000;margin:0;">${title}</h3>
        <button onclick="document.getElementById('modal-${id}')?.remove()"
          style="background:none;border:none;padding:6px;cursor:pointer;color:#888;border-radius:50%;display:flex;">
          ${iX()}
        </button>
      </div>
      <div id="modal-${id}-body">${body}</div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

export function closeModal(id) {
  document.getElementById(`modal-${id}`)?.remove();
}

// ── Shared page header ───────────────────────────────────────────────────────
export function pageHead(title, subtitle = '', backHref = null) {
  const trailing = window.__snowPageTrailing || '';
  return `
    <div class="page-head">
      <div style="display:flex;align-items:flex-end;gap:10px;">
        ${backHref ? `
          <a href="#${backHref}" style="flex-shrink:0;margin-bottom:2px;padding:6px;background:rgba(30,38,67,0.07);border-radius:999px;display:inline-flex;color:#1E2643;text-decoration:none;" aria-label="Back">
            ${iBack()}
          </a>` : ''}
        <h1 class="page-title" style="flex:1;">${title}</h1>
        ${trailing}
      </div>
      ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ''}
    </div>`;
}

// ── Badges ───────────────────────────────────────────────────────────────────
export function statusBadge(status) {
  const map = {
    confirmed:    ['badge-confirmed',    'Confirmed'],
    cancelled:    ['badge-cancelled',    'Cancelled'],
    scheduled:    ['badge-scheduled',    'Scheduled'],
    'in-progress':['badge-in-progress',  'In Progress'],
    completed:    ['badge-completed',    'Completed'],
    pending:      ['badge-pending',      'Pending'],
  };
  const [cls, lbl] = map[status] || ['badge-scheduled', status];
  return `<span class="badge ${cls}">${lbl}</span>`;
}

export function levelBadge(level) {
  const map = {
    beginner:     ['badge-beginner',     'Beginner'],
    intermediate: ['badge-intermediate', 'Intermediate'],
    advanced:     ['badge-advanced',     'Advanced'],
  };
  const [cls, lbl] = map[level] || ['badge-scheduled', level];
  return `<span class="badge ${cls}">${lbl}</span>`;
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

export function sessionTime(tmpl, session) {
  if (!tmpl) return '';
  return session === 'AM'
    ? `${tmpl.amStart} – ${tmpl.amEnd}`
    : `${tmpl.pmStart} – ${tmpl.pmEnd}`;
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
