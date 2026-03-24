import { DB, TEMPLATES, getTemplate, isoDate } from '../data.js';
import { navigate }   from '../app.js';
import {
  toast, pageHead, injectHeadAvatar, statusBadge, bookingDisplayStatus, levelBadge, sportBadge, av,
  secLabel, emptyState, fmtDate, fmtDateLong, todayStr,
  greeting, lessonTimes, iCalendar, iPlus, iChevR, iUser,
  iCheck, iWarn, iBack, setNavHidden, openModal,
} from '../ui.js';

// ── Guest Dashboard ──────────────────────────────────────────────────────────
export function renderGuestDashboard(container, { session }) {
  const today = todayStr();
  const allBkgs = DB.getBookingsByGuest(session.id);
  const confirmedFuture = allBkgs
    .filter(b => b.status === 'confirmed')
    .map(b => ({ ...b, lesson: DB.getLessonById(b.lessonId) }))
    .filter(b => b.lesson && b.lesson.date >= today)
    .sort((a, b) => a.lesson.date.localeCompare(b.lesson.date));

  const todayLesson = confirmedFuture.find(b => b.lesson.date === today);
  const upcoming    = confirmedFuture.filter(b => b.lesson.date > today).slice(0, 3);
  const hasAny      = todayLesson || upcoming.length > 0;

  container.innerHTML = `
    ${pageHead(`${greeting()},`, session.name.split(' ')[0])}

    <!-- Today's lesson (expanded) or empty state -->
    ${todayLesson ? `
      <div style="padding:0 12px 20px;">
        ${_todayCard(todayLesson)}
      </div>
    ` : `
      <div style="padding:0 12px 20px;">
        ${emptyState('📅', 'No lessons booked today', '')}
      </div>
    `}

    <!-- View all bookings -->
    ${hasAny ? `
      <div style="padding:4px 20px 20px;text-align:center;">
        <a href="#/guest/bookings" style="color:#1E2643;font-size:14px;font-weight:500;text-decoration:none;">
          View all bookings →
        </a>
      </div>
    ` : ''}

    <!-- Booking CTA at bottom -->
    <div style="padding:4px 20px 24px;">
      <div class="glass" style="padding:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-family:'Newsreader',serif;font-size:18px;font-weight:700;color:#000;">
            Book more lessons
          </div>
          <div style="font-size:13px;color:#777;margin-top:2px;">Browse lessons for the next few days</div>
        </div>
        <a href="#/guest/book" class="btn btn-primary btn-md" style="flex-shrink:0;">
          ${iPlus()} Book
        </a>
      </div>
    </div>
  `;
}

// ── Today's lesson card (expanded) ───────────────────────────────────────────
function _lessonDateTile(date, {
  size = 44,
  radius = 10,
  monthSize = 9,
  daySize = 18,
  background = '#FDBE00',
  monthColor = '#000',
  dayColor = '#000',
  letterSpacing = 0.4,
} = {}) {
  const safeDate = date ? new Date(date + 'T00:00:00') : null;
  const month = safeDate ? safeDate.toLocaleDateString('en-US', { month: 'short' }) : '?';
  const day = safeDate ? safeDate.getDate() : '?';

  return `
    <div style="flex-shrink:0;width:${size}px;height:${size}px;border-radius:${radius}px;background:${background};
      display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="font-size:${monthSize}px;font-weight:700;color:${monthColor};text-transform:uppercase;
        letter-spacing:${letterSpacing}px;">
        ${month}
      </div>
      <div style="font-size:${daySize}px;font-weight:800;color:${dayColor};line-height:1.1;">
        ${day}
      </div>
    </div>`;
}

