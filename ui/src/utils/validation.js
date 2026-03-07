export const isValidEmail = (value) => {
  const v = String(value || '').trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

export const normalizeDigitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const isValidPhoneOptional10Digit = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return true; // optional
  const digits = normalizeDigitsOnly(raw);
  return digits.length === 10;
};

export const isValidPhoneRequired10Digit = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;
  const digits = normalizeDigitsOnly(raw);
  return digits.length === 10;
};

export const required = (value) => String(value || '').trim().length > 0;

export const passwordMinLen = (value, minLen = 6) => {
  const v = String(value || '');
  return v.length >= minLen;
};
