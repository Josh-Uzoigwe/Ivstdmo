import Link from "next/link";
import { BRAND } from "@/config/brand";

export function BrandMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19V5h3.2l6.6 9.4V5H17v14h-3.2L7.2 9.6V19H4z" fill="currentColor" />
      <rect x="18.5" y="5" width="2.2" height="14" fill="#0f766e" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 group">
      <BrandMark className="w-6 h-6 text-slate-900 dark:text-white transition-transform group-hover:scale-105" />
      <span className="text-[19px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
        {BRAND.name}
      </span>
    </Link>
  );
}
