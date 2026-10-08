export interface NftDetailSearch {
  /** Selected edition; the default edition when absent. */
  edition?: string
}

/**
 * validateSearch of /nfts/$nftId. A plain function (no schema library)
 * because route options are part of the entry chunk.
 */
export function validateNftDetailSearch(
  search: Record<string, unknown>,
): NftDetailSearch {
  return typeof search.edition === 'string' && search.edition
    ? { edition: search.edition }
    : {}
}
