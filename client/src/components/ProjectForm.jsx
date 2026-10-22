// ─── CHANGE [design] NEW FILE ─────────────────────────────────────────────────
// WAS:    Two separate project forms: an inline create form in Dashboard.jsx (react-hook-form)
//         and an inline edit form in ProjectDetails.jsx (two useState values + onChange).
// NOW:    ONE form for both, shown inside a Modal. Pass `project` → edit mode (pre-filled,
//         "Save changes"); omit it → create mode (empty, "Create project").
// DETAILS: • validate: value.trim() !== '' rejects a title of only spaces in the browser,
//           matching the backend's .trim().notEmpty() rule.
//         • Create sends description only if filled in. Edit always sends it, so clearing
//           the field actually removes the description (same idea as TaskForm's edit mode).
//         • autoFocus puts the cursor in Title as soon as the modal opens.
// ─────────────────────────────────────────────────────────────────────────────
import { useForm } from 'react-hook-form';

function ProjectForm({ project, onSubmit, onCancel }) {
  const isEdit = Boolean(project);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { title: project?.title ?? '', description: project?.description ?? '' },
  });

  async function submit(data) {
    const payload = { title: data.title };
    if (isEdit || data.description) payload.description = data.description;
    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-[7px]">
        <label className="field-label" htmlFor="project-form-title">Title</label>
        <input
          id="project-form-title"
          autoFocus
          placeholder="e.g. Mobile App Redesign"
          aria-invalid={errors.title ? 'true' : 'false'}
          className={`input ${errors.title ? 'input-error' : ''}`}
          {...register('title', {
            validate: (value) => value.trim() !== '' || 'Title is required',
          })}
        />
        {errors.title && <p className="field-error">{errors.title.message}</p>}
      </div>

      <div className="flex flex-col gap-[7px]">
        <label className="field-label" htmlFor="project-form-description">
          Description <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <textarea
          id="project-form-description"
          rows={3}
          placeholder="What is this project about?"
          className="input h-auto resize-y py-2 leading-normal"
          {...register('description')}
        />
      </div>

      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isEdit ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </form>
  );
}

export default ProjectForm;
