/** Temporary content for routes whose screen is not implemented yet. */
export function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <section className="container-page py-16">
      <h1 className="text-28 font-bold">{title}</h1>
      <p className="mt-2 text-15 text-muted-foreground">
        Tela em implementação.
      </p>
    </section>
  )
}
