import { DB, TEMPLATES, getTemplate, isoDate } from '../data.js';
import { navigate } from '../app.js';
import {
  toast, pageHead, statusBadge, sportBadge, av, secLabel,
  emptyState, fmtDate, fmtDateLong, todayStr,
  lessonTimes, iCalendar, iChevR, iClipboard, iCheck,
  iBack, iX, openModal, closeModal,
} from '../ui.js';

// ── Instructor Dashboard ──────────────────────────────────────────────────────
export function renderInstructorDashboard(container, { session }) {
  const today   = todayStr();
  const lessons = DB.getLessonsByInstructor(session.id)
    .filter(l => l.date === today)
    .sort((a,b) => a.session.localeCompare(b.session));

  container.innerHTML = `
    ${pageHead('Today\'s Sessions', fmtDateLong(today))}

    <div style="padding:0 20px 8px;">${secLabel('Today\'s Schedule')}</div>
    <div style="padding:0 12px 20px;display:flex;flex-direction:column;gap:8px;" id="today-list">
      ${lessons.length === 0
        ? emptyState('🎿', 'No sessions today', 'Check your schedule for upcoming assignments.')
        : lessons.map(l => _instructorLessonCard(l, session.id)).join('')}
    </div>

  `;

  container.querySelectorAll('[data-lesson-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lesson = DB.getLessonById(btn.dataset.lessonId);
      if (lesson) _openInstructorLessonModal(lesson, session);
    });
  });

  container.querySelectorAll('[data-report-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lesson = DB.getLessonById(btn.dataset.reportId);
      if (lesson) openReportModal(lesson, session);
    });
  });
}

function _instructorLessonCard(lesson, instructorId) {
  const tmpl       = getTemplate(lesson.templateId);
  const bkgs       = DB.getConfirmedByLesson(lesson.id);
  const guestList  = bkgs.map(b => ({ ...b, guest: DB.getUserById(b.guestId) }));
  const guestCount = guestList.length;
  const maxGuests  = tmpl?.maxGuests ?? null;
  const report     = DB.getReportByLesson(lesson.id);
  const needsReport = lesson.status !== 'scheduled' && !report;

  return `
    <div class="glass" style="border-radius:16px;overflow:hidden;">
      <!-- Card body — clickable, opens detail modal -->
      <div data-lesson-id="${lesson.id}" style="padding:22px;cursor:pointer;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
          <span class="badge badge-in-progress" style="font-size:12px;padding:5px 14px;">Today</span>
          ${statusBadge(lesson.status)}
        </div>
        <div style="font-family:'Newsreader',serif;font-size:26px;font-weight:700;color:#000;
          margin-bottom:8px;line-height:1.2;">
          ${tmpl ? tmpl.name : lesson.templateId}
        </div>
        <div style="font-size:15px;color:#333;font-weight:500;margin-bottom:4px;">
          ${tmpl ? lessonTimes(tmpl) : ''}
        </div>
        <div style="font-size:14px;color:#777;">
          ${guestCount}${maxGuests ? ` / ${maxGuests}` : ''} guest${guestCount !== 1 ? 's' : ''} confirmed
        </div>
        <div class="div" style="margin:18px 0;"></div>
        ${guestCount > 0 ? `
        <div style="display:flex;align-items:center;gap:-6px;flex-wrap:wrap;gap:6px;">
          ${guestList.slice(0, 6).map(b => av((b.guest?.name ?? '?').slice(0, 2))).join('')}
          ${guestCount > 6 ? `<span style="font-size:13px;color:#888;margin-left:2px;">+${guestCount - 6} more</span>` : ''}
        </div>` : `
        <div style="font-size:14px;color:#aaa;font-style:italic;">No guests confirmed yet</div>`}
      </div>
      ${needsReport ? `
        <button data-report-id="${lesson.id}"
          style="display:flex;align-items:center;gap:8px;padding:13px 22px;width:100%;
          background:rgba(253,190,0,0.1);border:none;border-top:1px solid rgba(253,190,0,0.18);
          cursor:pointer;color:#875700;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;">
          ${iClipboard()} Submit lesson report
        </button>` : report ? `
        <div style="display:flex;align-items:center;gap:8px;padding:12px 22px;
          background:var(--bg-success-soft);border-top:1px solid rgba(8,138,32,0.12);
          color:#076b1a;font-size:13px;font-weight:500;">
          ${iCheck()} Report submitted
        </div>` : ''}
    </div>`;
}

