import { toast as sonner } from 'sonner'

/**
 * Typed toast helpers over Sonner. Keeps toast usage consistent and enables the
 * "undo instead of confirm" pattern (document/phase/00B §13).
 */
export const toast = {
  success: (message: string, description?: string) => sonner.success(message, { description }),
  error: (message: string, description?: string) => sonner.error(message, { description }),
  info: (message: string, description?: string) => sonner.info(message, { description }),
  warning: (message: string, description?: string) => sonner.warning(message, { description }),
  loading: (message: string) => sonner.loading(message),
  dismiss: (id?: string | number) => sonner.dismiss(id),
  promise: sonner.promise,

  /** Show a toast with an Undo action instead of a blocking confirm dialog. */
  undo: (message: string, onUndo: () => void) =>
    sonner(message, { action: { label: 'Undo', onClick: onUndo } }),
}
