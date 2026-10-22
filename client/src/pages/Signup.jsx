import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Logo from '../components/Logo';
import PasswordInput from '../components/PasswordInput';
import { AlertIcon } from '../components/Icons';

// ─── CHANGE [design] ──────────────────────────────────────────────────────────
// WAS:    Password needed 6+ characters; errors as toasts; no strength feedback.
// NOW:    • Rule is "8+ characters, one number" in the browser (minLength + validate) AND on
//           the server (auth.routes.js). Both must change together, otherwise the form
//           could accept a password the server then rejects.
//         • Live strength meter under the password (4 bars + label), as in the design.
//         • Errors show inline under the card (same pattern as Login), plus the eye toggle.
// STRENGTH SCORE (0–4): under 8 chars = 0 ("Too short"); then +1 base, +1 has a number,
//         +1 mixes upper AND lower case, +1 is 12+ chars OR has a symbol.
//         It's guidance only — the server rule above is the real requirement.
// SKIPPED: the design's Terms / Privacy links — those pages don't exist.
// ─────────────────────────────────────────────────────────────────────────────
const STRENGTH = [
  { label: 'Too short', bar: 'bg-danger', text: 'text-danger' },
  { label: 'Weak', bar: 'bg-danger', text: 'text-danger' },
  { label: 'Fair', bar: 'bg-doing', text: 'text-doing' },
  { label: 'Good', bar: 'bg-brand', text: 'text-brand' },
  { label: 'Strong', bar: 'bg-done', text: 'text-done' },
];

function passwordScore(password) {
  if (password.length < 8) return 0;
  let score = 1;
  if (/\d/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  // useWatch re-renders this component on every keystroke in the password field, which is
  // what lets the strength meter update live. (watch() did the same, but the linter flagged
  // it as incompatible with the React Compiler; useWatch is the hook-based replacement.)
  const password = useWatch({ control, name: 'password' }) ?? '';
  const score = passwordScore(password);
  const strength = STRENGTH[score];

  async function onSubmit(data) {
    setFormError('');
    try {
      await signup(data.name, data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not reach the server. Try again in a moment.');
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
            <h1 className="text-xl font-semibold tracking-[-0.01em]">Create your account</h1>
            <p className="text-sm text-ink-subtle">Free while TaskFlow is in beta.</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-[7px]">
              <label className="field-label" htmlFor="name">Name</label>
              <input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={errors.name ? 'true' : 'false'}
                className={`input ${errors.name ? 'input-error' : ''}`}
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>

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
                autoComplete="new-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby="password-hint"
                className={`input ${errors.password ? 'input-error' : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  validate: (value) => /\d/.test(value) || 'Password must contain at least one number',
                })}
              />
              {password && (
                <div className="mt-0.5 flex items-center gap-2" aria-live="polite">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <span
                        key={step}
                        className={`h-[3px] flex-1 rounded-full ${step <= score ? strength.bar : 'bg-line'}`}
                      />
                    ))}
                  </div>
                  <span className={`font-mono text-[11px] ${strength.text}`}>{strength.label}</span>
                </div>
              )}
              {errors.password ? (
                <p className="field-error">{errors.password.message}</p>
              ) : (
                <p id="password-hint" className="text-xs text-ink-faint">8+ characters, one number.</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary h-10 text-sm">
            {isSubmitting ? 'Creating account…' : 'Sign Up'}
          </button>

          <p className="text-center text-[13px] text-ink-subtle">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand hover:text-brand-hover">
              Log in
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

export default Signup;
