import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b">
      <span className="font-semibold">TaskFlow</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <button onClick={handleLogout} className="text-sm text-blue-600">
          Log out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
