import { DB, TEMPLATES, getTemplate, isoDate } from '../data.js';
import { navigate } from '../app.js';
import {
  toast, pageHead, statusBadge, levelBadge, sportBadge, av, secLabel,
  emptyState, fmtDate, fmtDateLong, todayStr,
  tabBar, lessonTimes, iCalendar, iChevR, iClipboard, iCheck,
  iBack, iX, openModal,
} from '../ui.js';

// ── Instructor Dashboard ──────────────────────────────────────────────────────
export function renderInstructorDashboard(container, { session }) {
  const today   = todayStr();
  const lessons = DB.getLessonsByInstructor(session.id)
    .filter(l => l.date === today)
    .sort((a,b) => a.session.localeCompare(b.session));

  container.innerHTML = `
    ${pageHead('Today\'s Sessions', fmtDateLong(today))}

    <!-- Quick stats -->
    <div style="padding:8px 20px 20px;display:flex;gap:10px;">
      <div class="glass" style="flex:1;padding:14px;text-align:center;">
        <div class="stat-num">${lessons.length}</div>
        <div class="stat-lbl">Sessions</div>
      </div>
      <div class="glass" style="flex:1;padding:14px;text-align:center;">
        <div class="stat-num">
          ${lessons.reduce((s,l)=>s+DB.getConfirmedByLesson(l.id).length,0)}
        </div>
        <div class="stat-lbl">Guests</div>
      </div>
      <div class="glass" style="flex:1;padding:14px;text-align:center;">
        <div class="stat-num">
          ${lessons.filter(l=>DB.getReportByLesson(l.id)).length}
        </div>
        <div class="stat-lbl">Reported</div>
      </div>
    </div>

    <div style="padding:0 20px 8px;">${secLabel('Today\'s Schedule')}</div>
    <div style="padding:0 12px 20px;display:flex;flex-direction:column;gap:8px;" id="today-list">
      ${lessons.length === 0
        ? emptyState('🎿', 'No sessions today', 'Check your schedule for upcoming assignments.')
        : lessons.map(l => _instructorLessonCard(l, session.id)).join('')}
    </div>

  `;

  container.querySelectorAll('[data-report-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lesson = DB.getLessonById(btn.dataset.reportId);
      if (lesson) openReportModal(lesson, session);
    });
  });
}

function _instructorLessonCard(lesson, instructorId) {
  const tmpl    = getTemplate(lesson.templateId);
  const guests  = DB.getConfirmedByLesson(lesson.id).length;
  const report  = DB.getReportByLesson(lesson.id);
  const needsReport = lesson.status !== 'scheduled' && !report;

  return `
    <div class="glass" style="border-radius:12px;overflow:hidden;">
      <!-- Header row -->
      <a href="#/instructor/lesson/${lesson.id}" style="display:flex;align-items:center;
        gap:12px;padding:14px 16px;text-decoration:none;color:inherit;">
        <div style="flex-shrink:0;width:44px;height:44px;background:rgba(30,38,67,0.08);
          border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <div style="font-size:12px;font-weight:800;color:#1E2643;font-family:'Newsreader',serif;">
            ${lesson.templateId}
          </div>
        </div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:15px;color:#000;">
            ${tmpl ? tmpl.name : lesson.templateId}
          </div>
          <div style="font-size:13px;color:#777;margin-top:2px;">
            ${guests} guest${guests!==1?'s':''} · ${statusBadge(lesson.status)}
          </div>
        </div>
        <div style="color:#1E2643;">${iChevR()}</div>
      </a>
      ${needsReport ? `
        <div class="div"></div>
        <button data-report-id="${lesson.id}"
          style="display:flex;align-items:center;gap:8px;padding:12px 16px;width:100%;
          background:rgba(253,190,0,0.08);border:none;cursor:pointer;color:#875700;
          font-size:14px;font-weight:600;font-family:'Inter',sans-serif;">
          ${iClipboard()} Submit lesson report
        </button>` : report ? `
        <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;
          background:rgba(8,138,32,0.06);color:#076b1a;font-size:13px;">
          ${iCheck()} Report submitted
        </div>` : ''}
    </div>`;
}

