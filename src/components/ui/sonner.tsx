import { Toaster as Sonner, type ToasterProps } from 'sonner'

/*
 * Toasts are announced through Sonner's aria-live region. Styled with the
 * card surface and the Figma border; errors and success add an accent edge.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      // Phones: above the home indicator or the browser toolbar.
      mobileOffset={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      closeButton
      containerAriaLabel="Notificações"
      toastOptions={{
        classNames: {
          toast:
            'group rounded-md! border! border-border-strong! bg-card! font-sans! text-14! text-foreground!',
          description: 'text-13! text-muted-foreground!',
          closeButton:
            'border-border-strong! bg-card! text-muted-foreground! hover:text-foreground!',
          actionButton:
            'rounded-sm! bg-primary! font-bold! text-primary-foreground!',
          success: 'border-l-4! border-l-primary!',
          error: 'border-l-4! border-l-destructive!',
          info: 'border-l-4! border-l-subtle-foreground!',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
