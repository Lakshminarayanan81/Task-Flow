import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import Modal from '../components/Modal';
import { PlusIcon, SearchIcon, XIcon } from '../components/Icons';

// ─── CHANGE [design] ──────────────────────────────────────────────────────────
// WAS:    An always-visible "Project title / Description / New Project" form above the
//         grid; cards with title + created date; no search.
// NOW:    The design's dashboard:
//         • Header: "Projects (4)" + greeting with tasks due soon (dueSoon from the backend).
//         • "Search projects" — filters the ALREADY-LOADED list in the browser. No API call:
//           the user's projects are all loaded anyway, so filtering locally is instant. (Tasks
//           use server-side search instead because a project can have many more tasks.)
//         • "New Project" button, dashed tile and the C key all open the same Modal.
//         • Each card's ⋮ menu → Edit (same modal, pre-filled) or Delete.
// STATE:  `modal` = null (closed) | { mode: 'create' } | { mode: 'edit', project }.
//         One state value describes which dialog is open, so they can never overlap.
// ─────────────────────────────────────────────────────────────────────────────
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

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

  // CHANGE [design]: NEW keyboard shortcut — pressing C opens "New project" (the design's
  // "Or press C"). It's ignored while typing in a field, with Ctrl/Cmd/Alt held (so Ctrl+C
  // still copies), or when a modal is already open. preventDefault stops the "c" from being
  // typed into the title field the modal auto-focuses.
  useEffect(() => {
    function onKeyDown(e) {
      if (modal || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== 'c') return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      e.preventDefault();
      setModal({ mode: 'create' });
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modal]);

  async function handleCreate(payload) {
    try {
      const res = await api.post('/projects', payload);
      // CHANGE [design]: WAS [...prev, newProject] (added at the end). The backend now sorts by
      // most recent activity, so a brand-new project goes FIRST to match that order.
      setProjects((prev) => [res.data.data, ...prev]);
      setModal(null);
      toast.success('Project created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create project');
    }
  }

  async function handleUpdate(project, payload) {
    try {
      const res = await api.put(`/projects/${project._id}`, payload);
      // { ...p, ...res.data.data } MERGES rather than replaces: PUT /projects/:id returns the
      // project without taskCounts/dueSoon, so replacing would wipe the card's progress bar.
      setProjects((prev) => prev.map((p) => (p._id === project._id ? { ...p, ...res.data.data } : p)));
      setModal(null);
      toast.success('Project updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update project');
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.title}" and all its tasks?`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      setProjects((prev) => prev.filter((p) => p._id !== project._id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete project');
    }
  }

  const firstName = user?.name?.split(' ')[0] ?? '';
  const dueSoon = projects.reduce((sum, p) => sum + (p.dueSoon ?? 0), 0);
  let summary = `${dueSoon} ${dueSoon === 1 ? 'task is' : 'tasks are'} due in the next 7 days.`;
  if (projects.length === 0) summary = 'create your first project to get started.';
  else if (dueSoon === 0) summary = 'nothing is due in the next 7 days.';

  const query = search.trim().toLowerCase();
  const visibleProjects = query
    ? projects.filter(
        (p) => p.title.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query),
      )
    : projects;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-[1344px] flex-col gap-6 px-4 py-8 sm:px-12">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Projects</h1>
              {!loading && (
                <span className="rounded-full bg-chip px-2.5 py-0.5 font-mono text-xs text-ink-subtle">
                  {projects.length}
                </span>
              )}
            </div>
            {!loading && (
              <p className="text-sm text-ink-subtle">
                {greeting()}
                {firstName && `, ${firstName}`} — {summary}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <label className="relative sm:w-[260px]">
              <span className="sr-only">Search projects</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-subtle" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects"
                className="input h-9 pr-8 pl-8 text-[13px]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded bg-chip text-ink-subtle hover:text-ink"
                >
                  <XIcon className="size-2.5" />
                </button>
              )}
            </label>
            <button onClick={() => setModal({ mode: 'create' })} className="btn btn-primary">
              <PlusIcon />
              New Project
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-[194px] animate-pulse bg-white/60" />
            ))}
          </div>
        ) : query && visibleProjects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
            <p className="text-sm font-medium">No projects match "{search.trim()}"</p>
            <button onClick={() => setSearch('')} className="text-[13px] font-medium text-brand hover:text-brand-hover">
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onEdit={(p) => setModal({ mode: 'edit', project: p })}
                onDelete={handleDelete}
              />
            ))}
            {!query && (
              <button
                onClick={() => setModal({ mode: 'create' })}
                className="flex min-h-[194px] flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-line-strong bg-white/50 p-5 text-center transition hover:border-brand hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
              >
                <span className="flex size-8 items-center justify-center rounded-[9px] bg-brand-soft text-brand">
                  <PlusIcon className="size-[15px]" />
                </span>
                <span className="text-[13px] font-semibold text-brand">New project</span>
                <span className="text-xs text-ink-faint">
                  Or press <kbd className="font-mono">C</kbd>
                </span>
              </button>
            )}
          </div>
        )}
      </main>

      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit project' : 'New project'} onClose={() => setModal(null)}>
          <ProjectForm
            project={modal.project}
            onCancel={() => setModal(null)}
            onSubmit={(payload) =>
              modal.mode === 'edit' ? handleUpdate(modal.project, payload) : handleCreate(payload)
            }
          />
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
