import { cn } from "@/lib/utils";

type AvatarProps = {
  name?: string | null;
  className?: string;
};

export function Avatar({ name, className }: AvatarProps) {
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700",
        className,
      )}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}
