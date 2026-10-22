// ─── CHANGE [design] NEW FILE ─────────────────────────────────────────────────
// WAS:    No pop-ups. Creating a project was an always-visible inline form on the dashboard;
//         editing a project swapped the page header for an inline form.
// NOW:    A reusable dialog (the design's "overlay" elevation), used for New project and
//         Edit project on both the Dashboard and the project page.
// HOW:    • role="dialog" + aria-modal + aria-labelledby → screen readers announce it as a
//           dialog titled by the <h2>. useId() makes a unique id for that link.
//         • Escape closes it (keydown listener), clicking the dark backdrop closes it
//           (onMouseDown checks the click hit the backdrop itself, not the panel inside).
//         • body overflow = 'hidden' stops the page behind from scrolling while it's open;
//           the cleanup function restores the previous value when the modal closes.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useId } from 'react';
import { XIcon } from './Icons';

function Modal({ title, onClose, children }) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-[14px] border border-line bg-white p-6 shadow-overlay"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost size-8 px-0">
            <XIcon className="size-3.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
