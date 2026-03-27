import { DB, TEMPLATES, getTemplate, saveTemplateOverride, isoDate } from '../data.js';
import { navigate } from '../app.js';
import {
  toast, pageHead, statusBadge, sportBadge, audienceBadge, av, secLabel,
  emptyState, openModal, dismissModal, fmtDate, fmtDateLong, todayStr, lessonTimes,
  iPlus, iCheck, iChevR, iWarn, iEdit, iUserPlus,
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

  openModal('transfer-inst', 'Swap Instructor With', `
    <p style="font-size:13px;color:#888;margin:0 0 12px;">
      Select a lesson to swap instructors with:
    </p>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${swappable.map(l => {
        const t = getTemplate(l.templateId);
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
    </div>`);

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

// ── Tab 1: Today ──────────────────────────────────────────────────────────────
export function renderSupervisorToday(container, { session }) {
  const date = todayStr();
  const f = _todayFilter;

  container.innerHTML = `
    ${pageHead('Today', fmtDateLong(date))}
    ${_filterRow(f.sport, f.audience)}
    <div style="padding:0 20px 32px;display:flex;flex-direction:column;gap:8px;"
      data-lesson-list></div>`;

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

  _renderLessons(container, date, f.sport, f.audience);
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
  function render() {
    const today = todayStr();
    const allUsers    = DB.getUsers();
    const instructors = allUsers.filter(u => u.role === 'instructor');
    const dayLessons  = DB.getLessonsByDate(today);

    const loadByInst = {};
    dayLessons.forEach(l => {
      if (l.instructorId) loadByInst[l.instructorId] = (loadByInst[l.instructorId] || 0) + 1;
    });

    container.innerHTML = `
      ${pageHead('Instructors')}
      <div style="padding:0 20px 16px;">
        <button id="add-inst" class="btn btn-navy btn-md btn-full">
          ${iUserPlus()} Add Instructor
        </button>
      </div>
      ${secLabel(`Team (${instructors.length})`)}
      <div style="padding:0 20px 32px;display:flex;flex-direction:column;gap:8px;">
        ${instructors.length === 0
          ? emptyState('👤', 'No instructors yet', 'Add your first instructor above.')
          : instructors.map(inst => {
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
                    <div style="display:flex;gap:8px;align-items:center;">
                      <button class="btn btn-ghost btn-xs edit-inst" data-id="${inst.id}"
                        title="Edit">${iEdit()}</button>
                      <div style="color:#CCC;">${iChevR()}</div>
                    </div>
                  </div>
                </div>`;
            }).join('')}
      </div>`;

    container.querySelector('#add-inst')?.addEventListener('click', () => _addInstModal(render));
    container.querySelectorAll('.edit-inst').forEach(btn =>
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const inst = DB.getUserById(btn.dataset.id);
        if (inst) _editInstModal(inst, render);
      }));
    container.querySelectorAll('.inst-card').forEach(el =>
      el.addEventListener('click', () =>
        _openInstSchedule(el.dataset.iid, DB.getUserById(el.dataset.iid))));
  }

  render();
}

// ── Instructor schedule modal (date-navigable) ────────────────────────────────
function _openInstSchedule(instId, inst) {
  let selectedDate = todayStr();

  function bodyHTML() {
    const lessons   = DB.getLessonsByInstructor(instId).filter(l => l.date === selectedDate);
    const timeOffs  = DB.getTimeOffByInstructor(instId).filter(t => t.date === selectedDate);
    const prev = dateOffset(selectedDate, -1);
    const next = dateOffset(selectedDate,  1);
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <button data-nav="${prev}"
          style="background:none;border:none;cursor:pointer;padding:8px 10px;
          color:#1E2643;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;">
          ← ${fmtDate(prev).split(',')[0]}
        </button>
        <span style="font-weight:700;font-size:14px;color:#000;">${fmtDate(selectedDate)}</span>
        <button data-nav="${next}"
          style="background:none;border:none;cursor:pointer;padding:8px 10px;
          color:#1E2643;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;">
          ${fmtDate(next).split(',')[0]} →
        </button>
      </div>
      ${timeOffs.length > 0 ? `
        <div style="padding:10px 14px;border-radius:10px;margin-bottom:10px;
          background:rgba(199,83,0,0.06);border:1px solid rgba(199,83,0,0.15);">
          <span style="font-size:13px;color:#875700;font-weight:500;">
            Time off · ${timeOffs[0].status}
            ${timeOffs[0].reason ? ` — ${timeOffs[0].reason}` : ''}
          </span>
        </div>` : ''}
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${lessons.length === 0 && timeOffs.length === 0
          ? `<div style="text-align:center;padding:24px;color:#888;font-size:14px;">
              No lessons scheduled</div>`
          : lessons.map(l => {
              const t = getTemplate(l.templateId);
              return `
                <div class="glass-strong" style="display:flex;align-items:center;gap:12px;
                  padding:12px 16px;border-radius:12px;">
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:14px;color:#000;">${t?.name ?? l.templateId}</div>
                    <div style="font-size:12px;color:#888;margin-top:2px;">
                      ${t ? lessonTimes(t) : ''}
                    </div>
                  </div>
                  ${statusBadge(l.status)}
                </div>`;
            }).join('')}
      </div>`;
  }

  function attachNav() {
    setTimeout(() => {
      document.querySelectorAll('[data-nav]').forEach(btn =>
        btn.addEventListener('click', () => {
          selectedDate = btn.dataset.nav;
          const bodyEl = document.getElementById('modal-inst-schedule-body');
          if (bodyEl) { bodyEl.innerHTML = bodyHTML(); attachNav(); }
        }));
    }, 50);
  }

  openModal('inst-schedule', inst?.name ?? 'Schedule', bodyHTML());
  attachNav();
}

