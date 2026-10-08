import { Link } from '@tanstack/react-router'
import { type SubmitEvent, useId, useState } from 'react'

import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons'
import { UnavailableAction } from '@/components/unavailable-action'
import { CATEGORIES } from '@/contracts/catalog-taxonomy'
import { CATALOG_ANCHOR } from '@/features/catalog/components/catalog-anchor'
import { notifyUnavailable } from '@/lib/unavailable'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

const SOCIAL = [
  { name: 'Facebook', Icon: FacebookIcon },
  { name: 'Instagram', Icon: InstagramIcon },
  { name: 'Twitter', Icon: TwitterIcon },
  { name: 'LinkedIn', Icon: LinkedinIcon },
  { name: 'YouTube', Icon: YoutubeIcon },
] as const

/** Footer shortcuts to the catalog filtered by collection (as in Figma). */
const FOOTER_COLLECTIONS = CATEGORIES.filter((category) =>
  ['arte-digital', 'fotografia', 'musica', 'arte-3d', 'utilidade'].includes(
    category.id,
  ),
)

const linkClass =
  'cursor-pointer text-left text-14 leading-[1.7rem] text-foreground transition-colors hover:text-highlight'

const headingClass = 'text-18 font-bold text-foreground'

function Newsletter() {
  const inputId = useId()
  const errorId = useId()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get('email')
    const valid =
      typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setError('Informe um e-mail válido.')
      return
    }
    setError(null)
    notifyUnavailable('A inscrição na newsletter')
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="grid content-start gap-4"
    >
      <h2 className="text-18 leading-[1.1] font-bold">
        Antecipe-se ao próximo lançamento
      </h2>
      <div className="flex h-10 overflow-hidden rounded-md bg-band focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
        <label htmlFor={inputId} className="sr-only">
          E-mail para receber novidades
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-14 text-foreground outline-none placeholder:text-subtle-foreground"
        />
        <button
          type="submit"
          className="cursor-pointer bg-primary px-4 text-18 font-bold text-primary-foreground transition-colors hover:bg-highlight"
        >
          Enviar
        </button>
      </div>
      {error ? (
        <p id={errorId} className="-mt-2 text-13 text-destructive">
          {error}
        </p>
      ) : null}
      <p className="max-w-[18.5rem] text-13 leading-[1.55] text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do
        mercado.
      </p>
    </form>
  )
}

export function SiteFooter({ className }: { className?: string | undefined }) {
  return (
    <footer className={cn('container-page mt-20 pb-4', className)}>
      <section
        aria-label="Destaques da Kurio"
        className="grid gap-8 bg-card px-6 py-8 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.3fr)] lg:gap-0 lg:px-12 lg:pt-[1.875rem] lg:pb-7 xl:grid-cols-[15.5625rem_16.5625rem_16.625rem_minmax(0,1fr)]"
      >
        {FEATURES.map((feature) => (
          <div
            key={feature.mark}
            className="lg:border-r lg:border-primary lg:pr-4 lg:[&:not(:first-child)]:pl-4"
          >
            <span
              aria-hidden="true"
              className="grid size-[4.625rem] place-items-center rounded-full bg-primary text-24 font-bold text-primary-foreground"
            >
              {feature.mark}
            </span>
            <h2 className="mt-[0.6875rem] text-17 font-bold">
              {feature.title}
            </h2>
            <p className="mt-3 max-w-[12.5rem] text-14 leading-[1.48] text-muted-foreground">
              {feature.text}
            </p>
          </div>
        ))}
        <div className="lg:pl-4">
          <Newsletter />
        </div>
      </section>

      <div className="grid gap-4 bg-band px-8 py-6 text-14 sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:py-[1.5625rem]">
        <p className="text-14 font-bold tracking-brand">KURIO</p>
        <p className="max-w-[14rem]">
          Feito para colecionadores, criadores e cultura
        </p>
        <a
          href="mailto:contato@email.com"
          className="transition-colors hover:text-highlight"
        >
          contato@email.com
        </a>
        <a
          href="tel:+551140028922"
          className="transition-colors hover:text-highlight"
        >
          +55 11 4002 8922
        </a>
      </div>

      <div className="grid grid-cols-2 gap-8 bg-card px-8 py-[1.875rem] lg:grid-cols-4">
        <nav aria-labelledby="footer-profile">
          <h2 id="footer-profile" className={headingClass}>
            Meu perfil
          </h2>
          <ul className="mt-2.5">
            <li>
              <Link to="/perfil" className={linkClass}>
                Meu perfil
              </Link>
            </li>
            <li>
              <UnavailableAction
                feature="Minha coleção"
                className={linkClass}
              />
            </li>
            <li>
              <UnavailableAction feature="Atividade" className={linkClass} />
            </li>
            <li>
              <UnavailableAction
                feature="O estúdio do criador"
                className={linkClass}
              >
                Estúdio do criador
              </UnavailableAction>
            </li>
            <li>
              <Link to="/perfil/favoritos" className={linkClass}>
                Lista de interesse
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-help">
          <h2 id="footer-help" className={headingClass}>
            Central de ajuda
          </h2>
          <ul className="mt-2.5">
            {[
              'Central de ajuda',
              'Como comprar NFTs',
              'Carteira e segurança',
              'Política do mercado',
              'Denunciar item',
            ].map((item) => (
              <li key={item}>
                <UnavailableAction feature={item} className={linkClass} />
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-collections">
          <h2 id="footer-collections" className={headingClass}>
            Coleções
          </h2>
          <ul className="mt-2.5">
            {FOOTER_COLLECTIONS.map(({ id, label }) => (
              <li key={id}>
                <Link
                  to="/"
                  search={{ categories: [id] }}
                  hash={CATALOG_ANCHOR}
                  className={linkClass}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 grid content-start gap-4 lg:col-span-1">
          <div>
            <h2 className={headingClass}>Redes sociais</h2>
            <ul className="mt-4 flex flex-wrap gap-[0.5625rem]">
              {SOCIAL.map(({ name, Icon }) => (
                <li key={name}>
                  <UnavailableAction
                    feature={`O perfil da Kurio no ${name}`}
                    aria-label={`Kurio no ${name}`}
                    className="grid size-[1.9375rem] cursor-pointer place-items-center rounded-[0.3125rem] border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="size-4" />
                  </UnavailableAction>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={headingClass}>Carteiras compatíveis</h2>
            <p className="mt-2 inline-flex h-[1.5625rem] items-center rounded-[0.34rem] border border-border-strong bg-band px-2.5 text-9 font-bold tracking-[0.01em] whitespace-pre text-highlight">
              {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-14">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
