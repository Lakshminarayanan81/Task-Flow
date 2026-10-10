import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="p-6 text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-6">
          <p className="text-gray-700">Project not found.</p>
          <Link to="/dashboard" className="text-blue-600 text-sm">← Back to projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <Link to="/dashboard" className="text-sm text-blue-600">← All projects</Link>
          {editing ? (
            <form onSubmit={handleUpdateProject} className="mt-2 space-y-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full border rounded px-3 py-2"
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white rounded px-3 py-1 text-sm">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="text-sm">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-4 mt-2">
              <div>
                <h1 className="text-2xl font-semibold">{project.title}</h1>
                {project.description && <p className="text-gray-600 mt-1">{project.description}</p>}
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={startEditing} className="text-blue-600">Edit</button>
                <button onClick={handleDeleteProject} className="text-red-600">Delete</button>
              </div>
            </div>
          )}
        </div>

        <TaskForm onSubmit={handleCreateTask} />

        <div className="bg-white p-4 rounded-lg shadow grid gap-3 sm:grid-cols-5 sm:items-end">
          <label className="text-sm sm:col-span-2">
            Search
            <input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Title or description"
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Status
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Due after
            <input
              type="date"
              value={filters.dueAfter}
              onChange={(e) => updateFilter('dueAfter', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Due before
            <input
              type="date"
              value={filters.dueBefore}
              onChange={(e) => updateFilter('dueBefore', e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>
        </div>
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-sm text-blue-600">
            Clear filters
          </button>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {STATUSES.filter((col) => !filters.status || col.value === filters.status).map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.value);
            return (
              <section key={col.value} className="bg-gray-100 rounded-lg p-3">
                <h2 className="font-semibold mb-3">
                  {col.label} <span className="text-sm text-gray-500">({columnTasks.length})</span>
                </h2>
                <div className="space-y-3">
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
                  {columnTasks.length === 0 && <p className="text-sm text-gray-500">No tasks</p>}
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
