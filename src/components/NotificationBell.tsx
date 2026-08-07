import Link from "next/link";

export default function NotificationBell({
  href,
  count,
}: {
  href: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${count} unseen order updates` : "Orders"}
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path
          d="M5 8a5 5 0 0 1 10 0c0 3.5 1.2 4.8 1.2 4.8H3.8S5 11.5 5 8Z"
          strokeLinejoin="round"
        />
        <path d="M8.2 15.5a1.8 1.8 0 0 0 3.6 0" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
