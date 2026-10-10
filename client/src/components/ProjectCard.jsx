import { Link } from 'react-router-dom';

function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition"
    >
      <h2 className="font-semibold">{project.title}</h2>
      {project.description && (
        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
      )}
      <p className="text-xs text-gray-400 mt-3">
        Created {new Date(project.createdAt).toLocaleDateString()}
      </p>
    </Link>
  );
}

export default ProjectCard;
