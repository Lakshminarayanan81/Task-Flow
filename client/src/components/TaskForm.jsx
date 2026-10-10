import { useForm } from 'react-hook-form';

function TaskForm({ onSubmit, initialValues, onCancel }) {
  const isEdit = Boolean(initialValues);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      dueDate: initialValues?.dueDate ? initialValues.dueDate.slice(0, 10) : '',
    },
  });

  async function submit(data) {
    const payload = { title: data.title };
    if (isEdit) {
      payload.description = data.description;
      payload.dueDate = data.dueDate || null;
    } else {
      if (data.description) payload.description = data.description;
      if (data.dueDate) payload.dueDate = data.dueDate;
    }

    const ok = await onSubmit(payload);
    if (ok && !isEdit) reset();
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className={
        isEdit
          ? 'space-y-2'
          : 'bg-white p-4 rounded-lg shadow grid gap-3 sm:grid-cols-4 sm:items-start'
      }
    >
      <div>
        <input
          placeholder="Task title"
          className="w-full border rounded px-3 py-2"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
      </div>
      <input
        placeholder="Description (optional)"
        className="w-full border rounded px-3 py-2"
        {...register('description')}
      />
      <input type="date" className="w-full border rounded px-3 py-2" {...register('dueDate')} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {isEdit ? 'Save' : 'Add task'}
        </button>
        {isEdit && (
          <button type="button" onClick={onCancel} className="text-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
