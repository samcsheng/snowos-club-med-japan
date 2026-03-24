// ── Storage keys ────────────────────────────────────────────────────────────
export const KEYS = {
  USERS:    'snow_users',
  LESSONS:  'snow_lessons',
  BOOKINGS: 'snow_bookings',
  REPORTS:  'snow_reports',
  SESSION:  'snow_session',
  SEEDED:   'snow_seeded_v1',
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
  { id:'CB',  name:'CLUB BEG',  sport:'ski',        audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:15', amEnd:'12:15', pmStart:'14:00', pmEnd:'16:00' },
  // ── Adult Snowboard ────────────────────────────────────────────────────────
  { id:'S4',  name:'SB 4',      sport:'snowboard',  audience:'adult', level:'intermediate', maxGuests:8, amStart:'09:45', amEnd:'12:00', pmStart:'13:30', pmEnd:'15:45' },
  { id:'S3',  name:'SB 3',      sport:'snowboard',  audience:'adult', level:'intermediate', maxGuests:8, amStart:'09:45', amEnd:'12:00', pmStart:'13:30', pmEnd:'15:45' },
  { id:'S2',  name:'SB 2',      sport:'snowboard',  audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:00', amEnd:'12:00', pmStart:'13:45', pmEnd:'15:45' },
  { id:'S1',  name:'SB 1',      sport:'snowboard',  audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:15', amEnd:'12:15', pmStart:'14:00', pmEnd:'16:00' },
  { id:'SB',  name:'SB BEG',    sport:'snowboard',  audience:'adult', level:'beginner',     maxGuests:8, amStart:'10:15', amEnd:'12:15', pmStart:'14:00', pmEnd:'16:00' },
  // ── Kids Ski ───────────────────────────────────────────────────────────────
  { id:'TG',  name:'T Gold',    sport:'ski',        audience:'kids',  level:'advanced',     maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'TB',  name:'T Bronze',  sport:'ski',        audience:'kids',  level:'intermediate', maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'T3',  name:'T3',        sport:'ski',        audience:'kids',  level:'intermediate', maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'T2',  name:'T2',        sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:15', amEnd:'11:30', pmStart:'13:15', pmEnd:'15:30' },
  { id:'T1',  name:'T1',        sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:30', amEnd:'11:30', pmStart:'13:30', pmEnd:'15:30' },
  { id:'DR',  name:'DRAGON',    sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:30', amEnd:'11:30', pmStart:'13:30', pmEnd:'15:30' },
  { id:'TGR', name:'TIGER',     sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:45', amEnd:'11:45', pmStart:'13:45', pmEnd:'15:45' },
  { id:'PD',  name:'PANDA',     sport:'ski',        audience:'kids',  level:'beginner',     maxGuests:6, amStart:'10:00', amEnd:'11:30', pmStart:'14:00', pmEnd:'15:30' },
  // ── Kids Snowboard ─────────────────────────────────────────────────────────
  { id:'R3',  name:'RIDER 3',   sport:'snowboard',  audience:'kids',  level:'intermediate', maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'R2',  name:'RIDER 2',   sport:'snowboard',  audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:00', amEnd:'11:15', pmStart:'13:00', pmEnd:'15:15' },
  { id:'R1',  name:'RIDER 1',   sport:'snowboard',  audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:00', amEnd:'11:00', pmStart:'13:00', pmEnd:'15:00' },
  { id:'RD',  name:'RIDER',     sport:'snowboard',  audience:'kids',  level:'beginner',     maxGuests:6, amStart:'09:00', amEnd:'11:00', pmStart:'13:00', pmEnd:'15:00' },
];

export function getTemplate(id) { return TEMPLATES.find(t => t.id === id) ?? null; }

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
};

// ── Seed (idempotent) ────────────────────────────────────────────────────────
export function seed() {
  if (localStorage.getItem(KEYS.SEEDED)) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = isoDate(today);

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    { id:'u-g1',  name:'Sophie Laurent',  email:'guest@snowos.com',      password:'guest123', role:'guest',      level:'beginner',     sport:'ski',       avatar:'SL' },
    { id:'u-g2',  name:'Tom Bradley',     email:'tom@snowos.com',        password:'tom123',   role:'guest',      level:'intermediate', sport:'ski',       avatar:'TB' },
    { id:'u-g3',  name:'Yuki Tanaka',     email:'yuki@snowos.com',       password:'yuki123',  role:'guest',      level:'beginner',     sport:'snowboard', avatar:'YT' },
    { id:'u-i1',  name:'Kenji Yamamoto',  email:'instructor@snowos.com', password:'inst123',  role:'instructor', avatar:'KY' },
    { id:'u-i2',  name:'Marie Dubois',    email:'marie@snowos.com',      password:'marie123', role:'instructor', avatar:'MD' },
    { id:'u-i3',  name:'Lucas Moreau',    email:'lucas@snowos.com',      password:'lucas123', role:'instructor', avatar:'LM' },
    { id:'u-s1',  name:'Alex Chen',       email:'supervisor@snowos.com', password:'sup123',   role:'supervisor', avatar:'AC' },
  ];
  write(KEYS.USERS, users);

  // ── Lessons: 6 seed templates × 14 days × AM+PM ───────────────────────────
  // Seed templates chosen to give good variety in the UI
  const seedTmplIds = ['C3', 'C5', 'CB', 'S2', 'T2', 'R1'];
  // Instructor rotation for seed lessons
  const instMap = { C3:'u-i1', C5:'u-i1', CB:'u-i2', S2:'u-i3', T2:'u-i2', R1:null };

  const lessons = [];
  for (let offset = -7; offset <= 6; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const dateStr = isoDate(d);
    const isPast   = offset < 0;
    const isToday  = offset === 0;
    const status   = isPast ? 'completed' : isToday ? 'in-progress' : 'scheduled';

    seedTmplIds.forEach((tmplId, idx) => {
      ['AM', 'PM'].forEach((session) => {
        // For future dates, leave some unassigned (supervisor has work to do)
        let instructorId = instMap[tmplId];
        if (!isPast && !isToday && idx >= 4) instructorId = null; // last 2 templates unassigned in future

        lessons.push({
          id: `les-${tmplId}-${dateStr}-${session}`,
          templateId: tmplId,
          date: dateStr,
          session,
          instructorId,
          status,
        });
      });
    });
  }
  write(KEYS.LESSONS, lessons);

  // ── Bookings ───────────────────────────────────────────────────────────────
  const past3  = isoDate(new Date(today.getTime() - 3 * 86400000));
  const past1  = isoDate(new Date(today.getTime() - 1 * 86400000));
  const fut2   = isoDate(new Date(today.getTime() + 2 * 86400000));
  const fut4   = isoDate(new Date(today.getTime() + 4 * 86400000));

  const bookings = [
    // Sophie — 4 bookings (1 past, 1 today, 1 future, 1 cancelled)
    { id:'bkg-s1', guestId:'u-g1', lessonId:`les-C3-${past3}-AM`,   createdAt: new Date(today.getTime()-5*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-s2', guestId:'u-g1', lessonId:`les-CB-${todayStr}-AM`, createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-s3', guestId:'u-g1', lessonId:`les-C3-${fut2}-PM`,     createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-s4', guestId:'u-g1', lessonId:`les-C5-${fut4}-AM`,     createdAt: new Date(today.getTime()-2*86400000).toISOString(), status:'cancelled' },
    // Tom — shares lessons with Sophie for roster demo
    { id:'bkg-t1', guestId:'u-g2', lessonId:`les-C3-${past3}-AM`,   createdAt: new Date(today.getTime()-5*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-t2', guestId:'u-g2', lessonId:`les-C3-${fut2}-PM`,     createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-t3', guestId:'u-g2', lessonId:`les-C5-${todayStr}-AM`, createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
    // Yuki — snowboard bookings
    { id:'bkg-y1', guestId:'u-g3', lessonId:`les-S2-${past1}-PM`,    createdAt: new Date(today.getTime()-2*86400000).toISOString(), status:'confirmed' },
    { id:'bkg-y2', guestId:'u-g3', lessonId:`les-S2-${fut2}-AM`,     createdAt: new Date(today.getTime()-1*86400000).toISOString(), status:'confirmed' },
  ];
  write(KEYS.BOOKINGS, bookings);

  // ── One pre-submitted report (for the past3 C3-AM lesson) ─────────────────
  const reports = [
    {
      id: 'rpt-1',
      lessonId: `les-C3-${past3}-AM`,
      instructorId: 'u-i1',
      terrains: ['groomed', 'icy'],
      skills: ['parallel-turns', 'edges', 'speed-control'],
      guestReports: [
        { guestId:'u-g1', attendance:'BOTH', nextClass:'C4', notes:'Great edge control progress. Recommend trying steeper groomed runs.' },
        { guestId:'u-g2', attendance:'AM',   nextClass:'C5', notes:'' },
      ],
      submittedAt: new Date(today.getTime() - 3*86400000 + 16*3600000).toISOString(),
    }
  ];
  write(KEYS.REPORTS, reports);

  localStorage.setItem(KEYS.SEEDED, '1');
}
