import { DB, TEMPLATES, getTemplate, isoDate } from '../data.js';
import { navigate } from '../app.js';
import {
  toast, pageHead, statusBadge, sportBadge, av, secLabel,
  emptyState, fmtDate, fmtDateLong, todayStr,
  lessonTimes, iCalendar, iChevR, iClipboard, iCheck,
  iBack, iX, iPlay, iFlag, openModal, closeModal,
  injectHeadAvatar,
} from '../ui.js';

// ── Instructor Dashboard ──────────────────────────────────────────────────────
export function renderInstructorDashboard(container, { session }) {
  const today   = todayStr();
  const lessons = DB.getLessonsByInstructor(session.id).filter(l => l.date === today);
  const firstName = session.name.split(' ')[0];

  // Determine overall view state from lesson statuses
  // Priority: on-mountain > completed (report due) > reported (done) > scheduled (neutral)
  let viewState = 'scheduled';
  if (lessons.some(l => l.status === 'on-mountain'))  viewState = 'on-mountain';
  else if (lessons.some(l => l.status === 'completed')) viewState = 'completed';
  else if (lessons.length > 0 && lessons.every(l => l.status === 'reported')) viewState = 'reported';

  // State-driven header and banner
  let headTitle, headSub, stateBanner;
  switch (viewState) {
    case 'on-mountain':
      headTitle  = 'On the Mountain';
      headSub    = fmtDateLong(today);
      stateBanner = `
        <div class="mlp" style="margin:0 -1px;">
          <div class="mlp-bar mlp-bar-primary"><div class="mlp-bar-inner"></div></div>
          <div class="mlp-bar mlp-bar-secondary"><div class="mlp-bar-inner"></div></div>
        </div>
        <div style="padding:12px 12px 20px;">
          <div class="glass-strong" style="padding:16px;border-radius:14px;
            background:rgba(30,38,67,0.07);border:1.5px solid rgba(30,38,67,0.15);">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:22px;line-height:1;">🏔</span>
              <div>
                <div style="font-weight:700;color:#1E2643;font-size:15px;">Lesson in progress</div>
                <div style="font-size:13px;color:#5a6070;margin-top:2px;">Enjoy your time with the guests. Show them the best you have :)</div>
              </div>
            </div>
          </div>
        </div>`;
      break;
    case 'completed':
      headTitle  = 'Today\'s Sessions';
      headSub    = fmtDateLong(today);
      stateBanner = `
        <div style="padding:0 12px 20px;">
          <div class="glass-strong" style="padding:16px;border-radius:14px;
            background:rgba(253,190,0,0.09);border:1.5px solid rgba(253,190,0,0.28);">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:22px;line-height:1;">📋</span>
              <div>
                <div style="font-weight:700;color:#875700;font-size:15px;">Lesson report due</div>
                <div style="font-size:13px;color:#a07000;margin-top:2px;">Please submit your report before end of day</div>
              </div>
            </div>
          </div>
        </div>`;
      break;
    case 'reported':
      headTitle  = `Well done, ${firstName}!`;
      headSub    = 'Thank you for your hard work today';
      stateBanner = `
        <div style="padding:0 12px 20px;">
          <div class="glass-strong" style="padding:16px;border-radius:14px;
            background:rgba(8,138,32,0.06);border:1.5px solid rgba(8,138,32,0.17);">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:22px;line-height:1;">🌟</span>
              <div>
                <div style="font-weight:700;color:#076b1a;font-size:15px;">All reports submitted</div>
                <div style="font-size:13px;color:#2d8a4a;margin-top:2px;">You're all done for the day, ${firstName} — enjoy your evening!</div>
              </div>
            </div>
          </div>
        </div>`;
      break;
    default:
      headTitle  = 'Today\'s Sessions';
      headSub    = fmtDateLong(today);
      stateBanner = '';
  }

  container.innerHTML = `
    ${pageHead(headTitle, headSub)}
    ${stateBanner}
    <div style="padding:0 12px 20px;display:flex;flex-direction:column;gap:8px;" id="today-list">
      ${lessons.length === 0
        ? emptyState('🎿', 'No sessions today', 'Check your schedule for upcoming assignments.')
        : lessons.map(l => _instructorLessonCard(l)).join('')}
    </div>
  `;

  // Lesson detail modal (tap on card body) — pass re-render callback so report
  // submission from inside the modal also refreshes the today view immediately.
  const _rerender = () => renderInstructorDashboard(container, { session });
  container.querySelectorAll('[data-lesson-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lesson = DB.getLessonById(btn.dataset.lessonId);
      if (lesson) _openInstructorLessonModal(lesson, session, _rerender);
    });
  });

  // Start Lesson: scheduled → on-mountain
  container.querySelectorAll('[data-start-lesson]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lesson = DB.getLessonById(btn.dataset.startLesson);
      if (!lesson) return;
      DB.upsertLesson({ ...lesson, status: 'on-mountain' });
      toast('Lesson started — have a great session! 🏔', 'success');
      renderInstructorDashboard(container, { session });
    });
  });

  // Complete Lesson: on-mountain → completed
  container.querySelectorAll('[data-complete-lesson]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lesson = DB.getLessonById(btn.dataset.completeLesson);
      if (!lesson) return;
      DB.upsertLesson({ ...lesson, status: 'completed' });
      toast('Lesson complete — please submit your report', 'info');
      renderInstructorDashboard(container, { session });
    });
  });

  // Submit report: opens report modal with re-render callback
  container.querySelectorAll('[data-report-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lesson = DB.getLessonById(btn.dataset.reportId);
      if (lesson) openReportModal(lesson, session, _rerender);
    });
  });

  // Re-inject avatar since we rebuilt container.innerHTML
  injectHeadAvatar(session, container);
}

