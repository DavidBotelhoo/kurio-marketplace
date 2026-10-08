import { CatalogSearchField } from '@/features/catalog/components/catalog-search-field'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { MobileFilters } from '@/features/catalog/components/mobile-filters'
import { useMediaQuery } from '@/hooks/use-media-query'

const SIDEBAR_QUERY = '(min-width: 64rem)'

/** Home: catalog (search, filters, sorting, pagination). */
export function HomePage() {
  // One search field and one set of filters at a time (no duplicated ids or
  // competing debounced navigations): sidebar on large screens, bar + drawer
  // on smaller ones (the Figma mobile frame puts the bar at the top).
  const desktop = useMediaQuery(SIDEBAR_QUERY)

  return (
    <>
      {desktop ? null : (
        <div className="container-page flex gap-2 pt-6 md:pt-8">
          <CatalogSearchField className="flex-1" />
          <MobileFilters />
        </div>
      )}
      <CatalogSection desktop={desktop} />
    </>
  )
}
