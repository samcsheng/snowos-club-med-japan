import { DB, TEMPLATES, getTemplate, isoDate, uid } from '../data.js';
import { navigate }   from '../app.js';
import {
  toast, pageHead, injectHeadAvatar, statusBadge, bookingDisplayStatus, sportBadge, av,
  secLabel, emptyState, fmtDate, fmtDateLong, todayStr,
  greeting, lessonTimes, lessonTimeLabel, lessonTitle, privateBadge, privateCardStyle, iCalendar, iPlus, iChevR, iUser,
  iCheck, iWarn, iBack, setNavHidden, openModal, closeModal, dismissModal, iClipboard,
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

  let todayLessonEnriched = null;
  if (todayLesson) {
    const lesson = todayLesson.lesson;
    const tmpl = lesson ? getTemplate(lesson.templateId) : null;
    const inst = lesson?.instructorId ? DB.getUserById(lesson.instructorId) : null;
    const report = lesson ? DB.getReportByLesson(lesson.id) : null;
    const guestReport = report?.guestReports?.find(gr => gr.guestId === session.id) ?? null;
    todayLessonEnriched = { ...todayLesson, tmpl, inst, report, guestReport };
  }

  container.innerHTML = `
    ${pageHead(`${greeting()},`, session.name.split(' ')[0])}

    <!-- Today's lesson (expanded) or empty state -->
    ${todayLesson ? `
      <div style="padding:0 20px 20px;">
        ${_todayCard(todayLesson)}
      </div>
    ` : `
      <div style="padding:0 20px 20px;">
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

  if (todayLessonEnriched) {
    const todayCard = container.querySelector('[data-today-card]');
    if (todayCard) {
      todayCard.addEventListener('click', () => _openBookingDetailModal(todayLessonEnriched, () => renderGuestDashboard(container, { session })));
    }
  }
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
    <div class="glass" data-today-card="${booking.id}" style="padding:22px;border-radius:16px;cursor:pointer;${privateCardStyle(lesson)}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <span class="badge badge-in-progress" style="font-size:12px;padding:5px 14px;">Today</span>
        ${statusBadge(displayStatus)}
      </div>
      <div style="font-family:'Newsreader',serif;font-size:26px;font-weight:700;color:var(--private-card-title,#000);
        margin-bottom:8px;line-height:1.2;">
        ${lessonTitle(lesson, tmpl)}
        ${privateBadge(lesson)}
      </div>
      <div style="font-size:15px;color:var(--private-card-title,#333);font-weight:500;margin-bottom:4px;">
        ${lessonTimeLabel(lesson, tmpl)}
      </div>
      <div style="font-size:14px;color:var(--private-card-meta,#777);">
        ${inst ? `with ${inst.name}` : 'Instructor TBD'}
      </div>
      <div class="div" style="margin:18px 0;border-color:var(--private-card-divider,var(--line-soft));"></div>
      <div style="display:flex;align-items:center;gap:14px;">
        ${_lessonDateTile(lesson.date, { size: 58, radius: 14, monthSize: 10, daySize: 24, letterSpacing: 0.5 })}
        <div>
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;
            letter-spacing:1px;color:var(--private-card-meta,#888);margin-bottom:3px;">Date</div>
          <div style="font-size:16px;font-weight:600;color:var(--private-card-title,#000);">${fmtDate(lesson.date)}</div>
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
    <div class="glass card-row" style="border-radius:12px;cursor:default;${privateCardStyle(lesson)}">
      ${_lessonDateTile(lesson.date, isToday
        ? {}
        : { background: 'var(--bg-tile)', monthColor: '#7f756d', dayColor: '#1E2643' })}
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;color:var(--private-card-title,#000);white-space:nowrap;
          overflow:hidden;text-overflow:ellipsis;">
          ${lessonTitle(lesson, tmpl)} ${privateBadge(lesson)}
          ${isToday ? '<span style="margin-left:6px;" class="badge badge-in-progress">Today</span>' : ''}
        </div>
        <div style="font-size:13px;color:var(--private-card-meta,#777);margin-top:2px;">
          ${lessonTimeLabel(lesson, tmpl)}
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
  setNavHidden(wiz.step >= 2);
  _renderWizardStep(container, ctx);
}

function _renderWizardStep(container, ctx) {
  container.innerHTML = '';
  const enterClass = wiz.step >= 2 ? 'wizard-step-enter-right' : (wiz.templateId ? 'wizard-step-enter-left' : '');

  const wrap = document.createElement('div');
  if (enterClass) wrap.classList.add(enterClass);

  if (wiz.step === 2) {
    setNavHidden(true);
    wrap.innerHTML = pageHead('Group Lesson');
    container.appendChild(wrap);
    const titleRow = wrap.querySelector('.page-head > div');
    titleRow.style.alignItems = 'center';
    titleRow.style.gap = '10px';
    const backBtn = document.createElement('button');
    backBtn.id = 'wiz-back';
    backBtn.type = 'button';
    backBtn.style.cssText = 'flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;padding:6px;background:var(--bg-section-soft);border:1px solid var(--line-soft);border-radius:999px;color:#1E2643;cursor:pointer;-webkit-tap-highlight-color:transparent;';
    backBtn.setAttribute('aria-label', 'Back');
    backBtn.innerHTML = iBack();
    titleRow.prepend(backBtn);
    wrap.querySelector('#wiz-back').addEventListener('click', () => {
      _runWizardTransition(container, ctx, () => {
        wiz.step = 1;
        setNavHidden(false);
      });
    });
  } else if (wiz.step >= 2) {
    setNavHidden(true);
    wrap.innerHTML = pageHead('');
    container.appendChild(wrap);
    const titleRow = wrap.querySelector('.page-head > div');
    titleRow.style.alignItems = 'center';
    // Hide empty h1
    const h1 = titleRow.querySelector('h1');
    if (h1) h1.remove();
    const backBtn = document.createElement('button');
    backBtn.id = 'wiz-back';
    backBtn.type = 'button';
    backBtn.style.cssText = 'flex-shrink:0;display:inline-flex;align-items:center;gap:6px;padding:8px 14px 8px 10px;background:var(--bg-section-soft);border:1px solid var(--line-soft);border-radius:999px;color:#1E2643;font-size:14px;font-weight:600;font-family:\'Inter\',sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;';
    backBtn.innerHTML = iBack() + '<span>Back</span>';
    titleRow.prepend(backBtn);
    wrap.querySelector('#wiz-back').addEventListener('click', () => {
      _runWizardTransition(container, ctx, () => {
        wiz.step = Math.max(1, wiz.step - 1);
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

  if (wiz.step === 1) _step1Choice(body, container, ctx);
  else if (wiz.step === 2) _step2GroupPicker(body, container, ctx);
  else _step3Confirm(body, container, ctx);
}

// Step 1 — choose booking type
function _bookingCutoffPassed(dateStr) {
  // Booking closes at 20:00 the night before the lesson date
  const [y, m, d] = dateStr.split('-').map(Number);
  const cutoff = new Date(y, m - 1, d - 1, 20, 0, 0);
  return Date.now() >= cutoff.getTime();
}

function _step1Choice(body, container, ctx) {
  body.innerHTML = `
    <div class="glass" style="padding:18px 18px 16px;border-radius:16px;margin-bottom:16px;
      background:linear-gradient(135deg,rgba(29,34,52,0.96),rgba(53,62,94,0.96));border:1px solid rgba(247,229,183,0.2);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-family:'Newsreader',serif;font-size:24px;font-weight:700;color:#F7E5B7;line-height:1.15;">Private Lessons</div>
          <div style="font-size:13px;color:#E3D6B7;margin-top:6px;line-height:1.5;">Premium one-on-one coaching with bespoke session timing and priority support.</div>
          <div style="font-size:12px;color:#FFE6B8;margin-top:10px;">from ¥38,000 / session</div>
        </div>
        <span class="badge" style="background:rgba(247,229,183,0.16);color:#F7E5B7;border:1px solid rgba(247,229,183,0.35);">Private</span>
      </div>
      <a href="#/guest/private-book" class="btn btn-md"
        style="margin-top:14px;width:100%;background:#F7E5B7;color:#1D2234;border:none;border-radius:999px;">
        Reserve Private Session
      </a>
    </div>
    <div class="glass" style="padding:18px 18px 16px;border-radius:16px;background:linear-gradient(145deg,rgba(251,247,239,0.95),rgba(245,237,225,0.95));border:1px solid rgba(30,38,67,0.08);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-family:'Newsreader',serif;font-size:24px;font-weight:700;color:#1E2643;line-height:1.15;">Group Lessons</div>
          <div style="font-size:13px;color:#6f6761;margin-top:6px;line-height:1.5;">Join level-based classes and book your next group session in two quick steps.</div>
        </div>
      </div>
      <button id="go-group-booking" class="btn btn-primary btn-md btn-full" style="margin-top:14px;">Browse Group Lessons</button>
    </div>`;
  body.querySelector('#go-group-booking')?.addEventListener('click', () => {
    _runWizardTransition(container, ctx, () => { wiz.step = 2; setNavHidden(true); });
  });
}

// Step 2 — Date picker + class list
function _step2GroupPicker(body, container, ctx) {
  const chips = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    chips.push(d);
  }

  // Pre-select the first date that hasn't passed its booking cutoff
  if (!wiz.date) {
    const firstOpen = chips.find(d => !_bookingCutoffPassed(isoDate(d)));
    if (firstOpen) wiz.date = isoDate(firstOpen);
  }

  function renderLessonList(listEl) {
    if (!wiz.date) {
      listEl.innerHTML = `<div style="text-align:center;padding:40px 0;color:#AAA;font-size:14px;">Select a date to see available classes</div>`;
      return;
    }
    if (_bookingCutoffPassed(wiz.date)) {
      const today = todayStr();
      const tomorrow = isoDate(new Date(Date.now() + 864e5));
      const dayLabel = wiz.date === today ? 'today' : wiz.date === tomorrow ? 'tomorrow' : fmtDate(wiz.date);
      listEl.innerHTML = `
        <div style="text-align:center;padding:32px 20px;background:linear-gradient(135deg,#FFF8EE,#FFF0DD);
          border-radius:16px;border:1px solid rgba(180,110,40,0.15);">
          <div style="font-size:40px;margin-bottom:14px;">🏔️</div>
          <div style="font-weight:700;font-size:16px;color:#5C3A1E;margin-bottom:8px;">
            Booking for ${dayLabel} has finalized.
          </div>
          <div style="font-size:14px;color:#8A6040;line-height:1.6;">
            Contact the front desk or ski school counter<br>for late bookings.
          </div>
        </div>`;
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
              <div style="flex-shrink:0;width:44px;height:44px;background:var(--bg-tile);
                border-radius:10px;display:flex;align-items:center;justify-content:center;
                font-family:'Newsreader',serif;font-size:17px;font-weight:800;color:#1E2643;">
                ${t.id}
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:15px;color:#000;">${t.name}</div>
                <div style="font-size:12px;color:#888;margin-top:2px;">
                  ${lessonTimes(t)}
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
          wiz.step = 3;
          setNavHidden(true);
        });
      });
    });
  }

  body.innerHTML = `
    <div class="glass" style="margin-bottom:20px;padding:14px 16px;border-radius:16px;background:var(--bg-section);">
      <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8A6B53;margin-bottom:10px;">
        Pick your lesson day
      </div>
      <div class="sx" style="display:flex;gap:8px;padding:4px 0;">
        ${chips.map(d => {
          const ds      = isoDate(d);
          const dow     = d.toLocaleDateString('en-US', { weekday: 'short' });
          const day     = d.getDate();
          const mon     = d.toLocaleDateString('en-US', { month: 'short' });
          const sel     = ds === wiz.date;
          const cutoff  = _bookingCutoffPassed(ds);
          return `
            <div class="date-chip${sel ? ' selected' : ''}${ds === todayStr() ? ' today' : ''}"
              data-date="${ds}" style="flex-shrink:0;${cutoff && !sel ? 'opacity:0.38;' : ''}">
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
      <div style="width:1px;background:var(--line-soft);align-self:stretch;margin:0 2px;"></div>
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

// Step 3 — Confirm booking
function _step3Confirm(body, container, ctx) {
  const { session } = ctx;
  const tmpl    = getTemplate(wiz.templateId);
  const lesson  = DB.getLessonsByDateTemplate(wiz.date, wiz.templateId)[0];
  const inst    = lesson?.instructorId ? DB.getUserById(lesson.instructorId) : null;
  const taken   = lesson ? DB.getConfirmedByLesson(lesson.id).length : 0;
  const existing = lesson
    ? DB.getBookingsByGuest(session.id).find(b => b.lessonId === lesson.id && b.status === 'confirmed')
    : null;

  const spotsLeft = tmpl.maxGuests - taken;
  const sportEmoji = tmpl.sport === 'snowboard' ? '🏂' : '⛷️';
  const instFirst  = inst ? inst.name.split(' ')[0] : null;
  const instLast   = inst ? inst.name.split(' ').slice(1).join(' ') : null;

  body.innerHTML = `
    <!-- Hero -->
    <div style="text-align:center;padding:12px 0 36px;">
      <div style="font-size:72px;line-height:1;margin-bottom:20px;">${sportEmoji}</div>
      <div style="font-family:'Newsreader',serif;font-size:36px;font-weight:800;color:#1E2643;
        line-height:1.1;margin-bottom:10px;">${tmpl.name}</div>
      <div style="font-size:16px;color:#888;margin-bottom:4px;">${fmtDateLong(wiz.date)}</div>
      <div style="font-size:16px;color:#888;">${lessonTimes(tmpl)}</div>
    </div>

    <!-- Instructor + Spots -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:32px;">
      <div style="background:var(--bg-section-soft);border-radius:16px;padding:18px 14px;text-align:center;">
        <div class="sec-label" style="margin-bottom:8px;">Instructor</div>
        ${inst
          ? `<div style="font-family:'Newsreader',serif;font-weight:800;font-size:32px;color:#1E2643;line-height:1;">${instFirst}</div>
             <div style="font-size:12px;color:#aaa;margin-top:4px;">${instLast}</div>`
          : `<div style="font-family:'Newsreader',serif;font-weight:800;font-size:32px;color:#aaa;line-height:1;">—</div>`}
      </div>
      <div style="background:var(--bg-section-soft);border-radius:16px;padding:18px 14px;text-align:center;">
        <div class="sec-label" style="margin-bottom:8px;">Spots left</div>
        <div style="font-family:'Newsreader',serif;font-weight:800;font-size:32px;color:${spotsLeft <= 2 ? '#BF2F17' : '#1E2643'};line-height:1;">${spotsLeft}</div>
        <div style="font-size:12px;color:#aaa;margin-top:4px;">of ${tmpl.maxGuests}</div>
      </div>
    </div>

    ${existing ? `
      <div style="background:var(--bg-action-soft);border:1px solid rgba(253,190,0,0.46);border-radius:10px;
        padding:12px 14px;color:#875700;font-size:14px;margin-bottom:20px;display:flex;align-items:center;gap:8px;">
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

export function renderPrivateBook(container, { session }) {
  setNavHidden(true);
  const nav = document.getElementById('bottom-nav');
  if (nav) nav.style.display = 'none';
  document.getElementById('content')?.classList.add('nav-hidden-offset');
  window.addEventListener('hashchange', () => setNavHidden(false), { once: true });
  window.addEventListener('hashchange', () => {
    const currentNav = document.getElementById('bottom-nav');
    if (currentNav) currentNav.style.display = '';
  }, { once: true });
  const today = todayStr();
  const sessionTimes = DB.getPrivateSessionTimes().filter(s => s.active !== false);
  const state = {
    date: today,
    sessionTimeId: sessionTimes[0]?.id ?? '',
    audience: 'adult',
    sport: 'ski',
    templateId: '',
  };

  const templateOptions = () => TEMPLATES
    .filter(t => t.sport === state.sport && t.audience === state.audience);
  state.templateId = templateOptions()[0]?.id ?? '';

  function priceFor(timeId) {
    const map = {
      '09:00 - 10:00': 38000,
      '10:00 - 11:00': 38000,
      '09:00 - 11:00': 68000,
      '11:00 - 13:00': 72000,
      '14:00 - 16:00': 72000,
    };
    const slot = sessionTimes.find(s => s.id === timeId);
    return map[slot?.label] ?? 42000;
  }

  function render() {
    const templates = templateOptions();
    if (!templates.find(t => t.id === state.templateId)) state.templateId = templates[0]?.id ?? '';
    const selectedSlot = sessionTimes.find(s => s.id === state.sessionTimeId) ?? sessionTimes[0];
    const selectedPrice = priceFor(selectedSlot?.id);
    const disciplineLabel = state.sport === 'snowboard' ? 'Snowboard' : 'Ski';
    const audienceLabel = state.audience === 'kids' ? 'Kids' : 'Adult';

    container.innerHTML = `
      ${pageHead('Private Lesson', 'Premium one-on-one booking', '/guest/book')}
      <div style="margin:-16px -20px -32px;padding:20px 16px calc(0px + env(safe-area-inset-bottom,0px));min-height:calc(100vh - 120px);
        background:
          radial-gradient(circle at 14% 2%,rgba(247,229,183,0.22),transparent 28%),
          radial-gradient(circle at 86% 10%,rgba(158,174,244,0.16),transparent 24%),
          linear-gradient(180deg,#273154 0%,#2D375A 22%,#384365 34%,#F6EFE7 52%,#F6EFE7 100%);">
        <div class="glass" style="padding:20px 18px 18px;border-radius:20px;margin:0 0 14px;background:linear-gradient(145deg,rgba(45,55,90,0.98),rgba(61,72,110,0.98));border:1px solid rgba(247,229,183,0.18);box-shadow:0 18px 40px rgba(8,15,31,0.18);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div>
              <div style="font-family:'Newsreader',serif;font-size:34px;font-weight:700;color:#F7E5B7;line-height:1.05;">Private mountain session</div>
              <div style="font-size:14px;color:rgba(246,239,231,0.82);margin-top:8px;line-height:1.55;">
                A dedicated instructor, flexible timing, and a lesson plan shaped around your pace.
              </div>
            </div>
            <span class="badge" style="background:rgba(247,229,183,0.14);color:#F7E5B7;border:1px solid rgba(247,229,183,0.30);">Private</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;">
            <span class="badge" style="background:rgba(255,255,255,0.10);color:#F6EFE7;border:1px solid rgba(255,255,255,0.14);">${disciplineLabel}</span>
            <span class="badge" style="background:rgba(255,255,255,0.10);color:#F6EFE7;border:1px solid rgba(255,255,255,0.14);">${audienceLabel}</span>
            <span class="badge" style="background:rgba(253,190,0,0.16);color:#F7E5B7;border:1px solid rgba(253,190,0,0.28);">${selectedSlot?.label ?? 'Time TBD'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(247,229,183,0.14);">
            <div>
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(246,239,231,0.58);">Starting from</div>
              <div style="font-size:28px;font-weight:700;color:#F7E5B7;margin-top:3px;">¥${selectedPrice.toLocaleString()}</div>
            </div>
            <div style="font-size:12px;color:rgba(246,239,231,0.72);text-align:right;line-height:1.45;">
              Charged to room folio<br>Instructor assigned after booking
            </div>
          </div>
        </div>
        <div style="padding:0;">
          <div class="glass" style="min-height:calc(100vh - 340px);padding:18px 16px calc(28px + env(safe-area-inset-bottom,0px));border-radius:18px 18px 0 0;background:linear-gradient(180deg,rgba(246,239,231,0.99),rgba(246,239,231,0.99));border:1px solid rgba(255,255,255,0.42);box-shadow:0 18px 40px rgba(8,15,31,0.12);">
            <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:16px;">
              <div>
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7A685B;">Booking Details</div>
                <div style="font-family:'Newsreader',serif;font-size:26px;color:#1E2643;line-height:1.05;margin-top:4px;">Build your private lesson</div>
              </div>
            </div>
            <div style="margin-bottom:12px;">
            <label class="field-label">Date</label>
            <input id="pb-date" type="date" class="field-input" min="${today}" value="${state.date}">
            </div>
            <div style="margin-bottom:12px;">
            <label class="field-label">Session Time</label>
            <select id="pb-time" class="field-input">
              ${sessionTimes.map(s => `<option value="${s.id}" ${s.id === selectedSlot?.id ? 'selected' : ''}>${s.label}</option>`).join('')}
            </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
              <div>
              <label class="field-label">Age</label>
              <select id="pb-audience" class="field-input">
                <option value="adult" ${state.audience === 'adult' ? 'selected' : ''}>Adult</option>
                <option value="kids" ${state.audience === 'kids' ? 'selected' : ''}>Kids</option>
              </select>
              </div>
              <div>
              <label class="field-label">Discipline</label>
              <select id="pb-sport" class="field-input">
                <option value="ski" ${state.sport === 'ski' ? 'selected' : ''}>Ski</option>
                <option value="snowboard" ${state.sport === 'snowboard' ? 'selected' : ''}>Snowboard</option>
              </select>
              </div>
            </div>
            <div style="margin-bottom:16px;">
              <label class="field-label">Level</label>
              <select id="pb-template" class="field-input">
                ${templates.map(t => `<option value="${t.id}" ${t.id === state.templateId ? 'selected' : ''}>${t.name}</option>`).join('')}
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
              <div style="background:rgba(30,38,67,0.04);border:1px solid rgba(30,38,67,0.08);border-radius:12px;padding:12px 12px 11px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7A685B;">Session</div>
                <div style="font-weight:700;color:#1E2643;margin-top:6px;">${selectedSlot?.label ?? 'TBD'}</div>
              </div>
              <div style="background:rgba(253,190,0,0.12);border:1px solid rgba(253,190,0,0.20);border-radius:12px;padding:12px 12px 11px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8B6200;">Estimated Total</div>
                <div style="font-weight:700;color:#1E2643;margin-top:6px;">¥${selectedPrice.toLocaleString()}</div>
              </div>
            </div>
            <div style="font-size:12px;color:#6B584B;background:rgba(172,190,185,0.18);border:1px solid rgba(172,190,185,0.32);padding:11px 12px;border-radius:12px;margin-bottom:14px;line-height:1.5;">
              Payment will be charged to your room. We will match the booking to an available instructor after confirmation.
            </div>
            <button id="pb-confirm" class="btn btn-primary btn-lg btn-full" style="background:#1E2643;color:#F6EFE7;border:1px solid rgba(30,38,67,0.06);box-shadow:0 10px 22px rgba(30,38,67,0.18);">${iCheck()} Confirm Private Booking</button>
          </div>
        </div>
      </div>
    `;

    const head = container.querySelector('.page-head');
    if (head) {
      head.style.background = 'linear-gradient(180deg, rgba(30,38,67,0.96), rgba(30,38,67,0.80))';
      head.style.backdropFilter = 'blur(20px) saturate(1.12)';
      head.style.webkitBackdropFilter = 'blur(20px) saturate(1.12)';
      const title = head.querySelector('.page-title-step');
      const sub = head.querySelector('.page-sub');
      const back = head.querySelector('a');
      if (title) title.style.color = '#F7E5B7';
      if (sub) sub.style.color = 'rgba(246,239,231,0.76)';
      if (back) {
        back.style.background = 'rgba(247,229,183,0.12)';
        back.style.borderColor = 'rgba(247,229,183,0.22)';
        back.style.color = '#F7E5B7';
      }
    }
    head?.nextElementSibling?.remove();

    container.querySelector('#pb-date')?.addEventListener('change', e => state.date = e.target.value);
    container.querySelector('#pb-time')?.addEventListener('change', e => { state.sessionTimeId = e.target.value; render(); });
    container.querySelector('#pb-audience')?.addEventListener('change', e => { state.audience = e.target.value; render(); });
    container.querySelector('#pb-sport')?.addEventListener('change', e => { state.sport = e.target.value; render(); });
    container.querySelector('#pb-template')?.addEventListener('change', e => { state.templateId = e.target.value; });
    container.querySelector('#pb-confirm')?.addEventListener('click', () => {
      const slot = sessionTimes.find(s => s.id === state.sessionTimeId);
      if (!slot || !state.date || !state.templateId) return;
      const groupTemplate = getTemplate(state.templateId);
      if (!groupTemplate) return;
      const duplicate = DB.getBookingsByGuest(session.id)
        .filter(b => b.status === 'confirmed')
        .map(b => DB.getLessonById(b.lessonId))
        .some(l => l?.lessonType === 'private' && l.date === state.date && l.privateSessionTimeId === slot.id);
      if (duplicate) {
        toast('You already booked this private session time.', 'info');
        return;
      }
      const lessonId = 'les-private-' + uid();
      DB.upsertLesson({
        id: lessonId,
        templateId: groupTemplate.id,
        date: state.date,
        instructorId: null,
        status: 'scheduled',
        lessonType: 'private',
        privateSessionTimeId: slot.id,
        privateTimeLabel: slot.label,
        privateStart: slot.start,
        privateEnd: slot.end,
        privatePrice: priceFor(slot.id),
      });
      const bookingId = 'bkg-private-' + uid();
      DB.upsertBooking({
        id: bookingId,
        guestId: session.id,
        lessonId,
        createdAt: new Date().toISOString(),
        status: 'confirmed',
      });
      sessionStorage.setItem('snow_new_booking_id', bookingId);
      toast('Private lesson reserved. We will assign your instructor shortly.', 'success');
      navigate('/guest/bookings');
    });
  }

  render();
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
      <div style="padding:0 20px 32px;display:flex;flex-direction:column;gap:8px;">
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

    container.querySelectorAll('[data-booking-card]').forEach(card => {
      card.addEventListener('click', () => {
        const booking = filtered.find(b => b.id === card.dataset.bookingCard);
        if (booking) _openBookingDetailModal(booking, render);
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
  if (newBookingId) {
    const card = container.querySelector(`[data-booking-card="${newBookingId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('bkg-new-shake');
      card.addEventListener('animationend', () => card.classList.remove('bkg-new-shake'), { once: true });
    }
  }
  sessionStorage.removeItem('snow_new_booking_id');
}

function _bookingCard(b, today) {
  const isToday    = b.lesson?.date === today;
  const displayStatus = bookingDisplayStatus(b, b.lesson);
  const isCancelled = b.status === 'cancelled';
  const canCheckReportCard = (
    b.status === 'confirmed' &&
    b.lesson?.status === 'reported' &&
    !!b.report?.submittedAt &&
    !!b.guestReport
  );
  const nextTemplate = b.guestReport?.nextClass ? getTemplate(b.guestReport.nextClass) : null;
  const nextClassLabel = nextTemplate
    ? nextTemplate.name
    : (b.guestReport?.nextClass || 'No recommendation');

  return `
    <div class="glass" data-booking-card="${b.id}"
      style="border-radius:12px;overflow:hidden;cursor:pointer;${privateCardStyle(b.lesson)}${isCancelled ? 'opacity:0.56;' : ''}">
      <div class="card-row" style="align-items:flex-start;padding:16px;">
        <!-- Date block -->
        ${_lessonDateTile(b.lesson?.date, isToday
          ? {}
          : { background: 'var(--bg-tile)', monthColor: '#7f756d', dayColor: '#1E2643' })}
        <!-- Info -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-weight:600;font-size:15px;color:var(--private-card-title,#000);">
              ${lessonTitle(b.lesson, b.tmpl)}
            </span>
            ${privateBadge(b.lesson)}
            ${statusBadge(displayStatus)}
            ${b.isNew ? `<span class="badge" style="background:#E8F5E9;color:#1B5E20;">NEW</span>` : ''}
          </div>
          <div style="font-size:13px;color:var(--private-card-meta,#777);margin-top:4px;">
            ${lessonTimeLabel(b.lesson, b.tmpl)}
            ${b.inst ? ` · ${b.inst.name}` : b.lesson?.instructorId ? '' : ' · Instructor TBD'}
          </div>
        </div>
        <div style="flex-shrink:0;color:var(--private-card-chevron,#9AA0B5);padding-top:2px;">${iChevR()}</div>
      </div>
      ${canCheckReportCard ? `
        <div class="div" style="border-color:var(--private-card-divider,var(--line-soft));"></div>
        <button data-report-card="${b.id}"
          style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;width:100%;
          background:rgba(253,190,0,0.08);border:none;cursor:pointer;color:#875700;
          font-size:14px;font-weight:600;font-family:'Inter',sans-serif;text-align:left;">
          <span style="display:flex;align-items:center;gap:8px;">
            ${iClipboard()} Check lesson report
          </span>
          <span style="display:flex;align-items:center;gap:6px;min-width:0;flex-shrink:0;">
            <span style="font-size:12px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;
              color:#000;background:#FDBE00;padding:5px 8px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.06);">
              ${nextClassLabel}
            </span>
          </span>
        </button>` : ''}
    </div>`;
}

function _openBookingDetailModal(booking, onDone) {
  const { lesson, tmpl, inst, report, guestReport } = booking;
  if (!lesson) return;

  const isPast = lesson.date < todayStr();
  const canCancel = booking.status === 'confirmed' && !isPast;
  const canCheckReportCard = (
    booking.status === 'confirmed' &&
    lesson.status === 'completed' &&
    !!report?.submittedAt &&
    !!guestReport
  );
  const spotsTaken = DB.getConfirmedByLesson(lesson.id).length;
  const spotsLabel = tmpl ? `${spotsTaken} of ${tmpl.maxGuests} spots filled` : null;

  openModal('guest-booking-detail', 'Lesson Details', `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="glass" style="padding:18px;border-radius:14px;">
        <div style="display:flex;align-items:flex-start;gap:14px;">
          ${_lessonDateTile(lesson.date, lesson.date === todayStr()
            ? { size: 54, radius: 14, monthSize: 10, daySize: 22, letterSpacing: 0.5 }
            : { size: 54, radius: 14, monthSize: 10, daySize: 22, background: 'var(--bg-tile)', monthColor: '#7f756d', dayColor: '#1E2643', letterSpacing: 0.5 })}
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-family:'Newsreader',serif;font-size:24px;font-weight:700;color:var(--private-card-title,#000);line-height:1.1;">
                ${lessonTitle(lesson, tmpl)}
              </span>
              ${privateBadge(lesson)}
              ${statusBadge(bookingDisplayStatus(booking, lesson))}
            </div>
            <div style="font-size:13px;color:var(--private-card-meta,#777);margin-top:6px;">
              ${fmtDateLong(lesson.date)}
            </div>
          </div>
        </div>
      </div>

      <div class="glass" style="padding:16px;border-radius:14px;">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#888;">Schedule</span>
            <span style="font-weight:600;color:#000;text-align:right;">${lessonTimeLabel(lesson, tmpl) || '—'}</span>
          </div>
          <div class="div"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#888;">Instructor</span>
            <span style="font-weight:600;color:#000;text-align:right;">${inst ? inst.name : 'To be assigned'}</span>
          </div>
          ${spotsLabel ? `
            <div class="div"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
              <span style="font-size:13px;color:#888;">${lesson.lessonType === 'private' ? 'Session size' : 'Group size'}</span>
              <span style="font-weight:600;color:#000;text-align:right;">${lesson.lessonType === 'private' ? '1 guest' : spotsLabel}</span>
            </div>` : ''}
        </div>
      </div>

      ${canCheckReportCard ? `
        <button id="detail-report-card"
          style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;width:100%;
          background:rgba(253,190,0,0.1);border:none;border-radius:14px;cursor:pointer;color:#875700;
          font-size:14px;font-weight:600;font-family:'Inter',sans-serif;text-align:left;">
          <span style="display:flex;align-items:center;gap:8px;">
            ${iClipboard()} Check lesson report
          </span>
          <span style="color:#B07A00;">${iChevR()}</span>
        </button>` : ''}

      ${canCancel ? `
        <div class="glass" style="border-radius:14px;overflow:hidden;background:var(--bg-section);">
          <div style="padding:16px 16px 14px;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8A6B53;">
              Need to change plans?
            </div>
            <div style="font-size:14px;color:#5D4B40;line-height:1.55;margin-top:8px;">
              You can manage this booking here if your plans changed.
            </div>
          </div>
          <div id="cancel-strip">
            <button data-sc-trigger style="display:flex;align-items:center;gap:8px;padding:13px 20px;width:100%;
              background:rgba(139,58,46,0.06);border:none;border-top:1px solid rgba(139,58,46,0.12);
              cursor:pointer;color:#8B3A2E;font-size:14px;font-weight:600;
              font-family:'Inter',sans-serif;">
              Cancel booking
            </button>
          </div>
        </div>` : ''}
    </div>
  `);

  document.getElementById('detail-report-card')?.addEventListener('click', () => {
    dismissModal('guest-booking-detail', () => _openReportCardModal(booking));
  });

  const cancelStrip = document.getElementById('cancel-strip');
  if (cancelStrip) {
    const FADE = 130;
    const primaryHTML = cancelStrip.innerHTML;

    function swapStrip(html, cb) {
      cancelStrip.style.transition = `opacity ${FADE}ms ease`;
      cancelStrip.style.opacity = '0';
      setTimeout(() => { cancelStrip.innerHTML = html; cancelStrip.style.opacity = '1'; cb?.(); }, FADE);
    }

    function bindPrimary() {
      cancelStrip.querySelector('[data-sc-trigger]')?.addEventListener('click', showConfirm);
    }

    function showConfirm() {
      swapStrip(`
        <div style="display:flex;align-items:stretch;border-top:1px solid rgba(139,58,46,0.12);">
          <span style="flex:1;padding:13px 16px;font-size:13px;font-weight:500;
            color:#6C4040;align-self:center;">Confirm cancel?</span>
          <button data-sc="keep" style="padding:13px 16px;background:none;border:none;
            border-left:1px solid rgba(0,0,0,0.07);cursor:pointer;font-size:14px;color:#888;
            font-weight:500;font-family:'Inter',sans-serif;white-space:nowrap;">Keep</button>
          <button data-sc="yes" style="padding:13px 18px;background:#8B3A2E;border:none;
            cursor:pointer;font-size:14px;color:#fff;font-weight:700;
            font-family:'Inter',sans-serif;white-space:nowrap;border-radius:0 0 14px 0;">
            Yes, cancel
          </button>
        </div>`, () => {
          cancelStrip.querySelector('[data-sc="keep"]').addEventListener('click', () => {
            swapStrip(primaryHTML, bindPrimary);
          });
          cancelStrip.querySelector('[data-sc="yes"]').addEventListener('click', () => {
            openModal('refund-policy', 'Refund Policy', `
              <div style="font-size:14px;color:#5D4B40;line-height:1.6;margin-bottom:16px;">
                Cancellations may be subject to resort policy and time-based handling fees. Please confirm you understand before cancelling.
              </div>
              <div style="display:flex;gap:8px;">
                <button id="rp-back" class="btn btn-ghost btn-md" style="flex:1;">Back</button>
                <button id="rp-confirm" class="btn btn-primary btn-md" style="flex:1;background:#8B3A2E;">Confirm Cancel</button>
              </div>
            `);
            setTimeout(() => {
              document.getElementById('rp-back')?.addEventListener('click', () => dismissModal('refund-policy'));
              document.getElementById('rp-confirm')?.addEventListener('click', () => {
                DB.cancelBooking(booking.id);
                dismissModal('refund-policy', () => {
                  dismissModal('guest-booking-detail', () => { toast('Booking cancelled.', 'info'); onDone(); });
                });
              });
            }, 50);
          });
        });
    }

    bindPrimary();
  }
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
        <div style="font-family:'Newsreader',serif;font-size:22px;font-weight:700;color:var(--private-card-title,#000);">
          ${lessonTitle(lesson, tmpl)} ${privateBadge(lesson)}
        </div>
        <div style="font-size:13px;color:var(--private-card-meta,#777);margin-top:4px;">
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
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <div style="font-size:12px;color:#888;">Recommended Next Class</div>
          ${nextClassLabel ? `
            <div style="font-size:12px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;
              color:#000;background:#FDBE00;padding:5px 8px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.06);">
              ${nextClassLabel}
            </div>` : ''}
        </div>
        ${!nextClassLabel ? `
          <div style="font-size:14px;color:#000;line-height:1.5;margin-top:8px;">
            No next class recommendation yet.
          </div>` : ''}
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
