// api.js — tiny fetch wrapper shared by all pages.
// No build step / no framework: loaded as a plain <script> tag.

const CURRENT_USER_KEY = 'docedit_current_user';

function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = '/login.html';
}

function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

async function api(path, options = {}) {
  const user = getCurrentUser();
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    options.headers || {},
    user ? { 'x-user-id': user.id } : {}
  );
  const res = await fetch(path, { ...options, headers });
  let body = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch (e) { body = text; }
  }
  if (!res.ok) {
    const message = (body && body.error) ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

function showError(el, err) {
  if (!el) return;
  el.textContent = err.message || String(err);
  el.classList.add('visible');
}

function clearError(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
}
