// ─── CHANGE [design] NEW FILE ─────────────────────────────────────────────────
// WAS:    `export function useAuth()` was at the bottom of AuthContext.jsx. That made the
//         linter fail (react-refresh/only-export-components): a .jsx file exporting both a
//         component AND a hook can't be hot-reloaded, so every edit forced a full page reload.
// NOW:    The hook has its own file. Components import it with:
//           import { useAuth } from '../context/useAuth';
//         (Login, Signup, Dashboard, Navbar, ProtectedRoute, GuestRoute and App were updated.)
// BETTER: Zero lint errors across the client, and editing auth code hot-reloads normally.
// ─────────────────────────────────────────────────────────────────────────────
import { useContext } from 'react';
import { AuthContext } from './authContext';

export function useAuth() {
  return useContext(AuthContext);
}
