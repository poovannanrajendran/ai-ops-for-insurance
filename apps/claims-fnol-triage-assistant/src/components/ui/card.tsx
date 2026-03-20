import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  eyebrow?: string;
  title: string;
}

export function Card({ children, eyebrow, title }: CardProps) {
  return (
    <section className="rounded-[28px] border border-slate-200/90 bg-[var(--panel)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-7">
      <div className="mb-5 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}
