import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ProjectCard from '../components/ProjectCard';

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-white p-4 rounded-lg shadow flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <input
              placeholder="Project title"
              className="w-full border rounded px-3 py-2"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>
          <input
            placeholder="Description (optional)"
            className="flex-1 border rounded px-3 py-2"
            {...register('description')}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
          >
            New project
          </button>
        </form>

        {loading ? (
          <p className="text-gray-500">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500">No projects yet. Create your first one above.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
