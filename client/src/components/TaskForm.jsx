import { useForm } from 'react-hook-form';
import { PlusIcon } from './Icons';

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
          ? 'flex flex-col gap-2.5'
          : 'card grid gap-3 p-4 sm:grid-cols-[1.2fr_1.6fr_auto_auto] sm:items-start'
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="sr-only" htmlFor={isEdit ? `title-${initialValues._id}` : 'new-task-title'}>
          Task title
        </label>
        <input
          id={isEdit ? `title-${initialValues._id}` : 'new-task-title'}
          placeholder={isEdit ? 'Task title' : 'New task title'}
          aria-invalid={errors.title ? 'true' : 'false'}
          className={`input ${isEdit ? 'h-9' : ''} ${errors.title ? 'input-error' : ''}`}
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="field-error">{errors.title.message}</p>}
      </div>
      <input
        aria-label="Description"
        placeholder="Description (optional)"
        className={`input ${isEdit ? 'h-9' : ''}`}
        {...register('description')}
      />
      <input
        type="date"
        aria-label="Due date"
        className={`input ${isEdit ? 'h-9' : 'sm:w-auto'} font-mono text-[13px] text-ink-muted`}
        {...register('dueDate')}
      />
      <div className={`flex gap-2 ${isEdit ? 'justify-end' : ''}`}>
        {isEdit && (
          <button type="button" onClick={onCancel} className="btn btn-secondary h-8">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-primary ${isEdit ? 'h-8' : 'h-10'}`}
        >
          {!isEdit && <PlusIcon />}
          {isEdit ? 'Save' : 'Add task'}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
