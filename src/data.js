// ── Storage keys ────────────────────────────────────────────────────────────
export const KEYS = {
  USERS:    'snow_users',
  LESSONS:  'snow_lessons',
  BOOKINGS: 'snow_bookings',
  REPORTS:  'snow_reports',
  SESSION:  'snow_session',
  SEEDED:   'snow_seeded_v6',
  TIME_OFF: 'snow_time_off',
  TMPL_OVERRIDES: 'snow_tmpl_overrides',
};

// ── Generic helpers ──────────────────────────────────────────────────────────
function read(key)        { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function write(key, arr)  { localStorage.setItem(key, JSON.stringify(arr)); }
function readOne(key)     { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function writeOne(key, v) { localStorage.setItem(key, JSON.stringify(v)); }

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function isoDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

// ── Lesson templates (all 24 from Club Med table) ────────────────────────────
// Levels: Lv1 → beginner, Lv2 → intermediate, Lv3 → advanced
export const TEMPLATES = [
  // ── Adult Ski ──────────────────────────────────────────────────────────────
  { id:'C6',  name:'CLUB 6',    sport:'ski',        audience:'adult', level:'advanced',     maxGuests:8, amStart:'09:00', amEnd:'11:30', pmStart:'13:15', pmEnd:'15:45' },
  { id:'C5',  name:'CLUB 5',    sport:'ski',        audience:'adult', level:'advanced',     maxGuests:8, amStart:'09:00', amEnd:'11:30', pmStart:'13:15', pmEnd:'15:45' },
  { id:'C4',  name:'CLUB 4',    sport:'ski',        audience:'adult', level:'intermediate', maxGuests:8, amStart:'09:15', amEnd:'11:30', pmStart:'13:15', pmEnd:'15:30' },
  { id:'C3',  name:'CLUB 3',    sport:'ski',        audience:'adult', level:'beginner',     maxGuests:8, amStart:'09:30', amEnd:'11:45', pmStart:'13:30', pmEnd:'15:45' },
  { id:'C2',  name:'CLUB 2',    sport:'ski',        audience:'adult', level:'beginner',     maxGuests:8, amStart:'09:45', amEnd:'11:45', pmStart:'13:45', pmEnd:'15:45' },
  { id:'C1',  name:'CLUB 1',    sport:'ski',        audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:00', amEnd:'12:00', pmStart:'13:30', pmEnd:'15:30' },
  { id:'CB',  name:'CLUB BEGINNER',  sport:'ski',        audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:15', amEnd:'12:15', pmStart:'14:00', pmEnd:'16:00' },
  // ── Adult Snowboard ────────────────────────────────────────────────────────
  { id:'S4',  name:'SB 4',      sport:'snowboard',  audience:'adult', level:'intermediate', maxGuests:8, amStart:'09:45', amEnd:'12:00', pmStart:'13:30', pmEnd:'15:45' },
  { id:'S3',  name:'SB 3',      sport:'snowboard',  audience:'adult', level:'intermediate', maxGuests:8, amStart:'09:45', amEnd:'12:00', pmStart:'13:30', pmEnd:'15:45' },
  { id:'S2',  name:'SB 2',      sport:'snowboard',  audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:00', amEnd:'12:00', pmStart:'13:45', pmEnd:'15:45' },
  { id:'S1',  name:'SB 1',      sport:'snowboard',  audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:15', amEnd:'12:15', pmStart:'14:00', pmEnd:'16:00' },
  { id:'SB',  name:'SB BEGINNER',    sport:'snowboard',  audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:15', amEnd:'12:15', pmStart:'14:00', pmEnd:'16:00' },
  // ── Kids Ski ───────────────────────────────────────────────────────────────
  { id:'TG',  name:'TRIDENT GOLD',    sport:'ski',        audience:'kids',  level:'advanced',     maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'TB',  name:'TRIDENT BRONZE',  sport:'ski',        audience:'kids',  level:'intermediate', maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'T3',  name:'TRIDENT 3',        sport:'ski',        audience:'kids',  level:'intermediate', maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'T2',  name:'TRIDENT 2',        sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:15', amEnd:'11:30', pmStart:'13:15', pmEnd:'15:30' },
  { id:'T1',  name:'TRIDENT 1',        sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:30', amEnd:'11:30', pmStart:'13:30', pmEnd:'15:30' },
  { id:'DR',  name:'DRAGON',    sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:30', amEnd:'11:30', pmStart:'13:30', pmEnd:'15:30' },
  { id:'TGR', name:'TIGER',     sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:45', amEnd:'11:45', pmStart:'13:45', pmEnd:'15:45' },
  { id:'PD',  name:'PANDA',     sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'10:00', amEnd:'11:30', pmStart:'14:00', pmEnd:'15:30' },
  // ── Kids Snowboard ─────────────────────────────────────────────────────────
  { id:'R3',  name:'RIDER 3',   sport:'snowboard',  audience:'kids',  level:'intermediate', maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'R2',  name:'RIDER 2',   sport:'snowboard',  audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'R1',  name:'RIDER 1',   sport:'snowboard',  audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:00', amEnd:'11:00', pmStart:'13:00', pmEnd:'15:00' },
  { id:'RD',  name:'RIDER',     sport:'snowboard',  audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:00', amEnd:'11:00', pmStart:'13:00', pmEnd:'15:00' },
];

export function getTemplate(id) {
  const base = TEMPLATES.find(t => t.id === id) ?? null;
  if (!base) return null;
  try {
    const overrides = JSON.parse(localStorage.getItem(KEYS.TMPL_OVERRIDES) || '{}');
    return overrides[id] ? { ...base, ...overrides[id] } : base;
  } catch { return base; }
}

export function saveTemplateOverride(id, fields) {
  try {
    const overrides = JSON.parse(localStorage.getItem(KEYS.TMPL_OVERRIDES) || '{}');
    overrides[id] = { ...(overrides[id] || {}), ...fields };
    localStorage.setItem(KEYS.TMPL_OVERRIDES, JSON.stringify(overrides));
  } catch {}
}

// ── DB API ───────────────────────────────────────────────────────────────────
export const DB = {
  // Users
  getUsers:         ()       => read(KEYS.USERS),
  getUserById:      (id)     => read(KEYS.USERS).find(u => u.id === id) ?? null,
  getUserByEmail:   (email)  => read(KEYS.USERS).find(u => u.email === email.toLowerCase().trim()) ?? null,
  getInstructors:   ()       => read(KEYS.USERS).filter(u => u.role === 'instructor'),
  upsertUser: (user) => {
    const arr = read(KEYS.USERS);
    const i = arr.findIndex(u => u.id === user.id);
    if (i >= 0) arr[i] = user; else arr.push(user);
    write(KEYS.USERS, arr);
  },

  // Session
  getSession:   ()    => readOne(KEYS.SESSION),
  setSession:   (u)   => writeOne(KEYS.SESSION, u),
  clearSession: ()    => localStorage.removeItem(KEYS.SESSION),

  // Lessons
  getLessons:              ()           => read(KEYS.LESSONS),
  getLessonById:           (id)         => read(KEYS.LESSONS).find(l => l.id === id) ?? null,
  getLessonsByDate:        (date)       => read(KEYS.LESSONS).filter(l => l.date === date),
  getLessonsByInstructor:  (iid)        => read(KEYS.LESSONS).filter(l => l.instructorId === iid),
  getLessonsByDateRange:   (from, to)   => read(KEYS.LESSONS).filter(l => l.date >= from && l.date <= to),
  getLessonsByDateTemplate:(date, tmpl) => read(KEYS.LESSONS).filter(l => l.date === date && l.templateId === tmpl),
  upsertLesson: (lesson) => {
    const arr = read(KEYS.LESSONS);
    const i = arr.findIndex(l => l.id === lesson.id);
    if (i >= 0) arr[i] = lesson; else arr.push(lesson);
    write(KEYS.LESSONS, arr);
  },

  // Bookings
  getBookings:          ()        => read(KEYS.BOOKINGS),
  getBookingById:       (id)      => read(KEYS.BOOKINGS).find(b => b.id === id) ?? null,
  getBookingsByGuest:   (gid)     => read(KEYS.BOOKINGS).filter(b => b.guestId === gid),
  getBookingsByLesson:  (lid)     => read(KEYS.BOOKINGS).filter(b => b.lessonId === lid),
  getConfirmedByLesson: (lid)     => read(KEYS.BOOKINGS).filter(b => b.lessonId === lid && b.status === 'confirmed'),
  upsertBooking: (booking) => {
    const arr = read(KEYS.BOOKINGS);
    const i = arr.findIndex(b => b.id === booking.id);
    if (i >= 0) arr[i] = booking; else arr.push(booking);
    write(KEYS.BOOKINGS, arr);
  },
  cancelBooking: (id) => {
    const arr = read(KEYS.BOOKINGS);
    const i = arr.findIndex(b => b.id === id);
    if (i >= 0) { arr[i] = { ...arr[i], status: 'cancelled' }; write(KEYS.BOOKINGS, arr); }
  },

  // Reports
  getReports:         ()    => read(KEYS.REPORTS),
  getReportByLesson:  (lid) => read(KEYS.REPORTS).find(r => r.lessonId === lid) ?? null,
  upsertReport: (report) => {
    const arr = read(KEYS.REPORTS);
    const i = arr.findIndex(r => r.id === report.id);
    if (i >= 0) arr[i] = report; else arr.push(report);
    write(KEYS.REPORTS, arr);
  },

  // Lesson deletion
  deleteLesson: (id) => {
    const arr = read(KEYS.LESSONS).filter(l => l.id !== id);
    write(KEYS.LESSONS, arr);
  },

  // Time-off requests
  getTimeOff:              ()    => read(KEYS.TIME_OFF),
  getTimeOffByInstructor:  (iid) => read(KEYS.TIME_OFF).filter(t => t.instructorId === iid),
  getTimeOffPending:       ()    => read(KEYS.TIME_OFF).filter(t => t.status === 'pending'),
  upsertTimeOff: (tor) => {
    const arr = read(KEYS.TIME_OFF);
    const i = arr.findIndex(t => t.id === tor.id);
    if (i >= 0) arr[i] = tor; else arr.push(tor);
    write(KEYS.TIME_OFF, arr);
  },
};

// ── Seed helpers ─────────────────────────────────────────────────────────────
const _FIRST = [
  'Akira','Yuta','Haruki','Sora','Ren','Kai','Hana','Mika','Naoki','Yui',
  'Sophie','Emma','Léa','Chloé','Camille','Jules','Thomas','Hugo','Lena','Nina',
  'James','Oliver','Liam','Noah','Ava','William','Benjamin','Grace','Henry','Ella',
  'Mei','Lin','Wei','Jun','Yuna','Ji-ho','Min','Seo','Da-eun','Tae',
  'Marco','Giulia','Luca','Anna','Matteo','Chiara','Alessandro','Valentina','Lorenzo','Francesca',
];
const _LAST = [
  'Yamamoto','Tanaka','Suzuki','Sato','Kobayashi','Ito','Watanabe','Nakamura','Matsumoto','Ogawa',
  'Martin','Bernard','Dubois','Simon','Laurent','Moreau','Petit','Leroy','Roux','Girard',
  'Smith','Johnson','Williams','Brown','Davis','Miller','Wilson','Taylor','Anderson','Thomas',
  'Kim','Park','Lee','Chen','Wang','Zhang','Müller','Fischer','García','Rossi',
  'Bernardi','Ferrari','Esposito','Romano','Colombo','Ricci','Marino','Greco','Bruno','Conti',
];
function _seedName(i) {
  return `${_FIRST[i % _FIRST.length]} ${_LAST[(i * 7 + 3) % _LAST.length]}`;
}
function _initials(name) {
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Core seed logic ──────────────────────────────────────────────────────────
function _doSeed() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = isoDate(today);

  // ── Users ──────────────────────────────────────────────────────────────────
  // 3 named demo guests + 97 generated guests
  // 3 named demo instructors + 27 generated instructors
  // 1 supervisor
  const SPORTS = ['ski', 'ski', 'ski', 'snowboard', 'snowboard'];
  const LEVELS = ['beginner', 'beginner', 'intermediate', 'intermediate', 'advanced'];

  const users = [
    { id:'u-g1', name:'Sophie Laurent', email:'guest@snowos.com',      password:'guest123', role:'guest',      level:'beginner',     sport:'ski',       avatar:'SL' },
    { id:'u-g2', name:'Tom Bradley',    email:'tom@snowos.com',        password:'tom123',   role:'guest',      level:'intermediate', sport:'ski',       avatar:'TB' },
    { id:'u-g3', name:'Yuki Tanaka',    email:'yuki@snowos.com',       password:'yuki123',  role:'guest',      level:'beginner',     sport:'snowboard', avatar:'YT' },
    { id:'u-i1', name:'Kenji Yamamoto', email:'instructor@snowos.com', password:'inst123',  role:'instructor', avatar:'KY' },
    { id:'u-i2', name:'Marie Dubois',   email:'marie@snowos.com',      password:'marie123', role:'instructor', avatar:'MD' },
    { id:'u-i3', name:'Lucas Moreau',   email:'lucas@snowos.com',      password:'lucas123', role:'instructor', avatar:'LM' },
    { id:'u-s1', name:'Alex Chen',      email:'supervisor@snowos.com', password:'sup123',   role:'supervisor', avatar:'AC' },
  ];

  for (let i = 0; i < 97; i++) {
    const name = _seedName(i);
    users.push({
      id: `u-g${i + 4}`, name,
      email: `guest${i + 4}@snowos.com`, password: 'guest123',
      role: 'guest', level: LEVELS[i % LEVELS.length], sport: SPORTS[i % SPORTS.length],
      avatar: _initials(name),
    });
  }

  for (let i = 0; i < 27; i++) {
    const name = _seedName(i + 120); // offset avoids name clashes with guests
    users.push({
      id: `u-i${i + 4}`, name,
      email: `instructor${i + 4}@snowos.com`, password: 'inst123',
      role: 'instructor', avatar: _initials(name),
    });
  }

  write(KEYS.USERS, users);

  // ── Lessons: all 24 templates × 14 days (−7…+6) × AM + PM ─────────────────
  const instIds = users.filter(u => u.role === 'instructor').map(u => u.id);
  const lessons = [];
  let instRot = 0;

  for (let offset = -7; offset <= 6; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const dateStr = isoDate(d);
    const isPast  = offset < 0;
    const isToday = offset === 0;
    const status  = isPast ? 'completed' : 'scheduled';

    TEMPLATES.forEach((tmpl, ti) => {
      // Future: leave ~1-in-8 slots unassigned for supervisor demo
      const isFuture = !isPast && !isToday;
      const instructorId = (isFuture && ti % 8 === 7)
        ? null
        : instIds[instRot % instIds.length];
      instRot++;

      lessons.push({
        id:         `les-${tmpl.id}-${dateStr}`,
        templateId: tmpl.id,
        date:       dateStr,
        instructorId,
        status,
      });
    });
  }
  write(KEYS.LESSONS, lessons);

  // ── Bookings ───────────────────────────────────────────────────────────────
  const past3 = isoDate(new Date(today.getTime() - 3 * 86400000));
  const past1 = isoDate(new Date(today.getTime() - 1 * 86400000));
  const fut2  = isoDate(new Date(today.getTime() + 2 * 86400000));
  const fut4  = isoDate(new Date(today.getTime() + 4 * 86400000));

  const bookings = [
    // Sophie — past, today, future, cancelled
    { id:'bkg-s1', guestId:'u-g1', lessonId:`les-C3-${past3}`,    createdAt: new Date(today.getTime()-5*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-s2', guestId:'u-g1', lessonId:`les-CB-${todayStr}`, createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-s3', guestId:'u-g1', lessonId:`les-C3-${fut2}`,     createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-s4', guestId:'u-g1', lessonId:`les-C5-${fut4}`,     createdAt: new Date(today.getTime()-2*86400000).toISOString(), status:'cancelled' },
    // Tom — shares lessons with Sophie
    { id:'bkg-t1', guestId:'u-g2', lessonId:`les-C3-${past3}`,    createdAt: new Date(today.getTime()-5*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-t2', guestId:'u-g2', lessonId:`les-C3-${fut2}`,     createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-t3', guestId:'u-g2', lessonId:`les-C5-${todayStr}`, createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
    // Yuki — snowboard
    { id:'bkg-y1', guestId:'u-g3', lessonId:`les-S2-${past1}`,    createdAt: new Date(today.getTime()-2*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-y2', guestId:'u-g3', lessonId:`les-S2-${fut2}`,     createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
  ];

  // Background guests fill every lesson with 2–4 confirmed guests
  const bgGuests = users.filter(u => u.role === 'guest' && !['u-g1','u-g2','u-g3'].includes(u.id));
  let bgRot = 0;
  lessons.forEach((lesson, li) => {
    const count = 2 + (li % 3);
    for (let k = 0; k < count; k++) {
      bookings.push({
        id:        `bkg-bg-${lesson.id}-${k}`,
        guestId:   bgGuests[(bgRot + k) % bgGuests.length].id,
        lessonId:  lesson.id,
        createdAt: new Date(today.getTime() - (1 + li % 7) * 86400000).toISOString(),
        status:    'confirmed',
      });
    }
    bgRot += 3;
  });

  write(KEYS.BOOKINGS, bookings);

  // ── Reports: ~80% of completed lessons ─────────────────────────────────────
  const TERRAIN_POOL = ['groomed','powder','moguls','park','off-piste','icy','trees'];
  const SKILL_POOL   = ['parallel-turns','carving','stopping','edges','speed-control','terrain-read','jumps'];

  // Build next-class progression map: same template or one level up (same sport + audience)
  const LEVEL_RANK = { beginner: 1, intermediate: 2, advanced: 3 };
  const _nextClassMap = (() => {
    const map = {};
    const groups = {};
    TEMPLATES.forEach(t => {
      const key = `${t.sport}-${t.audience}`;
      (groups[key] = groups[key] || []).push(t);
    });
    Object.values(groups).forEach(grp => {
      grp.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
      grp.forEach((t, i) => { map[t.id] = grp[i + 1]?.id ?? t.id; });
    });
    return map;
  })();

  const NOTES_POOL = [
    'Good progress on parallel turns. Ready for steeper terrain.',
    'Strong technique foundations. Focus on speed control next session.',
    'Showed great improvement with edge control. Keep challenging on varied terrain.',
    'Confident on groomed runs. Introduce off-piste conditions gradually.',
    'Working on carving consistency. More practice on steeper groomed runs recommended.',
    'Excellent balance and posture. Ready to tackle more challenging terrain.',
    'Needs more practice stopping at speed. Continue current level before progressing.',
    'Natural learner, advancing well. Consider moving up next session.',
  ];

  // Explicit report for the Sophie/Tom lesson
  const reports = [{
    id: 'rpt-1',
    lessonId:     `les-C3-${past3}`,
    instructorId: 'u-i1',
    terrains:     ['groomed', 'icy'],
    skills:       ['parallel-turns', 'edges', 'speed-control'],
    guestReports: [
      { guestId:'u-g1', attendance:'BOTH', nextClass:'C4', notes:'Great edge control progress. Recommend steeper groomed runs.' },
      { guestId:'u-g2', attendance:'AM',   nextClass:'C5', notes:'Strong carving technique. Ready for advanced groomed runs.' },
    ],
    submittedAt: new Date(today.getTime() - 3*86400000 + 16*3600000).toISOString(),
  }];

  lessons
    .filter(l => l.status === 'completed' && l.id !== `les-C3-${past3}`)
    .forEach((lesson, ri) => {
      if (ri % 5 === 4) return; // skip 20% → leaves "pending report" items for supervisor demo
      const lessonBkgs = bookings.filter(b => b.lessonId === lesson.id && b.status === 'confirmed');
      reports.push({
        id:           `rpt-auto-${lesson.id}`,
        lessonId:     lesson.id,
        instructorId: lesson.instructorId ?? 'u-i1',
        terrains:     TERRAIN_POOL.filter((_, i) => (ri + i) % 3 !== 0).slice(0, 2 + (ri % 3)),
        skills:       SKILL_POOL.filter((_, i)   => (ri + i) % 4 !== 0).slice(0, 2 + (ri % 4)),
        guestReports: lessonBkgs.map((b, bi) => {
          const seed = ri + bi + b.guestId.charCodeAt(b.guestId.length - 1);
          // ~60% stay same class, ~40% move up
          const nextClass = (seed % 5 < 2) ? (_nextClassMap[lesson.templateId] ?? lesson.templateId) : lesson.templateId;
          return {
            guestId:    b.guestId,
            attendance: ['AM','PM','BOTH'][seed % 3],
            nextClass,
            notes:      NOTES_POOL[seed % NOTES_POOL.length],
          };
        }),
        submittedAt: new Date(today.getTime() - (1 + ri % 6) * 86400000 + 16*3600000).toISOString(),
      });
    });

  write(KEYS.REPORTS, reports);

  // Mark lessons that have submitted reports as 'reported'
  const reportedLessonIds = new Set(reports.map(r => r.lessonId));
  lessons.forEach(l => { if (reportedLessonIds.has(l.id)) l.status = 'reported'; });
  write(KEYS.LESSONS, lessons);
}

// ── Public seed API ───────────────────────────────────────────────────────────
export function seed() {
  if (localStorage.getItem(KEYS.SEEDED)) return;
  _doSeed();
  localStorage.setItem(KEYS.SEEDED, '1');
}

export function resetSeed() {
  const sess = DB.getSession();
  localStorage.removeItem(KEYS.USERS);
  localStorage.removeItem(KEYS.LESSONS);
  localStorage.removeItem(KEYS.BOOKINGS);
  localStorage.removeItem(KEYS.REPORTS);
  localStorage.removeItem(KEYS.SEEDED);
  _doSeed();
  localStorage.setItem(KEYS.SEEDED, '1');
  // Restore session so user stays logged in
  if (sess) DB.setSession(sess);
}
