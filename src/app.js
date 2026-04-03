import { seed, resetSeed }              from './data.js';
import { getSession, logout }       from './auth.js';
import { renderNav, closeModal, dismissModal, injectHeadAvatar, setNavHidden } from './ui.js';
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
  renderSupervisorToday,
  renderSupervisorPlan,
  renderSupervisorInstructors,
  renderSupervisorInstructorDetail,
  renderSupervisorSchool,
  renderSupervisorSchoolTemplates,
  renderSupervisorSchoolTimeOff,
  renderSupervisorSchoolTimesheet,
  renderSupervisorLessonDetail,
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
  { pat: /^\/guest\/book$/,                   view: renderBook,                roles: ['guest'], noAvatar: true },
  { pat: /^\/guest\/bookings$/,               view: renderMyBookings,          roles: ['guest'] },
  { pat: /^\/instructor\/dashboard$/,         view: renderInstructorDashboard, roles: ['instructor'] },
  { pat: /^\/instructor\/schedule$/,          view: renderMySchedule,          roles: ['instructor'] },
  { pat: /^\/instructor\/lesson\/(?<id>.+)$/, view: renderLessonDetail,        roles: ['instructor'], hideNav: true },
  { pat: /^\/supervisor\/dashboard$/,         view: (c,o) => { navigate('/supervisor/today'); }, roles: ['supervisor'] },
  { pat: /^\/supervisor\/today$/,             view: renderSupervisorToday,        roles: ['supervisor'] },
  { pat: /^\/supervisor\/plan$/,              view: renderSupervisorPlan,         roles: ['supervisor'] },
  { pat: /^\/supervisor\/instructors$/,              view: renderSupervisorInstructors,       roles: ['supervisor'] },
  { pat: /^\/supervisor\/instructors\/(?<id>.+)$/,  view: renderSupervisorInstructorDetail,  roles: ['supervisor'], hideNav: true },
  { pat: /^\/supervisor\/school$/,                  view: renderSupervisorSchool,          roles: ['supervisor'] },
  { pat: /^\/supervisor\/school\/templates$/,       view: renderSupervisorSchoolTemplates, roles: ['supervisor'], hideNav: true },
  { pat: /^\/supervisor\/school\/timeoff$/,         view: renderSupervisorSchoolTimeOff,      roles: ['supervisor'], hideNav: true },
  { pat: /^\/supervisor\/school\/timesheet$/,      view: renderSupervisorSchoolTimesheet,    roles: ['supervisor'], hideNav: true },
  { pat: /^\/supervisor\/lesson\/(?<id>.+)$/, view: renderSupervisorLessonDetail,    roles: ['supervisor'], hideNav: true },
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
  content.innerHTML = '';
  window.scrollTo(0, 0);

  if (session) {
    renderNav(session, null);
    setNavHidden(!!route.hideNav);
    // Yellow accent for Book tab (immersive experience)
    const nav = document.getElementById('bottom-nav');
    if (nav) nav.dataset.accent = path === '/guest/book' ? 'yellow' : '';
  } else {
    document.getElementById('bottom-nav')?.remove();
    content.classList.remove('nav-hidden-offset');
  }

  route.view(content, { params, session });
  if (session && !route.noAvatar) injectHeadAvatar(session, content);
  content.classList.add('fade-up');
  setTimeout(() => { content.classList.remove('fade-up'); content.style.opacity = ''; }, 250);
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
  dismissModal('account', () => { logout(); navigate('/login'); });
};

// Global reset helper (called from account modal)
window.__snowResetData = () => {
  if (!confirm('Reset all mock data? Lessons, bookings and reports will be regenerated.')) return;
  resetSeed();
  window.location.reload();
};
