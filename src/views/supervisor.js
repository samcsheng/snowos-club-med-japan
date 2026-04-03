import { DB, TEMPLATES, getTemplate, saveTemplateOverride, isoDate } from '../data.js';
import { navigate } from '../app.js';
import {
  toast, pageHead, statusBadge, sportBadge, audienceBadge, av, secLabel,
  emptyState, openModal, dismissModal, fmtDate, fmtDateLong, todayStr, lessonTimes,
  iPlus, iCheck, iChevR, iWarn, iEdit, iUserPlus, iClipboard, iCalendar, iX, iFlag, iBack,
  iList, iDownload,
} from '../ui.js';

// ── Date offset helper ────────────────────────────────────────────────────────
function dateOffset(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return isoDate(dt);
}

// ── Single-pass data loader — prevents N+1 localStorage reads ─────────────────
function _loadDayData(date) {
  const allUsers    = DB.getUsers();
  const allBookings = DB.getBookings();
  const lessons     = DB.getLessonsByDate(date);

  const usersById   = Object.fromEntries(allUsers.map(u => [u.id, u]));
  const instructors = allUsers.filter(u => u.role === 'instructor');
  const guestUsers  = allUsers.filter(u => u.role === 'guest');

  const confirmedByLesson = {};
  allBookings.filter(b => b.status === 'confirmed').forEach(b => {
    (confirmedByLesson[b.lessonId] ??= []).push(b);
  });

  return { lessons, usersById, instructors, guestUsers, confirmedByLesson, allBookings };
}

// ── Lesson list renderer (used by Today + Plan) ───────────────────────────────
function _renderLessons(container, date, sport, audience) {
  const { lessons, usersById, confirmedByLesson } = _loadDayData(date);

  const filtered = lessons.filter(l => {
    const t = getTemplate(l.templateId);
    return t && t.sport === sport && t.audience === audience;
  });

  const listEl = container.querySelector('[data-lesson-list]');
  if (!listEl) return;

  if (filtered.length === 0) {
    listEl.innerHTML = emptyState('📋', 'No lessons', 'No lessons scheduled for this selection.');
    return;
  }

  listEl.innerHTML = filtered.map(lesson => {
    const tmpl  = getTemplate(lesson.templateId);
    const inst  = lesson.instructorId ? usersById[lesson.instructorId] : null;
    const count = (confirmedByLesson[lesson.id] || []).length;
    const maxG  = tmpl?.maxGuests ?? '?';
    const unassigned = !lesson.instructorId;
    return `
      <div class="glass-strong lesson-tap" data-lid="${lesson.id}"
        style="border-radius:14px;overflow:hidden;cursor:pointer;
        ${unassigned ? 'border:1.5px solid rgba(199,83,0,0.22);' : ''}">
        <div style="padding:14px 16px;display:flex;align-items:center;gap:12px;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
              <span style="font-weight:700;font-size:15px;color:#000;">${tmpl?.name ?? lesson.templateId}</span>
              ${statusBadge(lesson.status)}
            </div>
            <div style="font-size:12px;color:#6b625d;margin-bottom:5px;">${tmpl ? lessonTimes(tmpl) : ''}</div>
            <div style="font-size:13px;display:flex;align-items:center;gap:6px;
              ${unassigned ? 'color:#C75300;font-weight:500;' : 'color:#444;'}">
              ${unassigned
                ? `<span style="display:inline-flex;align-items:center;gap:4px;">${iWarn()} Unassigned</span>`
                : `${av(inst?.avatar, 'sm')} ${inst?.name ?? '—'}`}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;margin-right:4px;">
            <div style="font-size:20px;font-weight:700;color:#000;line-height:1;">
              ${count}<span style="font-size:12px;font-weight:400;color:#888;">/${maxG}</span>
            </div>
            <div style="font-size:11px;color:#888;margin-top:2px;">guests</div>
          </div>
          <div style="color:#CCC;flex-shrink:0;">${iChevR()}</div>
        </div>
      </div>`;
  }).join('');

  listEl.querySelectorAll('.lesson-tap').forEach(el => {
    el.addEventListener('click', () => navigate('/supervisor/lesson/' + el.dataset.lid));
  });
}

// ── Filter row (sport + audience chips) ───────────────────────────────────────
function _filterRow(sport, audience) {
  return `
    <div style="display:flex;gap:8px;padding:0 20px 20px;flex-wrap:wrap;">
      <button class="pill-filter${sport === 'ski' ? ' active' : ''}" data-sport="ski">⛷ Ski</button>
      <button class="pill-filter${sport === 'snowboard' ? ' active' : ''}" data-sport="snowboard">🏂 Snowboard</button>
      <div style="width:1px;background:var(--line-soft);align-self:stretch;margin:0 2px;"></div>
      <button class="pill-filter${audience === 'adult' ? ' active' : ''}" data-audience="adult">Adult</button>
      <button class="pill-filter${audience === 'kids' ? ' active' : ''}" data-audience="kids">Kids</button>
    </div>`;
}

// ── Back-href for lesson detail ───────────────────────────────────────────────
function _lessonBackHref(lesson) {
  if (!lesson) return '/supervisor/today';
  return lesson.date === todayStr() ? '/supervisor/today' : '/supervisor/plan';
}

// ── Inline remove confirmation ────────────────────────────────────────────────
const _IC_FADE = 130;
function _confirmRemove(group, onConfirm, onCancel) {
  function swap(html, cb) {
    group.style.transition = `opacity ${_IC_FADE}ms ease`;
    group.style.opacity = '0';
    setTimeout(() => { group.innerHTML = html; group.style.opacity = '1'; cb?.(); }, _IC_FADE);
  }

  swap(`
    <span style="font-size:12px;color:#888;align-self:center;white-space:nowrap;margin-right:2px;">Remove?</span>
    <button data-ic="cancel"
      style="font-size:12px;font-weight:600;color:#555;background:var(--bg-section-soft);
      border:1px solid var(--line-soft);border-radius:999px;padding:5px 12px;
      cursor:pointer;font-family:'Inter',sans-serif;">Cancel</button>
    <button data-ic="confirm"
      style="font-size:12px;font-weight:600;color:#BF2F17;background:rgba(191,47,23,0.06);
      border:1px solid rgba(191,47,23,0.2);border-radius:999px;padding:5px 12px;
      cursor:pointer;font-family:'Inter',sans-serif;">Remove</button>`,
  () => {
    group.querySelector('[data-ic="cancel"]').addEventListener('click', onCancel);
    group.querySelector('[data-ic="confirm"]').addEventListener('click', onConfirm);
  });
}

