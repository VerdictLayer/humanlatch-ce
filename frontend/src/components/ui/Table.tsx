import { cx } from '@/lib/utils'

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('overflow-x-auto', className)}>
      <table className="w-full text-sm text-[var(--app-text)]">{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-[var(--app-border)]">{children}</thead>
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cx(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-soft)]',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[var(--app-border)]">{children}</tbody>
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      className={cx('transition-colors', onClick && 'cursor-pointer hover:bg-[var(--app-accent-soft)]', className)}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cx('whitespace-nowrap px-4 py-3 text-[var(--app-text)]', className)}>{children}</td>
  )
}
