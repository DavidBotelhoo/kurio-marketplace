import { toast } from 'sonner'

/**
 * Feedback for links and actions that exist in the layout but are out of the
 * challenge scope (editorial pages, support, activity, offers, downloads…).
 * They must never look like a successful operation.
 */
export function notifyUnavailable(feature: string) {
  toast.info(`${feature} não está disponível nesta demonstração.`, {
    id: `unavailable:${feature}`,
  })
}
