import Link from "next/link";
import { CheckCheck } from "lucide-react";

type BrandMarkProps = {
  href?: string;
  inverse?: boolean;
  compact?: boolean;
};

export function BrandMark({
  href = "/rooms",
  inverse = false,
  compact = false,
}: BrandMarkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 rounded-xl"
      aria-label="Taskflow home"
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          inverse
            ? "bg-white text-indigo-700"
            : "bg-indigo-600 text-white shadow-sm"
        }`}
      >
        <CheckCheck size={22} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={`text-base font-bold tracking-tight ${
              inverse ? "text-white" : "text-slate-950"
            }`}
          >
            Taskflow
          </span>
          <span
            className={`mt-1 hidden text-[11px] font-medium uppercase tracking-[0.18em] sm:block ${
              inverse ? "text-indigo-200" : "text-slate-400"
            }`}
          >
            Team workspace
          </span>
        </span>
      )}
    </Link>
  );
}
