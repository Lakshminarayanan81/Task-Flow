import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setUnauthorizedHandler } from '../api/axios';
// CHANGE [design]: storage reads/writes moved to authStorage.js (see that file's header).
// CHANGE [polish]: readValidToken replaces getToken here, so an expired token is dropped on startup.
import { clearAuth, getStoredUser, readValidToken, saveAuth } from '../authStorage';
// CHANGE [design]: the context object now lives in authContext.js and useAuth in useAuth.js.
// WAS:  createContext() and useAuth() were both in this file.
// WHY:  Vite's Fast Refresh (hot reload) only works when a .jsx file exports ONLY components.
//       Exporting the useAuth hook from here too made the linter error, and any edit to this
//       file forced a full page reload. Now this file exports just AuthProvider.
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  // CHANGE [polish]: was useState(getToken) — trusted any stored token, even an expired one.
  // useState runs these initializer functions once, in order, on first render; if the token
  // is expired, readValidToken clears storage, so getStoredUser below then returns null too.
  const [token, setToken] = useState(readValidToken);
  const [user, setUser] = useState(getStoredUser);
  const navigate = useNavigate();

  // ─── CHANGE [polish] ────────────────────────────────────────────────────────
  // WAS:    Nothing reacted when the server rejected the token mid-session.
  // NOW:    On mount, AuthProvider hands axios a callback to run on any 401.
  // HOW:    The callback ends the session (same steps as logout) and redirects to /login.
  //         ProtectedRoute would also redirect once token is null; navigating directly just
  //         makes it immediate. The cleanup un-registers it if AuthProvider ever unmounts.
  // WHY OK: AuthProvider can use useNavigate() because main.jsx renders it INSIDE
  //         <BrowserRouter>. Outside a router, this hook would throw.
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      clearAuth();
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  // CHANGE [design]: login and signup used to repeat these 4 lines each; one helper now.
  // `remember` decides localStorage (stay logged in) vs sessionStorage (until tab closes).
  function startSession(res, remember) {
    setToken(res.data.token);
    setUser(res.data.data);
    saveAuth(res.data.token, res.data.data, remember);
  }

  // CHANGE [design]: new `remember` argument for the "Keep me logged in" checkbox.
  // Defaults to true so any caller that doesn't pass it behaves exactly as before.
  async function login(email, password, remember = true) {
    const res = await api.post('/auth/login', { email, password });
    startSession(res, remember);
  }

  async function signup(name, email, password) {
    const res = await api.post('/auth/signup', { name, email, password });
    startSession(res, true);
  }

  // CHANGE [design]: was removing 2 keys from localStorage; clearAuth() now clears both
  // localStorage AND sessionStorage, wherever the session happened to be stored.
  function logout() {
    setToken(null);
    setUser(null);
    clearAuth();
  }

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
