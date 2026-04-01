import { cx } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--app-text)]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cx(
          'w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-3 py-2 text-sm text-[var(--app-text)]',
          'placeholder:text-[var(--app-text-soft)]',
          'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]',
          'disabled:opacity-50',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--app-text)]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cx(
          'w-full resize-none rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-muted)] px-3 py-2 text-sm text-[var(--app-text)]',
          'placeholder:text-[var(--app-text-soft)]',
          'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