// ── Tab 4: School ─────────────────────────────────────────────────────────────
export function renderSupervisorSchool(container, { session }) {

  // Build skeleton once — two independent update slots
  container.innerHTML = `
    ${pageHead('School')}
    ${secLabel('Lesson Templates')}
    <div data-section="templates"
      style="padding:0 20px 28px;display:flex;flex-direction:column;gap:6px;"></div>
    <div data-section="timeoff"></div>
  `;

  function _renderTemplates() {
    const el = container.querySelector('[data-section="templates"]');
    if (!el) return;
    el.innerHTML = TEMPLATES.map(base => {
      const eff = getTemplate(base.id);
      return `
        <div class="glass-strong" style="border-radius:12px;overflow:hidden;">
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:14px;color:#000;">${base.name}</div>
              <div style="font-size:12px;color:#888;margin-top:2px;">
                ${base.sport === 'ski' ? '⛷' : '🏂'} ${base.audience} · ${base.level}
                · max ${eff.maxGuests}
              </div>
              <div style="font-size:12px;color:#6b625d;margin-top:1px;">
                AM ${eff.amStart}–${eff.amEnd} · PM ${eff.pmStart}–${eff.pmEnd}
              </div>
            </div>
            <button class="btn btn-ghost btn-xs edit-tmpl" data-tid="${base.id}"
              title="Edit times & capacity">${iEdit()}</button>
          </div>
        </div>`;
    }).join('');

    el.querySelectorAll('.edit-tmpl').forEach(btn =>
      btn.addEventListener('click', () =>
        _openEditTemplate(btn.dataset.tid, () => { _renderTemplates(); _renderTimeOff(); })));
  }

  function _renderTimeOff() {
    const pending   = DB.getTimeOffPending();
    const history   = DB.getTimeOff()
      .filter(t => t.status !== 'pending')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
    const usersById = Object.fromEntries(DB.getUsers().map(u => [u.id, u]));
    const el = container.querySelector('[data-section="timeoff"]');
    if (!el) return;

    el.innerHTML = `
      ${secLabel(`Time Off Requests${pending.length > 0 ? ` · ${pending.length} pending` : ''}`)}
      ${pending.length === 0 && history.length === 0
        ? `<div style="padding:0 20px 32px;">${emptyState('🏔', 'No requests', 'No time off requests yet.')}</div>`
        : ''}
      ${pending.length > 0 ? `
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
        _renderTimeOff();
      }));
    el.querySelectorAll('[data-tor-deny]').forEach(btn =>
      btn.addEventListener('click', () => {
        const tor = DB.getTimeOff().find(t => t.id === btn.dataset.torDeny);
        if (!tor) return;
        DB.upsertTimeOff({ ...tor, status: 'denied' });
        toast('Request denied.', 'info');
        _renderTimeOff();
      }));
  }

  _renderTemplates();
  _renderTimeOff();
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
