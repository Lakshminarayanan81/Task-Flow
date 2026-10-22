// ─── CHANGE [polish] NEW FILE ─────────────────────────────────────────────────
// WAS:    A logged-in user could still open /login or /signup and see the login form —
//         confusing, and signing up again from there would silently replace their session.
// NOW:    GuestRoute is the mirror image of ProtectedRoute:
//           ProtectedRoute → "logged-OUT users can't come in" (redirects to /login)
//           GuestRoute     → "logged-IN users can't come in"  (redirects to /dashboard)
// HOW:    Same pattern as ProtectedRoute: read the token from AuthContext; if the check
//         fails, render <Navigate> (React Router's redirect-as-a-component) instead of the page.
//         `replace` swaps the history entry, so the browser Back button doesn't bounce the
//         user back to /login only to be redirected again.
// ─────────────────────────────────────────────────────────────────────────────
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function GuestRoute({ children }) {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default GuestRoute;
