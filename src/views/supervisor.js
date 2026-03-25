import { DB, TEMPLATES, getTemplate, isoDate } from '../data.js';
import { navigate } from '../app.js';
import {
  toast, pageHead, statusBadge, bookingDisplayStatus, sportBadge, audienceBadge,
  av, secLabel, emptyState, openModal, closeModal, dismissModal,
  fmtDate, fmtDateLong, todayStr,
  tabBar, lessonTimes, iChevR, iCalendar, iPeople, iPlus,
  iClipboard, iCheck, iWarn, iEdit,
} from '../ui.js';

// ── Supervisor Dashboard ──────────────────────────────────────────────────────
export function renderSupervisorDashboard(container, { session }) {
  const today    = todayStr();
  const todayLes = DB.getLessonsByDate(today);
  const unassigned = todayLes.filter(l => !l.instructorId && l.status !== 'completed' && l.status !== 'reported').length;
  const pendingRep = todayLes.filter(l =>
    l.status === 'completed' && !DB.getReportByLesson(l.id)
  ).length;

  // Recent bookings (last 5)
  const recentBkgs = DB.getBookings()
    .sort((a,b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map(b => ({
      ...b,
      guest:  DB.getUserById(b.guestId),
      lesson: DB.getLessonById(b.lessonId),
    }));

  container.innerHTML = `
    ${pageHead('Overview', fmtDateLong(today))}

    <!-- Stats row -->
      <div style="padding:8px 20px 20px;display:flex;gap:10px;">
        <div class="glass-strong" style="flex:1;padding:16px 10px;text-align:center;">
          <div class="stat-num">${todayLes.length}</div>
          <div class="stat-lbl">Sessions</div>
        </div>
        <div class="glass-strong${unassigned>0?' ':''}${unassigned>0?'':''}" style="flex:1;padding:16px 10px;text-align:center;
          ${unassigned>0?'border:1.5px solid rgba(199,83,0,0.25);background:rgba(255,240,220,0.6);':''}">
          <div class="stat-num" style="${unassigned>0?'color:#C75300;':''}">${unassigned}</div>
          <div class="stat-lbl">Unassigned</div>
        </div>
        <div class="glass-strong" style="flex:1;padding:16px 10px;text-align:center;
          ${pendingRep>0?'border:1.5px solid rgba(199,83,0,0.2);background:rgba(255,240,220,0.5);':''}">
          <div class="stat-num" style="${pendingRep>0?'color:#C75300;':''}">${pendingRep}</div>
          <div class="stat-lbl">Pending Rep.</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div style="padding:0 20px 8px;">${secLabel('Quick Actions')}</div>
    <div style="padding:0 12px 20px;display:flex;flex-direction:column;gap:8px;">
      ${[
        { href:'/supervisor/bookings',    icon: iCalendar(),  label:'View All Bookings',    sub:`${DB.getBookings().filter(b=>b.status==='confirmed').length} confirmed` },
        { href:'/supervisor/instructors', icon: iPeople(),    label:'Manage Instructors',   sub:`${DB.getInstructors().length} instructors` },
      ].map(a => `
        <a href="#${a.href}" class="glass-strong card-row" style="text-decoration:none;border-radius:12px;">
          <div style="width:40px;height:40px;background:var(--bg-tile);border-radius:10px;
            display:flex;align-items:center;justify-content:center;color:#1E2643;flex-shrink:0;">
            ${a.icon}
          </div>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:15px;color:#000;">${a.label}</div>
            <div style="font-size:13px;color:#6b625d;margin-top:2px;">${a.sub}</div>
          </div>
          <div style="color:#AAA;">${iChevR()}</div>
        </a>`).join('')}
    </div>

    <!-- Unassigned sessions alert -->
    ${unassigned > 0 ? `
    <div style="padding:0 12px 20px;">
      <div class="glass-strong" style="padding:16px;border:1.5px solid rgba(199,83,0,0.25);
        background:var(--bg-action-soft);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          ${iWarn()}
          <div style="font-weight:600;color:#875700;">
            ${unassigned} session${unassigned>1?'s':''} need an instructor today
          </div>
        </div>
        ${todayLes.filter(l=>!l.instructorId&&l.status!=='completed'&&l.status!=='reported').map(l => {
          const tmpl = getTemplate(l.templateId);
          return `
            <a href="#/supervisor/assign/${l.id}"
              style="display:flex;align-items:center;justify-content:space-between;
              padding:8px 0;text-decoration:none;color:inherit;border-top:1px solid rgba(199,83,0,0.1);">
              <div>
                <span style="font-weight:600;font-size:14px;color:#000;">${tmpl?.name ?? l.templateId}</span>
              </div>
              <span class="btn btn-sm btn-ghost" style="color:#875700;border-color:rgba(199,83,0,0.25);">Assign →</span>
            </a>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- Recent activity -->
    <div style="padding:0 20px 8px;">${secLabel('Recent Bookings')}</div>
    <div style="padding:0 12px 20px;display:flex;flex-direction:column;gap:6px;">
      ${recentBkgs.length === 0
        ? emptyState('📋','No bookings yet','')
        : recentBkgs.map(b => `
          <div class="glass-strong" style="display:flex;align-items:center;gap:10px;
            padding:12px 14px;border-radius:12px;">
            ${av(b.guest?.avatar, 'sm')}
            <div style="flex:1;min-width:0;">
              <div style="font-weight:500;font-size:14px;color:#000;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${b.guest?.name ?? 'Guest'}
              </div>
              <div style="font-size:12px;color:#6b625d;">
                ${b.lesson ? getTemplate(b.lesson.templateId)?.name ?? '' : ''}
                · ${b.lesson ? fmtDate(b.lesson.date) : ''}
              </div>
            </div>
            ${statusBadge(bookingDisplayStatus(b, b.lesson))}
          </div>`).join('')}
    </div>

  `;
}

// ── All Bookings ───────────────────────────────────────────────────────────────
export function renderAllBookings(container, { session }) {
  let dateFilter   = todayStr();
  let statusFilter = 'all';

  function render() {
    const all = DB.getBookings()
      .map(b => ({
        ...b,
        guest:  DB.getUserById(b.guestId),
        lesson: DB.getLessonById(b.lessonId),
      }))
      .filter(b => {
        const matchDate   = !dateFilter || b.lesson?.date === dateFilter;
        const matchStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchDate && matchStatus;
      })
      .sort((a,b) => {
        const ad = a.lesson?.date ?? '';
        const bd = b.lesson?.date ?? '';
        return ad.localeCompare(bd);
      });

    container.innerHTML = `
      ${pageHead('All Bookings')}

      <!-- Date filter -->
      <div style="padding:0 20px 12px;">
        <label class="field-label">Date</label>
        <input type="date" class="field-input" id="date-filter" value="${dateFilter}">
      </div>

      <!-- Status filter -->
      <div class="sx" style="display:flex;gap:8px;padding:0 20px 20px;">
        ${['all','confirmed','cancelled'].map(s =>
          `<button class="pill-filter${statusFilter===s?' active':''}" data-status="${s}">
            ${s.charAt(0).toUpperCase()+s.slice(1)}
          </button>`
        ).join('')}
      </div>

      <!-- Count -->
      <div style="padding:0 20px 8px;display:flex;align-items:center;justify-content:space-between;">
        ${secLabel(`${all.length} booking${all.length!==1?'s':''}`)}
        <button id="clear-date" style="background:none;border:none;cursor:pointer;
          font-size:12px;color:#6b625d;font-family:'Inter',sans-serif;">
          ${dateFilter ? 'Clear date ×' : ''}
        </button>
      </div>

      <!-- List -->
      <div style="padding:0 12px 32px;display:flex;flex-direction:column;gap:6px;">
        ${all.length === 0
          ? emptyState('📭','No bookings found','Try adjusting the filters.')
          : all.map(b => {
            const tmpl = b.lesson ? getTemplate(b.lesson.templateId) : null;
            const inst = b.lesson?.instructorId ? DB.getUserById(b.lesson.instructorId) : null;
            return `
              <div class="glass-strong" style="border-radius:12px;overflow:hidden;">
                <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
                  ${av(b.guest?.avatar, 'md')}
                  <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:15px;color:#000;
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      ${b.guest?.name ?? 'Guest'}
                    </div>
                    <div style="font-size:13px;color:#777;margin-top:2px;">
                      ${tmpl?.name ?? b.lessonId}
                      · ${b.lesson ? fmtDate(b.lesson.date) : ''}
                    </div>
                  </div>
                  ${statusBadge(bookingDisplayStatus(b, b.lesson))}
                </div>
                <div class="div"></div>
                <div style="padding:10px 16px;font-size:12px;color:#6b625d;
                  display:flex;gap:16px;flex-wrap:wrap;">
                  <span>Instructor: ${inst?.name ?? 'TBD'}</span>
                  <span>${tmpl ? lessonTimes(tmpl) : ''}</span>
                </div>
              </div>`;
          }).join('')}
      </div>`;

    container.querySelector('#date-filter').addEventListener('change', e => {
      dateFilter = e.target.value;
      render();
    });
    container.querySelector('#clear-date').addEventListener('click', () => {
      dateFilter = '';
      render();
    });
    container.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', () => { statusFilter = btn.dataset.status; render(); });
    });
  }

  render();
}

// ── Instructor Management ──────────────────────────────────────────────────────
export function renderInstructorMgmt(container, { session }) {
  const today = todayStr();

  function render() {
    const instructors = DB.getInstructors();

    container.innerHTML = `
      ${pageHead('Instructors')}

      <!-- Add instructor button -->
      <div style="padding:0 20px 20px;">
        <button id="add-inst" class="btn btn-navy btn-md btn-full">
          ${iPlus()} Add Instructor
        </button>
      </div>

      <div style="padding:0 20px 8px;">${secLabel(`Team (${instructors.length})`)}</div>
      <div style="padding:0 12px 32px;display:flex;flex-direction:column;gap:8px;">
        ${instructors.length === 0
          ? emptyState('👤','No instructors yet','Add your first instructor.')
          : instructors.map(inst => {
            const todayCount = DB.getLessonsByInstructor(inst.id)
              .filter(l => l.date === today).length;
            const totalBkgs = DB.getLessonsByInstructor(inst.id)
              .reduce((s,l) => s + DB.getConfirmedByLesson(l.id).length, 0);
            return `
              <div class="glass-strong" style="border-radius:14px;overflow:hidden;">
                <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
                  ${av(inst.avatar, 'md')}
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:15px;color:#000;">${inst.name}</div>
                    <div style="font-size:13px;color:#777;margin-top:2px;">
                      ${todayCount} session${todayCount!==1?'s':''} today
                      · ${totalBkgs} guests total
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button class="btn btn-ghost btn-xs edit-inst" data-id="${inst.id}"
                      title="Edit">${iEdit()}</button>
                    <a href="#/instructor/schedule" class="btn btn-ghost btn-xs"
                      title="View schedule">${iCalendar()}</a>
                  </div>
                </div>
              </div>`;
          }).join('')}
      </div>
    `;

    container.querySelector('#add-inst').addEventListener('click', () => _addInstModal(render));
    container.querySelectorAll('.edit-inst').forEach(btn => {
      btn.addEventListener('click', () => {
        const inst = DB.getUserById(btn.dataset.id);
        if (inst) _editInstModal(inst, render);
      });
    });
  }

  render();
}

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
    <button id="ai-save" class="btn btn-primary btn-lg btn-full">Add Instructor</button>
  `);

  setTimeout(() => {
    document.getElementById('ai-save')?.addEventListener('click', () => {
      const name  = document.getElementById('ai-name')?.value ?? '';
      const email = document.getElementById('ai-email')?.value ?? '';
      const pw    = document.getElementById('ai-pw')?.value ?? '';
      const errEl = document.getElementById('add-err');

      if (!name.trim() || !email.trim() || pw.length < 6) {
        if (errEl) { errEl.innerHTML = '<div class="err-box">Please fill all fields (password min 6 chars).</div>'; errEl.style.display='block'; }
        return;
      }
      if (DB.getUserByEmail(email)) {
        if (errEl) { errEl.innerHTML = '<div class="err-box">Email already in use.</div>'; errEl.style.display='block'; }
        return;
      }

      const newInst = {
        id:       'u-' + Date.now().toString(36),
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        password: pw,
        role:     'instructor',
        avatar:   name.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase(),
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
    <button id="ei-save" class="btn btn-primary btn-lg btn-full">Save Changes</button>
  `);

  setTimeout(() => {
    document.getElementById('ei-save')?.addEventListener('click', () => {
      const name = document.getElementById('ei-name')?.value ?? '';
      if (!name.trim()) return;
      const updated = {
        ...inst,
        name: name.trim(),
        avatar: name.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase(),
      };
      DB.upsertUser(updated);
      dismissModal('edit-inst', () => { toast('Instructor updated.', 'success'); onDone(); });
    });
  }, 50);
}

// ── Assign Instructor ──────────────────────────────────────────────────────────
export function renderAssign(container, { params, session }) {
  const lesson = DB.getLessonById(params.id);
  if (!lesson) {
    container.innerHTML = pageHead('Not Found') + emptyState('❓','Lesson not found','');
    return;
  }

  const tmpl        = getTemplate(lesson.templateId);
  const instructors = DB.getInstructors();
  const today       = lesson.date;

  function render() {
    const lesson = DB.getLessonById(params.id); // re-fetch for updated instructorId

    container.innerHTML = `
      ${pageHead('Assign Instructor',
        `${tmpl?.name ?? lesson.templateId} · ${fmtDate(lesson.date)}`,
        '/supervisor/dashboard')}

      <!-- Lesson summary -->
      <div style="padding:0 20px 20px;">
        <div class="glass-strong" style="padding:16px;">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
            ${statusBadge(lesson.status)}
            ${tmpl ? `<span class="badge badge-${tmpl.sport}">${tmpl.sport==='ski'?'⛷':'🏂'} ${tmpl.sport}</span>` : ''}
          </div>
          <div style="font-size:13px;color:#6b625d;">
            ${tmpl ? lessonTimes(tmpl) : '—'}
            &nbsp;·&nbsp;
            ${DB.getConfirmedByLesson(lesson.id).length} / ${tmpl?.maxGuests ?? '—'} guests booked
          </div>
          ${lesson.instructorId ? `
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(30,38,67,0.07);
              font-size:13px;color:#076b1a;font-weight:500;display:flex;align-items:center;gap:6px;">
              ${iCheck()} Currently: ${DB.getUserById(lesson.instructorId)?.name ?? 'Unknown'}
            </div>` : `
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(30,38,67,0.07);
              font-size:13px;color:#C75300;font-weight:500;display:flex;align-items:center;gap:6px;">
              ${iWarn()} No instructor assigned
            </div>`}
        </div>
      </div>

      <div style="padding:0 20px 8px;">${secLabel('Available Instructors')}</div>
      <div style="padding:0 12px 32px;display:flex;flex-direction:column;gap:8px;">
        ${instructors.map(inst => {
          const dayLoad = DB.getLessonsByInstructor(inst.id).filter(l => l.date === today).length;
          const isCurrent = lesson.instructorId === inst.id;
          return `
            <div class="glass-strong" style="display:flex;align-items:center;gap:12px;
              padding:14px 16px;border-radius:12px;
              ${isCurrent?'border:1.5px solid rgba(8,138,32,0.3);background:rgba(220,245,226,0.5);':''}">
              ${av(inst.avatar, 'md')}
              <div style="flex:1;">
                <div style="font-weight:600;font-size:15px;color:#000;">
                  ${inst.name}
                  ${isCurrent ? `<span style="margin-left:6px;" class="badge badge-confirmed">Current</span>` : ''}
                </div>
                <div style="font-size:13px;color:#777;margin-top:2px;">
                  ${dayLoad} session${dayLoad!==1?'s':''} on ${fmtDate(today)}
                  ${dayLoad === 0 ? '<span style="margin-left:4px;color:#088A20;font-weight:500;">· Free</span>' : ''}
                </div>
              </div>
              ${isCurrent
                ? `<button class="btn btn-ghost btn-sm" data-unassign="${lesson.id}"
                    style="color:#BF2F17;border-color:rgba(191,47,23,0.25);">Remove</button>`
                : `<button class="btn btn-navy btn-sm" data-assign="${inst.id}">Assign</button>`}
            </div>`;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('[data-assign]').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = { ...lesson, instructorId: btn.dataset.assign };
        DB.upsertLesson(updated);
        const inst = DB.getUserById(btn.dataset.assign);
        toast(`${inst?.name} assigned.`, 'success');
        render();
      });
    });

    container.querySelectorAll('[data-unassign]').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = { ...lesson, instructorId: null };
        DB.upsertLesson(updated);
        toast('Instructor removed.', 'info');
        render();
      });
    });
  }

  render();
}