function _todayCard(booking) {
  const lesson = booking.lesson;
  const tmpl   = getTemplate(lesson.templateId);
  const inst   = lesson.instructorId ? DB.getUserById(lesson.instructorId) : null;
  const displayStatus = bookingDisplayStatus(booking, lesson);

  return `
    <div class="glass" style="padding:22px;border-radius:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <span class="badge badge-in-progress" style="font-size:12px;padding:5px 14px;">Today</span>
        ${statusBadge(displayStatus)}
      </div>
      <div style="font-family:'Newsreader',serif;font-size:26px;font-weight:700;color:#000;
        margin-bottom:8px;line-height:1.2;">
        ${tmpl ? tmpl.name : lesson.templateId}
      </div>
      <div style="font-size:15px;color:#333;font-weight:500;margin-bottom:4px;">
        ${tmpl ? lessonTimes(tmpl) : ''}
      </div>
      <div style="font-size:14px;color:#777;">
        ${inst ? `with ${inst.name}` : 'Instructor TBD'}
      </div>
      <div class="div" style="margin:18px 0;"></div>
      <div style="display:flex;align-items:center;gap:14px;">
        ${_lessonDateTile(lesson.date, { size: 58, radius: 14, monthSize: 10, daySize: 24, letterSpacing: 0.5 })}
        <div>
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;
            letter-spacing:1px;color:#888;margin-bottom:3px;">Date</div>
          <div style="font-size:16px;font-weight:600;color:#000;">${fmtDate(lesson.date)}</div>
        </div>
      </div>
    </div>`;
}

function _lessonCard(booking) {
  const lesson = booking.lesson;
  const tmpl   = getTemplate(lesson.templateId);
  const inst   = lesson.instructorId ? DB.getUserById(lesson.instructorId) : null;
  const isToday = lesson.date === todayStr();
  const displayStatus = bookingDisplayStatus(booking, lesson);

  return `
    <div class="glass card-row" style="border-radius:12px;cursor:default;">
      ${_lessonDateTile(lesson.date, isToday
        ? {}
        : { background: 'rgba(30,38,67,0.08)', monthColor: '#888', dayColor: '#1E2643' })}
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;color:#000;white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;">
          ${tmpl ? tmpl.name : lesson.templateId}
          ${isToday ? '<span style="margin-left:6px;" class="badge badge-in-progress">Today</span>' : ''}
        </div>
        <div style="font-size:13px;color:#777;margin-top:2px;">
          ${tmpl ? lessonTimes(tmpl) : ''}
          · ${inst ? inst.name : 'Instructor TBD'}
        </div>
      </div>
      ${statusBadge(displayStatus)}
    </div>`;
}

// ── Book Lesson Wizard ────────────────────────────────────────────────────────
const wiz = { step: 1, date: null, templateId: null, sport: 'ski', audience: 'adult' };

function resetWiz() { wiz.step = 1; wiz.date = null; wiz.templateId = null; }

function _runWizardTransition(container, ctx, mutate) {
  mutate();
  _renderWizardStep(container, ctx);
}

export function renderBook(container, ctx) {
  if (!window._bookActive) { resetWiz(); window._bookActive = true; }
  window.addEventListener('hashchange', () => { window._bookActive = false; setNavHidden(false); }, { once: true });
  setNavHidden(wiz.step === 2);
  _renderWizardStep(container, ctx);
}

