const SIZES = {
  sm: { box: 'size-[26px] rounded-[7px] gap-[2.5px] px-1.5', bar: 'h-[2.5px]', widths: ['w-3.5', 'w-2.5', 'w-1.5'] },
  md: { box: 'size-8 rounded-[9px] gap-[3px] px-[7px]', bar: 'h-[3px]', widths: ['w-[18px]', 'w-3', 'w-[7px]'] },
  lg: { box: 'size-10 rounded-[11px] gap-1 px-[9px]', bar: 'h-[3.5px]', widths: ['w-[22px]', 'w-[15px]', 'w-[9px]'] },
};

const BAR_TONES = ['bg-white', 'bg-white/70', 'bg-white/45'];

function Logo({ size = 'sm' }) {
  const s = SIZES[size];
  return (
    <span aria-hidden="true" className={`flex shrink-0 flex-col items-start justify-center bg-brand ${s.box}`}>
      {s.widths.map((width, i) => (
        <span key={width} className={`${width} ${s.bar} rounded-sm ${BAR_TONES[i]}`} />
      ))}
    </span>
  );
}

export default Logo;
