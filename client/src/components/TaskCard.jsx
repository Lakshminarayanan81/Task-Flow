import { useState } from 'react';
import TaskForm from './TaskForm';

function TaskCard({ task, statuses, onStatusChange, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="bg-white p-3 rounded shadow-sm">
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

  return (
    <div className="bg-white p-3 rounded shadow-sm space-y-2">
      <p className="font-medium">{task.title}</p>
      {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
      {task.dueDate && (
        <p className="text-xs text-gray-500">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task._id, e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <div className="flex gap-3">
        <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">
          Edit
        </button>
        <button onClick={() => onDelete(task._id)} className="text-xs text-red-600 hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