// ── Instructor Lesson Detail Modal ────────────────────────────────────────────
function _openInstructorLessonModal(lesson, session) {
  const tmpl  = getTemplate(lesson.templateId);
  const report = DB.getReportByLesson(lesson.id);
  const bkgs  = DB.getConfirmedByLesson(lesson.id);
  const guests = bkgs.map(b => ({ ...b, guest: DB.getUserById(b.guestId) }));
  const needsReport = lesson.status !== 'scheduled' && !report;
  const spotsLabel = tmpl ? `${guests.length} of ${tmpl.maxGuests} spots filled` : null;

  openModal('instructor-lesson-detail', tmpl ? tmpl.name : lesson.id, `
    <div style="display:flex;flex-direction:column;gap:16px;">

      <div class="glass" style="padding:16px;border-radius:14px;">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#888;">Schedule</span>
            <span style="font-weight:600;color:#000;text-align:right;">${tmpl ? lessonTimes(tmpl) : '—'}</span>
          </div>
          <div class="div"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#888;">Status</span>
            <span>${statusBadge(lesson.status)}</span>
          </div>
          ${tmpl ? `
          <div class="div"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#888;">Sport</span>
            <span style="font-weight:600;color:#000;">${tmpl.sport === 'ski' ? '⛷ Ski' : '🏂 Snowboard'}</span>
          </div>` : ''}
          ${spotsLabel ? `
          <div class="div"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#888;">Group size</span>
            <span style="font-weight:600;color:#000;text-align:right;">${spotsLabel}</span>
          </div>` : ''}
        </div>
      </div>

      ${guests.length > 0 ? `
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8A6B53;margin-bottom:10px;">Guests</div>
        <div class="glass" style="border-radius:14px;overflow:hidden;">
          ${guests.map((b, i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;
              ${i > 0 ? 'border-top:1px solid rgba(30,38,67,0.06);' : ''}">
              ${av((b.guest?.name ?? '?').slice(0,2))}
              <div style="font-weight:600;font-size:14px;color:#000;">${b.guest?.name ?? 'Guest'}</div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      ${needsReport ? `
      <button id="modal-report-btn"
        style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;width:100%;
        background:rgba(253,190,0,0.1);border:none;border-radius:14px;cursor:pointer;color:#875700;
        font-size:14px;font-weight:600;font-family:'Inter',sans-serif;text-align:left;">
        <span style="display:flex;align-items:center;gap:8px;">${iClipboard()} Submit lesson report</span>
        <span style="color:#B07A00;">${iChevR()}</span>
      </button>` : report ? `
      <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;
        background:var(--bg-success-soft);border-radius:14px;color:#076b1a;font-size:14px;font-weight:500;">
        ${iCheck()} Report submitted on ${new Date(report.submittedAt).toLocaleDateString()}
      </div>` : ''}

    </div>
  `);

  document.getElementById('modal-report-btn')?.addEventListener('click', () => {
    closeModal('instructor-lesson-detail');
    openReportModal(lesson, session);
  });
}

// ── My Schedule ───────────────────────────────────────────────────────────────
export function renderMySchedule(container, { session }) {
  const today      = todayStr();
  let selDate      = today;
  const allLessons = DB.getLessonsByInstructor(session.id);
  const lessonDates = new Set(allLessons.map(l => l.date));

  // Build date range: Sunday before (today − 7d) through today + 84d
  function _sunOf(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - d.getDay());
    return d;
  }
  const rangeStart = _sunOf(today);
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(today + 'T00:00:00');
  rangeEnd.setDate(rangeEnd.getDate() + 84);

  const dates = [];
  const cur = new Date(rangeStart);
  while (cur <= rangeEnd) { dates.push(isoDate(cur)); cur.setDate(cur.getDate() + 1); }

  function _monthLabel(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  container.innerHTML = `
    ${pageHead('My Schedule')}

    <div style="padding:0 20px 16px;">
      <div class="glass" id="date-picker" style="border-radius:16px;background:var(--bg-section);padding:14px 16px;">

        <!-- Header: month label + Today button -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div id="sched-month" style="font-size:12px;font-weight:700;letter-spacing:0.08em;
            text-transform:uppercase;color:#8A6B53;">${_monthLabel(today)}</div>
          <button id="sched-today-btn" style="font-size:12px;font-weight:600;color:#1E2643;
            background:rgba(30,38,67,0.07);border:none;padding:5px 12px;border-radius:999px;
            cursor:pointer;font-family:'Inter',sans-serif;">Today</button>
        </div>

        <!-- Fixed DOW row (always Sun–Sat since we snap to Sundays) -->
        <div style="display:flex;margin-bottom:4px;">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(dow => `
            <div class="date-chip-dow" style="width:var(--date-cell-w,calc((100vw - 72px)/7));
              text-align:center;flex-shrink:0;">${dow}</div>
          `).join('')}
        </div>

        <!-- Horizontally scrollable date row, snaps to every Sunday -->
        <div id="sched-date-row" class="sx" style="display:flex;scroll-snap-type:x mandatory;">
          ${dates.map(d => {
            const date = new Date(d + 'T00:00:00');
            const isSun  = date.getDay() === 0;
            const isToday = d === today;
            const isSel   = d === selDate;
            const hasDot  = lessonDates.has(d);
            const isFirst = date.getDate() === 1;
            const mon = date.toLocaleDateString('en-US', { month: 'short' });
            return `
              <div class="sched-date-cell${isSel ? ' sel' : ''}${isToday && !isSel ? ' tod' : ''}"
                data-date="${d}"
                style="width:var(--date-cell-w,calc((100vw - 72px)/7));${isSun ? 'scroll-snap-align:start;' : ''}">
                <div class="scd-num">${date.getDate()}</div>
                <div class="scd-month-hint" style="${!isFirst ? 'visibility:hidden;' : ''}">${mon}</div>
                ${hasDot ? '<div class="scd-dot"></div>' : '<div style="height:8px;"></div>'}
              </div>`;
          }).join('')}
        </div>

      </div>
    </div>

    <!-- Lesson list -->
    <div style="padding:0 20px 8px;">
      <div id="sched-date-label" style="font-size:11px;font-weight:700;text-transform:uppercase;
        letter-spacing:0.08em;color:#8A6B53;">${fmtDateLong(today)}</div>
    </div>
    <div id="sched-lessons" style="padding:0 20px 32px;display:flex;flex-direction:column;gap:8px;"></div>
  `;

  const pickerEl   = container.querySelector('#date-picker');
  const dateRowEl  = container.querySelector('#sched-date-row');
  const monthEl    = container.querySelector('#sched-month');
  const dateLabelEl = container.querySelector('#sched-date-label');

  // Set exact cell width from the scroll row's rendered width (no Math.floor — exact division)
  requestAnimationFrame(() => {
    const cellW = dateRowEl.clientWidth / 7;
    container.style.setProperty('--date-cell-w', cellW + 'px');
    _scrollToSundayOf(today);
  });

  function _scrollToSundayOf(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - d.getDay());
    const cell = dateRowEl.querySelector(`[data-date="${isoDate(d)}"]`);
    if (cell) dateRowEl.scrollLeft = cell.offsetLeft;
  }

  function _renderLessons() {
    const el = container.querySelector('#sched-lessons');
    if (!el) return;
    const dayLessons = allLessons
      .filter(l => l.date === selDate)
      .sort((a, b) => a.session.localeCompare(b.session));
    el.innerHTML = dayLessons.length === 0
      ? emptyState('😌', 'Rest day', 'No sessions scheduled.')
      : dayLessons.map(l => _schedLessonCard(l)).join('');
    el.querySelectorAll('[data-lesson-id]').forEach(el => {
      el.addEventListener('click', () => {
        const lesson = DB.getLessonById(el.dataset.lessonId);
        if (lesson) _openInstructorLessonModal(lesson, session);
      });
    });
    el.querySelectorAll('[data-report-id]').forEach(el => {
      el.addEventListener('click', () => {
        const lesson = DB.getLessonById(el.dataset.reportId);
        if (lesson) openReportModal(lesson, session);
      });
    });
  }

  function _selectDate(dateStr) {
    const prev = dateRowEl.querySelector('.sched-date-cell.sel');
    if (prev) {
      prev.classList.remove('sel');
      if (prev.dataset.date === today) prev.classList.add('tod');
    }
    const next = dateRowEl.querySelector(`[data-date="${dateStr}"]`);
    if (next) { next.classList.remove('tod'); next.classList.add('sel'); }
    selDate = dateStr;
    if (dateLabelEl) dateLabelEl.textContent = fmtDateLong(dateStr);
    _renderLessons();
  }

  // Update month label on scroll
  dateRowEl.addEventListener('scroll', () => {
    const sl = dateRowEl.scrollLeft;
    for (const cell of dateRowEl.querySelectorAll('.sched-date-cell')) {
      if (cell.offsetLeft >= sl - 2) {
        if (monthEl) monthEl.textContent = _monthLabel(cell.dataset.date);
        break;
      }
    }
  }, { passive: true });

  // Date cell taps
  dateRowEl.querySelectorAll('.sched-date-cell').forEach(cell => {
    cell.addEventListener('click', () => _selectDate(cell.dataset.date));
  });

  // Today button
  container.querySelector('#sched-today-btn').addEventListener('click', () => {
    _selectDate(today);
    _scrollToSundayOf(today);
  });

  _renderLessons();
}

// ── Schedule lesson card (compact, not the same as today-tab expanded card) ───
function _schedLessonCard(lesson) {
  const tmpl       = getTemplate(lesson.templateId);
  const bkgs       = DB.getConfirmedByLesson(lesson.id);
  const guestCount = bkgs.length;
  const maxGuests  = tmpl?.maxGuests ?? null;
  const report     = DB.getReportByLesson(lesson.id);
  const needsReport = lesson.status !== 'scheduled' && !report;

  return `
    <div class="glass-strong" style="border-radius:12px;overflow:hidden;">
      <div data-lesson-id="${lesson.id}" style="padding:14px 16px;cursor:pointer;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:5px;">
          <div style="font-family:'Newsreader',serif;font-size:18px;font-weight:700;color:#000;
            line-height:1.2;flex:1;min-width:0;">
            ${tmpl ? tmpl.name : lesson.templateId}
          </div>
          ${statusBadge(lesson.status)}
        </div>
        <div style="font-size:13px;color:#666;">
          ${tmpl ? lessonTimes(tmpl) : ''}${guestCount > 0 ? ` · ${guestCount}${maxGuests ? `/${maxGuests}` : ''} guest${guestCount !== 1 ? 's' : ''}` : ''}
        </div>
      </div>
      ${needsReport ? `
        <button data-report-id="${lesson.id}"
          style="display:flex;align-items:center;gap:8px;padding:10px 16px;width:100%;
          background:rgba(253,190,0,0.1);border:none;border-top:1px solid rgba(253,190,0,0.18);
          cursor:pointer;color:#875700;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;">
          ${iClipboard()} Submit report
        </button>` : report ? `
        <div style="display:flex;align-items:center;gap:8px;padding:9px 16px;
          background:var(--bg-success-soft);border-top:1px solid rgba(8,138,32,0.12);
          color:#076b1a;font-size:12px;font-weight:500;">
          ${iCheck()} Report submitted
        </div>` : ''}
    </div>`;
}

// ── Lesson Detail (Guest Roster) ──────────────────────────────────────────────
export function renderLessonDetail(container, { params, session }) {
  const lesson = DB.getLessonById(params.id);
  if (!lesson) {
    container.innerHTML = pageHead('Not Found') + emptyState('❓','Lesson not found','');
    return;
  }
  const tmpl   = getTemplate(lesson.templateId);
  const report = DB.getReportByLesson(lesson.id);
  const bkgs   = DB.getConfirmedByLesson(lesson.id);
  const guests = bkgs.map(b => ({ ...b, guest: DB.getUserById(b.guestId) }));

  container.innerHTML = `
    ${pageHead(tmpl ? tmpl.name : lesson.templateId, fmtDateLong(lesson.date), '/instructor/dashboard')}

    <!-- Lesson info card -->
    <div style="padding:0 20px 20px;">
      <div class="glass-strong" style="padding:18px 16px;">
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          ${statusBadge(lesson.status)}
          ${tmpl ? `<span class="badge badge-${tmpl.sport}">${tmpl.sport==='ski'?'⛷ Ski':'🏂 Snowboard'}</span>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
          <div><div style="color:#888;margin-bottom:2px;">Schedule</div>
            <div style="font-weight:600;">${tmpl ? lessonTimes(tmpl) : '—'}</div></div>
          <div><div style="color:#888;margin-bottom:2px;">Date</div>
            <div style="font-weight:600;">${fmtDate(lesson.date)}</div></div>
          <div><div style="color:#888;margin-bottom:2px;">Guests</div>
            <div style="font-weight:600;">${guests.length} / ${tmpl?.maxGuests ?? '—'}</div></div>
        </div>
      </div>
    </div>

    <!-- Report CTA -->
    ${!report && lesson.status !== 'scheduled' ? `
    <div style="padding:0 20px 16px;">
      <button id="report-cta" class="btn btn-primary btn-lg btn-full">
        ${iClipboard()} Submit Lesson Report
      </button>
    </div>` : report ? `
    <div style="padding:0 20px 16px;">
      <div style="background:var(--bg-success-soft);border:1px solid rgba(8,138,32,0.2);
        border-radius:10px;padding:12px 16px;color:#076b1a;font-size:14px;
        display:flex;align-items:center;gap:8px;font-weight:500;">
        ${iCheck()} Report submitted on ${new Date(report.submittedAt).toLocaleDateString()}
      </div>
    </div>` : ''}

    <!-- Guest roster -->
    <div style="padding:0 20px 8px;">${secLabel(`Guest Roster (${guests.length})`)}</div>
    <div style="padding:0 12px 32px;display:flex;flex-direction:column;gap:6px;">
      ${guests.length === 0
        ? emptyState('👤', 'No guests booked', 'This session has no confirmed bookings yet.')
        : guests.map(({ guest }) => `
          <div class="glass" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;">
            ${av(guest?.avatar, 'md')}
            <div style="flex:1;">
              <div style="font-weight:600;font-size:15px;color:#000;">${guest?.name ?? 'Guest'}</div>
              <div style="font-size:13px;color:#777;margin-top:2px;">
                ${guest?.sport ? `${sportBadge(guest.sport)}` : ''}
              </div>
            </div>
          </div>`).join('')}
    </div>
  `;

  container.querySelector('#report-cta')?.addEventListener('click', () => {
    openReportModal(lesson, session);
  });
}

// ── Submit Report (modal) ─────────────────────────────────────────────────────
// Module-level draft (survives re-renders within the same view)
const draft = {
  lessonId: null,
  terrains: new Set(),
  skills:   new Set(),
  guests:   {}, // guestId → { attendance, nextClass, notes }
};

const TERRAINS = [
  { id:'groomed',     label:'Groomed runs' },
  { id:'powder',      label:'Powder' },
  { id:'moguls',      label:'Moguls' },
  { id:'park',        label:'Terrain park' },
  { id:'off-piste',   label:'Off-piste' },
  { id:'icy',         label:'Icy conditions' },
  { id:'trees',       label:'Trees' },
];
const SKILLS = [
  { id:'parallel-turns', label:'Parallel turns' },
  { id:'carving',        label:'Carving' },
  { id:'stopping',       label:'Stopping' },
  { id:'edges',          label:'Edge control' },
  { id:'speed-control',  label:'Speed control' },
  { id:'terrain-read',   label:'Terrain reading' },
  { id:'jumps',          label:'Jumps' },
];

function openReportModal(lesson, session) {
  const MODAL_ID = 'lesson-report';

  // Reset draft if this is a different lesson
  if (draft.lessonId !== lesson.id) {
    draft.lessonId = lesson.id;
    draft.terrains = new Set();
    draft.skills   = new Set();
    draft.guests   = {};
    const existing = DB.getReportByLesson(lesson.id);
    if (existing) {
      existing.terrains.forEach(t => draft.terrains.add(t));
      existing.skills.forEach(s => draft.skills.add(s));
      existing.guestReports.forEach(gr => { draft.guests[gr.guestId] = { ...gr }; });
    }
  }

  const tmpl   = getTemplate(lesson.templateId);
  const bkgs   = DB.getConfirmedByLesson(lesson.id);
  const guests = bkgs.map(b => ({ ...b, guest: DB.getUserById(b.guestId) }));

  guests.forEach(({ guestId }) => {
    if (!draft.guests[guestId]) draft.guests[guestId] = { attendance: 'BOTH', nextClass: '', notes: '' };
  });

  document.getElementById(`modal-${MODAL_ID}`)?.remove();

  const overlay = document.createElement('div');
  overlay.id        = `modal-${MODAL_ID}`;
  overlay.className = 'modal-overlay';

  const sameType = TEMPLATES.filter(t => t.sport === tmpl?.sport && t.audience === tmpl?.audience);

  function buildBody() {
    return `
      <!-- Terrains -->
      <div style="padding:0 2px 6px;">${secLabel('Terrains covered')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
        ${TERRAINS.map(t => `
          <label class="check-pill${draft.terrains.has(t.id) ? ' checked' : ''}">
            <input type="checkbox" data-group="terrain" value="${t.id}"
              ${draft.terrains.has(t.id) ? 'checked' : ''}>
            ${draft.terrains.has(t.id) ? '✓ ' : ''}${t.label}
          </label>`).join('')}
      </div>

      <!-- Skills -->
      <div style="padding:0 2px 6px;">${secLabel('Skills practiced')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
        ${SKILLS.map(s => `
          <label class="check-pill${draft.skills.has(s.id) ? ' checked' : ''}">
            <input type="checkbox" data-group="skill" value="${s.id}"
              ${draft.skills.has(s.id) ? 'checked' : ''}>
            ${draft.skills.has(s.id) ? '✓ ' : ''}${s.label}
          </label>`).join('')}
      </div>

      <!-- Per-guest -->
      <div style="padding:0 2px 8px;">${secLabel(`Per-Guest (${guests.length})`)}</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
        ${guests.map(({ guestId, guest }) => {
          const g = draft.guests[guestId] || { attendance: 'BOTH', nextClass: '', notes: '' };
          return `
            <div class="glass" style="padding:16px;border-radius:12px;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                ${av(guest?.avatar, 'md')}
                <div>
                  <div style="font-weight:600;color:#000;">${guest?.name ?? 'Guest'}</div>
                </div>
              </div>
              <div style="margin-bottom:12px;">
                <div class="sec-label" style="margin-bottom:8px;">Attendance</div>
                <div style="display:flex;gap:8px;">
                  ${['AM','PM','BOTH'].map(a => `
                    <button class="att-pill${g.attendance === a ? ' active' : ''}"
                      data-att="${a}" data-guest="${guestId}">${a}</button>`).join('')}
                </div>
              </div>
              <div style="margin-bottom:12px;">
                <div class="sec-label" style="margin-bottom:8px;">Recommended next class</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                  <button class="att-pill${g.nextClass === '' ? ' active' : ''}"
                    data-nc-guest="${guestId}" data-nc-val="">Same class</button>
                  ${sameType.map(t => `
                    <button class="att-pill${g.nextClass === t.id ? ' active' : ''}"
                      data-nc-guest="${guestId}" data-nc-val="${t.id}">${t.name}</button>`).join('')}
                </div>
              </div>
              <div>
                <label class="field-label" for="notes-${guestId}">Notes (optional)</label>
                <textarea class="field-input" id="notes-${guestId}" data-notes="${guestId}"
                  rows="2" placeholder="Progress notes, observations...">${g.notes ?? ''}</textarea>
              </div>
            </div>`;
        }).join('')}
      </div>

      <!-- Submit -->
      <button id="submit-report" class="btn btn-primary btn-lg btn-full" style="margin-bottom:8px;">
        ${iClipboard()} Submit Report
      </button>
    `;
  }

  function attach() {
    const body = document.getElementById(`modal-${MODAL_ID}-body`);
    if (!body) return;

    body.querySelectorAll('[data-group="terrain"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) draft.terrains.add(cb.value);
        else draft.terrains.delete(cb.value);
        rerender();
      });
    });

    body.querySelectorAll('[data-group="skill"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) draft.skills.add(cb.value);
        else draft.skills.delete(cb.value);
        rerender();
      });
    });

    body.querySelectorAll('[data-att]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.guest;
        if (!draft.guests[gid]) draft.guests[gid] = { attendance: 'BOTH', nextClass: '', notes: '' };
        draft.guests[gid].attendance = btn.dataset.att;
        rerender();
      });
    });

    body.querySelectorAll('[data-nc-guest]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.ncGuest;
        if (!draft.guests[gid]) draft.guests[gid] = { attendance: 'BOTH', nextClass: '', notes: '' };
        draft.guests[gid].nextClass = btn.dataset.ncVal;
        rerender();
      });
    });

    body.querySelectorAll('[data-notes]').forEach(ta => {
      ta.addEventListener('blur', () => {
        const gid = ta.dataset.notes;
        if (!draft.guests[gid]) draft.guests[gid] = { attendance: 'BOTH', nextClass: '', notes: '' };
        draft.guests[gid].notes = ta.value;
      });
    });

    body.querySelector('#submit-report')?.addEventListener('click', () => {
      body.querySelectorAll('[data-notes]').forEach(ta => {
        const gid = ta.dataset.notes;
        if (draft.guests[gid]) draft.guests[gid].notes = ta.value;
      });

      const guestReports = guests.map(({ guestId }) => ({
        guestId,
        attendance: draft.guests[guestId]?.attendance ?? 'BOTH',
        nextClass:  draft.guests[guestId]?.nextClass  ?? '',
        notes:      draft.guests[guestId]?.notes      ?? '',
      }));

      const report = {
        id:           DB.getReportByLesson(lesson.id)?.id ?? ('rpt-' + Date.now().toString(36)),
        lessonId:     lesson.id,
        instructorId: session.id,
        terrains:     [...draft.terrains],
        skills:       [...draft.skills],
        guestReports,
        submittedAt:  new Date().toISOString(),
      };

      DB.upsertReport(report);
      DB.upsertLesson({ ...lesson, status: 'completed' });
      draft.lessonId = null;

      overlay.remove();
      toast('Report submitted successfully!', 'success');
      navigate('/instructor/dashboard');
    });
  }

  function rerender() {
    const body = document.getElementById(`modal-${MODAL_ID}-body`);
    if (!body) return;
    body.innerHTML = buildBody();
    attach();
  }

  overlay.innerHTML = `
    <div class="modal-sheet" style="display:flex;flex-direction:column;overflow:hidden;padding:0;">
      <div class="modal-handle-wrap" style="flex-shrink:0;"><div class="modal-handle"></div></div>
      <div style="flex-shrink:0;display:flex;align-items:flex-start;justify-content:space-between;
        padding:0 20px 16px;">
        <div>
          <h3 style="font-family:'Newsreader',serif;font-size:22px;font-weight:700;color:#000;margin:0;">
            Lesson Report
          </h3>
          <p style="margin:4px 0 0;font-size:13px;color:#888;">
            ${tmpl?.name ?? lesson.templateId} · ${fmtDate(lesson.date)}
          </p>
        </div>
        <button onclick="document.getElementById('modal-${MODAL_ID}')?.remove()"
          style="background:none;border:none;padding:6px;cursor:pointer;color:#888;border-radius:50%;display:flex;flex-shrink:0;">
          ${iX()}
        </button>
      </div>
      <div id="modal-${MODAL_ID}-body"
        style="flex:1;overflow-y:auto;padding:0 20px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch;">
        ${buildBody()}
      </div>
    </div>
  `;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  attach();
}
