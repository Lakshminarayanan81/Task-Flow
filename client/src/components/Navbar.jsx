import { Link, useNavigate } from 'react-router-dom';
// CHANGE [design]: WAS '../context/AuthContext' — useAuth moved to its own file (see useAuth.js).
import { useAuth } from '../context/useAuth';
import Logo from './Logo';
import Popover, { MenuItem } from './Popover';
import { ChevronDownIcon, LogoutIcon } from './Icons';

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
    <nav className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-line bg-white px-4 sm:px-7">
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
        {/* CHANGE [design]: WAS a static avatar + name. NOW the design's account button
            (avatar, name, ▾) opens a dropdown showing your name and email with a Log out
            item. The separate Logout button stays, as in the design. See Popover.jsx. */}
        <Popover
          buttonLabel="Account menu"
          buttonClassName="flex h-[34px] items-center gap-2.5 rounded-lg pr-2.5 pl-1 transition hover:bg-chip"
          button={
            <>
              <span className="flex size-[26px] items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold tracking-wide text-brand">
                {initials}
              </span>
              <span className="hidden text-[13px] font-medium sm:inline">{user?.name}</span>
              <ChevronDownIcon className="size-3 text-ink-subtle" />
            </>
          }
        >
          <div className="border-b border-line px-2.5 pt-1.5 pb-2.5">
            <p className="text-[13px] font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
          </div>
          <div className="pt-1">
            <MenuItem onClick={handleLogout}>
              <LogoutIcon />
              Log out
            </MenuItem>
          </div>
        </Popover>
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
