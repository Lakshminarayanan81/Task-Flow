import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { PencilIcon, SearchIcon, TrashIcon, XIcon } from '../components/Icons';
import { STATUS_STYLES } from '../statusStyles';

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const EMPTY_FILTERS = { search: '', status: '', dueAfter: '', dueBefore: '' };

function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await api.get(`/projects/${id}`);
        setProject(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load project', { id: 'load-error' });
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    const params = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value) params[key] = value;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/projects/${id}/tasks`, { params, signal: controller.signal });
        setTasks(res.data.data);
      } catch (err) {
        if (err.name === 'CanceledError') return;
        toast.error(err.response?.data?.message || 'Could not load tasks', { id: 'load-error' });
      }
    }, filters.search ? 300 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, filters]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleStatusChange(taskId, status) {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update task');
    }
  }

  async function handleUpdateTask(taskId, payload) {
    try {
      const res = await api.put(`/tasks/${taskId}`, payload);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
      toast.success('Task updated');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update task');
      return false;
    }
  }

  async function handleCreateTask(payload) {
    try {
      const res = await api.post(`/projects/${id}/tasks`, payload);
      setTasks((prev) => [...prev, res.data.data]);
      toast.success('Task added');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add task');
      return false;
    }
  }

  async function handleDeleteTask(taskId) {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete task');
    }
  }

  function startEditing() {
    setEditTitle(project.title);
    setEditDescription(project.description || '');
    setEditing(true);
  }

  async function handleUpdateProject(e) {
    e.preventDefault();
    try {
      const res = await api.put(`/projects/${id}`, {
        title: editTitle,
        description: editDescription,
      });
      setProject(res.data.data);
      setEditing(false);
      toast.success('Project updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update project');
    }
  }

  async function handleDeleteProject() {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete project');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto flex max-w-[1376px] flex-col gap-5 px-4 py-7 sm:px-8">
          <div className="h-4 w-40 animate-pulse rounded bg-line" />
          <div className="h-7 w-72 animate-pulse rounded bg-line" />
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-chip" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Project not found</h1>
          <p className="text-sm text-ink-subtle">
            It may have been deleted, or it belongs to another account.
          </p>
          <Link to="/dashboard" className="btn btn-secondary mt-2">
            ← Back to projects
          </Link>
        </main>
      </div>
    );
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-[1376px] flex-col gap-5 px-4 py-7 sm:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px]">
          <Link to="/dashboard" className="font-medium text-ink-subtle transition hover:text-ink">
            Projects
          </Link>
          <span className="text-line-strong">/</span>
          <span className="truncate font-medium">{project.title}</span>
        </nav>

        {editing ? (
          <form onSubmit={handleUpdateProject} className="card flex max-w-2xl flex-col gap-3 p-4">
            <input
              aria-label="Project title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input text-[15px] font-semibold"
            />
            <input
              aria-label="Project description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              className="input"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">Save changes</button>
            </div>
          </form>
        ) : (
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">{project.title}</h1>
              {project.description && (
                <p className="max-w-[640px] text-sm text-ink-subtle">{project.description}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={startEditing} className="btn btn-secondary">
                <PencilIcon />
                Edit
              </button>
              <button onClick={handleDeleteProject} className="btn btn-danger">
                <TrashIcon />
                Delete
              </button>
            </div>
          </header>
        )}

        <TaskForm onSubmit={handleCreateTask} />

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative w-full sm:w-[300px]">
            <span className="sr-only">Search tasks</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-subtle" />
            <input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search title or description"
              className="input h-9 pl-8 text-[13px]"
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-[13px] text-ink-subtle">Status</span>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="input h-9 w-auto text-[13px] font-medium"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-[13px] text-ink-subtle">Due after</span>
            <input
              type="date"
              value={filters.dueAfter}
              onChange={(e) => updateFilter('dueAfter', e.target.value)}
              className="input h-9 w-auto font-mono text-[13px] text-ink-muted"
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-[13px] text-ink-subtle">Due before</span>
            <input
              type="date"
              value={filters.dueBefore}
              onChange={(e) => updateFilter('dueBefore', e.target.value)}
              className="input h-9 w-auto font-mono text-[13px] text-ink-muted"
            />
          </label>

          {hasFilters && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 text-[13px] font-medium text-brand transition hover:bg-brand hover:text-white"
            >
              Clear filters
              <XIcon className="size-2.5" />
            </button>
          )}
        </div>

        <div className="grid items-start gap-4 md:grid-cols-3">
          {STATUSES.filter((col) => !filters.status || col.value === filters.status).map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.value);
            return (
              <section key={col.value} className="flex flex-col gap-3 rounded-xl bg-chip/70 p-3">
                <h2 className="flex items-center gap-2 px-1 text-[13px] font-semibold">
                  <span className={`size-2 rounded-full ${STATUS_STYLES[col.value].dot}`} />
                  {col.label}
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 font-mono text-[11px] font-normal text-ink-subtle">
                    {columnTasks.length}
                  </span>
                </h2>
                <div className="flex flex-col gap-2.5">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      statuses={STATUSES}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteTask}
                      onUpdate={handleUpdateTask}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <p className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-[13px] text-ink-faint">
                      No tasks
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default ProjectDetails;
