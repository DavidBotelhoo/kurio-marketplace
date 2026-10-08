import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FieldError } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import type { User } from '@/contracts/auth'
import { isApiError } from '@/lib/api/errors'

import { AvatarError, prepareAvatar } from '../avatar-image'
import { useRemoveAvatar, useUpdateAvatar } from '../queries'
import { UserAvatar } from './user-avatar'

/**
 * "Avatar": changes apply at once (separate from the form's "Salvar"). The
 * picked image is cropped and resized in the browser before the upload.
 */
export function AvatarField({ user }: { user: User }) {
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const labelId = useId()
  const errorId = useId()
  const busy = update.isPending || remove.isPending

  const fail = (failure: unknown) => {
    setError(
      failure instanceof AvatarError
        ? failure.message
        : isApiError(failure)
          ? (failure.fields.avatar ?? failure.message)
          : 'Não foi possível atualizar o avatar. Tente novamente.',
    )
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={error ? errorId : undefined}
    >
      <p id={labelId} className="text-15 text-foreground">
        Avatar
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <UserAvatar src={user.avatarUrl} className="size-[3.0625rem]" />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            setError(null)
            prepareAvatar(file)
              .then((avatar) => {
                update.mutate(
                  { avatar },
                  {
                    onSuccess: () => toast.success('Avatar atualizado.'),
                    onError: fail,
                  },
                )
              })
              .catch(fail)
          }}
        />
        <Button
          type="button"
          size="md"
          disabled={busy}
          aria-label="Alterar avatar"
          className="w-[6.125rem] rounded-[0.1875rem]"
          onClick={() => {
            inputRef.current?.click()
          }}
        >
          {update.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        <button
          type="button"
          disabled={busy || !user.avatarUrl}
          aria-label="Remover avatar"
          onClick={() => {
            setError(null)
            remove.mutate(undefined, {
              onSuccess: () => toast.success('Avatar removido.'),
              onError: fail,
            })
          }}
          className="cursor-pointer text-14 text-foreground underline-offset-4 transition-colors hover:text-highlight hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
        >
          {remove.isPending ? 'Removendo…' : 'Remover'}
        </button>
      </div>
      {error ? (
        <div role="alert" className="mt-2">
          <FieldError id={errorId}>{error}</FieldError>
        </div>
      ) : null}
    </div>
  )
}
