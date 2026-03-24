import { seed, resetSeed }              from './data.js';
import { getSession, logout }       from './auth.js';
import { renderNav, closeModal } from './ui.js';
import { renderLogin, renderRegister } from './views/login.js';
import {
  renderGuestDashboard,
  renderBook,
  renderMyBookings,
} from './views/guest.js';
import {
  renderInstructorDashboard,
  renderMySchedule,
  renderLessonDetail,
} from './views/instructor.js';
import {
  renderSupervisorDashboard,
  renderAllBookings,
  renderInstructorMgmt,
  renderAssign,
} from './views/supervisor.js';

// ── Bootstrap ────────────────────────────────────────────────────────────────
seed();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ── Route table ──────────────────────────────────────────────────────────────
// pattern: regex string (named capture groups for params)
const ROUTES = [
  { pat: /^\/login$/,                         view: renderLogin,               roles: null },
  { pat: /^\/register$/,                      view: renderRegister,            roles: null },
  { pat: /^\/guest\/dashboard$/,              view: renderGuestDashboard,      roles: ['guest'] },
  { pat: /^\/guest\/book$/,                   view: renderBook,                roles: ['guest'] },
  { pat: /^\/guest\/bookings$/,               view: renderMyBookings,          roles: ['guest'] },
  { pat: /^\/instructor\/dashboard$/,         view: renderInstructorDashboard, roles: ['instructor'] },
  { pat: /^\/instructor\/schedule$/,          view: renderMySchedule,          roles: ['instructor'] },
  { pat: /^\/instructor\/lesson\/(?<id>.+)$/, view: renderLessonDetail,        roles: ['instructor'], back: p => '/instructor/dashboard' },
  { pat: /^\/supervisor\/dashboard$/,         view: renderSupervisorDashboard, roles: ['supervisor'] },
  { pat: /^\/supervisor\/bookings$/,          view: renderAllBookings,         roles: ['supervisor'] },
  { pat: /^\/supervisor\/instructors$/,       view: renderInstructorMgmt,      roles: ['supervisor'] },
  { pat: /^\/supervisor\/assign\/(?<id>.+)$/, view: renderAssign,              roles: ['supervisor'], back: p => '/supervisor/dashboard' },
];

function matchRoute(path) {
  for (const route of ROUTES) {
    const m = path.match(route.pat);
    if (m) return { route, params: m.groups || {} };
  }
  return null;
}

// ── Navigation ───────────────────────────────────────────────────────────────
export function navigate(path) {
  window.location.hash = '#' + path;
}

// ── Router ───────────────────────────────────────────────────────────────────
function router() {
  const hash    = window.location.hash;
  const path    = hash ? hash.slice(1) : '/login';
  const session = getSession();
  const matched = matchRoute(path);

  if (!matched) {
    navigate(session ? `/${session.role}/dashboard` : '/login');
    return;
  }

  const { route, params } = matched;

  // Auth guard
  if (route.roles) {
    if (!session)                           { navigate('/login'); return; }
    if (!route.roles.includes(session.role)){ navigate(`/${session.role}/dashboard`); return; }
  } else {
    // Public pages — redirect logged-in users to their home
    if (session) { navigate(`/${session.role}/dashboard`); return; }
  }

  const content = document.getElementById('content');
  content.style.opacity = '0';

  // Small delay for the fade transition
  setTimeout(() => {
    content.innerHTML = '';
    window.scrollTo(0, 0);

    if (session) {
      const backHref = route.back ? route.back(params) : null;
      renderNav(session, backHref);
    } else {
      document.getElementById('bottom-nav')?.remove();
      document.getElementById('top-avatar-btn')?.remove();
    }

    route.view(content, { params, session });
    content.style.opacity = '1';
    content.classList.add('fade-up');
    setTimeout(() => content.classList.remove('fade-up'), 250);
  }, 80);
}

window.addEventListener('hashchange', router);

window.addEventListener('load', () => {
  // Hide splash screen
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 420);
    }
  }, 900);
  router();
});

// Global logout helper (called from profile / nav)
window.__snowLogout = () => {
  closeModal('account');
  logout();
  navigate('/login');
};

// Global reset helper (called from account modal)
window.__snowResetData = () => {
  if (!confirm('Reset all mock data? Lessons, bookings and reports will be regenerated.')) return;
  resetSeed();
  window.location.reload();
};
