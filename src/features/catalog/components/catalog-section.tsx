import type { ReactNode } from 'react'

import { ActiveFilters, CatalogTabs, SortSelect } from './catalog-toolbar'
import { CATALOG_ANCHOR } from './catalog-anchor'
import { CatalogFilters } from './catalog-filters'
import { CatalogResults } from './catalog-results'

interface CatalogSectionProps {
  /**
   * Sidebar layout (≥1024px, search from the header as in the Figma frame);
   * smaller screens use the search bar + drawer.
   */
  desktop: boolean
  /** Rendered under the filters on desktop ("NFT em destaque"). */
  sidebarExtra?: ReactNode
}

export function CatalogSection({ desktop, sidebarExtra }: CatalogSectionProps) {
  return (
    <section
      id={CATALOG_ANCHOR}
      aria-labelledby="catalog-title"
      className="container-page mt-8 scroll-mt-6 lg:mt-[5.625rem]"
    >
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>
      <div className="lg:grid lg:grid-cols-[19.375rem_minmax(0,1fr)] lg:items-start lg:gap-12">
        {desktop ? (
          <aside
            aria-label="Filtros do catálogo"
            className="grid gap-12 xl:mt-1.5"
          >
            <div className="bg-card px-5 pt-4 pb-10">
              <CatalogFilters />
            </div>
            {sidebarExtra}
          </aside>
        ) : null}
        <div className="min-w-0">
          {/* Baseline alignment: the tabs' underline padding must not push
              "Ordenar por" off their text line. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-4">
            <CatalogTabs />
            <SortSelect className="max-md:hidden" />
          </div>
          <ActiveFilters />
          <CatalogResults />
        </div>
      </div>
    </section>
  )
}
