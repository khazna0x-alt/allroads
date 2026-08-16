"use client";

type RangeSliderProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  formatValue: (value: number) => string;
  onChange: (value: [number, number]) => void;
};

export function RangeSlider({
  label,
  min,
  max,
  step,
  value,
  formatValue,
  onChange,
}: RangeSliderProps) {
  const span = Math.max(max - min, 1);
  const start = ((value[0] - min) / span) * 100;
  const end = ((value[1] - min) / span) * 100;

  return (
    <div className="md:col-span-2">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-sm tabular-nums text-[var(--sand-bright)]">
          {formatValue(value[0])} – {formatValue(value[1])}
        </p>
      </div>
      <div className="range-slider relative h-7" dir="ltr">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--sand)]"
          style={{ left: `${start}%`, width: `${Math.max(end - start, 0)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          aria-label={`${label} min`}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange([Math.min(next, value[1]), value[1]]);
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          aria-label={`${label} max`}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange([value[0], Math.max(next, value[0])]);
          }}
        />
      </div>
    </div>
  );
}
