'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children, pendingLabel }: {
  children: React.ReactNode
  pendingLabel: string
}): React.JSX.Element {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-disabled={pending}
      className="min-h-12 w-full rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#363636] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171717] disabled:cursor-wait disabled:opacity-60">
      <span aria-live="polite">{pending ? pendingLabel : children}</span>
    </button>
  )
}
