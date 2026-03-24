import { DB, uid } from './data.js';

export function login(email, password) {
  if (!email || !password) return { ok: false, error: 'Please fill in all fields.' };
  const user = DB.getUserByEmail(email);
  if (!user)           return { ok: false, error: 'No account found with this email.' };
  if (user.password !== password) return { ok: false, error: 'Incorrect password.' };
  const sess = _makeSession(user);
  DB.setSession(sess);
  return { ok: true, user: sess };
}

export function register(name, email, password) {
  if (!name.trim())                          return { ok: false, error: 'Please enter your name.' };
  if (!email.trim() || !email.includes('@')) return { ok: false, error: 'Please enter a valid email.' };
  if (password.length < 6)                   return { ok: false, error: 'Password must be at least 6 characters.' };
  if (DB.getUserByEmail(email))              return { ok: false, error: 'An account with this email already exists.' };

  const user = {
    id: 'u-' + uid(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'guest',
    level: 'beginner',
    sport: 'ski',
    avatar: name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  };
  DB.upsertUser(user);
  const sess = _makeSession(user);
  DB.setSession(sess);
  return { ok: true, user: sess };
}

export function logout() {
  DB.clearSession();
}

export function getSession() {
  return DB.getSession();
}

function _makeSession(user) {
  return {
    id:     user.id,
    name:   user.name,
    email:  user.email,
    role:   user.role,
    level:  user.level ?? null,
    sport:  user.sport ?? null,
    avatar: user.avatar,
  };
}
