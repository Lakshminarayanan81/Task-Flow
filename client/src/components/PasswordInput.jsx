// ─── CHANGE [design] NEW FILE ─────────────────────────────────────────────────
// WAS:    Plain <input type="password"> on Login and Signup — no way to check what you typed.
// NOW:    The design's eye icon: click to show/hide the password.
// HOW:    Toggling `visible` switches the input between type="password" and type="text".
//         `ref` arrives as a normal prop (React 19 feature): react-hook-form's register()
//         returns a ref, and we pass it straight to the real <input> so the form can still
//         read its value. aria-label/aria-pressed describe the button for screen readers.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';

function PasswordInput({ ref, className = '', ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input ref={ref} type={visible ? 'text' : 'password'} className={`${className} pr-10`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-ink-subtle transition hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

export default PasswordInput;
