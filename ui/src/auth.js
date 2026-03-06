const AUTH_KEY = 'nyayadesk_auth';
const USERS_KEY = 'nyayadesk_users';

export const DEMO_CREDENTIALS = {
  email: 'admin@nyayadesk.com',
  password: 'admin123',
};

export function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function ensureDemoUser() {
  const users = getUsers();
  const exists = users.some((u) => (u.email || '').toLowerCase() === DEMO_CREDENTIALS.email);
  if (!exists) {
    users.unshift({
      name: 'NyayaDesk Admin',
      email: DEMO_CREDENTIALS.email,
      phone: '',
      role: 'Admin',
      password: DEMO_CREDENTIALS.password,
    });
    saveUsers(users);
  }
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const auth = getAuth();
  return Boolean(auth && auth.isAuthenticated);
}

export function login(email, password) {
  ensureDemoUser();
  const users = getUsers();
  const user = users.find((u) => (u.email || '').toLowerCase() === (email || '').trim().toLowerCase());
  if (!user) return { ok: false, error: 'Account not found' };
  if (user.password !== password) return { ok: false, error: 'Invalid password' };

  const auth = {
    isAuthenticated: true,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  return { ok: true, user: auth };
}

export function registerUser({ name, email, phone, role, password }) {
  ensureDemoUser();
  const users = getUsers();
  const exists = users.some((u) => (u.email || '').toLowerCase() === (email || '').trim().toLowerCase());
  if (exists) return { ok: false, error: 'Email already registered' };

  const user = {
    name: (name || '').trim(),
    email: (email || '').trim().toLowerCase(),
    phone: (phone || '').trim(),
    role: role || 'Advocate',
    password,
  };
  users.push(user);
  saveUsers(users);
  return { ok: true };
}

export function updateProfile({ name, phone }) {
  const auth = getAuth();
  if (!auth?.email) return { ok: false, error: 'Not authenticated' };

  const users = getUsers();
  const idx = users.findIndex((u) => (u.email || '').toLowerCase() === auth.email.toLowerCase());
  if (idx === -1) return { ok: false, error: 'Account not found' };

  users[idx] = { ...users[idx], name: name ?? users[idx].name, phone: phone ?? users[idx].phone };
  saveUsers(users);

  const nextAuth = { ...auth, name: users[idx].name, phone: users[idx].phone };
  localStorage.setItem(AUTH_KEY, JSON.stringify(nextAuth));

  return { ok: true, user: nextAuth };
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}