function _instructorLessonCard(lesson) {
  const tmpl       = getTemplate(lesson.templateId);
  const bkgs       = DB.getConfirmedByLesson(lesson.id);
  const guestList  = bkgs.map(b => ({ ...b, guest: DB.getUserById(b.guestId) }));
  const guestCount = guestList.length;
  const maxGuests  = tmpl?.maxGuests ?? null;
  const report     = DB.getReportByLesson(lesson.id);

  // Action strip: drives the lesson lifecycle, shown only in today tab
  let actionStrip = '';
  if (lesson.status === 'scheduled') {
    actionStrip = `
      <button data-start-lesson="${lesson.id}"
        style="display:flex;align-items:center;gap:8px;padding:13px 22px;width:100%;
        background:rgba(30,38,67,0.06);border:none;border-top:1px solid rgba(30,38,67,0.1);
        cursor:pointer;color:#1E2643;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;">
        ${iPlay()} Start Lesson
      </button>`;
  } else if (lesson.status === 'on-mountain') {
    actionStrip = `
      <button data-complete-lesson="${lesson.id}"
        style="display:flex;align-items:center;gap:8px;padding:13px 22px;width:100%;
        background:rgba(253,190,0,0.12);border:none;border-top:1px solid rgba(253,190,0,0.22);
        cursor:pointer;color:#875700;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;">
        ${iFlag()} Complete Lesson
      </button>`;
  } else if (lesson.status === 'completed' && !report) {
    actionStrip = `
      <button data-report-id="${lesson.id}"
        style="display:flex;align-items:center;gap:8px;padding:13px 22px;width:100%;
        background:rgba(253,190,0,0.1);border:none;border-top:1px solid rgba(253,190,0,0.18);
        cursor:pointer;color:#875700;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;">
        ${iClipboard()} Submit lesson report
      </button>`;
  } else if (lesson.status === 'reported' || report) {
    actionStrip = `
      <div style="display:flex;align-items:center;gap:8px;padding:12px 22px;
        background:var(--bg-success-soft);border-top:1px solid rgba(8,138,32,0.12);
        color:#076b1a;font-size:13px;font-weight:500;">
        ${iCheck()} Report submitted
      </div>`;
  }

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
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
          ${guestList.slice(0, 6).map(b => av((b.guest?.name ?? '?').slice(0, 2))).join('')}
          ${guestCount > 6 ? `<span style="font-size:13px;color:#888;margin-left:2px;">+${guestCount - 6} more</span>` : ''}
        </div>` : `
        <div style="font-size:14px;color:#aaa;font-style:italic;">No guests confirmed yet</div>`}
      </div>
      ${actionStrip}
    </div>`;
}