// ── Lesson detail page ────────────────────────────────────────────────────────
export function renderSupervisorLessonDetail(container, { params, session }) {
  const lessonId = params.id;

  function _data() {
    const lesson        = DB.getLessonById(lessonId);
    const allUsers      = DB.getUsers();
    const usersById     = Object.fromEntries(allUsers.map(u => [u.id, u]));
    const instructors   = allUsers.filter(u => u.role === 'instructor');
    const tmpl          = lesson ? getTemplate(lesson.templateId) : null;
    const confirmedBkgs = lesson ? DB.getBookings().filter(b => b.lessonId === lessonId && b.status === 'confirmed') : [];
    const guestEntries  = confirmedBkgs.map(b => ({ booking: b, user: usersById[b.guestId] }));
    const sameDayOthers = lesson ? DB.getLessonsByDate(lesson.date).filter(l => l.id !== lessonId) : [];
    return { lesson, tmpl, usersById, instructors, confirmedBkgs, guestEntries, sameDayOthers };
  }

  function _renderInstructorSection() {
    const { lesson, instructors, usersById, sameDayOthers } = _data();
    if (!lesson) return;
    const inst = lesson.instructorId ? usersById[lesson.instructorId] : null;
    const sec  = container.querySelector('[data-section="instructor"]');
    if (!sec) return;

    sec.innerHTML = `
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
        color:#8A6B53;margin-bottom:8px;">Instructor</div>
      <div class="glass-strong" style="border-radius:14px;overflow:hidden;">
        ${inst ? `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;">
            ${av(inst.avatar, 'md')}
            <div style="flex:1;font-weight:600;font-size:14px;color:#000;">${inst.name}</div>
            <div data-btn-group style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
              <button data-action="transfer-inst"
                style="font-size:12px;font-weight:600;color:#1E2643;
                background:var(--bg-section-soft);border:1px solid var(--line-soft);
                border-radius:999px;padding:5px 12px;cursor:pointer;font-family:'Inter',sans-serif;">
                Transfer
              </button>
              <button data-action="remove-inst"
                style="font-size:12px;font-weight:600;color:#BF2F17;
                background:rgba(191,47,23,0.06);border:1px solid rgba(191,47,23,0.2);
                border-radius:999px;padding:5px 12px;cursor:pointer;font-family:'Inter',sans-serif;">
                Remove
              </button>
            </div>
          </div>` : `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;">
            <div style="flex:1;font-size:14px;color:#C75300;font-weight:500;
              display:flex;align-items:center;gap:6px;">
              ${iWarn()} No instructor assigned
            </div>
            <button data-action="assign-inst"
              style="font-size:12px;font-weight:600;color:#fff;background:#1E2643;border:none;
              border-radius:999px;padding:6px 14px;cursor:pointer;font-family:'Inter',sans-serif;">
              Assign
            </button>
          </div>`}
      </div>`;

    sec.querySelector('[data-action="assign-inst"]')?.addEventListener('click', () =>
      _openAssignInstructor(lesson, lesson.date, instructors, usersById, _renderInstructorSection));
    sec.querySelector('[data-action="remove-inst"]')?.addEventListener('click', function() {
      const group = this.closest('[data-btn-group]');
      _confirmRemove(group,
        () => { DB.upsertLesson({ ...lesson, instructorId: null }); toast('Instructor removed.', 'info'); _renderInstructorSection(); },
        () => _renderInstructorSection()
      );
    });
    sec.querySelector('[data-action="transfer-inst"]')?.addEventListener('click', () =>
      _openTransferInstructor(lesson, lesson.date, sameDayOthers, usersById, _renderInstructorSection));
  }

  function _renderGuestSection() {
    const { lesson, tmpl, confirmedBkgs, guestEntries, usersById } = _data();
    if (!lesson) return;
    const sec = container.querySelector('[data-section="guests"]');
    if (!sec) return;

    sec.innerHTML = `
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
        color:#8A6B53;margin-bottom:8px;">
        Guests (${guestEntries.length}/${tmpl?.maxGuests ?? '?'})
      </div>
      <div class="glass-strong" style="border-radius:14px;overflow:hidden;">
        ${guestEntries.length === 0
          ? `<div style="padding:16px;font-size:14px;color:#888;text-align:center;">No guests booked</div>`
          : guestEntries.map((g, i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;
              ${i > 0 ? 'border-top:1px solid rgba(30,38,67,0.06);' : ''}">
              ${av(g.user?.avatar, 'sm')}
              <div style="flex:1;font-weight:600;font-size:14px;color:#000;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${g.user?.name ?? 'Guest'}
              </div>
              <div data-btn-group style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                <button data-action="transfer-guest" data-bid="${g.booking.id}"
                  style="font-size:12px;font-weight:600;color:#1E2643;
                  background:var(--bg-section-soft);border:1px solid var(--line-soft);
                  border-radius:999px;padding:5px 12px;cursor:pointer;font-family:'Inter',sans-serif;">
                  Transfer
                </button>
                <button data-action="remove-guest" data-bid="${g.booking.id}"
                  style="font-size:12px;font-weight:600;color:#BF2F17;
                  background:rgba(191,47,23,0.06);border:1px solid rgba(191,47,23,0.2);
                  border-radius:999px;padding:5px 12px;cursor:pointer;font-family:'Inter',sans-serif;">
                  Remove
                </button>
              </div>
            </div>`).join('')}
        <div style="border-top:1px solid rgba(30,38,67,0.06);">
          <button data-action="add-guest"
            style="width:100%;padding:12px 16px;background:none;border:none;cursor:pointer;
            font-size:14px;font-weight:600;color:#1E2643;font-family:'Inter',sans-serif;
            display:flex;align-items:center;justify-content:center;gap:8px;">
            ${iPlus()} Add Guest
          </button>
        </div>
      </div>`;

    sec.querySelectorAll('[data-action="remove-guest"]').forEach(btn =>
      btn.addEventListener('click', function() {
        const group = this.closest('[data-btn-group]');
        const bid = this.dataset.bid;
        _confirmRemove(group,
          () => { DB.cancelBooking(bid); toast('Guest removed.', 'info'); _renderGuestSection(); },
          () => _renderGuestSection()
        );
      }));
    sec.querySelectorAll('[data-action="transfer-guest"]').forEach(btn =>
      btn.addEventListener('click', () => {
        const bkg = DB.getBookingById(btn.dataset.bid);
        if (bkg) _openTransferGuest(bkg, _data().lesson, lesson.date, usersById, _renderGuestSection);
      }));
    sec.querySelector('[data-action="add-guest"]')?.addEventListener('click', () =>
      _openAddGuest(lesson, confirmedBkgs, usersById, _renderGuestSection));
  }

  // Build page skeleton once
  const { lesson, tmpl } = _data();
  if (!lesson) {
    container.innerHTML = pageHead('Not Found') + emptyState('❓', 'Lesson not found', '');
    return;
  }

  container.innerHTML = `
    ${pageHead(tmpl?.name ?? lessonId, fmtDateLong(lesson.date), _lessonBackHref(lesson))}
    <div style="padding:0 20px 20px;">
      <div class="glass" style="padding:14px 16px;border-radius:14px;">
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
          ${statusBadge(lesson.status)}
          ${tmpl ? sportBadge(tmpl.sport) : ''}
          ${tmpl ? audienceBadge(tmpl.audience) : ''}
          ${tmpl ? `<span class="badge" style="background:var(--bg-tile);color:#555;border:1px solid var(--line-soft);">${tmpl.level}</span>` : ''}
        </div>
        <div style="font-size:13px;color:#6b625d;">${tmpl ? lessonTimes(tmpl) : '—'}</div>
      </div>
    </div>
    <div data-section="instructor" style="padding:0 20px 16px;"></div>
    <div data-section="guests"     style="padding:0 20px 32px;"></div>
  `;

  _renderInstructorSection();
  _renderGuestSection();
}

// ── Assign instructor modal ───────────────────────────────────────────────────
function _openAssignInstructor(lesson, date, instructors, usersById, onDone) {
  const dayLessons = DB.getLessonsByDate(date);

  openModal('assign-inst', 'Assign Instructor', `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${instructors.map(inst => {
        const load = dayLessons.filter(l => l.instructorId === inst.id).length;
        const isCurrent = lesson.instructorId === inst.id;
        return `
          <div class="glass-strong inst-pick" data-iid="${inst.id}"
            style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;cursor:pointer;
            ${isCurrent ? 'border:1.5px solid rgba(8,138,32,0.3);background:rgba(220,245,226,0.5);' : ''}">
            ${av(inst.avatar, 'md')}
            <div style="flex:1;">
              <div style="font-weight:600;font-size:14px;color:#000;">${inst.name}
                ${isCurrent ? '<span class="badge badge-confirmed" style="margin-left:6px;">Current</span>' : ''}
              </div>
              <div style="font-size:12px;color:#888;margin-top:2px;">
                ${load} session${load !== 1 ? 's' : ''} today
                ${load === 0 ? '<span style="color:#088A20;font-weight:500;"> · Free</span>' : ''}
              </div>
            </div>
            <div style="color:${isCurrent ? '#088A20' : '#CCC'};">
              ${isCurrent ? iCheck() : iChevR()}
            </div>
          </div>`;
      }).join('')}
    </div>`);

  setTimeout(() => {
    document.querySelectorAll('.inst-pick').forEach(el => {
      el.addEventListener('click', () => {
        const iid = el.dataset.iid;
        if (iid === lesson.instructorId) return;
        DB.upsertLesson({ ...lesson, instructorId: iid });
        toast(`${usersById[iid]?.name ?? 'Instructor'} assigned.`, 'success');
        dismissModal('assign-inst', onDone);
      });
    });
  }, 50);
}

// ── Transfer instructor between lessons ───────────────────────────────────────
function _openTransferInstructor(lesson, date, otherLessons, usersById, onDone) {
  const swappable = otherLessons.filter(l => l.instructorId && l.instructorId !== lesson.instructorId);

  if (swappable.length === 0) {
    openModal('transfer-inst', 'Transfer Instructor', `
      <div style="text-align:center;padding:24px;color:#888;">
        No other lessons with assigned instructors today.
      </div>`);
    return;
  }

  const CATS = [
    { label: '⛷ Ski Adult',       sport: 'ski',       audience: 'adult' },
    { label: '🏂 Snowboard Adult', sport: 'snowboard', audience: 'adult' },
    { label: '⛷ Ski Kids',        sport: 'ski',       audience: 'kids'  },
    { label: '🏂 Snowboard Kids',  sport: 'snowboard', audience: 'kids'  },
  ];

  const sections = CATS.map(cat => {
    const items = swappable.filter(l => {
      const t = getTemplate(l.templateId);
      return t?.sport === cat.sport && t?.audience === cat.audience;
    });
    if (!items.length) return '';
    return `
      <div>
        <div style="position:sticky;top:0;z-index:2;display:flex;justify-content:center;padding:16px 0 16px;">
          <span style="display:inline-flex;align-items:center;
            font-size:13px;font-weight:700;color:#1E2643;
            background:rgba(30,38,67,0.09);border-radius:999px;
            padding:6px 16px;letter-spacing:0.01em;
            transform:translateZ(0);
            backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
            ${cat.label}
          </span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;padding-bottom:8px;">
          ${items.map(l => {
            const t    = getTemplate(l.templateId);
            const inst = usersById[l.instructorId];
            return `
              <div class="glass-strong lesson-swap" data-lid="${l.id}"
                style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;cursor:pointer;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:14px;color:#000;">${t?.name ?? l.templateId}</div>
                  <div style="font-size:12px;color:#888;margin-top:2px;">${inst?.name ?? '—'}</div>
                </div>
                <div style="color:#CCC;">${iChevR()}</div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');

  openModal('transfer-inst', 'Swap Instructor With', sections);

  setTimeout(() => {
    document.querySelectorAll('.lesson-swap').forEach(el => {
      el.addEventListener('click', () => {
        const other = DB.getLessonById(el.dataset.lid);
        if (!other) return;
        const myInst = lesson.instructorId;
        DB.upsertLesson({ ...lesson, instructorId: other.instructorId });
        DB.upsertLesson({ ...other,  instructorId: myInst });
        toast('Instructors swapped.', 'success');
        dismissModal('transfer-inst', onDone);
      });
    });
  }, 50);
}

// ── Transfer guest to another lesson ─────────────────────────────────────────
function _openTransferGuest(booking, currentLesson, date, usersById, onDone) {
  const curTmpl   = getTemplate(currentLesson.templateId);
  const dayLessons = DB.getLessonsByDate(date).filter(l => {
    if (l.id === currentLesson.id) return false;
    const t = getTemplate(l.templateId);
    return t && t.sport === curTmpl?.sport && t.audience === curTmpl?.audience;
  });
  const guestName = usersById[booking.guestId]?.name ?? 'Guest';

  if (dayLessons.length === 0) {
    openModal('transfer-guest', `Move ${guestName}`, `
      <div style="text-align:center;padding:24px;color:#888;">
        No other ${curTmpl?.sport ?? ''} ${curTmpl?.audience ?? ''} lessons today.
      </div>`);
    return;
  }

  openModal('transfer-guest', `Move ${guestName}`, `
    <p style="font-size:13px;color:#888;margin:0 0 12px;">Select destination lesson:</p>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${dayLessons.map(l => {
        const t     = getTemplate(l.templateId);
        const inst  = l.instructorId ? usersById[l.instructorId] : null;
        const count = DB.getConfirmedByLesson(l.id).length;
        const isFull = count >= (t?.maxGuests ?? 999);
        return `
          <div class="glass-strong guest-target" data-lid="${l.id}"
            style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;
            cursor:${isFull ? 'not-allowed' : 'pointer'};${isFull ? 'opacity:0.45;' : ''}">
            <div style="flex:1;">
              <div style="font-weight:600;font-size:14px;color:#000;">${t?.name ?? l.templateId}</div>
              <div style="font-size:12px;color:#888;margin-top:2px;">
                ${inst?.name ?? 'Unassigned'} · ${count}/${t?.maxGuests ?? '?'} guests
                ${isFull ? ' · <span style="color:#C75300;">Full</span>' : ''}
              </div>
            </div>
            ${!isFull ? `<div style="color:#CCC;">${iChevR()}</div>` : ''}
          </div>`;
      }).join('')}
    </div>`);

  setTimeout(() => {
    document.querySelectorAll('.guest-target').forEach(el => {
      el.addEventListener('click', () => {
        const tl = DB.getLessonById(el.dataset.lid);
        if (!tl) return;
        const count = DB.getConfirmedByLesson(tl.id).length;
        const tt = getTemplate(tl.templateId);
        if (count >= (tt?.maxGuests ?? 999)) return;
        DB.upsertBooking({ ...booking, lessonId: tl.id });
        toast(`${guestName} moved to ${tt?.name ?? tl.id}.`, 'success');
        dismissModal('transfer-guest', onDone);
      });
    });
  }, 50);
}

// ── Add guest modal ───────────────────────────────────────────────────────────
function _openAddGuest(lesson, confirmedBkgs, usersById, onDone) {
  const tmpl    = getTemplate(lesson.templateId);
  const maxG    = tmpl?.maxGuests ?? 999;
  if (confirmedBkgs.length >= maxG) {
    openModal('add-guest', 'Add Guest', `
      <div style="text-align:center;padding:20px;color:#C75300;">
        This lesson is full (${confirmedBkgs.length}/${maxG} guests).
      </div>`);
    return;
  }

  const bookedIds = new Set(confirmedBkgs.map(b => b.guestId));
  const allGuests = DB.getUsers().filter(u => u.role === 'guest' && !bookedIds.has(u.id));

  function listHTML(q) {
    const show = q
      ? allGuests.filter(g => g.name.toLowerCase().includes(q.toLowerCase())).slice(0, 12)
      : allGuests.slice(0, 12);
    if (show.length === 0) return `<div style="padding:16px;text-align:center;color:#888;font-size:14px;">No guests found</div>`;
    return `
      <div class="glass-strong" style="border-radius:14px;overflow:hidden;">
        ${show.map((g, i) => `
          <div class="guest-add-pick" data-gid="${g.id}"
            style="display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;
            ${i > 0 ? 'border-top:1px solid rgba(30,38,67,0.06);' : ''}">
            ${av(g.avatar, 'sm')}
            <div style="flex:1;">
              <div style="font-weight:600;font-size:14px;color:#000;">${g.name}</div>
              <div style="font-size:12px;color:#888;">${g.level} · ${g.sport}</div>
            </div>
            <div style="color:#CCC;">${iChevR()}</div>
          </div>`).join('')}
      </div>`;
  }

  openModal('add-guest', 'Add Guest', `
    <div style="margin-bottom:12px;">
      <input type="text" class="field-input" id="guest-search" placeholder="Search guests…">
    </div>
    <div id="guest-list">${listHTML('')}</div>`);

  function attachPicks() {
    document.querySelectorAll('.guest-add-pick').forEach(el => {
      el.addEventListener('click', () => {
        const g = allGuests.find(u => u.id === el.dataset.gid);
        if (!g) return;
        DB.upsertBooking({
          id:        'bkg-sup-' + Date.now().toString(36),
          guestId:   g.id,
          lessonId:  lesson.id,
          createdAt: new Date().toISOString(),
          status:    'confirmed',
        });
        toast(`${g.name} added.`, 'success');
        dismissModal('add-guest', onDone);
      });
    });
  }

  setTimeout(() => {
    attachPicks();
    document.getElementById('guest-search')?.addEventListener('input', e => {
      const listEl = document.getElementById('guest-list');
      if (listEl) { listEl.innerHTML = listHTML(e.target.value.trim()); attachPicks(); }
    });
  }, 50);
}

// ── Persistent filter state (survives tab navigation within the session) ──────
const _todayFilter = { sport: 'ski', audience: 'adult' };
const _planFilter  = { sport: 'ski', audience: 'adult', date: null };

// ── Assign instructor from standby modal ─────────────────────────────────────
function _openAssignStandbyModal(inst, date, onDone) {
  const { lessons, usersById, confirmedByLesson } = _loadDayData(date);

  const CATEGORIES = [
    { sport: 'ski',       audience: 'adult', label: '⛷ Ski · Adult' },
    { sport: 'ski',       audience: 'kids',  label: '⛷ Ski · Kids' },
    { sport: 'snowboard', audience: 'adult', label: '🏂 Snowboard · Adult' },
    { sport: 'snowboard', audience: 'kids',  label: '🏂 Snowboard · Kids' },
  ];

  const modalId = 'assign-standby';
  const existingOverlay = document.getElementById(`modal-${modalId}`);
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id        = `modal-${modalId}`;
  overlay.className = 'modal-overlay';

  function buildBody() {
    return CATEGORIES.map(cat => {
      const catLessons = lessons.filter(l => {
        const t = getTemplate(l.templateId);
        return t && t.sport === cat.sport && t.audience === cat.audience;
      });
      if (catLessons.length === 0) return '';

      const rows = catLessons.map((lesson, i) => {
        const tmpl       = getTemplate(lesson.templateId);
        const curInst    = lesson.instructorId ? usersById[lesson.instructorId] : null;
        const guestCount = (confirmedByLesson[lesson.id] || []).length;
        const maxG       = tmpl?.maxGuests ?? '?';
        const isAssigned = !!lesson.instructorId;
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 0;
            ${i < catLessons.length - 1 ? 'border-bottom:1px solid var(--line-soft);' : ''}">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:14px;color:#000;margin-bottom:2px;">
                ${tmpl?.name ?? lesson.templateId}
              </div>
              <div style="font-size:11px;color:#888;margin-bottom:4px;">
                ${tmpl ? lessonTimes(tmpl) : ''}
              </div>
              <div style="font-size:12px;display:flex;align-items:center;gap:5px;
                ${isAssigned ? 'color:#555;' : 'color:#C75300;font-weight:500;'}">
                ${isAssigned
                  ? `${av(curInst?.avatar, 'xs')} ${curInst?.name ?? '—'}`
                  : `<span style="display:inline-flex;align-items:center;gap:3px;">${iWarn()} Unassigned</span>`}
              </div>
            </div>
            <div style="font-size:12px;color:#888;flex-shrink:0;text-align:right;margin-right:8px;">
              ${guestCount}/${maxG}
            </div>
            <button data-assign-lid="${lesson.id}"
              style="flex-shrink:0;font-size:12px;font-weight:600;
              color:#fff;background:#1E2643;border:none;
              border-radius:999px;padding:6px 14px;cursor:pointer;
              font-family:'Inter',sans-serif;">
              Assign
            </button>
          </div>`;
      }).join('');

      return `
        <div style="margin-bottom:4px;">
          <div style="position:sticky;top:0;z-index:2;
            display:flex;justify-content:center;padding:16px 0 16px;">
            <span style="display:inline-flex;align-items:center;
              font-size:13px;font-weight:700;color:#1E2643;
              background:rgba(30,38,67,0.09);border-radius:999px;
              padding:6px 16px;letter-spacing:0.01em;
              transform:translateZ(0);
              backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
              ${cat.label}
            </span>
          </div>
          ${rows}
        </div>`;
    }).join('');
  }

  overlay.innerHTML = `
    <div class="modal-sheet" style="display:flex;flex-direction:column;overflow:hidden;padding:0;max-height:82vh;">
      <div class="modal-handle-wrap" style="flex-shrink:0;"><div class="modal-handle"></div></div>
      <div style="flex-shrink:0;display:flex;align-items:flex-start;justify-content:space-between;
        padding:0 20px 14px;border-bottom:1px solid var(--line-soft);">
        <div>
          <h3 style="font-family:'Newsreader',serif;font-size:22px;font-weight:700;color:#000;margin:0 0 2px;">
            ${inst.name}
          </h3>
          <div style="font-size:13px;color:#888;">${fmtDateLong(date)}</div>
        </div>
        <button data-modal-close
          style="background:none;border:none;padding:6px;cursor:pointer;color:#888;
          border-radius:50%;display:flex;flex-shrink:0;margin-top:2px;">
          ${iX()}
        </button>
      </div>
      <div id="modal-${modalId}-body"
        style="overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;
        padding:0 20px calc(24px + env(safe-area-inset-bottom, 0px));">
        ${buildBody()}
      </div>
    </div>`;

  function dismiss(cb) {
    overlay.classList.add('closing');
    setTimeout(() => { overlay.remove(); cb?.(); }, 240);
  }

  overlay.querySelector('[data-modal-close]').addEventListener('click', () => dismiss());
  overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });

  function attachAssign() {
    overlay.querySelectorAll('[data-assign-lid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lid = btn.dataset.assignLid;
        const lesson = lessons.find(l => l.id === lid);
        if (!lesson) return;
        DB.upsertLesson({ ...lesson, instructorId: inst.id });
        toast(`${inst.name} assigned.`, 'success');
        dismiss(onDone);
      });
    });
  }

  document.body.appendChild(overlay);
  setTimeout(attachAssign, 50);
}

