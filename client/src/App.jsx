import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import ProjectDetails from './pages/ProjectDetails.jsx'
import { useAuth } from './context/useAuth'

function App() {
  // CHANGE [polish]: App now reads the token so the catch-all route below can choose where to send people.
  const { token } = useAuth()

  return (
    <Routes>
      {/* CHANGE [polish]: /login and /signup are wrapped in GuestRoute (was: no wrapper).
          Logged-in users visiting them are sent to /dashboard. See GuestRoute.jsx. */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <Signup />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        }
      />
      {/* CHANGE [polish]: unknown URLs WAS always <Navigate to="/login">.
          For a logged-in user that meant two redirects (unknown → /login → GuestRoute → /dashboard).
          NOW it goes straight to the right place in one hop. */}
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
