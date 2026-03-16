interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({ description, eyebrow, title }: SectionHeadingProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">{eyebrow}</p>
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
        {title}
      </h1>
      <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{description}</p>
    </div>
  );
}
