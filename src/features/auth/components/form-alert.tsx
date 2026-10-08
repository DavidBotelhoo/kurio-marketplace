import { DangerTriangleIcon } from '@/components/icons'

/** Form-level error (credentials, network, server), announced on change. */
export function FormAlert({ message }: { message: string | undefined }) {
  return (
    <div role="alert" className="empty:hidden">
      {message ? (
        <p className="mb-4 flex items-start gap-2 rounded-sm border border-destructive/60 bg-destructive/10 px-3 py-2 text-13 text-foreground">
          <DangerTriangleIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          {message}
        </p>
      ) : null}
    </div>
  )
}