function _renderWizardStep(container, ctx) {
  container.innerHTML = '';
  const enterClass = wiz.step === 2 ? 'wizard-step-enter-right' : (wiz.templateId ? 'wizard-step-enter-left' : '');

  const wrap = document.createElement('div');
  if (enterClass) wrap.classList.add(enterClass);

  if (wiz.step === 2) {
    setNavHidden(true);
    wrap.innerHTML = pageHead('Confirm booking');
    container.appendChild(wrap);
    const titleRow = wrap.querySelector('.page-head > div');
    titleRow.style.alignItems = 'center';
    const backBtn = document.createElement('button');
    backBtn.id = 'wiz-back';
    backBtn.type = 'button';
    backBtn.style.cssText = 'flex-shrink:0;margin-bottom:2px;padding:6px;background:rgba(30,38,67,0.07);border-radius:999px;display:inline-flex;color:#1E2643;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;';
    backBtn.innerHTML = iBack();
    titleRow.prepend(backBtn);
    wrap.querySelector('#wiz-back').addEventListener('click', () => {
      _runWizardTransition(container, ctx, () => {
        wiz.step = 1;
        setNavHidden(false);
      });
    });
  } else {
    setNavHidden(false);
    wrap.innerHTML = pageHead('Book a lesson', 'Group lesson booking');
    container.appendChild(wrap);
  }

  const body = document.createElement('div');
  body.style.padding = '0 20px 32px';
  if (enterClass) body.classList.add(enterClass);
  container.appendChild(body);

  if (wiz.step === 1) _step1(body, container, ctx);
  else _step2(body, container, ctx);
}

// Step 1 — Date picker + class list combined
function _step1(body, container, ctx) {
  const chips = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    chips.push(d);
  }

  function renderLessonList(listEl) {
    if (!wiz.date) {
      listEl.innerHTML = `<div style="text-align:center;padding:40px 0;color:#AAA;font-size:14px;">Select a date to see available classes</div>`;
      return;
    }
    const filtered = TEMPLATES.filter(t => t.sport === wiz.sport && t.audience === wiz.audience);
    listEl.innerHTML = `
      <div class="sec-label" style="margin-bottom:12px;">Classes on ${fmtDate(wiz.date)}</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${filtered.map(t => {
          const lesson   = DB.getLessonsByDateTemplate(wiz.date, t.id)[0];
          const taken    = lesson ? DB.getConfirmedByLesson(lesson.id).length : t.maxGuests;
          const hasSlots = !!lesson && taken < t.maxGuests;
          return `
            <div class="glass card-row book-lesson-card" style="border-radius:12px;${!hasSlots ? 'opacity:0.5;cursor:default;' : ''}"
              data-tmpl="${t.id}">
              <div style="flex-shrink:0;width:44px;height:44px;background:rgba(30,38,67,0.08);
                border-radius:10px;display:flex;align-items:center;justify-content:center;
                font-family:'Newsreader',serif;font-size:17px;font-weight:800;color:#1E2643;">
                ${t.id}
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:15px;color:#000;">${t.name}</div>
                <div style="font-size:12px;color:#888;margin-top:2px;">
                  ${levelBadge(t.level)} &nbsp;·&nbsp; ${lessonTimes(t)}
                </div>
              </div>
              ${hasSlots
                ? `<div style="color:#1E2643;">${iChevR()}</div>`
                : `<span class="badge badge-cancelled" style="flex-shrink:0;">Full</span>`}
            </div>`;
        }).join('')}
        ${filtered.length === 0 ? `<div style="text-align:center;padding:32px 0;color:#AAA;font-size:14px;">No classes in this category.</div>` : ''}
      </div>`;

    listEl.querySelectorAll('[data-tmpl]').forEach(card => {
      const tmpl = getTemplate(card.dataset.tmpl);
      if (!tmpl) return;
      const lesson = DB.getLessonsByDateTemplate(wiz.date, tmpl.id)[0];
      if (!lesson || DB.getConfirmedByLesson(lesson.id).length >= tmpl.maxGuests) return;
      card.addEventListener('click', () => {
        _runWizardTransition(container, ctx, () => {
          wiz.templateId = card.dataset.tmpl;
          wiz.step = 2;
          setNavHidden(true);
        });
      });
    });
  }

  body.innerHTML = `
    <div style="margin-bottom:20px;">
      <div class="sx" style="display:flex;gap:8px;padding:4px 0;">
        ${chips.map(d => {
          const ds  = isoDate(d);
          const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
          const day = d.getDate();
          const mon = d.toLocaleDateString('en-US', { month: 'short' });
          const sel = ds === wiz.date;
          return `
            <div class="date-chip${sel ? ' selected' : ''}${ds === todayStr() ? ' today' : ''}"
              data-date="${ds}" style="flex-shrink:0;">
              <div class="date-chip-dow">${dow}</div>
              <div class="date-chip-day">${day}</div>
              <div style="font-size:9px;color:${sel ? 'rgba(255,255,255,0.7)' : '#AAA'};margin-top:1px;">${mon}</div>
            </div>`;
        }).join('')}
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
      <button class="pill-filter${wiz.sport === 'ski' ? ' active' : ''}" data-sport="ski">⛷ Ski</button>
      <button class="pill-filter${wiz.sport === 'snowboard' ? ' active' : ''}" data-sport="snowboard">🏂 Snowboard</button>
      <div style="width:1px;background:rgba(0,0,0,0.12);align-self:stretch;margin:0 2px;"></div>
      <button class="pill-filter${wiz.audience === 'adult' ? ' active' : ''}" data-audience="adult">Adult</button>
      <button class="pill-filter${wiz.audience === 'kids' ? ' active' : ''}" data-audience="kids">Kids</button>
    </div>

    <div id="lesson-list"></div>`;

  const listEl = body.querySelector('#lesson-list');
  renderLessonList(listEl);

  body.querySelectorAll('.date-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      wiz.date = chip.dataset.date;
      body.querySelectorAll('.date-chip').forEach(c => {
        const sel = c.dataset.date === wiz.date;
        c.classList.toggle('selected', sel);
        const monEl = c.querySelector('div:last-child');
        if (monEl) monEl.style.color = sel ? 'rgba(255,255,255,0.7)' : '#AAA';
      });
      renderLessonList(listEl);
    });
  });

  body.querySelectorAll('[data-sport]').forEach(btn => {
    btn.addEventListener('click', () => {
      wiz.sport = btn.dataset.sport;
      body.querySelectorAll('[data-sport]').forEach(b => b.classList.toggle('active', b.dataset.sport === wiz.sport));
      renderLessonList(listEl);
    });
  });

  body.querySelectorAll('[data-audience]').forEach(btn => {
    btn.addEventListener('click', () => {
      wiz.audience = btn.dataset.audience;
      body.querySelectorAll('[data-audience]').forEach(b => b.classList.toggle('active', b.dataset.audience === wiz.audience));
      renderLessonList(listEl);
    });
  });
}

