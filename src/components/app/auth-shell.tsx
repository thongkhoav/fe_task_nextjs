import { BarChart3, CheckCircle2, ShieldCheck } from "lucide-react";
import { BrandMark } from "./brand-mark";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const benefits = [
  {
    icon: CheckCircle2,
    title: "Plan work clearly",
    description: "Keep every task, owner, and deadline in one shared view.",
  },
  {
    icon: BarChart3,
    title: "See progress instantly",
    description: "Move work through a focused Kanban workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Collaborate securely",
    description: "Room access and conversations stay within your team.",
  },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen w-full bg-[#f7f7fb] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-indigo-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-20 xl:py-14">
        <div className="absolute -right-28 -top-28 size-96 rounded-full border border-indigo-700/50" />
        <div className="absolute -bottom-48 -left-36 size-[32rem] rounded-full bg-indigo-900" />
        <div className="relative z-10">
          <BrandMark inverse />
        </div>

        <div className="relative z-10 my-auto max-w-xl py-16">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
            Less noise. More progress.
          </p>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
            Turn your team&apos;s plans into progress.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-indigo-100/80">
            A focused place to organize tasks, align your team, and keep every
            conversation close to the work.
          </p>

          <div className="mt-12 grid gap-6">
            {benefits.map(
              ({ icon: Icon, title: benefitTitle, description: benefitDescription }) => (
                <div key={benefitTitle} className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{benefitTitle}</h2>
                    <p className="mt-1 text-sm leading-6 text-indigo-200/75">
                      {benefitDescription}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <div className="surface-card p-6 sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
            {children}
            {footer && (
              <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
                {footer}
              </div>
            )}
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Organize with clarity. Collaborate with confidence.
          </p>
        </div>
      </section>
    </main>
  );
}
