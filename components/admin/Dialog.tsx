'use client'
import { useId, useLayoutEffect, useRef, type ReactElement, type ReactNode } from 'react'
import { control } from './styles'

export function Dialog({ title, trigger, children, unmountFocusId, onClose }: { title: string; trigger: ReactNode; children: ReactNode; unmountFocusId?: string; onClose?: () => void }): ReactElement {
  const ref = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  useLayoutEffect(() => {
    const dialog = ref.current
    const triggerButton = triggerRef.current
    return () => {
      if (!dialog || !unmountFocusId) return
      if (!dialog.open && document.activeElement !== triggerButton) return
      // A remoção do registro também remove seu botão: aguarde o DOM sair
      // antes de focar um alvo persistente, sem roubar foco de outro controle.
      queueMicrotask(() => {
        if (!dialog.isConnected && document.activeElement === document.body) {
          document.getElementById(unmountFocusId)?.focus()
        }
      })
    }
  }, [unmountFocusId])
  return <>
    <button type="button" ref={triggerRef} className={`${control} w-full text-left`} onClick={() => ref.current?.showModal()}>{trigger}</button>
    <dialog ref={ref} aria-labelledby={id} onClose={() => { triggerRef.current?.focus(); onClose?.() }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-sand bg-cream p-5 text-ink shadow-[0_24px_100px_#211c1840] backdrop:bg-ink/50 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-3"><h2 id={id} className="font-display text-2xl">{title}</h2><button type="button" className={control} onClick={() => ref.current?.close()} aria-label={`Fechar ${title}`}>Fechar</button></div>
      {children}
    </dialog>
  </>
}
