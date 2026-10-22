import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Logo from '../components/Logo';
import PasswordInput from '../components/PasswordInput';
import { AlertIcon } from '../components/Icons';

// ─── CHANGE [design] ──────────────────────────────────────────────────────────
// WAS:    Errors appeared as a toast popup; plain password field; no "remember me".
// NOW:    • Errors show INSIDE the page under the card (the design's red box), held in
//           `formError` state — a toast disappears after a few seconds, the box stays put.
//         • A 401 becomes the friendlier "Email or password is incorrect." Same message for
//           both "no such email" and "wrong password", matching the backend's deliberate
//           choice so nobody can probe which emails are registered.
//         • "Keep me logged in" (react-hook-form checkbox, ticked by default): its value is
//           passed to login(), which picks localStorage vs sessionStorage (see authStorage.js).
//         • PasswordInput adds the show/hide eye.
//         • Removed the "Logged in" success toast — landing on the dashboard says it already.
// SKIPPED: the design's "Forgot?" link — password reset is v2 per CLAUDE.md §3.
// ─────────────────────────────────────────────────────────────────────────────
function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { remember: true } });

  async function onSubmit(data) {
    setFormError('');
    try {
      await login(data.email, data.password, data.remember);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 401) setFormError('Email or password is incorrect.');
      else setFormError(err.response?.data?.message || 'Could not reach the server. Try again in a moment.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" />
          <span className="text-[17px] font-semibold tracking-[-0.01em]">TaskFlow</span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-[22px] rounded-[14px] border border-line bg-white p-8 shadow-card"
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold tracking-[-0.01em]">Welcome back</h1>
            <p className="text-sm text-ink-subtle">Log in to pick up where you left off.</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-[7px]">
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                className={`input ${errors.email ? 'input-error' : ''}`}
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="field-label" htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                className={`input ${errors.password ? 'input-error' : ''}`}
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-[13px] text-ink-muted">
            <input type="checkbox" className="size-4 cursor-pointer accent-brand" {...register('remember')} />
            Keep me logged in
          </label>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary h-10 text-sm">
            {isSubmitting ? 'Logging in…' : 'Log In'}
          </button>

          <p className="text-center text-[13px] text-ink-subtle">
            No account yet?{' '}
            <Link to="/signup" className="font-medium text-brand hover:text-brand-hover">
              Sign up
            </Link>
          </p>
        </form>

        {formError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-lg border border-danger-line bg-danger-bg px-3 py-2.5"
          >
            <AlertIcon className="size-[15px] shrink-0 text-danger" />
            <p className="text-[13px] text-danger-ink">{formError}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
