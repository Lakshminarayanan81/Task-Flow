import { Link } from 'react-router-dom';
import Popover, { MenuItem } from './Popover';
import { DotsIcon, PencilIcon, TrashIcon } from './Icons';
import { STATUS_STYLES } from '../statusStyles';
import { timeAgo } from '../utils/date';

const STATUS_ORDER = ['todo', 'in-progress', 'done'];

// ─── CHANGE [design] ──────────────────────────────────────────────────────────
// WAS:    The whole card was one <Link> showing title, description and "Created <date>".
// NOW:    The design's card: progress ("9 / 14 done", %, bar), a pill per status with its
//         count, "Updated 2h ago", and a ⋮ menu (Edit / Delete).
// DATA:   taskCounts, lastActivity and dueSoon come from the backend's new aggregation
//         (project.controller.js → getTaskStats). This file only does arithmetic on them.
// LAYOUT TRICK ("stretched link"): a <button> inside an <a> is invalid HTML, so the card can't
//         be one big link any more. Instead the title is the link, and its ::after
//         pseudo-element (after:absolute after:inset-0) stretches over the whole card, which
//         keeps the entire card clickable. The ⋮ menu sits above it with `relative z-10`.
//         has-[a:focus-visible] shows the focus ring on the card when the link is tabbed to.
// ─────────────────────────────────────────────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete }) {
  const counts = project.taskCounts ?? { todo: 0, 'in-progress': 0, done: 0 };
  const total = counts.todo + counts['in-progress'] + counts.done;
  const percent = total ? Math.round((counts.done / total) * 100) : 0;
  const complete = total > 0 && counts.done === total;

  let activity = `Updated ${timeAgo(project.lastActivity ?? project.updatedAt)}`;
  if (total === 0) activity = `Created ${timeAgo(project.createdAt)}`;
  else if (complete) activity = `Completed ${timeAgo(project.lastActivity ?? project.updatedAt)}`;

  return (
    <article className="group card relative flex min-h-[194px] flex-col gap-4 p-5 transition hover:-translate-y-px hover:border-line-strong hover:shadow-hover has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-brand/25">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="text-[15px] font-semibold">
            <Link
              to={`/projects/${project._id}`}
              className="transition outline-none group-hover:text-brand after:absolute after:inset-0 after:rounded-xl"
            >
              {project.title}
            </Link>
          </h2>
          {project.description ? (
            <p className="line-clamp-2 text-[13px] leading-normal text-ink-subtle">{project.description}</p>
          ) : (
            <p className="text-[13px] text-ink-faint">No description</p>
          )}
        </div>
        <div className="relative z-10 -mt-1 -mr-2">
          <Popover
            buttonLabel={`Actions for ${project.title}`}
            buttonClassName="btn btn-ghost size-8 px-0 text-ink-faint"
            button={<DotsIcon />}
          >
            {(close) => (
              <>
                <MenuItem onClick={() => { close(); onEdit(project); }}>
                  <PencilIcon />
                  Edit project
                </MenuItem>
                <MenuItem danger onClick={() => { close(); onDelete(project); }}>
                  <TrashIcon />
                  Delete project
                </MenuItem>
              </>
            )}
          </Popover>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-baseline justify-between font-mono text-[11px]">
          <span className="text-ink-subtle">
            {total === 0 ? 'No tasks yet' : `${counts.done} / ${total} done`}
          </span>
          <span className={`font-medium ${complete ? 'text-done' : 'text-ink'}`}>{percent}%</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-chip">
          <div
            className={`h-full rounded-full ${complete ? 'bg-done' : 'bg-brand'}`}
            // Width must be computed at runtime, so it's an inline style rather than a class.
            // Math.max(percent, 2): a project at 0% with tasks still shows a sliver, as in the design.
            style={{ width: `${total ? Math.max(percent, 2) : 0}%` }}
          />
        </div>
      </div>

      <span className="h-px bg-chip" />

      <div className="flex items-center gap-2">
        {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
          <span
            key={status}
            className={`flex h-[22px] items-center gap-[5px] rounded-full px-2 text-[11px] font-medium ${STATUS_STYLES[status].pill}`}
          >
            <span className={`size-[5px] rounded-full ${STATUS_STYLES[status].dot}`} />
            {counts[status]}
          </span>
        ))}
        <span className="flex-1" />
        <span className="font-mono text-[11px] text-ink-faint">{activity}</span>
      </div>
    </article>
  );
}

export default ProjectCard;
