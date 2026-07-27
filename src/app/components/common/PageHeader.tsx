import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border dark:border-slate-800 pb-5 mb-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground dark:text-white sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed font-normal">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border dark:border-slate-800 mb-4">
      <div>
        <h2 className="text-lg font-bold text-foreground dark:text-white">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
