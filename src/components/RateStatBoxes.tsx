import { LOCAL_CURRENCY } from "@/lib/config";

export default function RateStatBoxes({
  buyRate,
  sellRate,
}: {
  buyRate: number;
  sellRate: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
        <p className="text-xs text-zinc-500">They buy at</p>
        <p className="font-medium">
          {buyRate.toFixed(4)} {LOCAL_CURRENCY}
        </p>
      </div>
      <div className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
        <p className="text-xs text-zinc-500">They sell at</p>
        <p className="font-medium">
          {sellRate.toFixed(4)} {LOCAL_CURRENCY}
        </p>
      </div>
    </div>
  );
}
