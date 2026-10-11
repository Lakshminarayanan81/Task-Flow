import { Link } from 'react-router-dom';

function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className="group card flex min-h-[164px] flex-col gap-4 p-5 transition hover:-translate-y-px hover:border-line-strong hover:shadow-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/25"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[15px] font-semibold transition group-hover:text-brand">{project.title}</h2>
        {project.description ? (
          <p className="line-clamp-2 text-[13px] leading-normal text-ink-subtle">{project.description}</p>
        ) : (
          <p className="text-[13px] text-ink-faint">No description</p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <span className="h-px bg-chip" />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-ink-faint">
            Created{' '}
            {new Date(project.createdAt).toLocaleDateString(undefined, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <span className="text-[13px] font-medium text-brand opacity-0 transition group-hover:opacity-100">
            Open →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