// ── Instructor Lesson Detail Modal ────────────────────────────────────────────
function _openInstructorLessonModal(lesson, session, onReportSuccess = null) {
  const tmpl       = getTemplate(lesson.templateId);
  const report     = DB.getReportByLesson(lesson.id);
  const bkgs       = DB.getConfirmedByLesson(lesson.id);
  const guests     = bkgs.map(b => ({ ...b, guest: DB.getUserById(b.guestId) }));
  const needsReport = lesson.status === 'completed' && !report;
  const spotsLabel  = tmpl ? `${guests.length} of ${tmpl.maxGuests} spots filled` : null;

  // Label lookup maps (TERRAINS/SKILLS defined later in module, available at call time)
  const terrainLabels = Object.fromEntries(TERRAINS.map(t => [t.id, t.label]));
  const skillLabels   = Object.fromEntries(SKILLS.map(s => [s.id, s.label]));

  openModal('instructor-lesson-detail', tmpl ? tmpl.name : lesson.id, `
    <div style="display:flex;flex-direction:column;gap:16px;">

      <!-- Lesson info -->
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

      <!-- Guests (with per-guest report button when report exists) -->
      ${guests.length > 0 ? `
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
          color:#8A6B53;margin-bottom:10px;">Guests</div>
        <div class="glass" style="border-radius:14px;overflow:hidden;">
          ${guests.map((b, i) => {
            const gr = report?.guestReports?.find(g => g.guestId === b.guestId);
            return `
              <div style="display:flex;align-items:center;gap:12px;padding:11px 16px;
                ${i > 0 ? 'border-top:1px solid rgba(30,38,67,0.06);' : ''}">
                ${av((b.guest?.name ?? '?').slice(0, 2))}
                <div style="flex:1;font-weight:600;font-size:14px;color:#000;">${b.guest?.name ?? 'Guest'}</div>
                ${gr ? `
                  <button data-guest-report="${b.guestId}"
                    style="font-size:12px;font-weight:600;color:#1E2643;
                    background:var(--bg-section-soft);border:1px solid var(--line-soft);
                    border-radius:999px;padding:5px 12px;cursor:pointer;
                    font-family:'Inter',sans-serif;flex-shrink:0;white-space:nowrap;
                    display:inline-flex;align-items:center;line-height:1;">
                    Report
                  </button>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <!-- Lesson Report: terrain + skills pills -->
      ${report ? `
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
          color:#8A6B53;margin-bottom:10px;">Lesson Report</div>
        <div class="glass" style="padding:14px 16px;border-radius:14px;display:flex;flex-direction:column;gap:12px;">
          ${report.terrains?.length > 0 ? `
          <div>
            <div style="font-size:11px;color:#888;font-weight:600;letter-spacing:0.05em;
              text-transform:uppercase;margin-bottom:7px;">Terrain</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;">
              ${report.terrains.map(t => `
                <span style="font-size:12px;font-weight:500;
                  background:transparent;color:#000;border:1.5px solid #000;
                  border-radius:999px;padding:3px 10px;">${terrainLabels[t] ?? t}</span>`).join('')}
            </div>
          </div>` : ''}
          ${report.skills?.length > 0 ? `
          <div>
            <div style="font-size:11px;color:#888;font-weight:600;letter-spacing:0.05em;
              text-transform:uppercase;margin-bottom:7px;">Skills</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;">
              ${report.skills.map(s => `
                <span style="font-size:12px;font-weight:500;
                  background:transparent;color:#000;border:1.5px solid #000;
                  border-radius:999px;padding:3px 10px;">${skillLabels[s] ?? s}</span>`).join('')}
            </div>
          </div>` : ''}
          <div style="padding-top:2px;border-top:1px solid rgba(30,38,67,0.06);
            font-size:12px;color:#888;">
            Submitted ${new Date(report.submittedAt).toLocaleDateString()}
          </div>
        </div>
      </div>` : ''}

      <!-- CTA: submit report / pending state -->
      ${needsReport ? `
      <button id="modal-report-btn"
        style="display:flex;align-items:center;gap:8px;padding:14px 16px;width:100%;
        background:rgba(253,190,0,0.1);border:none;border-radius:14px;cursor:pointer;color:#875700;
        font-size:14px;font-weight:600;font-family:'Inter',sans-serif;text-align:left;">
        ${iClipboard()} Submit lesson report
      </button>` : ''}

    </div>
  `);

  // Guest report drill-down buttons
  const modalBody = document.getElementById('modal-instructor-lesson-detail-body');
  modalBody?.querySelectorAll('[data-guest-report]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gr    = report?.guestReports?.find(g => g.guestId === btn.dataset.guestReport);
      const guest = DB.getUserById(btn.dataset.guestReport);
      if (gr && guest) _openGuestReportModal(guest, gr);
    });
  });

  document.getElementById('modal-report-btn')?.addEventListener('click', () => {
    closeModal('instructor-lesson-detail');
    openReportModal(lesson, session, onReportSuccess);
  });
}

// ── Per-guest report detail modal ─────────────────────────────────────────────
function _openGuestReportModal(guest, gr) {
  const nextTemplate = gr.nextClass ? getTemplate(gr.nextClass) : null;
  const attColors = { AM: '#e6ebfb,#1E2643', PM: '#e6ebfb,#1E2643', BOTH: '#dcf5e2,#076b1a' };
  const [attBg, attColor] = (attColors[gr.attendance] ?? attColors.BOTH).split(',');

  openModal('guest-report-detail', guest.name, `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="glass" style="padding:16px;border-radius:14px;">
        <div style="display:flex;flex-direction:column;gap:11px;">

          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#888;">Attendance</span>
            <span style="font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;
              background:${attBg};color:${attColor};">${gr.attendance}</span>
          </div>

          <div class="div"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#888;">Recommended next</span>
            <span style="font-weight:600;font-size:14px;color:${nextTemplate ? '#000' : '#bbb'};">
              ${nextTemplate ? nextTemplate.name : '—'}
            </span>
          </div>

          <div class="div"></div>
          <div>
            <div style="font-size:13px;color:#888;margin-bottom:6px;">Notes</div>
            <div style="font-size:14px;line-height:1.55;color:${gr.notes ? '#000' : '#bbb'};">
              ${gr.notes || '—'}
            </div>
          </div>

        </div>
      </div>
    </div>
  `);
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
        <div style="display:flex;gap:3px;margin-bottom:4px;">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(dow => `
            <div class="date-chip-dow" style="width:var(--date-cell-w,calc((100vw - 90px)/7));
              text-align:center;flex-shrink:0;">${dow}</div>
          `).join('')}
        </div>

        <!-- Horizontally scrollable date row, snaps to every Sunday -->
        <div id="sched-date-row" class="sx" style="display:flex;gap:3px;scroll-snap-type:x mandatory;">
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
                style="width:var(--date-cell-w,calc((100vw - 90px)/7));${isSun ? 'scroll-snap-align:start;' : ''}">
                <div class="scd-month-hint" style="${!isFirst ? 'visibility:hidden;' : ''}">${mon}</div>
                <div class="scd-num">${date.getDate()}</div>
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
    const cellW = (dateRowEl.clientWidth - 18) / 7; // 18 = 6 gaps × 3px
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
    const dayLessons = allLessons.filter(l => l.date === selDate);
    el.innerHTML = dayLessons.length === 0
      ? emptyState('😌', 'Rest day', 'No sessions scheduled.')
      : dayLessons.map(l => _schedLessonCard(l)).join('');
    // Schedule tab: cards open detail modal only — no lifecycle actions
    el.querySelectorAll('[data-lesson-id]').forEach(card => {
      card.addEventListener('click', () => {
        const lesson = DB.getLessonById(card.dataset.lessonId);
        if (lesson) _openInstructorLessonModal(lesson, session);
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

// ── Schedule lesson card (read-only — no lifecycle actions) ───────────────────
function _schedLessonCard(lesson) {
  const tmpl       = getTemplate(lesson.templateId);
  const bkgs       = DB.getConfirmedByLesson(lesson.id);
  const guestCount = bkgs.length;
  const maxGuests  = tmpl?.maxGuests ?? null;
  const report     = DB.getReportByLesson(lesson.id);

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
        ${report ? `
        <div style="display:flex;align-items:center;gap:6px;margin-top:8px;
          font-size:12px;color:#076b1a;font-weight:500;">
          ${iCheck()} Report submitted
        </div>` : ''}
      </div>
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
    ${!report && lesson.status === 'completed' ? `
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

function openReportModal(lesson, session, onSuccess = null) {
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
    if (!draft.guests[guestId]) draft.guests[guestId] = { attendance: 'BOTH', nextClass: lesson.templateId, notes: '' };
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
          const g = draft.guests[guestId] || { attendance: 'BOTH', nextClass: lesson.templateId, notes: '' };
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
        if (!draft.guests[gid]) draft.guests[gid] = { attendance: 'BOTH', nextClass: lesson.templateId, notes: '' };
        draft.guests[gid].attendance = btn.dataset.att;
        rerender();
      });
    });

    body.querySelectorAll('[data-nc-guest]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.ncGuest;
        if (!draft.guests[gid]) draft.guests[gid] = { attendance: 'BOTH', nextClass: lesson.templateId, notes: '' };
        draft.guests[gid].nextClass = btn.dataset.ncVal;
        rerender();
      });
    });

    body.querySelectorAll('[data-notes]').forEach(ta => {
      ta.addEventListener('blur', () => {
        const gid = ta.dataset.notes;
        if (!draft.guests[gid]) draft.guests[gid] = { attendance: 'BOTH', nextClass: lesson.templateId, notes: '' };
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
        nextClass:  draft.guests[guestId]?.nextClass  ?? lesson.templateId,
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
      DB.upsertLesson({ ...lesson, status: 'reported' });
      draft.lessonId = null;

      overlay.remove();
      toast('Report submitted successfully!', 'success');
      if (onSuccess) onSuccess();
      else navigate('/instructor/dashboard');
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
