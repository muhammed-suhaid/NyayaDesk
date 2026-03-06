import http from './services/api';

const AUTH_KEY = 'nyayadesk_auth';

export const DEMO_CREDENTIALS = {
  superAdmin: { email: 'superadmin@nyayadesk.com', password: 'super123' },
  admin: { email: 'admin@samplefirm.com', password: 'admin123' },
};

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
  return Boolean(auth && auth.token && auth.user);
}

export function getToken() {
  const auth = getAuth();
  return auth?.token || null;
}

export function getCurrentUser() {
  const auth = getAuth();
  return auth?.user || null;
}

export function getRole() {
  return getCurrentUser()?.role || null;
}

export function getCompanyId() {
  return getCurrentUser()?.companyId ?? null;
}

export async function login(email, password) {
  try {
    const res = await http.post('/auth/login', { email, password });
    const auth = { token: res.data.token, user: res.data.user };
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    return { ok: true, ...auth };
  } catch (e) {
    const msg = e?.response?.data?.error || e?.response?.data?.message || 'Unable to sign in';
    return { ok: false, error: msg };
  }
}

export async function registerAdminCompany({
  companyName,
  companyEmail,
  companyPhone,
  companyAddress,
  subscriptionPlan,
  paymentStatus,
  name,
  email,
  phone,
  password,
}) {
  try {
    const res = await http.post('/auth/register-admin', {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      subscriptionPlan,
      paymentStatus,
      name,
      email,
      phone,
      password,
    });
    return { ok: true, data: res.data };
  } catch (e) {
    const msg = e?.response?.data?.error || e?.response?.data?.message || 'Unable to register';
    return { ok: false, error: msg };
  }
}

export function updateProfile({ name, phone }) {
  const auth = getAuth();
  if (!auth?.token || !auth?.user) return { ok: false, error: 'Not authenticated' };

  const nextAuth = {
    ...auth,
    user: { ...auth.user, name: name ?? auth.user.name, phone: phone ?? auth.user.phone },
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(nextAuth));
  return { ok: true, user: nextAuth.user };
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}