// Step 2 — Confirm booking
function _step2(body, container, ctx) {
  const { session } = ctx;
  const tmpl    = getTemplate(wiz.templateId);
  const lesson  = DB.getLessonsByDateTemplate(wiz.date, wiz.templateId)[0];
  const inst    = lesson?.instructorId ? DB.getUserById(lesson.instructorId) : null;
  const taken   = lesson ? DB.getConfirmedByLesson(lesson.id).length : 0;
  const existing = lesson
    ? DB.getBookingsByGuest(session.id).find(b => b.lessonId === lesson.id && b.status === 'confirmed')
    : null;

  body.innerHTML = `
    <div class="sec-label" style="margin-bottom:12px;">Booking summary</div>
    <div class="glass book-summary-card" style="padding:20px;margin-bottom:20px;">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">Class</span>
          <span style="font-weight:600;font-size:15px;color:#000;">${tmpl.id} — ${tmpl.name}</span>
        </div>
        <div class="div"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">Date</span>
          <span style="font-weight:600;">${fmtDateLong(wiz.date)}</span>
        </div>
        <div class="div"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">Schedule</span>
          <span style="font-weight:600;">${lessonTimes(tmpl)}</span>
        </div>
        <div class="div"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">Instructor</span>
          <span style="font-weight:600;">${inst ? inst.name : 'TBD'}</span>
        </div>
        <div class="div"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">Level</span>
          ${levelBadge(tmpl.level)}
        </div>
        <div class="div"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#888;">Availability</span>
          <span style="font-weight:600;">${tmpl.maxGuests - taken} of ${tmpl.maxGuests} spots left</span>
        </div>
      </div>
    </div>

    ${existing ? `
      <div style="background:#fff0cc;border:1px solid #FDBE00;border-radius:8px;padding:12px 14px;
        color:#875700;font-size:14px;margin-bottom:16px;">
        ${iWarn()} You already have a booking for this lesson.
      </div>` : ''}

    <button id="confirm-btn" class="btn btn-primary btn-lg btn-full" ${(!lesson || existing) ? 'disabled' : ''}>
      ${iCheck()} Confirm Booking
    </button>`;

  body.querySelector('#confirm-btn')?.addEventListener('click', () => {
    if (!lesson) return;
    const bookingId = 'bkg-' + Date.now().toString(36);
    DB.upsertBooking({
      id:        bookingId,
      guestId:   session.id,
      lessonId:  lesson.id,
      createdAt: new Date().toISOString(),
      status:    'confirmed',
    });
    sessionStorage.setItem('snow_new_booking_id', bookingId);
    toast('Booking confirmed! See you on the mountain. ⛷', 'success');
    resetWiz();
    window._bookActive = false;
    setNavHidden(false);
    navigate('/guest/bookings');
  });
}

