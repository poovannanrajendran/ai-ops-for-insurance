import type { PropsWithChildren, ReactNode } from "react";

interface CardProps extends PropsWithChildren {
  eyebrow?: string;
  title?: string;
  actions?: ReactNode;
}

export function Card({ actions, children, eyebrow, title }: CardProps) {
  return (
    <section className="rounded-[28px] border border-slate-500/55 bg-white/88 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur">
      {(eyebrow || title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2 className="text-2xl font-semibold text-slate-900">{title}</h2> : null}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
