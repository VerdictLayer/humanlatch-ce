import type { ReactNode } from 'react'

type EmptyStateProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  checklist?: string[]
}

export function EmptyState({ eyebrow, title, description, actions, checklist = [] }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-[var(--app-border-strong)] bg-[linear-gradient(180deg,var(--app-panel-strong),var(--app-panel))] p-8 text-left">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-soft)]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--app-text-muted)]">{description}</p>

      {checklist.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {checklist.map((item) => (
            <div key={item} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-4 py-4">
              <p className="text-sm text-[var(--app-text)]">{item}</p>
            </div>
          ))}
        </div>
      ) : null}

      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
