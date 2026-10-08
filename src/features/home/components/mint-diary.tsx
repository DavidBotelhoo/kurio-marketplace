import { UnavailableAction } from '@/components/unavailable-action'
import { NftImage } from '@/features/catalog/components/nft-image'
import { type ArtworkId, artworkImage } from '@/lib/artwork-image'

interface Post {
  date: string
  dateTime: string
  readingTime: string
  title: string
  excerpt: string
  artwork: ArtworkId
  alt: string
}

const POSTS: readonly Post[] = [
  {
    date: '12 de setembro',
    dateTime: '2026-09-12',
    readingTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    artwork: 'ivory',
    alt: 'Macaco de blazer creme e gola alta verde',
  },
  {
    date: '13 de setembro',
    dateTime: '2026-09-13',
    readingTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    artwork: 'emerald',
    alt: 'Macaco de óculos redondos e jaqueta college verde',
  },
  {
    date: '15 de setembro',
    dateTime: '2026-09-15',
    readingTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    artwork: 'nomad',
    alt: 'Gorila com chapéu bucket e moletom lilás',
  },
  {
    date: '15 de setembro',
    dateTime: '2026-09-15',
    readingTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    artwork: 'golden',
    alt: 'Macaco dourado com fones de ouvido verdes',
  },
]

/** "Diário da Cunhagem": editorial teasers; articles are out of scope. */
export function MintDiary() {
  return (
    <section
      aria-labelledby="diary-title"
      className="container-page mt-20 lg:mt-[5.25rem] xl:mt-[6.0625rem]"
    >
      <h2 id="diary-title" className="text-center text-24 font-bold lg:text-28">
        Diário da Cunhagem
      </h2>
      <p className="mx-auto mt-3.5 max-w-[30.5rem] text-center text-14 text-muted-foreground xl:mt-[0.6875rem] xl:max-w-none">
        Histórias, guias e insights para colecionadores sobre o universo da
        propriedade digital.
      </p>
      {/* xl: four 268px cards 24px apart, from the left edge (Figma). */}
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:mt-[2.375rem] xl:grid-cols-[repeat(4,16.75rem)]">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-card lg:max-w-[16.75rem]">
              <NftImage
                image={artworkImage(post.artwork, post.alt)}
                sizes="(min-width: 1024px) 268px, (min-width: 640px) 48vw, 100vw"
                className="aspect-[268/195] w-full object-cover"
              />
              <div className="flex flex-1 flex-col px-4 pt-3 pb-[1.0625rem]">
                <p className="text-12 leading-4 font-medium text-muted-foreground">
                  <time dateTime={post.dateTime}>{post.date}</time>
                  <span aria-hidden="true" className="whitespace-pre">
                    {'  |  '}
                  </span>
                  <span className="sr-only">, </span>
                  {post.readingTime}
                </p>
                <h3 className="mt-2 text-16 leading-[1.3125rem] font-bold">
                  {post.title}
                </h3>
                <p className="mt-2 text-12 leading-4 font-medium text-muted-foreground">
                  {post.excerpt}
                </p>
                <UnavailableAction
                  feature="O conteúdo do Diário da Cunhagem"
                  className="mt-auto w-fit cursor-pointer pt-[0.4375rem] text-12 leading-4 font-bold text-highlight hover:underline"
                >
                  Ler mais{' '}
                  <span aria-hidden="true" className="font-normal">
                    →
                  </span>
                  <span className="sr-only">: {post.title}</span>
                </UnavailableAction>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
