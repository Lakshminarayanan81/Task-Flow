// ─── CHANGE [design] NEW FILE ─────────────────────────────────────────────────
// WAS:    AuthContext.jsx and axios.js each called localStorage.getItem('token') directly.
// NOW:    All reading/writing of the login session lives in this one file.
// WHY:    "Keep me logged in" means the session can live in EITHER localStorage
//         (survives closing the browser) OR sessionStorage (wiped when the tab closes).
//         Every place that reads the token would otherwise need that same either/or logic.
// BETTER: One source of truth — AuthContext, the axios interceptor, and startup all agree
//         on where the token is, and logout clears both stores so nothing is left behind.
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = ['token', 'user'];

// Whichever store currently holds a token is the active one; sessionStorage is the fallback.
function activeStore() {
  return localStorage.getItem('token') ? localStorage : sessionStorage;
}

export function getToken() {
  return activeStore().getItem('token');
}

export function getStoredUser() {
  const raw = activeStore().getItem('user');
  return raw ? JSON.parse(raw) : null;
}

// ─── CHANGE [polish] ──────────────────────────────────────────────────────────
// WAS:    On page load, any stored token was trusted — even one that expired last week.
//         The app would open the dashboard, every API call would fail with 401, and the
//         user saw a page full of errors instead of a login screen.
// NOW:    On startup we read the token's own expiry ("exp") and throw it away if it's past.
// HOW:    A JWT is three base64url parts: header.payload.signature. The payload is only
//         ENCODED, not encrypted (remember the generateToken.js discussion), so the browser
//         can decode it with atob() and read { id, iat, exp }. exp is in SECONDS since 1970,
//         Date.now() is in MILLISECONDS — hence the * 1000.
//         base64url swaps '+'/'/' for '-'/'_' to be URL-safe; atob() expects the original
//         characters, so we swap them back first.
// NOTE:   This is a convenience check, NOT security. Anyone can edit "exp" in their own
//         browser; the server still verifies the signature on every request (protect
//         middleware) and is the real gatekeeper. This just avoids a pointless failed load.
// ─────────────────────────────────────────────────────────────────────────────
function isExpired(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return !exp || exp * 1000 <= Date.now();
  } catch {
    return true; // A token we can't even decode is treated as unusable.
  }
}

// CHANGE [polish]: used ONLY when the app starts. Returns the token if still valid,
// otherwise wipes the stale session and returns null (= logged out).
export function readValidToken() {
  const token = getToken();
  if (token && !isExpired(token)) return token;
  clearAuth();
  return null;
}

export function saveAuth(token, user, remember) {
  clearAuth();
  const store = remember ? localStorage : sessionStorage;
  store.setItem('token', token);
  store.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  for (const store of [localStorage, sessionStorage]) {
    for (const key of KEYS) store.removeItem(key);
  }
}
