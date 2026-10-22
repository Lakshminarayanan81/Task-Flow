// ─── CHANGE [design] NEW FILE ─────────────────────────────────────────────────
// WAS:    Date logic was inline in components, e.g. TaskCard did
//         `new Date(task.dueDate).toLocaleDateString()`.
// NOW:    All date helpers in one place: formatting, "overdue", "2h ago", and the
//         due-date filter presets.
// BUG FIXED: a due date picked as "2026-10-15" is stored by MongoDB as 2026-10-15T00:00Z
//         (UTC midnight). `new Date(...)` converts that to LOCAL time — fine in India (+5:30),
//         but anywhere west of UTC (the Americas) it becomes Oct 14 evening, and the card
//         showed the wrong day. dueDay() reads the "2026-10-15" part directly instead.
// ─────────────────────────────────────────────────────────────────────────────

// Builds "YYYY-MM-DD" from LOCAL date parts — the format <input type="date"> and the
// backend's ?dueAfter=/?dueBefore= expect. (toISOString() would give the UTC date, which
// can be yesterday or tomorrow depending on the time of day.)
export function toDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Due dates are stored as UTC midnight, so read the date part directly; converting to local time shifts it a day west of UTC.
export function dueDay(dueDate) {
  return dueDate.slice(0, 10);
}

export function formatDay(day, options = { day: '2-digit', month: 'short' }) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}

export function isOverdue(task) {
  return Boolean(task.dueDate) && task.status !== 'done' && dueDay(task.dueDate) < toDateInput(new Date());
}

export function timeAgo(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

// Quick ranges for the "Due date" dropdown. Each preset is just a dueAfter/dueBefore pair,
// so they reuse the backend's existing $gte/$lte date filter — no new API needed.
// (7 - getDay()) % 7 = days until Sunday (getDay(): 0 = Sunday … 6 = Saturday).
// new Date(year, month + 1, 0) = "day 0 of next month" = the last day of this month.
export function duePresets() {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + ((7 - today.getDay()) % 7));
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const from = toDateInput(today);
  return [
    { label: 'Due today', dueAfter: from, dueBefore: from },
    { label: 'Due this week', dueAfter: from, dueBefore: toDateInput(endOfWeek) },
    { label: 'Due this month', dueAfter: from, dueBefore: toDateInput(endOfMonth) },
  ];
}

export function dueFilterLabel(dueAfter, dueBefore) {
  const preset = duePresets().find((p) => p.dueAfter === dueAfter && p.dueBefore === dueBefore);
  if (preset) return preset.label;
  if (dueAfter && dueBefore) return `${formatDay(dueAfter)} – ${formatDay(dueBefore)}`;
  if (dueAfter) return `Due after ${formatDay(dueAfter)}`;
  return `Due before ${formatDay(dueBefore)}`;
}
