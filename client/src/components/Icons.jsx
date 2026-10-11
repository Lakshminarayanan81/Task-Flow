const base = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function SearchIcon({ className = 'size-3.5' }) {
  return (
    <svg {...base} strokeWidth="1.5" className={className}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}

export function PlusIcon({ className = 'size-3.5' }) {
  return (
    <svg {...base} strokeWidth="1.8" className={className}>
      <path d="M8 3.2v9.6M3.2 8h9.6" />
    </svg>
  );
}

export function LogoutIcon({ className = 'size-3.5' }) {
  return (
    <svg {...base} strokeWidth="1.5" className={className}>
      <path d="M6 2.5H3.6A1.1 1.1 0 0 0 2.5 3.6v8.8a1.1 1.1 0 0 0 1.1 1.1H6M10.5 11 13.5 8l-3-3M13.5 8H6.5" />
    </svg>
  );
}

export function CalendarIcon({ className = 'size-3.5' }) {
  return (
    <svg {...base} strokeWidth="1.5" className={className}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.6" />
      <path d="M2.5 6.5h11M5.8 2.2v2.4M10.2 2.2v2.4" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'size-3' }) {
  return (
    <svg {...base} strokeWidth="1.5" className={className}>
      <path d="M4 6.4 8 10.4l4-4" />
    </svg>
  );
}

export function PencilIcon({ className = 'size-3.5' }) {
  return (
    <svg {...base} strokeWidth="1.5" className={className}>
      <path d="M10.6 2.9a1.6 1.6 0 0 1 2.3 2.3L5.6 12.5l-3 .8.8-3z" />
    </svg>
  );
}

export function TrashIcon({ className = 'size-3.5' }) {
  return (
    <svg {...base} strokeWidth="1.5" className={className}>
      <path d="M2.8 4.5h10.4M6.2 4.5V3h3.6v1.5M4.2 4.5l.6 8.5h6.4l.6-8.5" />
    </svg>
  );
}

export function XIcon({ className = 'size-3' }) {
  return (
    <svg {...base} strokeWidth="1.6" className={className}>
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}
