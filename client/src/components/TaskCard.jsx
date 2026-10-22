import { useState } from 'react';
import TaskForm from './TaskForm';
import { CalendarIcon, ChevronDownIcon } from './Icons';
import { STATUS_STYLES } from '../statusStyles';
import { dueDay, formatDay, isOverdue } from '../utils/date';

function TaskCard({ task, statuses, onStatusChange, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-[10px] border border-brand bg-white p-3 shadow-hover ring-3 ring-brand/10">
        <TaskForm
          initialValues={task}
          onCancel={() => setEditing(false)}
          onSubmit={async (payload) => {
            const ok = await onUpdate(task._id, payload);
            if (ok) setEditing(false);
            return ok;
          }}
        />
      </div>
    );
  }

  const style = STATUS_STYLES[task.status] ?? STATUS_STYLES.todo;
  // CHANGE [design]: NEW — a task past its due date and not done is "overdue" (see utils/date.js).
  // Its date renders in the danger red with an "Overdue ·" prefix so it stands out on the board.
  const overdue = isOverdue(task);

  return (
    <article className="group flex flex-col gap-2.5 rounded-[10px] border border-line bg-white p-3.5 shadow-card transition hover:border-line-strong hover:shadow-hover">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold leading-snug">{task.title}</p>
        {task.description && (
          <p className="line-clamp-3 text-[13px] leading-normal text-ink-subtle">{task.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {task.dueDate ? (
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${
              overdue ? 'font-medium text-danger' : 'text-ink-subtle'
            }`}
          >
            <CalendarIcon className="size-3" />
            {overdue && 'Overdue · '}
            {/* CHANGE [design]: WAS new Date(task.dueDate).toLocaleDateString(...), which showed
                the previous day west of UTC. dueDay() reads the stored date part directly —
                see the BUG FIXED note at the top of utils/date.js. */}
            {formatDay(dueDay(task.dueDate))}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-ink-faint">No due date</span>
        )}

        <span className="relative inline-flex">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            aria-label="Change status"
            className={`field-sizing-content h-[22px] cursor-pointer appearance-none rounded-full pr-6 pl-2.5 text-[11px] font-medium outline-none transition focus-visible:ring-3 focus-visible:ring-brand/25 ${style.pill}`}
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-2.5 -translate-y-1/2 opacity-70" />
        </span>
      </div>

      <div className="flex gap-1 border-t border-chip pt-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md px-1.5 py-0.5 text-xs font-medium text-ink-subtle transition hover:bg-chip hover:text-ink"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task._id)}
          className="rounded-md px-1.5 py-0.5 text-xs font-medium text-ink-subtle transition hover:bg-danger-bg hover:text-danger"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default TaskCard;
