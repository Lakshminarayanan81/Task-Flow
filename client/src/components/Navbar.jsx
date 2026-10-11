import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { LogoutIcon } from './Icons';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <nav className="sticky top-0 z-10 flex h-[60px] items-center justify-between border-b border-line bg-white px-4 sm:px-7">
      <div className="flex items-center gap-7">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">TaskFlow</span>
        </Link>
        <Link
          to="/dashboard"
          className="hidden h-[30px] items-center rounded-[7px] bg-chip px-3 text-[13px] font-medium sm:flex"
        >
          Projects
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-[26px] items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold tracking-wide text-brand">
            {initials}
          </span>
          <span className="hidden text-[13px] font-medium sm:inline">{user?.name}</span>
        </div>
        <span className="h-[22px] w-px bg-line" />
        <button onClick={handleLogout} className="btn btn-secondary h-8 px-3">
          <LogoutIcon />
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
