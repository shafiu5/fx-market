import Link from "next/link";
import { LOCAL_CURRENCY } from "@/lib/config";

const WIDTH = 600;
const HEIGHT = 64;
const PADDING = 4;

export const RANGES = [
  { value: "1d", label: "1D", ms: 24 * 60 * 60 * 1000 },
  { value: "1w", label: "1W", ms: 7 * 24 * 60 * 60 * 1000 },
  { value: "1m", label: "1M", ms: 30 * 24 * 60 * 60 * 1000 },
  { value: "1y", label: "1Y", ms: 365 * 24 * 60 * 60 * 1000 },
] as const;

export type Range = (typeof RANGES)[number]["value"];

export default function RateSparkline({
  currency,
  sort,
  range,
  points,
}: {
  currency: string;
  sort: string;
  range: Range;
  points: number[];
}) {
  const rangeLabel = RANGES.find((r) => r.value === range)!.label;

  const rangePills = (
    <div className="flex shrink-0 gap-1">
      {RANGES.map((r) => (
        <Link
          key={r.value}
          href={`/?currency=${currency}&sort=${sort}&range=${r.value}`}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            r.value === range
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );

  if (points.length < 2) {
    return (
      <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-zinc-400">
            Not enough {rangeLabel} history yet to chart {currency} movement.
          </p>
          {rangePills}
        </div>
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (WIDTH - PADDING * 2) + PADDING;
    const y = HEIGHT - PADDING - ((p - min) / span) * (HEIGHT - PADDING * 2);
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${HEIGHT} L${coords[0][0]},${HEIGHT} Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const rose = last >= first;
  const strokeColor = rose ? "#10b981" : "#ef4444";
  const fillColor = rose ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)";

  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`font-mono text-3xl font-semibold tabular-nums ${rose ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {last.toFixed(2)} {LOCAL_CURRENCY}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {currency} best buy rate — last {rangeLabel}
          </p>
        </div>
        {rangePills}
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-3 h-16 w-full"
      >
        <path d={areaPath} fill={fillColor} stroke="none" />
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" />
      </svg>
    </div>
  );
}
