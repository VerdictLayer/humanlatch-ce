import { cx } from '@/lib/utils'

type Variant = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'indigo'

const variants: Record<Variant, string> = {
  green: 'bg-green-500/10 text-green-400 ring-green-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 ring-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  gray: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
}

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
