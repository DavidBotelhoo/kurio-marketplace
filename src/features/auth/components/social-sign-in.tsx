import { FacebookIcon, GoogleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { notifyUnavailable } from '@/lib/unavailable'
import { cn } from '@/lib/utils'

import type { AuthLayout } from './auth-layout-context'

const PROVIDERS = [
  { name: 'Google', Icon: GoogleIcon, iconClass: 'size-5' },
  { name: 'Facebook', Icon: FacebookIcon, iconClass: 'size-5 text-[#3b5999]' },
] as const

/**
 * "Ou continue com" + social buttons. Real OAuth is out of scope, so the
 * buttons explain that instead of pretending to sign in.
 */
export function SocialSignIn({ layout }: { layout: AuthLayout }) {
  const dialog = layout === 'dialog'
  return (
    <div className={cn(dialog ? 'mt-[1.5625rem]' : 'mt-10')}>
      <div className="flex items-center gap-3" role="presentation">
        <span className="h-px flex-1 bg-border" />
        <span className="text-13 text-foreground">Ou continue com</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <ul
        className={cn(
          'mt-7 grid',
          dialog
            ? 'mx-auto max-w-[21.1875rem] gap-[0.8125rem] px-4 sm:px-0'
            : 'gap-[1.0625rem]',
        )}
      >
        {PROVIDERS.map(({ name, Icon, iconClass }) => (
          <li key={name}>
            <Button
              variant="secondary"
              className="h-[2.4375rem] w-full gap-3 rounded-[0.28rem] text-13"
              onClick={() => {
                notifyUnavailable(`O acesso com ${name}`)
              }}
            >
              <Icon className={iconClass} />
              Continuar com {name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
