import { Link } from '@tanstack/react-router'

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

import type { CatalogSearch } from '../search'
import { pageItems } from '../pagination'
import { CATALOG_ANCHOR } from './catalog-anchor'

interface CatalogPaginationProps {
  search: CatalogSearch
  page: number
  totalPages: number
}

/** Real links (shareable, open in a new tab); scrolls back to the catalog top. */
export function CatalogPagination({
  search,
  page,
  totalPages,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null
  const pageSearch = (target: number): CatalogSearch => {
    const { page: _page, ...rest } = search
    return target > 1 ? { ...rest, page: target } : rest
  }

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-14 flex justify-end md:mt-[5.25rem]"
    >
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <li>
            <Button asChild variant="secondary" size="icon">
              <Link
                to="/"
                search={pageSearch(page - 1)}
                hash={CATALOG_ANCHOR}
                resetScroll={false}
                aria-label="Página anterior"
              >
                <ChevronLeftIcon className="size-3" />
              </Link>
            </Button>
          </li>
        ) : null}
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Button
                asChild
                variant="secondary"
                size="icon"
                className="text-foreground"
              >
                <Link
                  to="/"
                  search={pageSearch(item)}
                  hash={CATALOG_ANCHOR}
                  resetScroll={false}
                  aria-label={`Página ${String(item)}`}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </Link>
              </Button>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden="true"
              className="px-1 text-subtle-foreground"
            >
              …
            </li>
          ),
        )}
        {page < totalPages ? (
          <li>
            <Button
              asChild
              variant="secondary"
              size="icon"
              className="text-foreground"
            >
              <Link
                to="/"
                search={pageSearch(page + 1)}
                hash={CATALOG_ANCHOR}
                resetScroll={false}
                aria-label="Próxima página"
              >
                <ChevronRightIcon className="size-3" />
              </Link>
            </Button>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