// ── Standby page renderer ─────────────────────────────────────────────────────
function _renderStandby(container, date) {
  const { instructors, lessons } = _loadDayData(date);
  const assignedIds = new Set(lessons.map(l => l.instructorId).filter(Boolean));
  const standby = instructors.filter(i => !assignedIds.has(i.id));

  const listEl = container.querySelector('[data-standby-list]');
  if (!listEl) return;

  if (standby.length === 0) {
    listEl.innerHTML = emptyState('✅', 'All hands on deck', 'Every instructor has a lesson today.');
    return;
  }

  listEl.innerHTML = `
    <div style="padding:8px 20px 32px;display:flex;flex-direction:column;">
      ${standby.map((inst, i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:14px 0;
          ${i < standby.length - 1 ? 'border-bottom:1px solid var(--line-soft);' : ''}">
          ${av(inst.avatar, 'md')}
          <div style="flex:1;">
            <div style="font-weight:500;font-size:15px;color:var(--text-main);">${inst.name}</div>
          </div>
          <button data-assign-inst="${inst.id}"
            style="font-size:12px;font-weight:600;color:#fff;background:#1E2643;border:none;
            border-radius:999px;padding:6px 14px;cursor:pointer;font-family:'Inter',sans-serif;">
            Assign
          </button>
        </div>`).join('')}
    </div>`;

  listEl.querySelectorAll('[data-assign-inst]').forEach(btn => {
    btn.addEventListener('click', () => {
      const inst = standby.find(i => i.id === btn.dataset.assignInst);
      if (!inst) return;
      _openAssignStandbyModal(inst, date, () => _renderStandby(container, date));
    });
  });
}

// ── Tab 1: Today ──────────────────────────────────────────────────────────────
export function renderSupervisorToday(container, { session }) {
  const date = todayStr();
  const f = _todayFilter;

  // Compute tab counts
  const { lessons, instructors } = _loadDayData(date);
  const assignedIds = new Set(lessons.map(l => l.instructorId).filter(Boolean));
  const groupCount   = assignedIds.size;
  const standbyCount = instructors.filter(i => !assignedIds.has(i.id)).length;

  container.innerHTML = `
    <div class="page-head" style="padding-bottom:12px;">
      <div style="display:flex;align-items:center;">
        <h1 class="page-title" style="flex:1;">${fmtDate(date)}</h1>
      </div>
    </div>
    <div data-tab-row style="position:sticky;top:0;z-index:39;
      display:flex;align-items:center;gap:24px;padding:8px 20px 12px;
      background:linear-gradient(180deg,rgba(247,241,232,0.96),rgba(247,241,232,0.88));
      backdrop-filter:blur(20px) saturate(1.16);
      -webkit-backdrop-filter:blur(20px) saturate(1.16);">
      <button data-page-btn="0"
        style="padding:4px 0;background:none;border:none;cursor:pointer;
        font-family:'Inter',sans-serif;font-size:15px;
        -webkit-tap-highlight-color:transparent;user-select:none;">
        <span style="font-weight:700;color:var(--text-main);">Group</span><span
          style="font-weight:400;color:var(--text-muted);margin-left:4px;">${groupCount}</span>
      </button>
      <button data-page-btn="1"
        style="padding:4px 0;background:none;border:none;cursor:pointer;
        font-family:'Inter',sans-serif;font-size:15px;
        -webkit-tap-highlight-color:transparent;user-select:none;">
        <span style="font-weight:700;color:var(--text-main);">Standby</span><span
          style="font-weight:400;color:var(--text-muted);margin-left:4px;">${standbyCount}</span>
      </button>
      <div data-tab-indicator style="position:absolute;bottom:5px;height:3px;
        background:var(--text-main);border-radius:99px;pointer-events:none;"></div>
    </div>
    <div data-swipe-outer
      style="overflow-x:scroll;overflow-y:hidden;scroll-snap-type:x mandatory;
      -webkit-overflow-scrolling:touch;display:flex;">
      <div data-page-content="0"
        style="min-width:100%;width:100%;overflow-y:auto;scroll-snap-align:start;flex-shrink:0;">
        <div style="height:16px;"></div>
        ${_filterRow(f.sport, f.audience)}
        <div style="padding:0 20px;display:flex;flex-direction:column;gap:8px;"
          data-lesson-list></div>
        <div style="height:calc(96px + env(safe-area-inset-bottom, 0px));flex-shrink:0;"></div>
      </div>
      <div data-page-content="1"
        style="min-width:100%;width:100%;overflow-y:auto;scroll-snap-align:start;flex-shrink:0;">
        <div data-standby-list></div>
        <div style="height:calc(96px + env(safe-area-inset-bottom, 0px));flex-shrink:0;"></div>
      </div>
    </div>`;

  // ── Indicator positioning ─────────────────────────────────────────────────
  function _positionIndicator(progress) {
    const indicator = container.querySelector('[data-tab-indicator]');
    const btn0 = container.querySelector('[data-page-btn="0"]');
    const btn1 = container.querySelector('[data-page-btn="1"]');
    if (!indicator || !btn0 || !btn1) return;
    const l0 = btn0.offsetLeft, w0 = btn0.offsetWidth;
    const l1 = btn1.offsetLeft, w1 = btn1.offsetWidth;
    indicator.style.left  = (l0 + (l1 - l0) * progress) + 'px';
    indicator.style.width = (w0 + (w1 - w0) * progress) + 'px';
  }

  // ── Set swipe container height using getBoundingClientRect for accuracy ───
  requestAnimationFrame(() => {
    const head   = container.querySelector('.page-head');
    const tabRow = container.querySelector('[data-tab-row]');
    const nav    = document.getElementById('bottom-nav');
    const outer  = container.querySelector('[data-swipe-outer]');
    if (!outer || !head) return;

    const headH   = head.offsetHeight;
    if (tabRow) tabRow.style.top = headH + 'px';

    // Swipe area fills from below tab row to bottom of screen.
    // Nav floats over it; pages have bottom padding so last items clear the nav.
    const tabBottom = tabRow ? tabRow.getBoundingClientRect().bottom : head.getBoundingClientRect().bottom;
    outer.style.height = Math.max(200, window.innerHeight - tabBottom) + 'px';

    _positionIndicator(0);
  });

  // ── Scroll → live indicator ───────────────────────────────────────────────
  const swipeOuter = container.querySelector('[data-swipe-outer]');
  let _rafId = null;
  swipeOuter?.addEventListener('scroll', () => {
    if (_rafId) return;
    _rafId = requestAnimationFrame(() => {
      _rafId = null;
      const p = swipeOuter.scrollLeft / (swipeOuter.offsetWidth || 1);
      _positionIndicator(Math.max(0, Math.min(1, p)));
    });
  }, { passive: true });

  // ── Tab button clicks — custom snappy scroll (220ms ease-out) ───────────
  // scroll-snap must be disabled during animation or the browser snaps every frame
  let _scrollRaf = null;
  function _scrollToPage(page) {
    if (!swipeOuter) return;
    const targetX  = page * swipeOuter.offsetWidth;
    const startX   = swipeOuter.scrollLeft;
    const delta    = targetX - startX;
    if (!delta) return;
    const duration = 220;
    const startT   = performance.now();
    cancelAnimationFrame(_scrollRaf);
    swipeOuter.style.scrollSnapType = 'none';
    function step(now) {
      const t = Math.min(1, (now - startT) / duration);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      swipeOuter.scrollLeft = startX + delta * ease;
      if (t < 1) {
        _scrollRaf = requestAnimationFrame(step);
      } else {
        swipeOuter.scrollLeft = targetX;
        swipeOuter.style.scrollSnapType = 'x mandatory'; // restore — '' would delete it
      }
    }
    _scrollRaf = requestAnimationFrame(step);
  }

  container.querySelectorAll('[data-page-btn]').forEach(btn => {
    btn.addEventListener('click', () => _scrollToPage(+btn.dataset.pageBtn));
  });

  // ── Filter listeners (page 0) ─────────────────────────────────────────────
  function _applyFilter() {
    container.querySelectorAll('[data-sport]').forEach(b =>
      b.classList.toggle('active', b.dataset.sport === f.sport));
    container.querySelectorAll('[data-audience]').forEach(b =>
      b.classList.toggle('active', b.dataset.audience === f.audience));
    _renderLessons(container, date, f.sport, f.audience);
  }

  container.querySelectorAll('[data-sport]').forEach(btn =>
    btn.addEventListener('click', () => { f.sport = btn.dataset.sport; _applyFilter(); }));
  container.querySelectorAll('[data-audience]').forEach(btn =>
    btn.addEventListener('click', () => { f.audience = btn.dataset.audience; _applyFilter(); }));

  // ── Initial render ────────────────────────────────────────────────────────
  _renderLessons(container, date, f.sport, f.audience);
  _renderStandby(container, date);
}

// ── Tab 2: Plan ───────────────────────────────────────────────────────────────
export function renderSupervisorPlan(container, { session }) {
  const tomorrowDate = dateOffset(todayStr(), 1);
  const f = _planFilter;
  // Reset date if it's in the past (e.g. app left open overnight)
  if (!f.date || f.date < tomorrowDate) f.date = tomorrowDate;

  container.innerHTML = `
    ${pageHead('Plan')}
    <div style="padding:0 20px 16px;">
      <label class="field-label">Date</label>
      <input type="date" class="field-input" id="plan-date"
        value="${f.date}" min="${tomorrowDate}">
    </div>
    ${_filterRow(f.sport, f.audience)}
    <div style="padding:0 20px 32px;display:flex;flex-direction:column;gap:8px;"
      data-lesson-list></div>`;

  function _applyFilter() {
    container.querySelectorAll('[data-sport]').forEach(b =>
      b.classList.toggle('active', b.dataset.sport === f.sport));
    container.querySelectorAll('[data-audience]').forEach(b =>
      b.classList.toggle('active', b.dataset.audience === f.audience));
    _renderLessons(container, f.date, f.sport, f.audience);
  }

  container.querySelector('#plan-date')?.addEventListener('change', e => {
    if (e.target.value) { f.date = e.target.value; _renderLessons(container, f.date, f.sport, f.audience); }
  });
  container.querySelectorAll('[data-sport]').forEach(btn =>
    btn.addEventListener('click', () => { f.sport = btn.dataset.sport; _applyFilter(); }));
  container.querySelectorAll('[data-audience]').forEach(btn =>
    btn.addEventListener('click', () => { f.audience = btn.dataset.audience; _applyFilter(); }));

  _renderLessons(container, f.date, f.sport, f.audience);
}

// ── Tab 3: Instructors ────────────────────────────────────────────────────────
export function renderSupervisorInstructors(container, { session }) {
  let searchQuery = '';

  function render() {
    const today      = todayStr();
    const allUsers    = DB.getUsers();
    const instructors = allUsers.filter(u => u.role === 'instructor');
    const dayLessons  = DB.getLessonsByDate(today);

    const loadByInst = {};
    dayLessons.forEach(l => {
      if (l.instructorId) loadByInst[l.instructorId] = (loadByInst[l.instructorId] || 0) + 1;
    });

    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? instructors.filter(i => i.name.toLowerCase().includes(q))
      : instructors;

    // Group by first letter of first name, A-Z
    const groups = {};
    [...filtered].sort((a, b) => {
      const fa = a.name.split(' ')[0].toLowerCase();
      const fb = b.name.split(' ')[0].toLowerCase();
      return fa.localeCompare(fb);
    }).forEach(inst => {
      const letter = inst.name.split(' ')[0][0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(inst);
    });
    const letters = Object.keys(groups).sort();

    container.innerHTML = `
      ${pageHead('Instructors')}
      <div style="padding:0 20px 12px;">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;
          background:var(--bg-section-soft);border:1px solid var(--line-soft);border-radius:12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            style="flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="inst-search" value="${searchQuery.replace(/"/g, '&quot;')}"
            placeholder="Search instructors…"
            style="background:none;border:none;outline:none;flex:1;
            font-family:'Inter',sans-serif;font-size:14px;color:#1E2643;">
        </div>
      </div>
      <div style="padding:0 28px 32px 20px;">
        ${filtered.length === 0
          ? emptyState('👤', q ? 'No results' : 'No instructors yet',
              q ? `No instructor matches "${searchQuery}".` : 'Tap + to add your first instructor.')
          : letters.map(letter => `
              <div id="inst-group-${letter}" style="scroll-margin-top:72px;">
                ${secLabel(letter)}
                <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
                  ${groups[letter].map(inst => {
                    const load = loadByInst[inst.id] || 0;
                    return `
                      <div class="glass-strong" style="border-radius:14px;overflow:hidden;">
                        <div class="inst-card" data-iid="${inst.id}"
                          style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;">
                          ${av(inst.avatar, 'md')}
                          <div style="flex:1;">
                            <div style="font-weight:600;font-size:15px;color:#000;">${inst.name}</div>
                            <div style="font-size:13px;color:#777;margin-top:2px;">
                              ${load} session${load !== 1 ? 's' : ''} today
                              ${load === 0 ? '<span style="color:#088A20;font-weight:500;"> · Free</span>' : ''}
                            </div>
                          </div>
                          <div style="color:#CCC;">${iChevR()}</div>
                        </div>
                      </div>`;
                  }).join('')}
                </div>
              </div>`).join('')}
      </div>`;

    // Add instructor button in header (left of avatar)
    const headTitleRow = container.querySelector('.page-head > div');
    if (headTitleRow) {
      headTitleRow.style.alignItems = 'center';
      const addBtn = document.createElement('button');
      addBtn.id = 'add-inst';
      addBtn.style.cssText = 'flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent;';
      addBtn.title = 'Add Instructor';
      addBtn.innerHTML = `<div style="width:40px;height:40px;border-radius:50%;background:#1E2643;
        display:inline-flex;align-items:center;justify-content:center;color:#fff;">${iUserPlus()}</div>`;
      headTitleRow.appendChild(addBtn);
    }

    // A-Z index strip (fixed, inside #content so it auto-clears on navigation)
    if (letters.length > 1) {
      const azEl = document.createElement('div');
      azEl.style.cssText = 'position:fixed;right:2px;top:50%;transform:translateY(-50%);z-index:38;' +
        'display:flex;flex-direction:column;align-items:center;padding:6px 0;';
      azEl.innerHTML = letters.map(l =>
        `<button data-az="${l}" style="background:none;border:none;cursor:pointer;
          width:20px;height:20px;padding:0;font-size:10px;font-weight:700;color:#85786f;
          font-family:'Inter',sans-serif;-webkit-tap-highlight-color:transparent;
          user-select:none;line-height:1;letter-spacing:0.3px;transition:color 0.15s;
          display:flex;align-items:center;justify-content:center;border-radius:999px;">${l}</button>`
      ).join('');
      container.appendChild(azEl);

      function getHeadHeight() {
        return container.querySelector('.page-head')?.offsetHeight ?? 72;
      }

      azEl.querySelectorAll('[data-az]').forEach(btn =>
        btn.addEventListener('click', () => {
          const target = document.getElementById(`inst-group-${btn.dataset.az}`);
          if (!target) return;
          const top = target.getBoundingClientRect().top + window.scrollY - getHeadHeight() - 8;
          window.scrollTo({ top, behavior: 'smooth' });
        }));

      // Active-letter indicator: highlight whichever section is at the top
      function updateActive() {
        if (!container.isConnected) return;
        const threshold = window.scrollY + getHeadHeight() + 2;
        let active = letters[0];
        for (const l of letters) {
          const el = document.getElementById(`inst-group-${l}`);
          if (el && el.getBoundingClientRect().top + window.scrollY <= threshold) active = l;
        }
        azEl.querySelectorAll('[data-az]').forEach(btn => {
          const on = btn.dataset.az === active;
          btn.style.color        = on ? '#fff' : '#85786f';
          btn.style.background   = on ? '#1E2643' : 'none';
          btn.style.borderRadius = '999px';
          btn.style.transform    = 'scale(1)';
        });
      }

      updateActive();
      function onScroll() {
        if (!azEl.isConnected) { window.removeEventListener('scroll', onScroll); return; }
        updateActive();
      }
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Search input
    const searchEl = container.querySelector('#inst-search');
    searchEl?.addEventListener('input', e => {
      searchQuery = e.target.value;
      render();
      const input = container.querySelector('#inst-search');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    });

    container.querySelector('#add-inst')?.addEventListener('click', () => _addInstModal(render));
    container.querySelectorAll('.inst-card').forEach(el =>
      el.addEventListener('click', () => navigate(`/supervisor/instructors/${el.dataset.iid}`)));
  }

  render();
}

