'use client'

import { createContext, useContext } from 'react'

export type DashboardTheme = 'developer' | 'enterprise'

const DashboardThemeContext = createContext<DashboardTheme>('developer')

export function DashboardThemeProvider({
  theme,
  children,
}: {
  theme: DashboardTheme
  children: React.ReactNode
}) {
  return <DashboardThemeContext.Provider value={theme}>{children}</DashboardThemeContext.Provider>
}

export function useDashboardTheme() {
  return useContext(DashboardThemeContext)
}