// ── My Schedule ───────────────────────────────────────────────────────────────
export function renderMySchedule(container, { session }) {
  let view     = 'week'; // 'week' | 'day'
  let selDate  = todayStr();
  let weekStart = _weekStart(new Date());

  function render() {
    const today = todayStr();
    const days  = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return isoDate(d);
    });

    const allLessons = DB.getLessonsByInstructor(session.id);

    container.innerHTML = `
      ${pageHead('My Schedule')}

      <!-- Week nav -->
      <div style="padding:0 20px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <button id="prev-wk" class="btn btn-ghost btn-sm">← Prev</button>
        <div style="font-size:13px;color:#555;font-weight:500;">
          ${fmtDate(days[0])} – ${fmtDate(days[6])}
        </div>
        <button id="next-wk" class="btn btn-ghost btn-sm">Next →</button>
      </div>

      <!-- View switcher -->
      <div style="padding:0 20px 16px;">
        ${tabBar([{id:'week',label:'Week'},{id:'day',label:'Day'}], view)}
      </div>

      ${view === 'week'
        ? _weekView(days, allLessons, today, selDate)
        : _dayView(selDate, allLessons, session.id)}
    `;

    container.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => { view = btn.dataset.tab; render(); });
    });
    container.querySelector('#prev-wk').addEventListener('click', () => {
      weekStart.setDate(weekStart.getDate() - 7); render();
    });
    container.querySelector('#next-wk').addEventListener('click', () => {
      weekStart.setDate(weekStart.getDate() + 7); render();
    });
    container.querySelectorAll('[data-daysel]').forEach(btn => {
      btn.addEventListener('click', () => {
        selDate = btn.dataset.daysel; view = 'day'; render();
      });
    });

    container.querySelectorAll('[data-report-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lesson = DB.getLessonById(btn.dataset.reportId);
        if (lesson) openReportModal(lesson, session);
      });
    });
  }

  render();
}

function _weekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function _weekView(days, allLessons, today, selDate) {
  return `
    <div style="padding:0 12px 20px;display:flex;gap:6px;">
      ${days.map(d => {
        const count = allLessons.filter(l => l.date === d).length;
        const isToday = d === today;
        const isSel   = d === selDate;
        return `
          <div class="date-chip${isSel?' selected':isToday?' today':''}"
            data-daysel="${d}" style="flex:1;min-width:0;padding:10px 6px;">
            <div class="date-chip-dow">${new Date(d+'T00:00:00').toLocaleDateString('en-US',{weekday:'short'})}</div>
            <div class="date-chip-day">${new Date(d+'T00:00:00').getDate()}</div>
            ${count > 0
              ? `<div style="font-size:10px;margin-top:3px;font-weight:700;
                  color:${isSel?'rgba(255,255,255,0.8)':'#FDBE00'};">${count}</div>`
              : `<div style="font-size:10px;margin-top:3px;color:transparent;">·</div>`}
          </div>`;
      }).join('')}
    </div>
    <div style="padding:0 20px;color:#888;font-size:13px;text-align:center;">
      Tap a day to see details
    </div>`;
}

function _dayView(date, allLessons, instructorId) {
  const dayLessons = allLessons
    .filter(l => l.date === date)
    .sort((a,b) => a.session.localeCompare(b.session));

  if (dayLessons.length === 0) {
    return `
      <div style="padding:0 12px;">
        <div class="sec-label" style="margin-bottom:12px;">${fmtDateLong(date)}</div>
        ${emptyState('😌', 'Rest day', 'No sessions scheduled for this day.')}
      </div>`;
  }
  return `
    <div style="padding:0 20px 8px;">
      <div class="sec-label">${fmtDateLong(date)}</div>
    </div>
    <div style="padding:0 12px 32px;display:flex;flex-direction:column;gap:8px;">
      ${dayLessons.map(l => _instructorLessonCard(l, instructorId)).join('')}
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
      <div class="glass" style="padding:18px 16px;">
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          ${statusBadge(lesson.status)}
          ${tmpl ? `<span class="badge badge-${tmpl.sport}">${tmpl.sport==='ski'?'⛷ Ski':'🏂 Snowboard'}</span>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
          <div><div style="color:#888;margin-bottom:2px;">Schedule</div>
            <div style="font-weight:600;">${tmpl ? lessonTimes(tmpl) : '—'}</div></div>
          <div><div style="color:#888;margin-bottom:2px;">Date</div>
            <div style="font-weight:600;">${fmtDate(lesson.date)}</div></div>
          <div><div style="color:#888;margin-bottom:2px;">Level</div>
            <div style="font-weight:600;">${tmpl ? tmpl.level.charAt(0).toUpperCase()+tmpl.level.slice(1) : '—'}</div></div>
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
      <div style="background:rgba(8,138,32,0.08);border:1px solid rgba(8,138,32,0.2);
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
                ${guest?.level ? levelBadge(guest.level) : ''}
                ${guest?.sport ? `&nbsp;${sportBadge(guest.sport)}` : ''}
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
                  ${guest?.level ? `<div style="font-size:12px;color:#888;margin-top:2px;">${levelBadge(guest.level)}</div>` : ''}
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