// ── My Bookings ───────────────────────────────────────────────────────────────
export function renderMyBookings(container, { session }) {
  const today    = todayStr();
  let   filter   = 'upcoming';
  const newBookingId = sessionStorage.getItem('snow_new_booking_id');

  function render() {
    const allBkgs = DB.getBookingsByGuest(session.id)
      .map(b => {
        const lesson = DB.getLessonById(b.lessonId);
        const tmpl   = lesson ? getTemplate(lesson.templateId) : null;
        const inst   = lesson?.instructorId ? DB.getUserById(lesson.instructorId) : null;
        const report = lesson ? DB.getReportByLesson(lesson.id) : null;
        const guestReport = report?.guestReports?.find(gr => gr.guestId === session.id) ?? null;
        return { ...b, lesson, tmpl, inst, report, guestReport, isNew: b.id === newBookingId };
      })
      .sort((a,b) => {
        const ad = a.lesson?.date ?? '';
        const bd = b.lesson?.date ?? '';
        if (ad !== bd) return ad.localeCompare(bd);
        return a.createdAt.localeCompare(b.createdAt);
      });

    const filtered = allBkgs.filter(b => {
      if (filter === 'upcoming')  return b.status === 'confirmed' && b.lesson?.date >= today;
      if (filter === 'past')      return b.status === 'confirmed' && b.lesson?.date < today;
      if (filter === 'cancelled') return b.status === 'cancelled';
      return true;
    });

    container.innerHTML = `
      ${pageHead('My Lessons')}

      <!-- Filter pills -->
      <div class="sx" style="display:flex;gap:8px;padding:0 20px 20px;">
        ${['upcoming','past','cancelled','all'].map(f =>
          `<button class="pill-filter${filter===f?' active':''}" data-filter="${f}" style="white-space:nowrap;">
            ${f.charAt(0).toUpperCase()+f.slice(1)}
          </button>`
        ).join('')}
      </div>

      <!-- Bookings list -->
      <div style="padding:0 12px 32px;display:flex;flex-direction:column;gap:8px;">
        ${filtered.length === 0
          ? emptyState('📅', 'No bookings here',
              filter === 'all'
                ? 'Book your first group lesson to get started.'
                : `No ${filter} bookings.`,
              filter === 'all'
                ? `<a href="#/guest/book" class="btn btn-primary btn-md">Book a lesson</a>`
                : '')
          : filtered.map(b => _bookingCard(b, today)).join('')}
      </div>`;

    injectHeadAvatar(session, container);

    // Filter buttons
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => { filter = btn.dataset.filter; render(); });
    });

    // Cancel buttons
    container.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.cancel;
        _confirmCancel(id, render);
      });
    });

    container.querySelectorAll('[data-report-card]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const booking = filtered.find(b => b.id === btn.dataset.reportCard);
        if (booking) _openReportCardModal(booking);
      });
    });
  }

  render();
  sessionStorage.removeItem('snow_new_booking_id');
}

