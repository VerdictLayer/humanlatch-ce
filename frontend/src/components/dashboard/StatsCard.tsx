import { cx } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  color?: 'indigo' | 'green' | 'yellow' | 'red' | 'gray'
}

const colorMap = {
  indigo: 'text-[var(--app-accent)]',
  green: 'text-green-400',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
  gray: 'text-[var(--app-text-muted)]',
}

export function StatsCard({ title, value, subtitle, color = 'indigo' }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[linear-gradient(180deg,var(--app-panel-strong),var(--app-panel))] p-5 shadow-[var(--app-shadow)]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-text-soft)]">{title}</p>
      <p className={cx('mt-2 text-3xl font-bold', colorMap[color])}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-[var(--app-text-muted)]">{subtitle}</p>}
    </div>
  )
}
