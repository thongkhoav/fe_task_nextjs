import { Inbox, LoaderCircle } from "lucide-react";

export function PageLoading({ label = "Loading workspace" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-slate-500"
      role="status"
    >
      <LoaderCircle className="animate-spin text-indigo-600" size={28} />
      <p className="text-sm font-medium">{label}...</p>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="surface-card flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Inbox size={26} aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