function _bookingCard(b, today) {
  const isToday    = b.lesson?.date === today;
  const isPast     = b.lesson && b.lesson.date < today;
  const canCancel  = b.status === 'confirmed' && !isPast;
  const displayStatus = bookingDisplayStatus(b, b.lesson);
  const isCancelled = b.status === 'cancelled';
  const canCheckReportCard = (
    b.status === 'confirmed' &&
    b.lesson?.status === 'completed' &&
    !!b.report?.submittedAt &&
    !!b.guestReport
  );
  const nextTemplate = b.guestReport?.nextClass ? getTemplate(b.guestReport.nextClass) : null;
  const nextClassLabel = nextTemplate
    ? nextTemplate.name
    : (b.guestReport?.nextClass || 'No recommendation');

  return `
    <div class="glass" style="padding:16px;border-radius:12px;${isCancelled ? 'opacity:0.56;' : ''}">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <!-- Date block -->
        ${_lessonDateTile(b.lesson?.date, isToday
          ? {}
          : { background: 'rgba(30,38,67,0.08)', monthColor: '#888', dayColor: '#1E2643' })}
        <!-- Info -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-weight:600;font-size:15px;color:#000;">
              ${b.tmpl ? b.tmpl.name : b.lessonId}
            </span>
            ${statusBadge(displayStatus)}
            ${b.isNew ? `<span class="badge" style="background:#E8F5E9;color:#1B5E20;">NEW</span>` : ''}
          </div>
          <div style="font-size:13px;color:#777;margin-top:4px;">
            ${b.tmpl ? lessonTimes(b.tmpl) : ''}
            ${b.inst ? ` · ${b.inst.name}` : b.lesson?.instructorId ? '' : ' · Instructor TBD'}
          </div>
        </div>
      </div>
      ${canCancel || canCheckReportCard ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(30,38,67,0.07);">
          ${canCheckReportCard ? `
            <button data-report-card="${b.id}"
              style="display:flex;align-items:center;justify-content:space-between;gap:12px;
              padding:12px 16px;width:100%;background:rgba(253,190,0,0.08);border:none;
              border-radius:10px;cursor:pointer;color:#875700;font-size:14px;font-weight:600;
              font-family:'Inter',sans-serif;text-align:left;margin-bottom:${canCancel ? '8px' : '0'};">
              <span style="display:flex;align-items:center;gap:8px;">
                ${iCheck()} check report card
              </span>
              <span style="display:flex;align-items:center;gap:6px;min-width:0;flex-shrink:0;">
                <span style="font-size:12px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;
                  color:#1E2643;background:rgba(30,38,67,0.10);padding:5px 8px;border-radius:999px;">
                  ${nextClassLabel}
                </span>
                <span style="color:#1E2643;">${iChevR()}</span>
              </span>
            </button>` : ''}
          ${canCancel ? `
            <button data-cancel="${b.id}" class="btn btn-ghost btn-sm"
              style="color:#BF2F17;border-color:rgba(191,47,23,0.25);">
              Cancel booking
            </button>` : ''}
        </div>` : ''}
    </div>`;
}

function _openReportCardModal(booking) {
  const { lesson, tmpl, inst, report, guestReport } = booking;
  if (!lesson || !report || !guestReport) return;
  const nextTemplate = guestReport.nextClass ? getTemplate(guestReport.nextClass) : null;
  const nextClassLabel = nextTemplate ? nextTemplate.name : '';

  const attendanceMap = {
    AM: 'Morning only',
    PM: 'Afternoon only',
    BOTH: 'Full day',
  };

  const terrainLabels = {
    groomed: 'Groomed runs',
    powder: 'Powder',
    moguls: 'Moguls',
    park: 'Terrain park',
    'off-piste': 'Off-piste',
    icy: 'Icy conditions',
    trees: 'Trees',
  };

  const skillLabels = {
    'parallel-turns': 'Parallel turns',
    carving: 'Carving',
    stopping: 'Stopping',
    edges: 'Edge control',
    'speed-control': 'Speed control',
    'terrain-read': 'Terrain reading',
    jumps: 'Jumps',
  };

  openModal('guest-report-card', 'Report Card', `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="glass" style="padding:16px;border-radius:12px;">
        <div style="font-family:'Newsreader',serif;font-size:22px;font-weight:700;color:#000;">
          ${tmpl ? tmpl.name : lesson.templateId}
        </div>
        <div style="font-size:13px;color:#777;margin-top:4px;">
          ${fmtDateLong(lesson.date)}${inst ? ` · ${inst.name}` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="glass" style="padding:14px;border-radius:12px;">
          <div style="font-size:12px;color:#888;margin-bottom:4px;">Attendance</div>
          <div style="font-weight:600;color:#000;">${attendanceMap[guestReport.attendance] ?? guestReport.attendance ?? 'Not recorded'}</div>
        </div>
        <div class="glass" style="padding:14px;border-radius:12px;">
          <div style="font-size:12px;color:#888;margin-bottom:4px;">Submitted</div>
          <div style="font-weight:600;color:#000;">${new Date(report.submittedAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div class="glass" style="padding:16px;border-radius:12px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">Lesson Focus</div>
        <div style="font-size:14px;color:#000;line-height:1.5;">
          ${(report.terrains?.map(t => terrainLabels[t] ?? t) ?? []).join(', ') || 'No terrain notes shared.'}
        </div>
        <div style="font-size:14px;color:#000;line-height:1.5;margin-top:8px;">
          ${(report.skills?.map(s => skillLabels[s] ?? s) ?? []).join(', ') || 'No skills shared.'}
        </div>
      </div>

      <div class="glass" style="padding:16px;border-radius:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px;">
          <div style="font-size:12px;color:#888;">Recommended Next Class</div>
          ${nextClassLabel ? `
            <div style="font-size:12px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;
              color:#1E2643;background:rgba(30,38,67,0.10);padding:5px 8px;border-radius:999px;">
              ${nextClassLabel}
            </div>` : ''}
        </div>
        <div style="font-size:14px;color:#000;line-height:1.5;">
          ${nextClassLabel || 'No next class recommendation yet.'}
        </div>
      </div>

      <div class="glass" style="padding:16px;border-radius:12px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">Instructor Notes</div>
        <div style="font-size:14px;color:#000;line-height:1.6;">
          ${guestReport.notes || 'No written notes were included for this lesson.'}
        </div>
      </div>
    </div>
  `);
}

function _confirmCancel(bookingId, onDone) {
  // Inline confirmation strip injected below the cancel button
  const card = document.querySelector(`[data-cancel="${bookingId}"]`)?.closest('.glass');
  if (!card) return;

  const strip = document.createElement('div');
  strip.style.cssText = 'margin-top:10px;display:flex;gap:8px;align-items:center;';
  strip.innerHTML = `
    <span style="font-size:13px;color:#555;flex:1;">Cancel this booking?</span>
    <button class="btn btn-danger btn-sm" id="yes-cancel">Yes, cancel</button>
    <button class="btn btn-ghost btn-sm" id="no-cancel">Keep it</button>`;
  card.appendChild(strip);

  strip.querySelector('#yes-cancel').addEventListener('click', () => {
    DB.cancelBooking(bookingId);
    toast('Booking cancelled.', 'info');
    onDone();
  });
  strip.querySelector('#no-cancel').addEventListener('click', () => strip.remove());
}
