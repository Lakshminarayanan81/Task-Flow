import axios from 'axios';
// CHANGE [design]: was reading localStorage directly; now asks authStorage.js, which knows
// whether the token is in localStorage or sessionStorage ("Keep me logged in").
import { getToken } from '../authStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// REQUEST interceptor (from Phase 5): runs BEFORE every request and attaches the token
// as "Authorization: Bearer <token>" — the exact header auth.middleware.js reads.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── CHANGE [polish] ──────────────────────────────────────────────────────────
// WAS:    No response interceptor. If the token expired while the app was open (your JWT
//         lasts JWT_EXPIRES_IN = 7d), protect middleware answered 401 and every page just
//         showed "Not authorized, invalid token" toasts — the user stayed on a broken page
//         with no idea they needed to log in again.
// NOW:    A RESPONSE interceptor runs AFTER every response. On a 401 it tells AuthContext
//         to end the session, which logs out and redirects to /login.
// WHY HERE: This file has no access to React state or the router (it isn't a component),
//         so it can't log out by itself. AuthProvider registers a callback with
//         setUnauthorizedHandler(), and this file just calls it — the same idea as
//         passing an onClick prop, but across the React / non-React boundary.
// WHY SKIP /auth/*: a 401 from POST /auth/login means "wrong password", not "session
//         expired". The Login page shows its own message for that, so we leave it alone.
// BETTER: One place handles expiry for EVERY request in the app — no page needs its own
//         check. The friendly message below replaces the raw server text, so whatever toast
//         the page shows reads "Your session has expired..." instead of a technical error.
// ─────────────────────────────────────────────────────────────────────────────
let handleUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  handleUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response, // success: pass it through untouched
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRequest) {
      error.response.data = {
        ...error.response.data,
        message: 'Your session has expired. Please log in again.',
      };
      handleUnauthorized?.();
    }
    // Still reject, so the calling page's catch block runs (stops spinners, shows the toast).
    return Promise.reject(error);
  },
);

export default api;
