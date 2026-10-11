import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit(data) {
    try {
      await signup(data.name, data.email, data.password);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
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
            <p className="text-sm text-ink-subtle">Projects and tasks, organised in one place.</p>
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
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                className={`input ${errors.password ? 'input-error' : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              {errors.password ? (
                <p className="field-error">{errors.password.message}</p>
              ) : (
                <p className="text-xs text-ink-faint">At least 6 characters.</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary h-10 text-sm">
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </button>

          <p className="text-center text-[13px] text-ink-subtle">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand hover:text-brand-hover">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
