import { CatalogSearchField } from '@/features/catalog/components/catalog-search-field'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { MobileFilters } from '@/features/catalog/components/mobile-filters'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'

import { FeaturedNft } from './components/featured-nft'
import { HeroDesktop, HeroMobile } from './components/hero'
import { MintDiary } from './components/mint-diary'
import { Promos } from './components/promos'

const SIDEBAR_QUERY = '(min-width: 64rem)'

/**
 * Home: hero highlights, catalog (search, filters, sorting, pagination),
 * editorial banners and the "Diário da Cunhagem".
 */
export function HomePage() {
  // One search field and one set of filters at a time (no duplicated ids or
  // competing debounced navigations): sidebar on large screens, bar + drawer
  // on smaller ones (the Figma mobile frame puts the bar at the top).
  const sidebar = useMediaQuery(SIDEBAR_QUERY)
  const desktop = useMediaQuery(DESKTOP_QUERY)

  return (
    <>
      {sidebar ? null : (
        <div className="container-page flex gap-2 pt-6 md:pt-8">
          <CatalogSearchField className="flex-1" />
          <MobileFilters />
        </div>
      )}
      {desktop ? <HeroDesktop /> : <HeroMobile />}
      <CatalogSection desktop={sidebar} sidebarExtra={<FeaturedNft />} />
      <Promos />
      <MintDiary />
    </>
  )
}
