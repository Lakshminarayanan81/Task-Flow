// ─── CHANGE [design] NEW FILE ─────────────────────────────────────────────────
// WAS:    No dropdown menus anywhere.
// NOW:    One reusable dropdown used for: the user menu (Navbar), the ⋮ menu on project
//         cards, the ⋮ menu on the project page, and the "Due date" filter.
// HOW:    • A button toggles `open`; the panel renders only while open.
//         • Clicking anywhere OUTSIDE closes it: a 'mousedown' listener on the whole document
//           checks whether the click target is inside rootRef (our wrapper div).
//         • Escape also closes it. Listeners are only attached while open (cheap) and are
//           removed in the effect's cleanup.
//         • `children` can be a function — children(close) — so menu items can close the
//           menu after they act (e.g. "Edit project" closes the menu, then opens the modal).
//         • aria-haspopup / aria-expanded tell screen readers it's a menu button and its state.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

function Popover({ button, buttonLabel, buttonClassName, align = 'right', panelClassName = '', children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e) {
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={buttonLabel}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName}
      >
        {button}
      </button>
      {open && (
        <div
          className={`absolute top-full z-30 mt-1.5 min-w-48 rounded-[10px] border border-line bg-white p-1 shadow-overlay ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${panelClassName}`}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ onClick, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium transition ${
        danger ? 'text-danger hover:bg-danger-bg' : 'text-ink-muted hover:bg-chip hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default Popover;
