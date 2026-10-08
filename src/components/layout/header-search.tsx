import { Popover } from 'radix-ui'
import { useState } from 'react'

import { SearchIcon } from '@/components/icons'
import { CatalogSearchField } from '@/features/catalog/components/catalog-search-field'

import { searchTriggerClass } from './header-search-trigger'

/**
 * The Figma header's search icon: opens the catalog search under it, from
 * any page. Typing updates the catalog (and scrolls to its results); Enter
 * closes the field.
 */
export default function HeaderSearch() {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger aria-label="Buscar NFTs" className={searchTriggerClass}>
        <SearchIcon className="size-5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          aria-label="Buscar NFTs"
          align="end"
          sideOffset={14}
          className="z-50 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-border-strong bg-background p-2 shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <CatalogSearchField
            revealResults
            onSubmitted={() => {
              setOpen(false)
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
