import Link from "next/link";
import { BRAND } from "@/config/brand";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center shadow-sm group-hover:bg-teal-600 transition-colors">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M17 7h4v4" />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
        {BRAND.name}
      </span>
    </Link>
  );
}
