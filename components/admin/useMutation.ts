'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/lib/admin-types'

export function useMutation(): { pending: boolean; message: string; error: boolean; run: (action: () => Promise<ActionResult>, success: string, after?: () => void) => void } {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  function run(action: () => Promise<ActionResult>, success: string, after?: () => void): void {
    setMessage('')
    startTransition(async () => {
      try {
        const result = await action()
        if ('error' in result) { setError(true); setMessage(result.error); return }
        setError(false); setMessage(success); after?.(); router.refresh()
      } catch {
        setError(true); setMessage('Não foi possível salvar. Confira sua conexão e tente novamente.')
      }
    })
  }
  return { pending, message, error, run }
}
