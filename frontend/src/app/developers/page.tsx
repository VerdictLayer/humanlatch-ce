'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DevelopersPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/developers')
  }, [router])

  return null
}