// ── Instructor detail page ────────────────────────────────────────────────────
export function renderSupervisorInstructorDetail(container, { session, params }) {
  const instId = params.id;

  if (!DB.getUserById(instId)) {
    container.innerHTML = pageHead('Not Found', '', '/supervisor/instructors') +
      emptyState('❓', 'Instructor not found', '');
    return;
  }

  const today = todayStr();

  function weekStartOf(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const day = dt.getDay();
    dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
    return isoDate(dt);
  }

  function fmtShort(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  let weekStart = weekStartOf(today);

  function weekNavHTML() {
    const weekEnd  = dateOffset(weekStart, 6);
    const prevWeek = dateOffset(weekStart, -7);
    const nextWeek = dateOffset(weekStart,  7);
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:10px 20px 14px;">
        <button data-nav-week="${prevWeek}" style="background:none;border:none;cursor:pointer;
          padding:6px 4px;color:#1E2643;font-size:18px;line-height:1;
          -webkit-tap-highlight-color:transparent;">←</button>
        <span style="font-weight:700;font-size:14px;color:#000;">
          ${fmtShort(weekStart)} – ${fmtShort(weekEnd)}
        </span>
        <button data-nav-week="${nextWeek}" style="background:none;border:none;cursor:pointer;
          padding:6px 4px;color:#1E2643;font-size:18px;line-height:1;
          -webkit-tap-highlight-color:transparent;">→</button>
      </div>`;
  }

  function weekListHTML() {
    const allLessons  = DB.getLessonsByInstructor(instId);
    const allTimeOffs = DB.getTimeOffByInstructor(instId);
    const weekEnd     = dateOffset(weekStart, 6);
    const weekDays    = Array.from({ length: 7 }, (_, i) => dateOffset(weekStart, i));

    const lessonsByDate = {};
    const timeOffByDate = {};
    weekDays.forEach(d => { lessonsByDate[d] = []; timeOffByDate[d] = null; });
    allLessons .filter(l => l.date >= weekStart && l.date <= weekEnd).forEach(l => lessonsByDate[l.date]?.push(l));
    allTimeOffs.filter(t => t.date >= weekStart && t.date <= weekEnd).forEach(t => { timeOffByDate[t.date] = t; });

    const WDAY = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return weekDays.map((date, i) => {
      const lessons = lessonsByDate[date];
      const timeOff = timeOffByDate[date];
      const isToday = date === today;
      return `
        <div style="padding-bottom:14px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;
              color:${isToday ? '#1E2643' : '#85786f'};
              text-transform:uppercase;letter-spacing:0.9px;">${WDAY[i]}</span>
            <span style="font-size:11px;color:${isToday ? '#1E2643' : '#aaa'};
              font-weight:${isToday ? '700' : '400'};">${fmtShort(date)}</span>
            ${isToday ? `<span style="font-size:10px;font-weight:700;color:#fff;
              background:#1E2643;border-radius:999px;padding:1px 7px;">Today</span>` : ''}
          </div>
          ${timeOff ? `
            <div style="padding:7px 12px;border-radius:9px;margin-bottom:5px;
              background:rgba(199,83,0,0.06);border:1px solid rgba(199,83,0,0.15);">
              <span style="font-size:12px;color:#875700;font-weight:500;">
                Time off · ${timeOff.status}${timeOff.reason ? ` — ${timeOff.reason}` : ''}
              </span>
            </div>` : ''}
          ${lessons.length === 0 && !timeOff
            ? `<div style="font-size:12px;color:#ccc;padding:2px 0;">Free</div>`
            : lessons.map(l => {
                const t = getTemplate(l.templateId);
                return `
                  <div class="glass-strong" style="display:flex;align-items:center;gap:10px;
                    padding:9px 13px;border-radius:10px;margin-bottom:4px;">
                    <div style="flex:1;">
                      <div style="font-weight:600;font-size:13px;color:#000;">${t?.name ?? l.templateId}</div>
                      ${t ? `<div style="font-size:11px;color:#888;margin-top:1px;">${lessonTimes(t)}</div>` : ''}
                    </div>
                    ${statusBadge(l.status)}
                  </div>`;
              }).join('')}
        </div>`;
    }).join('');
  }

  function renderWeek() {
    const navWrap  = container.querySelector('[data-week-nav]');
    const listWrap = container.querySelector('[data-week-list]');
    if (!navWrap || !listWrap) return;
    navWrap.innerHTML  = weekNavHTML();
    listWrap.innerHTML = weekListHTML();
    const headH = container.querySelector('.page-head')?.offsetHeight ?? 56;
    navWrap.style.cssText = `position:sticky;top:${headH}px;z-index:39;` +
      `background:rgba(247,241,232,0.96);` +
      `backdrop-filter:blur(20px) saturate(1.16);` +
      `-webkit-backdrop-filter:blur(20px) saturate(1.16);` +
      `border-bottom:1px solid rgba(0,0,0,0.06);`;
    container.querySelectorAll('[data-nav-week]').forEach(btn =>
      btn.addEventListener('click', () => { weekStart = btn.dataset.navWeek; renderWeek(); }));
  }

  function render() {
    const inst  = DB.getUserById(instId);
    const allLessons  = DB.getLessonsByInstructor(instId);
    const allTimeOffs = DB.getTimeOffByInstructor(instId);
    const taughtCount  = allLessons.filter(l => l.status === 'reported').length;
    const daysOffCount = allTimeOffs.filter(t => t.status === 'approved').length;

    container.innerHTML = `
      ${pageHead(inst.name, '', '/supervisor/instructors')}

      <div style="display:flex;align-items:center;padding:0 20px;margin-bottom:10px;">
        <span class="sec-label" style="padding:0;">Info</span>
        <button data-edit-btn style="margin-left:auto;background:none;border:none;cursor:pointer;
          font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#1E2643;
          padding:4px 0;-webkit-tap-highlight-color:transparent;">Edit</button>
      </div>
      <div style="padding:0 20px 24px;">
        <div class="glass-strong" style="border-radius:14px;overflow:hidden;">
          <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;
            border-bottom:1px solid rgba(0,0,0,0.06);">
            <span style="font-size:13px;color:#888;width:76px;flex-shrink:0;">Email</span>
            <span style="font-size:14px;color:#000;font-weight:500;">${inst.email}</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;">
            <span style="font-size:13px;color:#888;width:76px;flex-shrink:0;padding-top:1px;">Certs</span>
            <span style="font-size:14px;color:#000;font-weight:500;line-height:1.5;">
              APSI Alpine Level 3<br>CASI Snowboard Level 3
            </span>
          </div>
        </div>
      </div>

      ${secLabel('Stats')}
      <div style="padding:0 20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div class="glass-strong" style="border-radius:14px;padding:16px;">
          <div class="stat-num">${taughtCount}</div>
          <div class="stat-lbl">Lessons Taught</div>
        </div>
        <div class="glass-strong" style="border-radius:14px;padding:16px;cursor:pointer;-webkit-tap-highlight-color:transparent;"
          data-tor-btn>
          <div style="display:flex;align-items:flex-start;justify-content:space-between;">
            <div>
              <div class="stat-num">${daysOffCount}</div>
              <div class="stat-lbl">Days Off</div>
            </div>
            <div style="color:#CCC;margin-top:4px;">${iChevR()}</div>
          </div>
        </div>
      </div>

      ${secLabel('Schedule')}
      <div data-week-nav></div>
      <div data-week-list style="padding:0 20px 40px;"></div>
    `;

    renderWeek();

    container.querySelector('[data-edit-btn]').addEventListener('click', () => {
      const fresh = DB.getUserById(instId);
      if (fresh) _editInstModal(fresh, render);
    });
    container.querySelector('[data-tor-btn]').addEventListener('click', () => _openInstTimeOffModal(instId, render));
  }

  render();
}

// ── Tab 4: School ─────────────────────────────────────────────────────────────
export function renderSupervisorSchool(container, { session }) {
  const pendingCount = DB.getTimeOffPending().length;

  container.innerHTML = `
    ${pageHead('School')}
    <div style="padding:0 20px 32px;display:flex;flex-direction:column;gap:24px;">
      <div class="glass-strong" style="border-radius:16px;overflow:hidden;">
        <a href="#/supervisor/school/templates"
          style="display:flex;align-items:center;gap:14px;padding:16px;text-decoration:none;color:inherit;border-bottom:1px solid rgba(0,0,0,0.06);">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(0,100,200,0.12);
            display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${iClipboard()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:15px;color:#000;">Lesson Templates</div>
            <div style="font-size:13px;color:#888;margin-top:1px;">${TEMPLATES.length} templates</div>
          </div>
          <div style="color:#bbb;display:flex;">${iChevR()}</div>
        </a>
        <a href="#/supervisor/school/timeoff"
          style="display:flex;align-items:center;gap:14px;padding:16px;text-decoration:none;color:inherit;border-bottom:1px solid rgba(0,0,0,0.06);">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(200,80,0,0.1);
            display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${iCalendar()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:15px;color:#000;">Time Off Requests</div>
            <div style="font-size:13px;color:#888;margin-top:1px;">
              ${pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
            </div>
          </div>
          ${pendingCount > 0 ? `
            <div style="min-width:20px;height:20px;border-radius:999px;background:#BF2F17;
              color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;
              justify-content:center;padding:0 5px;">${pendingCount}</div>
          ` : ''}
          <div style="color:#bbb;display:flex;">${iChevR()}</div>
        </a>
        <a href="#/supervisor/school/timesheet"
          style="display:flex;align-items:center;gap:14px;padding:16px;text-decoration:none;color:inherit;">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(0,140,60,0.1);
            display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${iList()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:15px;color:#000;">Instructor Timesheet</div>
            <div style="font-size:13px;color:#888;margin-top:1px;">Monthly export for HR</div>
          </div>
          <div style="color:#bbb;display:flex;">${iChevR()}</div>
        </a>
      </div>
    </div>
  `;
}

export function renderSupervisorSchoolTemplates(container, { session }) {
  container.innerHTML = `
    <div class="page-head page-head-step" data-nav-step="true">
      <div style="display:flex;align-items:center;gap:10px;">
        <a href="#/supervisor/school" style="flex-shrink:0;padding:6px;background:var(--bg-section-soft);border:1px solid var(--line-soft);border-radius:999px;display:inline-flex;color:#1E2643;text-decoration:none;" aria-label="Back">${iBack()}</a>
        <h1 class="page-title page-title-step" style="flex:1;">Lesson Templates</h1>
        <button id="btn-edit-max" style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent;" title="Edit Max Guests">
          <div style="width:40px;height:40px;border-radius:50%;background:#1E2643;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:800;letter-spacing:.5px;">MAX</div>
        </button>
      </div>
    </div>
    <div style="height:16px;"></div>
    <div data-section="templates" style="padding:0 0 32px;"></div>
  `;

  const CATEGORIES = [
    { label: '⛷ Ski Adult',        sport: 'ski',       audience: 'adult' },
    { label: '🏂 Snowboard Adult',  sport: 'snowboard', audience: 'adult' },
    { label: '⛷ Ski Kids',         sport: 'ski',       audience: 'kids'  },
    { label: '🏂 Snowboard Kids',   sport: 'snowboard', audience: 'kids'  },
  ];

  function _render() {
    const el = container.querySelector('[data-section="templates"]');
    if (!el) return;
    el.innerHTML = CATEGORIES.map(cat => {
      const items = TEMPLATES.filter(t => t.sport === cat.sport && t.audience === cat.audience);
      if (!items.length) return '';
      return `
        <div>
          <div style="position:sticky;top:64px;z-index:30;
            display:flex;justify-content:center;padding:16px 0 16px;">
            <span style="display:inline-flex;align-items:center;
              font-size:13px;font-weight:700;color:#1E2643;
              background:rgba(30,38,67,0.09);border-radius:999px;
              padding:6px 16px;letter-spacing:0.01em;
              backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
              ${cat.label}
            </span>
          </div>
          <div style="padding:0 20px 16px;display:flex;flex-direction:column;gap:6px;">
            ${items.map(base => {
              const eff = getTemplate(base.id);
              return `
                <div class="glass-strong" style="border-radius:12px;overflow:hidden;">
                  <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;">
                    <div style="flex:1;min-width:0;">
                      <div style="font-weight:600;font-size:14px;color:#000;">${base.name}</div>
                      <div style="font-size:12px;color:#888;margin-top:2px;">
                        ${base.level} · max ${eff.maxGuests}
                      </div>
                      <div style="font-size:12px;color:#6b625d;margin-top:1px;">
                        AM ${eff.amStart}–${eff.amEnd} · PM ${eff.pmStart}–${eff.pmEnd}
                      </div>
                    </div>
                    <button class="btn btn-ghost btn-xs edit-tmpl" data-tid="${base.id}"
                      title="Edit times & capacity">${iEdit()}</button>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    el.querySelectorAll('.edit-tmpl').forEach(btn =>
      btn.addEventListener('click', () =>
        _openEditTemplate(btn.dataset.tid, _render)));
  }

  _render();
  container.querySelector('#btn-edit-max')?.addEventListener('click', () => _openMaxModal(_render));
}

export function renderSupervisorSchoolTimeOff(container, { session }) {
  container.innerHTML = `
    ${pageHead('Time Off Requests', '', '/supervisor/school')}
    <div data-section="timeoff"></div>
  `;

  function _render() {
    const pending   = DB.getTimeOffPending();
    const history   = DB.getTimeOff()
      .filter(t => t.status !== 'pending')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
    const usersById = Object.fromEntries(DB.getUsers().map(u => [u.id, u]));
    const el = container.querySelector('[data-section="timeoff"]');
    if (!el) return;

    el.innerHTML = `
      ${pending.length === 0 && history.length === 0
        ? `<div style="padding:0 20px 32px;">${emptyState('🏔', 'No requests', 'No time off requests yet.')}</div>`
        : ''}
      ${pending.length > 0 ? `
        ${secLabel(`Pending · ${pending.length}`)}
        <div style="padding:0 20px 16px;display:flex;flex-direction:column;gap:8px;">
          ${pending.map(tor => {
            const inst = usersById[tor.instructorId];
            return `
              <div class="glass-strong" style="border-radius:12px;overflow:hidden;">
                <div style="padding:12px 16px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    ${av(inst?.avatar, 'sm')}
                    <span style="font-weight:600;font-size:14px;color:#000;">${inst?.name ?? '—'}</span>
                    <span style="margin-left:auto;font-size:13px;color:#888;">${fmtDate(tor.date)}</span>
                  </div>
                  ${tor.reason ? `<div style="font-size:13px;color:#555;margin:4px 0 8px 30px;">${tor.reason}</div>` : ''}
                  <div style="display:flex;gap:8px;">
                    <button class="btn btn-sm btn-full" style="background:#088A20;color:#fff;border:none;border-radius:999px;"
                      data-tor-approve="${tor.id}">Approve</button>
                    <button class="btn btn-sm btn-ghost btn-full"
                      style="color:#BF2F17;border-color:rgba(191,47,23,0.25);"
                      data-tor-deny="${tor.id}">Deny</button>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>` : ''}
      ${history.length > 0 ? `
        ${secLabel('History')}
        <div style="padding:0 20px 32px;display:flex;flex-direction:column;gap:6px;">
          ${history.map(tor => {
            const inst = usersById[tor.instructorId];
            return `
              <div class="glass-strong" style="display:flex;align-items:center;gap:10px;
                padding:12px 16px;border-radius:12px;">
                ${av(inst?.avatar, 'sm')}
                <div style="flex:1;">
                  <div style="font-weight:500;font-size:14px;color:#000;">${inst?.name ?? '—'}</div>
                  <div style="font-size:12px;color:#888;">${fmtDate(tor.date)}</div>
                </div>
                ${statusBadge(tor.status)}
              </div>`;
          }).join('')}
        </div>` : ''}
    `;

    el.querySelectorAll('[data-tor-approve]').forEach(btn =>
      btn.addEventListener('click', () => {
        const tor = DB.getTimeOff().find(t => t.id === btn.dataset.torApprove);
        if (!tor) return;
        DB.upsertTimeOff({ ...tor, status: 'approved' });
        toast('Time off approved.', 'success');
        _render();
      }));
    el.querySelectorAll('[data-tor-deny]').forEach(btn =>
      btn.addEventListener('click', () => {
        const tor = DB.getTimeOff().find(t => t.id === btn.dataset.torDeny);
        if (!tor) return;
        DB.upsertTimeOff({ ...tor, status: 'denied' });
        toast('Request denied.', 'info');
        _render();
      }));
  }

  _render();
}

// ── Edit all max guests modal ─────────────────────────────────────────────────
function _openMaxModal(onDone) {
  const CATS = [
    { label: '⛷ Ski Adult',       sport: 'ski',       audience: 'adult' },
    { label: '🏂 Snowboard Adult', sport: 'snowboard', audience: 'adult' },
    { label: '⛷ Ski Kids',        sport: 'ski',       audience: 'kids'  },
    { label: '🏂 Snowboard Kids',  sport: 'snowboard', audience: 'kids'  },
  ];

  const rows = CATS.map(cat => {
    const items = TEMPLATES.filter(t => t.sport === cat.sport && t.audience === cat.audience);
    if (!items.length) return '';
    return `
      <div>
        <div style="display:flex;justify-content:center;padding:16px 0 16px;">
          <span style="display:inline-flex;align-items:center;
            font-size:13px;font-weight:700;color:#1E2643;
            background:rgba(30,38,67,0.09);border-radius:999px;
            padding:6px 16px;letter-spacing:0.01em;
            transform:translateZ(0);
            backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
            ${cat.label}
          </span>
        </div>
        ${items.map(base => {
          const eff = getTemplate(base.id);
          return `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
              <span style="flex:1;font-size:13px;font-weight:600;color:#000;">${base.name}</span>
              <input type="number" class="field-input max-input" data-tid="${base.id}"
                value="${eff.maxGuests}" min="1" max="20"
                style="width:64px;text-align:center;padding:6px 8px;">
            </div>`;
        }).join('')}
      </div>`;
  }).join('');

  const existing = document.getElementById('modal-edit-max');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id        = 'modal-edit-max';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet" style="display:flex;flex-direction:column;overflow:hidden;padding:0;max-height:82vh;">
      <div class="modal-handle-wrap" style="flex-shrink:0;"><div class="modal-handle"></div></div>
      <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 20px 14px;">
        <h3 style="font-family:'Newsreader',serif;font-size:22px;font-weight:700;color:#000;margin:0;">Max Guests</h3>
        <button data-modal-close
          style="background:none;border:none;padding:6px;cursor:pointer;color:#888;border-radius:50%;display:flex;">
          ${iX()}
        </button>
      </div>
      <div style="flex-shrink:0;display:flex;align-items:center;gap:10px;
        padding:10px 20px 14px;border-bottom:1px solid var(--line-soft);">
        <span style="flex:1;font-size:13px;font-weight:600;color:#000;">Apply to all</span>
        <input type="number" id="em-all" class="field-input" min="1" max="20" placeholder="—"
          style="width:64px;text-align:center;padding:6px 8px;">
        <button id="em-apply-all" style="flex-shrink:0;background:#1E2643;color:#fff;border:none;
          border-radius:999px;padding:6px 14px;font-size:12px;font-weight:600;
          cursor:pointer;-webkit-tap-highlight-color:transparent;">Apply</button>
      </div>
      <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;
        overscroll-behavior:contain;padding:0 20px;">
        ${rows}
      </div>
      <div style="flex-shrink:0;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px));
        border-top:1px solid var(--line-soft);">
        <button id="em-save" class="btn btn-primary btn-lg btn-full">Save All</button>
      </div>
    </div>`;

  overlay.querySelector('[data-modal-close]').addEventListener('click', () => {
    overlay.classList.add('closing');
    setTimeout(() => { overlay.remove(); }, 240);
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) { overlay.classList.add('closing'); setTimeout(() => overlay.remove(), 240); }
  });
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.getElementById('em-apply-all')?.addEventListener('click', () => {
      const v = parseInt(document.getElementById('em-all')?.value ?? '', 10);
      if (!isNaN(v) && v >= 1) {
        document.querySelectorAll('.max-input').forEach(inp => { inp.value = String(v); });
      }
    });
    document.getElementById('em-save')?.addEventListener('click', () => {
      document.querySelectorAll('.max-input').forEach(inp => {
        const tid  = inp.dataset.tid;
        const maxG = parseInt(inp.value, 10);
        if (tid && !isNaN(maxG) && maxG >= 1) saveTemplateOverride(tid, { maxGuests: maxG });
      });
      toast('Max guests updated for all templates.', 'success');
      overlay.classList.add('closing');
      setTimeout(() => { overlay.remove(); onDone?.(); }, 240);
    });
  }, 50);
}

// ── Edit template modal ───────────────────────────────────────────────────────
function _openEditTemplate(tid, onDone) {
  const eff = getTemplate(tid);
  if (!eff) return;

  openModal('edit-tmpl', `Edit ${eff.name}`, `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;gap:10px;">
        <div style="flex:1;">
          <label class="field-label">AM Start</label>
          <input type="time" class="field-input" id="et-am-start" value="${eff.amStart}">
        </div>
        <div style="flex:1;">
          <label class="field-label">AM End</label>
          <input type="time" class="field-input" id="et-am-end" value="${eff.amEnd}">
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <div style="flex:1;">
          <label class="field-label">PM Start</label>
          <input type="time" class="field-input" id="et-pm-start" value="${eff.pmStart}">
        </div>
        <div style="flex:1;">
          <label class="field-label">PM End</label>
          <input type="time" class="field-input" id="et-pm-end" value="${eff.pmEnd}">
        </div>
      </div>
      <div>
        <label class="field-label">Max Guests</label>
        <input type="number" class="field-input" id="et-max"
          value="${eff.maxGuests}" min="1" max="20">
      </div>
      <button id="et-save" class="btn btn-primary btn-lg btn-full">Save Changes</button>
    </div>`);

  setTimeout(() => {
    document.getElementById('et-save')?.addEventListener('click', () => {
      const amStart = document.getElementById('et-am-start')?.value;
      const amEnd   = document.getElementById('et-am-end')?.value;
      const pmStart = document.getElementById('et-pm-start')?.value;
      const pmEnd   = document.getElementById('et-pm-end')?.value;
      const maxG    = parseInt(document.getElementById('et-max')?.value ?? '8', 10);
      if (!amStart || !amEnd || !pmStart || !pmEnd || isNaN(maxG)) return;
      saveTemplateOverride(tid, { amStart, amEnd, pmStart, pmEnd, maxGuests: maxG });
      toast(`${eff.name} updated.`, 'success');
      dismissModal('edit-tmpl', onDone);
    });
  }, 50);
}

// ── Instructor CRUD modals ────────────────────────────────────────────────────
function _addInstModal(onDone) {
  openModal('add-inst', 'Add Instructor', `
    <div id="add-err" style="display:none;margin-bottom:12px;"></div>
    <div style="margin-bottom:14px;">
      <label class="field-label">Full name</label>
      <input type="text" class="field-input" id="ai-name" placeholder="Kenji Yamamoto">
    </div>
    <div style="margin-bottom:14px;">
      <label class="field-label">Email</label>
      <input type="email" class="field-input" id="ai-email" placeholder="kenji@snowos.com">
    </div>
    <div style="margin-bottom:24px;">
      <label class="field-label">Password</label>
      <input type="password" class="field-input" id="ai-pw" placeholder="Min. 6 characters">
    </div>
    <button id="ai-save" class="btn btn-primary btn-lg btn-full">Add Instructor</button>`);

  setTimeout(() => {
    document.getElementById('ai-save')?.addEventListener('click', () => {
      const name  = document.getElementById('ai-name')?.value ?? '';
      const email = document.getElementById('ai-email')?.value ?? '';
      const pw    = document.getElementById('ai-pw')?.value ?? '';
      const errEl = document.getElementById('add-err');
      if (!name.trim() || !email.trim() || pw.length < 6) {
        if (errEl) {
          errEl.innerHTML = '<div class="err-box">Please fill all fields (password min 6 chars).</div>';
          errEl.style.display = 'block';
        }
        return;
      }
      if (DB.getUserByEmail(email)) {
        if (errEl) {
          errEl.innerHTML = '<div class="err-box">Email already in use.</div>';
          errEl.style.display = 'block';
        }
        return;
      }
      const newInst = {
        id:       'u-' + Date.now().toString(36),
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        password: pw,
        role:     'instructor',
        avatar:   name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      };
      DB.upsertUser(newInst);
      dismissModal('add-inst', () => { toast(`${newInst.name} added.`, 'success'); onDone(); });
    });
  }, 50);
}

function _editInstModal(inst, onDone) {
  openModal('edit-inst', 'Edit Instructor', `
    <div style="margin-bottom:14px;">
      <label class="field-label">Full name</label>
      <input type="text" class="field-input" id="ei-name" value="${inst.name}">
    </div>
    <div style="margin-bottom:24px;">
      <label class="field-label">Email</label>
      <input type="email" class="field-input" id="ei-email" value="${inst.email}" disabled>
    </div>
    <button id="ei-save" class="btn btn-primary btn-lg btn-full">Save Changes</button>`);

  setTimeout(() => {
    document.getElementById('ei-save')?.addEventListener('click', () => {
      const name = document.getElementById('ei-name')?.value ?? '';
      if (!name.trim()) return;
      DB.upsertUser({
        ...inst,
        name:   name.trim(),
        avatar: name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      });
      dismissModal('edit-inst', () => { toast('Instructor updated.', 'success'); onDone(); });
    });
  }, 50);
}

function _openInstTimeOffModal(instId, onRefresh) {
  const ORDER = ['pending', 'approved', 'denied', 'cancelled'];
  const STATUS_COLOR = { pending: '#875700', approved: '#088A20', denied: '#BF2F17', cancelled: '#999' };

  function _render() {
    const all    = DB.getTimeOffByInstructor(instId).sort((a, b) => b.date.localeCompare(a.date));
    const groups = ORDER
      .map(key => ({ key, items: all.filter(t => t.status === key) }))
      .filter(g => g.items.length > 0);

    const body = `
      <div style="margin-bottom:16px;">
        <button id="tor-new" class="btn btn-navy btn-md btn-full">
          ${iFlag()} Add &amp; Approve new request
        </button>
      </div>
      ${groups.length === 0
        ? emptyState('📅', 'No requests yet', 'Add a time off request above.')
        : groups.map(g => `
            <div style="margin-bottom:16px;">
              ${secLabel(`${g.key.charAt(0).toUpperCase() + g.key.slice(1)} (${g.items.length})`)}
              <div class="glass-strong" style="border-radius:14px;overflow:hidden;">
                ${g.items.map((t, i) => `
                  <div style="display:flex;align-items:center;gap:10px;padding:11px 16px;
                    ${i > 0 ? 'border-top:1px solid rgba(30,38,67,0.06);' : ''}">
                    <div style="flex:1;">
                      <div style="font-weight:600;font-size:14px;color:#000;">${fmtDate(t.date)}</div>
                      ${t.reason ? `<div style="font-size:12px;color:#888;margin-top:2px;">${t.reason}</div>` : ''}
                    </div>
                    <span style="font-size:12px;font-weight:600;color:${STATUS_COLOR[t.status] ?? '#888'};">
                      ${t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </span>
                  </div>`).join('')}
              </div>
            </div>`).join('')}`;

    openModal('inst-time-off', 'Time Off Requests', body, { onClose: onRefresh });

    setTimeout(() => {
      document.getElementById('tor-new')?.addEventListener('click', () =>
        dismissModal('inst-time-off', () =>
          _torInstModal(instId, () => _openInstTimeOffModal(instId, onRefresh))));
    }, 50);
  }

  _render();
}

// ── Time diff helper (hours between two HH:MM strings) ───────────────────────
function _timeDiff(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 6) / 10;
}

function _torInstModal(instId, onDone) {
  openModal('tor-inst', 'Add Time Off', `
    <div style="margin-bottom:14px;">
      <label class="field-label">Date</label>
      <input type="date" class="field-input" id="tor-date">
    </div>
    <div style="margin-bottom:24px;">
      <label class="field-label">Reason <span style="color:#aaa;font-weight:400;">(optional)</span></label>
      <input type="text" class="field-input" id="tor-reason" placeholder="Illness, personal…">
    </div>
    <button id="tor-save" class="btn btn-primary btn-lg btn-full">Add &amp; Approve</button>`);

  setTimeout(() => {
    const dateEl = document.getElementById('tor-date');
    if (dateEl) dateEl.value = todayStr();
    document.getElementById('tor-save')?.addEventListener('click', () => {
      const date   = document.getElementById('tor-date')?.value ?? '';
      const reason = (document.getElementById('tor-reason')?.value ?? '').trim();
      if (!date) return;
      DB.upsertTimeOff({
        id:           'tor-' + Date.now().toString(36),
        instructorId: instId,
        date,
        status:       'approved',
        reason,
        createdAt:    new Date().toISOString(),
      });
      dismissModal('tor-inst', () => { toast('Time off approved.', 'success'); onDone?.(); });
    });
  }, 50);
}

// ── Instructor Timesheet ──────────────────────────────────────────────────────
export function renderSupervisorSchoolTimesheet(container) {
  const SEASON_MONTHS = [
    { year: 2025, month: 12, label: 'Dec 2025', short: 'dec' },
    { year: 2026, month:  1, label: 'Jan 2026', short: 'jan' },
    { year: 2026, month:  2, label: 'Feb 2026', short: 'feb' },
    { year: 2026, month:  3, label: 'Mar 2026', short: 'mar' },
    { year: 2026, month:  4, label: 'Apr 2026', short: 'apr' },
  ];

  const now = new Date();
  let selected = SEASON_MONTHS.find(
    m => m.year === now.getFullYear() && m.month === now.getMonth() + 1
  ) ?? SEASON_MONTHS[SEASON_MONTHS.length - 1];

  container.innerHTML = `
    ${pageHead('Instructor Timesheet', '', '/supervisor/school')}
    <div data-section="ts-body"></div>
  `;

  function _render() {
    const el = container.querySelector('[data-section="ts-body"]');
    if (!el) return;

    const pad     = n => String(n).padStart(2, '0');
    const fromStr = `${selected.year}-${pad(selected.month)}-01`;
    const lastDay = new Date(selected.year, selected.month, 0).getDate();
    const toStr   = `${selected.year}-${pad(selected.month)}-${pad(lastDay)}`;

    const instructors  = DB.getInstructors().sort((a, b) => a.name.localeCompare(b.name));
    const monthLessons = DB.getLessonsByDateRange(fromStr, toStr)
      .filter(l => l.instructorId);
    const approvedOffs = DB.getTimeOff().filter(
      t => t.status === 'approved' && t.date >= fromStr && t.date <= toStr
    );

    const rows = instructors.map(inst => {
      const lessons    = monthLessons.filter(l => l.instructorId === inst.id);
      const workedDays = new Set(lessons.map(l => l.date)).size;
      const hours      = lessons.reduce((sum, l) => {
        const tmpl = getTemplate(l.templateId);
        if (!tmpl) return sum + 5;
        return sum + _timeDiff(tmpl.amStart, tmpl.amEnd) + _timeDiff(tmpl.pmStart, tmpl.pmEnd);
      }, 0);
      const dayOffs = approvedOffs.filter(t => t.instructorId === inst.id).length;
      return { inst, workedDays, hours: Math.round(hours * 10) / 10, dayOffs };
    });

    el.innerHTML = `
      <div style="padding:0 20px 16px;overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <div style="display:flex;gap:8px;padding-bottom:2px;width:max-content;">
          ${SEASON_MONTHS.map(m => {
            const active = m.year === selected.year && m.month === selected.month;
            return `<button class="ts-month-pill"
              data-year="${m.year}" data-month="${m.month}" data-short="${m.short}" data-label="${m.label}"
              style="padding:7px 16px;border-radius:999px;border:1.5px solid;cursor:pointer;
                font-size:13px;font-weight:600;white-space:nowrap;transition:all 0.15s;
                ${active
                  ? 'background:#1E2643;color:#fff;border-color:#1E2643;'
                  : 'background:rgba(255,255,255,0.7);color:#555;border-color:rgba(0,0,0,0.15);'}">
              ${m.label}
            </button>`;
          }).join('')}
        </div>
      </div>

      <div style="padding:0 20px 16px;">
        <div class="glass-strong" style="border-radius:14px;overflow:hidden;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1.5px solid rgba(30,38,67,0.1);">
                <th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;
                  color:#888;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;">
                  Instructor
                </th>
                <th style="text-align:center;padding:10px 10px;font-size:11px;font-weight:700;
                  color:#888;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;">
                  Days
                </th>
                <th style="text-align:center;padding:10px 10px;font-size:11px;font-weight:700;
                  color:#888;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;">
                  Hours
                </th>
                <th style="text-align:center;padding:10px 12px 10px 6px;font-size:11px;font-weight:700;
                  color:#888;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;">
                  Day Offs
                </th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr style="${i > 0 ? 'border-top:1px solid rgba(30,38,67,0.06);' : ''}">
                  <td style="padding:10px 16px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      ${av(r.inst.avatar, 'xs')}
                      <span style="font-size:13px;font-weight:600;color:#000;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;">
                        ${r.inst.name}
                      </span>
                    </div>
                  </td>
                  <td style="text-align:center;padding:10px;">
                    <span style="font-size:15px;font-weight:700;
                      color:${r.workedDays > 0 ? '#000' : '#ddd'};">
                      ${r.workedDays}
                    </span>
                  </td>
                  <td style="text-align:center;padding:10px;">
                    <span style="font-size:15px;font-weight:700;
                      color:${r.hours > 0 ? '#000' : '#ddd'};">
                      ${r.hours}h
                    </span>
                  </td>
                  <td style="text-align:center;padding:10px 12px 10px 6px;">
                    <span style="font-size:15px;font-weight:700;
                      color:${r.dayOffs > 0 ? '#BF2F17' : '#ddd'};">
                      ${r.dayOffs}
                    </span>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="height:80px;"></div>
    `;

    // Floating export bar (rendered outside scroll area so it stays fixed)
    const existingBar = container.querySelector('[data-ts-export-bar]');
    const isFirstRender = !existingBar;
    if (existingBar) existingBar.remove();
    const bar = document.createElement('div');
    bar.setAttribute('data-ts-export-bar', '');
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:50;' +
      'padding:12px 20px 28px;background:linear-gradient(to bottom,transparent,rgba(244,240,235,0.97) 30%);' +
      'will-change:transform,opacity;';
    bar.innerHTML = `
      <button id="ts-export" class="btn btn-primary btn-lg btn-full"
        style="display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 20px rgba(30,38,67,0.22);">
        ${iDownload()}
        Export ${selected.label} CSV
      </button>`;
    container.appendChild(bar);
    if (isFirstRender) {
      bar.style.transform = 'translateY(110%)';
      bar.style.opacity   = '0';
      requestAnimationFrame(() => {
        bar.style.transition = 'transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.42s cubic-bezier(0.22,1,0.36,1)';
        bar.style.transform  = 'translateY(0)';
        bar.style.opacity    = '1';
      });
    }

    el.querySelectorAll('.ts-month-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        selected = {
          year:  +btn.dataset.year,
          month: +btn.dataset.month,
          short: btn.dataset.short,
          label: btn.dataset.label,
        };
        _render();
      });
    });

    document.getElementById('ts-export')?.addEventListener('click', () => {
      const fileName = `clubmed-tomamu-${selected.year}-${selected.short}-instructor-timesheet.csv`;
      const csvLines = [
        ['Instructor', 'Worked Days', 'Hours', 'Day Offs'],
        ...rows.map(r => [r.inst.name, r.workedDays, r.hours, r.dayOffs]),
      ];
      const csv  = csvLines.map(row =>
        row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(`Downloaded ${selected.label} timesheet`, 'success');
    });
  }

  _render();
}
