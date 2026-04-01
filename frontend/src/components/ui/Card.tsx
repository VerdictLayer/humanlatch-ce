import { cx } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5 shadow-[var(--app-shadow)] backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}
