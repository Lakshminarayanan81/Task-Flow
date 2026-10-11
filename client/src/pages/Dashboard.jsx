import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import { PlusIcon } from '../components/Icons';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load projects');
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  async function onCreate(data) {
    try {
      const res = await api.post('/projects', data);
      setProjects((prev) => [...prev, res.data.data]);
      reset();
      toast.success('Project created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create project');
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-[1344px] flex-col gap-6 px-4 py-8 sm:px-12">
        <header className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Projects</h1>
            {!loading && (
              <span className="rounded-full bg-chip px-2.5 py-0.5 font-mono text-xs text-ink-subtle">
                {projects.length}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-subtle">Everything you're working on, one board per project.</p>
        </header>

        <form
          onSubmit={handleSubmit(onCreate)}
          className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start"
        >
          <div className="flex flex-col gap-1.5 sm:flex-1">
            <label htmlFor="project-title" className="sr-only">Project title</label>
            <input
              id="project-title"
              placeholder="Project title"
              aria-invalid={errors.title ? 'true' : 'false'}
              className={`input ${errors.title ? 'input-error' : ''}`}
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="field-error">{errors.title.message}</p>}
          </div>
          <label htmlFor="project-description" className="sr-only">Description</label>
          <input
            id="project-description"
            placeholder="Description (optional)"
            className="input sm:flex-1"
            {...register('description')}
          />
          <button type="submit" disabled={isSubmitting} className="btn btn-primary h-10">
            <PlusIcon />
            New Project
          </button>
        </form>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-[164px] animate-pulse bg-white/60" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
            <label
              htmlFor="project-title"
              className="flex min-h-[164px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-line-strong bg-white/50 p-5 text-center transition hover:border-brand hover:bg-white"
            >
              <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand-soft text-brand">
                <PlusIcon className="size-[15px]" />
              </span>
              <span className="text-[13px] font-semibold text-brand">New project</span>
              <span className="text-xs text-ink-faint">
                {projects.length === 0
                  ? 'No projects yet. Add a title above to create your first.'
                  : 'Add a title above to create one.'}
              </span>
            </label>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
