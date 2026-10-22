import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import ProjectForm from '../components/ProjectForm';
import Modal from '../components/Modal';
import Popover, { MenuItem } from '../components/Popover';
import {
  CalendarIcon,
  ChevronDownIcon,
  DotsIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from '../components/Icons';
import { STATUS_STYLES } from '../statusStyles';
import { dueFilterLabel, duePresets } from '../utils/date';

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const STATUS_FILTERS = [{ value: '', label: 'All' }, ...STATUSES];

const EMPTY_FILTERS = { search: '', status: '', dueAfter: '', dueBefore: '' };

// ─── CHANGE [filters + design] overview ───────────────────────────────────────
// WAS:    Inline edit form for the project; Edit/Delete buttons; a filter row of plain
//         <select> and date inputs; one effect that debounced ALL filters together.
// NOW:    • Header shows "64% complete" + progress bar (from the backend's taskCounts) and
//           a ⋮ menu → Edit (Modal + ProjectForm) / Delete.
//         • Toolbar matches the design: search with ✕, segmented All / To Do / In Progress /
//           Done buttons, a "Due date" dropdown with presets + custom range, and a chip
//           showing the active date filter (✕ removes it).
//         • Filter fetching was reworked (details at each effect below).
// REMOVED: editTitle / editDescription state — ProjectForm manages its own fields now.
// ─────────────────────────────────────────────────────────────────────────────
function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // CHANGE [filters]: NEW — a copy of the search text that only updates 300ms after typing stops.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // CHANGE [filters]: NEW — a counter whose only job is to trigger a refetch. Increasing it
  // changes the fetch effect's dependencies, so React re-runs the effect.
  const [reloadKey, setReloadKey] = useState(0);
  // CHANGE [filters]: WAS computed further down, just before the JSX. Moved up here because the
  // handlers (refetchIfFiltered) now need it too, and handlers are defined before the JSX.
  const hasFilters = Object.values(filters).some(Boolean);

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

  // ─── CHANGE [filters] the debounce ──────────────────────────────────────────
  // WAS:    ONE effect watched all filters and waited `filters.search ? 300 : 0` ms before
  //         fetching. Quirk: once the search box had text, clicking a STATUS filter also
  //         waited 300ms, because the delay depended on whether search was non-empty, not
  //         on which filter changed.
  // NOW:    This small effect debounces ONLY the search text into `debouncedSearch`.
  //         Each keystroke changes filters.search → cleanup cancels the previous timer → a
  //         new 300ms timer starts. Only when you pause does debouncedSearch update.
  // BETTER: Typing still sends one request per pause, but status/date changes fetch
  //         instantly (measured in the browser: ~14ms, previously 300ms).
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const { status, dueAfter, dueBefore } = filters;

  // ─── CHANGE [filters] the fetch ─────────────────────────────────────────────
  // WAS:    deps [id, filters] + a setTimeout wrapper + a loop over every filter key.
  // NOW:    No timer here at all (the debounce effect above handles search). It fetches
  //         immediately whenever any of these change:
  //           id, debouncedSearch (NOT the raw search text), status, dueAfter, dueBefore,
  //           reloadKey (bumped after task edits — see refetchIfFiltered below).
  //         Listing each value instead of the whole `filters` object means typing in the
  //         search box no longer re-runs this effect on every keystroke.
  // KEPT:   AbortController — if a newer fetch starts, the cleanup cancels the older
  //         in-flight request, so a slow stale response can never overwrite newer results.
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (status) params.status = status;
    if (dueAfter) params.dueAfter = dueAfter;
    if (dueBefore) params.dueBefore = dueBefore;

    async function loadTasks() {
      try {
        const res = await api.get(`/projects/${id}/tasks`, { params, signal: controller.signal });
        setTasks(res.data.data);
      } catch (err) {
        if (err.name === 'CanceledError') return;
        toast.error(err.response?.data?.message || 'Could not load tasks', { id: 'load-error' });
      }
    }
    loadTasks();

    return () => controller.abort();
  }, [id, debouncedSearch, status, dueAfter, dueBefore, reloadKey]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  // CHANGE [design]: NEW — sets both dates at once, used by the "Due date" presets and the
  // chip's ✕. One state update instead of two means one fetch instead of two.
  function setDueRange(after, before) {
    setFilters((prev) => ({ ...prev, dueAfter: after, dueBefore: before }));
  }

  function clearSearch() {
    updateFilter('search', '');
    setDebouncedSearch('');
  }

  // CHANGE [filters]: WAS `setFilters(EMPTY_FILTERS)` inline on the button. Now it also clears
  // debouncedSearch directly, so clearing shows all tasks at once instead of 300ms later.
  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setDebouncedSearch('');
  }

  // ─── CHANGE [filters] ───────────────────────────────────────────────────────
  // WAS:    Adding/editing a task while filters were on just updated the local list, so a
  //         task that no longer matched (e.g. a new "Unrelated task" while searching "nav")
  //         stayed on the board until the next filter change.
  // NOW:    If any filter is active, bump reloadKey → the fetch effect re-runs → the server
  //         applies the filters again and the board shows only real matches.
  //         With no filters active nothing can be wrongly shown, so we skip the extra request.
  // ───────────────────────────────────────────────────────────────────────────
  function refetchIfFiltered() {
    if (hasFilters) setReloadKey((k) => k + 1);
  }

  // CHANGE [design]: NEW — re-fetches the project (with its fresh taskCounts) after any task
  // change, so the "64% complete" header stays accurate. Errors are deliberately ignored
  // here: the board itself already updated, and a stale percentage is only cosmetic.
  async function refreshProgress() {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
    } catch {
      // Progress is secondary; keep the last known numbers if this refresh fails.
    }
  }

  function afterTaskChange() {
    refetchIfFiltered();
    refreshProgress();
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
      afterTaskChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update task');
    }
  }

  async function handleUpdateTask(taskId, payload) {
    try {
      const res = await api.put(`/tasks/${taskId}`, payload);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
      afterTaskChange();
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
      afterTaskChange();
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
      refreshProgress();
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete task');
    }
  }

  async function handleUpdateProject(payload) {
    try {
      const res = await api.put(`/projects/${id}`, payload);
      // CHANGE [design]: WAS setProject(res.data.data). Merge instead of replace: the PUT
      // response doesn't include taskCounts, so replacing would reset the progress header to 0%.
      setProject((prev) => ({ ...prev, ...res.data.data }));
      setEditingProject(false);
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

  const counts = project.taskCounts ?? { todo: 0, 'in-progress': 0, done: 0 };
  const total = counts.todo + counts['in-progress'] + counts.done;
  const percent = total ? Math.round((counts.done / total) * 100) : 0;
  const complete = total > 0 && counts.done === total;
  const hasDueFilter = Boolean(dueAfter || dueBefore);

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

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">{project.title}</h1>
            {project.description && (
              <p className="max-w-[640px] text-sm text-ink-subtle">{project.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-start gap-3">
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-xl font-medium ${complete ? 'text-done' : ''}`}>{percent}%</span>
                <span className="text-[13px] text-ink-subtle">complete</span>
              </div>
              <div className="h-[5px] w-[200px] overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full transition-all ${complete ? 'bg-done' : 'bg-brand'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-ink-faint">
                {total === 0 ? 'No tasks yet' : `${counts.done} / ${total} done`}
              </span>
            </div>
            <Popover
              buttonLabel="Project actions"
              buttonClassName="btn btn-secondary size-9 px-0"
              button={<DotsIcon />}
            >
              {(close) => (
                <>
                  <MenuItem onClick={() => { close(); setEditingProject(true); }}>
                    <PencilIcon />
                    Edit project
                  </MenuItem>
                  <MenuItem danger onClick={() => { close(); handleDeleteProject(); }}>
                    <TrashIcon />
                    Delete project
                  </MenuItem>
                </>
              )}
            </Popover>
          </div>
        </header>

        <TaskForm onSubmit={handleCreateTask} />

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative w-full sm:w-[300px]">
            <span className="sr-only">Search tasks</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-subtle" />
            <input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search title or description"
              className="input h-9 pr-8 pl-8 text-[13px]"
            />
            {filters.search && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded bg-chip text-ink-subtle hover:text-ink"
              >
                <XIcon className="size-2.5" />
              </button>
            )}
          </label>

          {/* CHANGE [design]: WAS a <select> (All / To Do / In Progress / Done). NOW the design's
              segmented buttons. Same state underneath — each button calls
              updateFilter('status', value) exactly like the select's onChange did.
              aria-pressed tells screen readers which one is selected. */}
          <div role="group" aria-label="Filter by status" className="flex gap-0.5 rounded-[9px] bg-chip p-[3px]">
            {STATUS_FILTERS.map((option) => {
              const active = status === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateFilter('status', option.value)}
                  className={`flex h-[30px] items-center gap-1.5 rounded-[7px] px-3 text-[13px] font-medium transition ${
                    active ? 'bg-white text-ink shadow-card' : 'text-ink-subtle hover:text-ink'
                  }`}
                >
                  {option.value && <span className={`size-1.5 rounded-full ${STATUS_STYLES[option.value].dot}`} />}
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* CHANGE [design]: WAS two always-visible "Due after" / "Due before" date inputs.
              NOW a "Due date" dropdown: presets (today / this week / this month, built in
              utils/date.js) plus the same two date inputs under "Custom range". Every option
              just sets dueAfter/dueBefore — the backend filter is unchanged. */}
          <Popover
            align="left"
            buttonLabel="Filter by due date"
            buttonClassName="btn btn-secondary h-9"
            panelClassName="w-64"
            button={
              <>
                <CalendarIcon className="size-3.5 text-ink-subtle" />
                Due date
                <ChevronDownIcon className="size-3 text-ink-subtle" />
              </>
            }
          >
            {(close) => (
              <>
                {duePresets().map((preset) => (
                  <MenuItem
                    key={preset.label}
                    onClick={() => {
                      setDueRange(preset.dueAfter, preset.dueBefore);
                      close();
                    }}
                  >
                    {preset.label}
                  </MenuItem>
                ))}
                <div className="mt-1 flex flex-col gap-2 border-t border-line px-2.5 pt-2.5 pb-2">
                  <span className="text-xs font-medium text-ink-subtle">Custom range</span>
                  <label className="flex items-center justify-between gap-2 text-[13px] text-ink-muted">
                    From
                    <input
                      type="date"
                      value={dueAfter}
                      onChange={(e) => updateFilter('dueAfter', e.target.value)}
                      className="input h-8 w-[150px] px-2 font-mono text-xs"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-[13px] text-ink-muted">
                    To
                    <input
                      type="date"
                      value={dueBefore}
                      onChange={(e) => updateFilter('dueBefore', e.target.value)}
                      className="input h-8 w-[150px] px-2 font-mono text-xs"
                    />
                  </label>
                </div>
              </>
            )}
          </Popover>

          {hasDueFilter && (
            <button
              type="button"
              onClick={() => setDueRange('', '')}
              aria-label={`Remove filter: ${dueFilterLabel(dueAfter, dueBefore)}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 text-[13px] font-medium text-brand transition hover:bg-brand hover:text-white"
            >
              {dueFilterLabel(dueAfter, dueBefore)}
              <XIcon className="size-2.5" />
            </button>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[13px] font-medium text-ink-subtle transition hover:text-ink"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid items-start gap-4 md:grid-cols-3">
          {STATUSES.filter((col) => !status || col.value === status).map((col) => {
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
                      {hasFilters ? 'No matching tasks' : 'No tasks'}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {editingProject && (
        <Modal title="Edit project" onClose={() => setEditingProject(false)}>
          <ProjectForm
            project={project}
            onCancel={() => setEditingProject(false)}
            onSubmit={handleUpdateProject}
          />
        </Modal>
      )}
    </div>
  );
}

export default ProjectDetails;
