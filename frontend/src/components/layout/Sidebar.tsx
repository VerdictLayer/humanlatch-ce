'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearToken } from '@/lib/auth'
import { cx } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  userEmail: string
  pendingCount?: number
  theme: 'developer' | 'enterprise'
  onThemeChange: (theme: 'developer' | 'enterprise') => void
}

function NavLink({
  href,
  label,
  icon,
  badge,
  theme,
}: NavItem & { theme: 'developer' | 'enterprise' }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  const isEnterprise = theme === 'enterprise'

  return (
    <Link
      href={href}
      className={cx(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isEnterprise
          ? active
            ? 'border border-[var(--app-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
            : 'border border-transparent text-[var(--app-text-muted)] hover:bg-[var(--app-panel-muted)] hover:text-[var(--app-text)]'
          : active
            ? 'bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'text-white/68 hover:bg-[var(--app-sidebar-hover)] hover:text-white',
      )}
    >
      <span className="w-4 h-4 shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className={cx(
            'ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold',
            isEnterprise
              ? active
                ? 'bg-[var(--app-accent)] text-white'
                : 'bg-[var(--app-panel-muted)] text-[var(--app-text)]'
              : 'bg-white/16 text-white',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

export function Sidebar({ userEmail, pendingCount, theme, onThemeChange }: SidebarProps) {
  const router = useRouter()
  const isEnterprise = theme === 'enterprise'

  function handleLogout() {
    clearToken()
    router.push('/login')
  }

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/approvals',
      label: 'Approvals',
      badge: pendingCount,
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/actions',
      label: 'Actions',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/policies',
      label: 'Policies',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/audit',
      label: 'Audit Log',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/api-keys',
      label: 'API Keys',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
    },
    {
      href: '/dashboard/developers',
      label: 'Developers',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L21 12l-3.75 5.25M6.75 6.75L3 12l3.75 5.25M14.25 4.5L9.75 19.5" />
        </svg>
      ),
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <aside
      className={cx(
        'flex h-full shrink-0 flex-col border-r',
        isEnterprise
          ? 'w-80 border-[var(--app-border)] bg-[var(--app-panel-strong)] text-[var(--app-text)]'
          : 'w-72 border-[var(--app-border)] bg-[var(--app-sidebar)] text-white',
      )}
    >
      <div className={cx('px-5 py-5', isEnterprise ? 'border-b border-[var(--app-border)]' : 'border-b border-white/10')}>
        <div className="flex items-center gap-3">
          <div
            className={cx(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              isEnterprise
                ? 'bg-[var(--app-accent)] text-white shadow-[0_10px_24px_rgba(15,76,129,0.18)]'
                : 'bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cx('text-sm font-semibold tracking-[0.08em]', isEnterprise ? 'text-[var(--app-text)]' : 'text-white')}>
                HumanLatch
              </span>
              <span
                className={cx(
                  'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]',
                  isEnterprise ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-white/10 text-white/80',
                )}
              >
                CE
              </span>
            </div>
            <p className={cx('mt-1 text-xs', isEnterprise ? 'text-[var(--app-text-muted)]' : 'text-white/60')}>
              {theme === 'enterprise' ? 'Executive command center' : 'Developer operations view'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <div
          className={cx(
            'rounded-2xl border p-3',
            isEnterprise ? 'border-[var(--app-border)] bg-[var(--app-panel-muted)]' : 'border-white/10 bg-white/5',
          )}
        >
          <p className={cx('text-[11px] font-semibold uppercase tracking-[0.18em]', isEnterprise ? 'text-[var(--app-text-soft)]' : 'text-white/45')}>
            Theme
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onThemeChange('developer')}
              className={cx(
                'rounded-xl border px-3 py-2 text-left text-xs transition-colors',
                theme === 'developer'
                  ? isEnterprise
                    ? 'border-[var(--app-border-strong)] bg-white text-[var(--app-text)]'
                    : 'border-white/20 bg-white/14 text-white'
                  : isEnterprise
                    ? 'border-[var(--app-border)] bg-transparent text-[var(--app-text-muted)] hover:bg-white'
                    : 'border-white/10 bg-transparent text-white/65 hover:bg-white/8',
              )}
            >
              <span className="block font-semibold">Developer</span>
              <span className="mt-0.5 block text-[11px] opacity-80">Dark ops</span>
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('enterprise')}
              className={cx(
                'rounded-xl border px-3 py-2 text-left text-xs transition-colors',
                theme === 'enterprise'
                  ? isEnterprise
                    ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-white'
                    : 'border-white/20 bg-white/14 text-white'
                  : isEnterprise
                    ? 'border-[var(--app-border)] bg-transparent text-[var(--app-text-muted)] hover:bg-white'
                    : 'border-white/10 bg-transparent text-white/65 hover:bg-white/8',
              )}
            >
              <span className="block font-semibold">Enterprise</span>
              <span className="mt-0.5 block text-[11px] opacity-80">Boardroom</span>
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            theme={theme}
            label={isEnterprise && item.href === '/dashboard' ? 'Executive Overview' : item.label}
          />
        ))}
      </nav>

      <div className={cx('px-3 py-4', isEnterprise ? 'border-t border-[var(--app-border)]' : 'border-t border-white/10')}>
        <div className="mb-2 flex items-center gap-3 px-2">
          <div className={cx('flex h-8 w-8 items-center justify-center rounded-full', isEnterprise ? 'bg-[var(--app-accent-soft)]' : 'bg-white/10')}>
            <span className={cx('text-xs font-bold', isEnterprise ? 'text-[var(--app-accent)]' : 'text-white')}>
              {userEmail[0]?.toUpperCase()}
            </span>
          </div>
          <span className={cx('truncate text-xs', isEnterprise ? 'text-[var(--app-text-muted)]' : 'text-white/72')}>{userEmail}</span>
        </div>
        <button
          onClick={handleLogout}
          className={cx(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors',
            isEnterprise
              ? 'text-[var(--app-text-muted)] hover:bg-[var(--app-panel-muted)] hover:text-[var(--app-text)]'
              : 'text-white/58 hover:bg-white/8 hover:text-white',
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
