import { LOCAL_CURRENCY } from "@/lib/config";

const WIDTH = 600;
const HEIGHT = 64;
const PADDING = 4;

export default function RateSparkline({
  currency,
  points,
  rangeLabel,
}: {
  currency: string;
  points: number[];
  rangeLabel: string;
}) {
  if (points.length < 2) {
    return (
      <div className="flex h-16 items-center justify-center rounded-lg border border-zinc-200 text-xs text-zinc-400 dark:border-zinc-800">
        Not enough {rangeLabel} history yet to chart {currency} movement.
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {currency} best buy rate — last {rangeLabel}
        </p>
        <p className={`text-xs font-medium ${rose ? "text-emerald-600" : "text-red-600"}`}>
          {last.toFixed(2)} {LOCAL_CURRENCY}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-1 h-16 w-full"
      >
        <path d={areaPath} fill={fillColor} stroke="none" />
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" />
      </svg>
    </div>
  );
}
