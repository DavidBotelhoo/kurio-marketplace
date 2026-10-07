// Icons extracted from the Figma file (design/assets/icons) and optimized with SVGO.
// Monochrome icons use currentColor; size them with font-size or size-* utilities.
// Icons are decorative by default (aria-hidden); label the interactive parent instead.
import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Header cart. */
export function CartIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M17.16 20.25H9.89a5.63 5.63 0 0 1-5.62-5.62V8.86A8.5 8.5 0 0 0 .42 1.72.93.93 0 0 1 .16.42.93.93 0 0 1 1.45.16c1.38.9 2.49 2.1 3.29 3.47.17.2 1.56 1.67 3.84 1.67h10.79a4.63 4.63 0 0 1 4.48 5.74L22.61 16a5.6 5.6 0 0 1-5.45 4.26M5.9 6.65q.24 1.07.24 2.2v5.78a3.75 3.75 0 0 0 3.75 3.74h7.27a3.74 3.74 0 0 0 3.63-2.83l1.25-4.96a2.76 2.76 0 0 0-2.67-3.4H8.58a7 7 0 0 1-2.68-.54m3.52 16.18c0-.65-.52-1.17-1.17-1.17-1.55.06-1.55 2.28 0 2.34.65 0 1.17-.52 1.17-1.17m9.33 0c0-.65-.52-1.17-1.17-1.17-1.56.06-1.55 2.28 0 2.34.65 0 1.17-.52 1.17-1.17m1.56-12.85a.94.94 0 0 0-.94-.93H8.95c-1.24.05-1.24 1.82 0 1.87h10.42c.52 0 .94-.42.94-.94"
      />
    </Icon>
  )
}

/** Search and zoom. */
export function SearchIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20.003 20.003" {...props}>
      <path
        fill="currentColor"
        d="M14.57 16a8.97 8.97 0 0 1-12.54-1.34 8.95 8.95 0 0 1 .42-11.83 8.95 8.95 0 0 1 14.8 2.68 8.9 8.9 0 0 1-1.3 9.11l.24.16 3.46 3.46c.27.27.41.58.33.97a1 1 0 0 1-1.65.53q-.4-.38-.78-.77l-2.85-2.85zm1.4-7a6.97 6.97 0 0 0-7-7 6.98 6.98 0 1 0 6.99 7"
      />
    </Icon>
  )
}

/** Sign in / sign out (Iconly Curved Logout). */
export function LoginIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 17.78 17.78" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M17.03 8.99H7m7.59-2.43 2.44 2.43-2.44 2.43M12.5 5.25c-.27-2.99-1.39-4.07-5.83-4.07C.75 1.18.75 3.11.75 8.88c0 5.8 0 7.72 5.92 7.72 4.44 0 5.56-1.09 5.83-4.07"
      />
    </Icon>
  )
}

/** Favorite (outline). */
export function HeartIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20 20" {...props}>
      <path
        fill="currentColor"
        d="M10 18.9q-.44 0-.77-.3l-2.28-1.95a42 42 0 0 1-4.97-4.66C.63 10.35 0 8.8 0 7.1c0-1.64.56-3.16 1.59-4.27a5.4 5.4 0 0 1 4-1.74q1.74 0 3.14 1.09.71.54 1.27 1.32.57-.77 1.27-1.32a5 5 0 0 1 3.14-1.09c1.55 0 2.97.62 4 1.74A6.2 6.2 0 0 1 20 7.11c0 1.7-.63 3.24-1.98 4.88a42 42 0 0 1-4.97 4.66q-1.05.88-2.28 1.96-.33.28-.77.29M5.59 2.27c-1.22 0-2.33.49-3.14 1.37A5 5 0 0 0 1.17 7.1c0 1.43.53 2.7 1.72 4.13 1.14 1.38 2.85 2.83 4.82 4.52L10 17.72l2.29-1.96a42 42 0 0 0 4.83-4.52c1.18-1.43 1.71-2.7 1.71-4.13 0-1.34-.45-2.58-1.28-3.47a4.2 4.2 0 0 0-3.14-1.37q-1.34 0-2.42.85a6 6 0 0 0-1.35 1.56.8.8 0 0 1-.64.36.7.7 0 0 1-.63-.36 6 6 0 0 0-1.36-1.56 4 4 0 0 0-2.42-.85"
      />
    </Icon>
  )
}

/** Favorite (filled, mobile tab bar). */
export function HeartFilledIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20 20" {...props}>
      <path
        fill="currentColor"
        d="M18.41 2.84a5.4 5.4 0 0 0-4-1.74q-1.73 0-3.14 1.09-.71.54-1.27 1.32-.56-.77-1.27-1.32A5 5 0 0 0 5.59 1.1c-1.55 0-2.97.62-4 1.74A6.3 6.3 0 0 0 0 7.11c0 1.7.63 3.24 1.98 4.88a42 42 0 0 0 4.97 4.66q1.05.88 2.28 1.96a1.2 1.2 0 0 0 1.54 0c.81-.71 1.6-1.38 2.28-1.96a42 42 0 0 0 4.97-4.66C19.37 10.35 20 8.8 20 7.1c0-1.64-.56-3.16-1.59-4.27"
      />
    </Icon>
  )
}

/** Add to cart / activity. */
export function ShoppingCartIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20 20" {...props}>
      <path
        fill="currentColor"
        d="M14.3 16.87H8.23a4.7 4.7 0 0 1-4.69-4.68v-4.8a7.1 7.1 0 0 0-3.2-5.95.78.78 0 0 1 .86-1.3 9 9 0 0 1 2.74 2.89c.14.16 1.3 1.39 3.2 1.39h9a3.86 3.86 0 0 1 3.73 4.78l-1.04 4.13a4.7 4.7 0 0 1-4.55 3.54M4.91 5.54q.2.9.2 1.84v4.8c0 1.73 1.4 3.13 3.12 3.13h6.05a3.1 3.1 0 0 0 3.03-2.36l1.04-4.13a2.3 2.3 0 0 0-2.22-2.84h-9c-.85 0-1.6-.19-2.22-.44m12 2.78a.8.8 0 0 0-.78-.78H7.46c-1.04.04-1.04 1.52 0 1.56h8.68c.43 0 .78-.35.78-.78"
      />
    </Icon>
  )
}

/** Cart (filled, mobile). */
export function ShopIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 17.5 17.5" {...props}>
      <path
        fill="currentColor"
        d="m17.5 5.55-.94 5.98a2.24 2.24 0 0 1-2.32 1.93H6.01a2.4 2.4 0 0 1-2.32-1.93L2.66 4.54 2.4 2.61c-.08-.51-.51-.85-1.11-.85h-.6C.34 1.76 0 1.43 0 1.1S.34.42.69.42h.6c1.2 0 2.23.84 2.31 2.02l.18 1.34h12.18c.43 0 .85.17 1.11.5.34.34.43.85.43 1.27m-3.09 11.53c.48 0 .86-.37.86-.84a.85.85 0 0 0-.86-.84.85.85 0 0 0-.86.84c0 .47.39.84.86.84m-8.58 0c.48 0 .86-.37.86-.84a.85.85 0 0 0-.86-.84.85.85 0 0 0-.85.84c0 .47.38.84.85.84"
      />
    </Icon>
  )
}

/** Rating star (Iconly Bold Star). */
export function StarIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 12.502 12.502" {...props}>
      <path
        fill="currentColor"
        d="M9.95 7.7a.7.7 0 0 0-.2.6l.56 3.08a.7.7 0 0 1-.29.68.7.7 0 0 1-.73.05l-2.77-1.45a1 1 0 0 0-.3-.08h-.18l-.17.06-2.76 1.45q-.22.11-.45.07a.7.7 0 0 1-.55-.8l.55-3.07a.7.7 0 0 0-.2-.61L.21 5.48a.7.7 0 0 1-.17-.7.7.7 0 0 1 .55-.47l3.11-.45a.7.7 0 0 0 .55-.38L5.62.68 5.74.5 5.8.46l.1-.08.07-.02.1-.05h.27a.7.7 0 0 1 .55.38l1.38 2.8c.1.2.3.34.52.37l3.11.45a.7.7 0 0 1 .57.47c.08.25.01.53-.18.7z"
      />
    </Icon>
  )
}

/** Share by e-mail. */
export function MessageIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 15 15" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7.5 2.6c-1.7 0-4.01.14-5.48.24a.9.9 0 0 0-.87.9v.53l5.88 3.09a1 1 0 0 0 .94 0l5.88-3.09v-.53a.9.9 0 0 0-.87-.9c-1.47-.1-3.78-.25-5.48-.25m6.35 2.92-5.32 2.8c-.64.33-1.42.33-2.06 0l-5.32-2.8v5.74c0 .48.38.86.87.9 1.47.1 3.78.25 5.48.25s4.01-.15 5.48-.25a.9.9 0 0 0 .87-.9zM1.93 1.76C3.4 1.65 5.75 1.5 7.5 1.5s4.1.15 5.57.26c1.1.08 1.93.94 1.93 1.98v7.52c0 1.04-.83 1.9-1.93 1.98-1.47.11-3.82.26-5.57.26s-4.1-.15-5.57-.26A2.03 2.03 0 0 1 0 11.26V3.74c0-1.04.83-1.9 1.93-1.98"
        clipRule="evenodd"
      />
    </Icon>
  )
}

/** Select / dropdown. */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 10.125 10.125" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9.96 2.41c.22.22.22.58 0 .8l-4.5 4.5a.56.56 0 0 1-.8 0l-4.5-4.5a.56.56 0 0 1 0-.8.56.56 0 0 1 .8 0l4.1 4.1 4.1-4.1a.56.56 0 0 1 .8 0"
        clipRule="evenodd"
      />
    </Icon>
  )
}

/** Pagination next. */
export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 12 12" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M3.38.75S8.62 3.86 8.62 6s-5.24 5.25-5.24 5.25"
      />
    </Icon>
  )
}

/** Back navigation. */
export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 13.167 13.167" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M9.5 12.42S3.67 8.96 3.67 6.58 9.5.75 9.5.75"
      />
    </Icon>
  )
}

/** Call to action arrow. */
export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 12.75 12.75" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M12 6.37H.75m6.71-4.51S12 4.3 12 6.37c0 2.08-4.54 4.52-4.54 4.52"
      />
    </Icon>
  )
}

/** Close dialogs. */
export function CloseIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 12 12" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M.17.38a.6.6 0 0 1 .82 0L6 5.21l5-4.83a.6.6 0 0 1 .83 0c.23.22.23.58 0 .8L6.83 6l5 4.83c.23.22.23.57 0 .79a.6.6 0 0 1-.82 0L6 6.79l-5 4.83a.6.6 0 0 1-.83 0 .54.54 0 0 1 0-.8l5-4.82-5-4.83a.54.54 0 0 1 0-.79"
        clipRule="evenodd"
      />
    </Icon>
  )
}

/** Password hidden (Iconly Curved Hide). */
export function HideIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 18.982 18.982" {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M4.22 14.15C2.1 12.94.75 11.1.75 9.5c0-2.73 3.91-6.08 8.74-6.08 1.97 0 3.8.56 5.28 1.43m2.13 1.7a4.6 4.6 0 0 1 1.33 2.94c0 2.74-3.92 6.09-8.74 6.09q-1.3 0-2.49-.3" />
        <path d="M7.38 11.35a2.5 2.5 0 0 1-.88-1.86c0-1.45 1.33-2.63 2.98-2.64.8 0 1.56.28 2.12.77m.82 2.34a2.8 2.8 0 0 1-2.4 2.12m6.92-9.16L2.04 16.06" />
      </g>
    </Icon>
  )
}

/** Password visible. Not in Figma: derived from HideIcon geometry. */
export function ShowIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 18.982 18.982" {...props}>
      <g stroke="currentColor" strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M.75 9.5c0-2.74 3.91-6.09 8.74-6.09s8.74 3.35 8.74 6.08c0 2.74-3.92 6.09-8.74 6.09S.75 12.23.75 9.49"
        />
        <path d="M6.5 9.5a2.98 2.98 0 1 0 5.97 0 2.98 2.98 0 1 0-5.96 0Z" />
      </g>
    </Icon>
  )
}

/** Increase quantity. Figma uses a text glyph; drawn as an icon. */
export function PlusIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 12 12" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M6 1v10M1 6h10"
      />
    </Icon>
  )
}

/** Decrease quantity. Figma uses a text glyph; drawn as an icon. */
export function MinusIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 12 12" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M1 6h10"
      />
    </Icon>
  )
}

/** Remove item (Iconly Curved Delete). */
export function DeleteIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 19.984 19.984" {...props}>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M16.6 7.59c0 8.02 1.15 11.64-6.62 11.64S3.4 15.61 3.4 7.6m14.67-3.08H1.92m11.5 0S13.95.75 9.99.75 6.57 4.52 6.57 4.52"
      />
    </Icon>
  )
}

/** Profile (outline). */
export function UserIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 15 15" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7.5 1.15a2.5 2.5 0 0 0-2.52 2.5 2.5 2.5 0 0 0 2.52 2.5 2.5 2.5 0 0 0 2.52-2.5 2.5 2.5 0 0 0-2.52-2.5m-3.68 2.5A3.67 3.67 0 0 1 7.5 0a3.67 3.67 0 0 1 3.68 3.65A3.67 3.67 0 0 1 7.5 7.31a3.67 3.67 0 0 1-3.68-3.66M5.6 10a2.93 2.93 0 0 0-2.94 2.92q0 .12.03.18l.04.04c.45.25 1.71.7 4.77.7s4.32-.45 4.77-.7l.04-.04.03-.18A2.93 2.93 0 0 0 9.4 10zm-4.1 2.92a4.1 4.1 0 0 1 4.1-4.07h3.8c2.26 0 4.1 1.82 4.1 4.07 0 .41-.15.95-.67 1.24-.7.37-2.18.84-5.33.84s-4.63-.47-5.33-.84a1.4 1.4 0 0 1-.67-1.24"
        clipRule="evenodd"
      />
    </Icon>
  )
}

/** Profile (filled, mobile tab bar). */
export function UserFilledIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16.666 16.666" {...props}>
      <path
        fill="currentColor"
        d="M8.33 8.16a4.1 4.1 0 0 0 4.1-4.08A4.1 4.1 0 0 0 8.34 0a4.1 4.1 0 1 0 0 8.16m2.13 1.7H6.2a4.55 4.55 0 0 0-4.53 4.51c0 .6.25 1.1.77 1.36.77.43 2.47.94 5.9.94 3.41 0 5.12-.51 5.9-.94.42-.25.76-.76.76-1.36a4.5 4.5 0 0 0-4.53-4.5"
      />
    </Icon>
  )
}

/** Home (Iconly Bold Home). */
export function HomeIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16.666 16.666" {...props}>
      <path
        fill="currentColor"
        d="M5.95 15.64V13.1c0-.66.53-1.18 1.18-1.18h2.4a1.2 1.2 0 0 1 1.18 1.18v2.54a1 1 0 0 0 1.03 1.03h1.63a2.9 2.9 0 0 0 2.88-2.86V6.55c0-.6-.27-1.19-.75-1.58L9.95.57a2.6 2.6 0 0 0-3.3.05L1.23 4.97c-.5.38-.79.96-.8 1.58v7.26a2.87 2.87 0 0 0 2.88 2.86h1.6c.56 0 1.02-.46 1.02-1.02z"
      />
    </Icon>
  )
}

/** Mobile tab bar primary action. */
export function ScanIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 26.823 26.823" {...props}>
      <path
        fill="currentColor"
        d="M13.38 14.3H1.1q-.2 0-.39-.02a.9.9 0 0 1-.7-.97.9.9 0 0 1 .91-.79h24.81q.21 0 .41.03c.44.1.73.52.69.95a.9.9 0 0 1-.9.8H13.4m-2.84 11.11c-1.35-.2-2.74-.28-4.05-.63-2.75-.75-4.32-2.64-4.77-5.44q-.23-1.55-.38-3.12c-.08-.63.22-1.04.77-1.11s.95.28 1 .83c.14 1.18.23 2.37.45 3.53a4.65 4.65 0 0 0 4.26 3.76q1.5.14 3.02.32c.73.08 1.07.9.64 1.5-.2.25-.42.33-.94.36m14.89-14.6-.05.41c-.1.31-.4.57-.66.58-.44 0-.94-.32-1.04-.74-.07-.3-.08-.6-.12-.9-.12-.96-.18-1.93-.4-2.87a4.4 4.4 0 0 0-3.57-3.55c-1.14-.25-2.31-.33-3.47-.48q-.2-.02-.39-.06a.85.85 0 0 1-.64-.92c.06-.46.42-.81.86-.78 1.53.1 3.07.22 4.54.69a6.2 6.2 0 0 1 4.4 4.76c.3 1.26.4 2.56.58 3.85zm-.03 5.49c-.12 1.28-.21 2.7-.6 4.06a6.4 6.4 0 0 1-5.58 4.6q-1.62.17-3.24.4c-.38.04-.8-.32-.88-.78s.2-.91.66-.97c.55-.08 1.1-.1 1.64-.16.9-.12 1.84-.16 2.7-.43a4.4 4.4 0 0 0 3.16-3.86q.2-1.54.35-3.07c.06-.6.45-1.01.97-.98.5.03.85.48.82 1.18m-24.09-5.6c.2-1.32.3-2.67.61-3.96.66-2.6 2.4-4.2 5.02-4.78 1.17-.27 2.39-.36 3.58-.52q.29-.04.56.02c.41.1.65.47.62.9a.85.85 0 0 1-.8.8q-1.62.16-3.23.39A4.7 4.7 0 0 0 3.52 7.7q-.21 1.62-.39 3.26a.9.9 0 0 1-.89.76.9.9 0 0 1-.85-.8v-.22z"
      />
    </Icon>
  )
}

/** Open filters (Iconly Curved Filter). */
export function FilterIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16.146 16.146" {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M6.68 12.88H.75" />
        <path
          fillRule="evenodd"
          d="M10.4 12.88c0 1.87.63 2.5 2.5 2.5s2.5-.63 2.5-2.5-.63-2.5-2.5-2.5-2.5.63-2.5 2.5"
          clipRule="evenodd"
        />
        <path d="M9.46 3.27h5.94" />
        <path
          fillRule="evenodd"
          d="M5.74 3.26c0-1.87-.62-2.49-2.5-2.49S.76 1.39.76 3.27s.62 2.49 2.5 2.49 2.49-.62 2.49-2.5"
          clipRule="evenodd"
        />
      </g>
    </Icon>
  )
}

/** Wallet (Iconly Curved Wallet). */
export function WalletIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20.101 20.101" {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M19.2 12.47h-3.88a2.56 2.56 0 1 1 0-5.12h3.86m-3.42 2.5h-.3M5.64 5.94H9.7" />
        <path
          fillRule="evenodd"
          d="M.75 10.05c0-6.4 2.32-8.54 9.3-8.54s9.3 2.13 9.3 8.54-2.32 8.54-9.3 8.54-9.3-2.14-9.3-8.54"
          clipRule="evenodd"
        />
      </g>
    </Icon>
  )
}

/** Wallets menu entry. */
export function LocationIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16.25 16.25" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.13 5.42a1.46 1.46 0 0 0 0 2.91 1.46 1.46 0 0 0 0-2.91m0 4.16a2.71 2.71 0 1 1 0-5.42 2.71 2.71 0 0 1 0 5.42"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8.13 1.25A5.66 5.66 0 0 0 2.5 6.93c0 3.98 4.69 7.86 5.63 8.07.93-.21 5.62-4.1 5.62-8.07a5.66 5.66 0 0 0-5.62-5.68m0 15c-1.5 0-6.88-4.63-6.88-9.32A6.9 6.9 0 0 1 8.13 0 6.9 6.9 0 0 1 15 6.93c0 4.7-5.38 9.32-6.87 9.32"
        clipRule="evenodd"
      />
    </Icon>
  )
}

/** Offers menu entry. */
export function ActivityIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 15.902 15.902" {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M4.13 10.13 6.37 7.2l2.56 2.01 2.2-2.83" />
        <path
          fillRule="evenodd"
          d="M13.69.75a1.44 1.44 0 1 1 0 2.88 1.44 1.44 0 0 1 0-2.88"
          clipRule="evenodd"
        />
        <path d="M14.5 5.94q.15 1 .15 2.28c0 5.2-1.73 6.93-6.94 6.93-5.2 0-6.94-1.73-6.94-6.93s1.74-6.94 6.94-6.94q1.25 0 2.24.14" />
      </g>
    </Icon>
  )
}

/** Downloads menu entry. */
export function DownloadIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 15.457 15.457" {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M7.64 9.78V.75m2.18 6.84-2.18 2.2-2.19-2.2" />
        <path d="M11 4.13c2.69.25 3.67 1.25 3.67 5.25 0 5.33-1.74 5.33-6.94 5.33S.79 14.7.79 9.38c0-4 .98-5 3.66-5.25" />
      </g>
    </Icon>
  )
}

/** Support menu entry / warnings. */
export function DangerTriangleIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 15.749 15.749" {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path
          fillRule="evenodd"
          d="M7.88 14.63c-4.88 0-6.79-.35-7.1-2.1S2.46 7.48 3.07 6.4C5.1 2.76 6.5 1.13 7.87 1.13c1.38 0 2.77 1.63 4.81 5.27.61 1.08 2.6 4.38 2.29 6.13s-2.22 2.1-7.1 2.1"
          clipRule="evenodd"
        />
        <path d="M7.88 5.25v2.92m-.01 2.63z" />
      </g>
    </Icon>
  )
}

/** Avatar placeholder. */
export function ImageIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20 20" {...props}>
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path
          fillRule="evenodd"
          d="M.75 10c0 6.94 2.31 9.25 9.25 9.25s9.25-2.31 9.25-9.25S16.94.75 10 .75.75 3.06.75 10"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          d="M8.6 6.78a1.76 1.76 0 1 1-3.52 0 1.76 1.76 0 0 1 3.52 0"
          clipRule="evenodd"
        />
        <path d="M19.12 12.67c-.88-.9-2.13-2.74-4.42-2.74s-2.33 4.04-4.67 4.04-3.28-1.37-4.8-.66-2.76 3.56-2.76 3.56" />
      </g>
    </Icon>
  )
}

/** Google brand mark. */
export function GoogleIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20 20" {...props}>
      <path
        fill="#59c36a"
        d="M16.43 17.6A10 10 0 0 1 10 20a10 10 0 0 1-8.58-4.94l.65-3 2.88-.53a5.3 5.3 0 0 0 8.14 2.74l2.77.42z"
      />
      <path
        fill="#00a66c"
        d="m16.43 17.6-.57-2.91-2.77-.42a5.2 5.2 0 0 1-3.09 1V20c2.45 0 4.7-.93 6.43-2.4"
      />
      <path
        fill="#ffda2d"
        d="M4.73 10q0 .81.22 1.53l-3.53 3.53A10 10 0 0 1 0 10a10 10 0 0 1 1.42-5.06l2.83.48.7 3.05q-.21.73-.22 1.53"
      />
      <path
        fill="#4086f4"
        d="M20 10a10 10 0 0 1-3.57 7.6l-3.34-3.33a5 5 0 0 0 1.63-1.93H10a.6.6 0 0 1-.59-.58V8.24c0-.33.26-.58.59-.58h9.25c.28 0 .53.2.57.48Q20 9.05 20 10"
      />
      <path
        fill="#4175df"
        d="M14.72 12.34a5 5 0 0 1-1.63 1.93l3.34 3.34a10 10 0 0 0 3.4-9.47.6.6 0 0 0-.58-.48H10v4.68z"
      />
      <path
        fill="#ff641a"
        d="M16.6 2.8a.6.6 0 0 1-.17.43l-2.5 2.5a.6.6 0 0 1-.77.05 5.3 5.3 0 0 0-8.22 2.68L1.43 4.95A10 10 0 0 1 10 0a10 10 0 0 1 6.39 2.36c.13.1.2.27.2.43"
      />
      <path
        fill="#f0805f"
        d="M13.16 5.78c.24.18.57.15.77-.06l2.5-2.5a.6.6 0 0 0-.04-.86A10 10 0 0 0 10 0v4.73c1.15 0 2.24.36 3.16 1.05"
      />
    </Icon>
  )
}

/** Facebook brand mark. */
export function FacebookIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20 20" {...props}>
      <path
        fill="currentColor"
        d="M13.18 3.32H15V.14A23 23 0 0 0 12.34 0c-5.78 0-4.2 6.54-4.43 7.5H5v3.55h2.9V20h3.57v-8.94h2.78l.45-3.56h-3.23c.15-2.35-.64-4.18 1.7-4.18"
      />
    </Icon>
  )
}

/** Instagram. */
export function InstagramIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        d="M8 1.47c2.13 0 2.4 0 3.27.06 2.2.07 3.2 1.14 3.26 3.27.07.87.07 1.07.07 3.2s0 2.4-.07 3.2q-.08 3.18-3.26 3.27c-.87.06-1.07.06-3.27.06-2.13 0-2.4 0-3.2-.06-2.2-.07-3.2-1.14-3.27-3.27-.06-.87-.06-1.07-.06-3.2s0-2.4.06-3.2q.09-3.18 3.27-3.27c.8-.06 1.07-.06 3.2-.06M8 0C5.8 0 5.53 0 4.73.07 1.8.2.2 1.8.07 4.73 0 5.53 0 5.8 0 8s0 2.47.07 3.27C.2 14.2 1.8 15.8 4.73 15.93 5.53 16 5.8 16 8 16s2.47 0 3.27-.07c2.93-.13 4.53-1.73 4.66-4.66.07-.8.07-1.07.07-3.27s0-2.47-.07-3.27C15.8 1.8 14.2.2 11.27.07 10.47 0 10.2 0 8 0m0 3.87A4.14 4.14 0 0 0 3.87 8 4.14 4.14 0 0 0 8 12.13 4.14 4.14 0 0 0 12.13 8 4.14 4.14 0 0 0 8 3.87m0 6.8a2.68 2.68 0 0 1 0-5.34 2.68 2.68 0 0 1 0 5.34m4.27-7.87c-.54 0-.94.4-.94.93 0 .54.4.94.94.94s.93-.4.93-.94-.4-.93-.93-.93"
      />
    </Icon>
  )
}

/** Twitter. */
export function TwitterIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        d="M5.03 14.5c6.04 0 9.34-5 9.34-9.34l-.01-.42A7 7 0 0 0 16 3.04q-.88.4-1.89.52a3.3 3.3 0 0 0 1.45-1.82q-.96.57-2.09.8a3.28 3.28 0 0 0-5.59 2.99A9.3 9.3 0 0 1 1.11 2.1a3.3 3.3 0 0 0 1.02 4.38 3 3 0 0 1-1.49-.41v.04a3.3 3.3 0 0 0 2.64 3.22 3 3 0 0 1-1.49.06 3.3 3.3 0 0 0 3.07 2.28A6.6 6.6 0 0 1 0 13.03a9.3 9.3 0 0 0 5.03 1.47"
      />
    </Icon>
  )
}

/** LinkedIn. */
export function LinkedinIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 16" {...props}>
      <path
        fill="currentColor"
        d="M3.33 2c0 .93-.73 1.66-1.66 1.66C.73 3.66 0 2.93 0 2.01 0 1.07.73.34 1.67.34S3.33 1.07 3.33 2m0 3H0v10.66h3.33zm5.34 0H5.33v10.66h3.34v-5.6c0-3.13 4-3.4 4 0v5.6H16V8.93c0-5.27-5.93-5.06-7.33-2.46z"
      />
    </Icon>
  )
}

/** YouTube. */
export function YoutubeIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 18.67 18.67" {...props}>
      <path
        fill="currentColor"
        d="M3.42 2.53c2.8-.24 9.02-.24 11.82 0l.28.02c2.78.32 3.15 2.14 3.15 6.82l-.01.87c-.05 4.17-.57 5.83-3.42 5.96-2.8.17-9.02.17-11.82 0C.58 16 .06 14.4 0 10.24v-.87c0-4.82.39-6.61 3.42-6.84M14.34 6.7c-2.59-.15-7.42-.15-10.02 0-.06.65-.08 1.48-.08 2.67 0 1.17.02 2 .08 2.64 2.65.1 7.38.1 10.02 0 .06-.64.09-1.48.09-2.64 0-1.19-.03-2.02-.09-2.67M7 9.37a1.92 1.92 0 1 1 2.78 1.72A1.92 1.92 0 0 1 7 9.37"
      />
    </Icon>
  )
}

/** Order confirmation illustration. */
export function ThankYouIllustration(props: IconProps) {
  return (
    <Icon viewBox="0 0 80 80" {...props}>
      <g fill="currentColor">
        <path d="M36.7 25.93c.6.23 1.28-.07 1.51-.68l.4-1.03h2.77l.38 1.03a1.17 1.17 0 1 0 2.2-.83l-2.71-7.17-.01-.03c-.21-.5-.7-.83-1.24-.83s-1.03.32-1.24.83v.03l-2.74 7.17c-.23.6.07 1.28.68 1.51m3.8-4.05h-1l.5-1.31zM46.33 26c.65 0 1.17-.52 1.17-1.16v-3.5l2.78 4.01c.33.48.9.69 1.43.52.54-.17.9-.67.9-1.29l-.08-7.03c0-.64-.53-1.16-1.17-1.16h-.01c-.65 0-1.17.53-1.16 1.18l.03 3.58-2.93-4.24a1.17 1.17 0 0 0-2.13.66v7.27c0 .64.52 1.17 1.17 1.17m8.92-.01c.65 0 1.17-.52 1.17-1.16v-1.27l2.19 2.11a1.17 1.17 0 1 0 1.62-1.69l-3.04-2.93 2.77-2.55a1.17 1.17 0 0 0-1.6-1.72l-1.94 1.8v-1.03a1.17 1.17 0 0 0-2.34 0v7.28c0 .64.52 1.17 1.17 1.17M28.4 26c.66 0 1.18-.52 1.18-1.16v-2.6h2.7v2.6a1.17 1.17 0 1 0 2.34 0v-7.28a1.17 1.17 0 0 0-2.35 0v2.34h-2.69v-2.34a1.17 1.17 0 1 0-2.34 0v7.28c0 .64.52 1.17 1.17 1.17m-2.76 5.63 2.13 3.27v3.36a1.17 1.17 0 1 0 2.34 0v-3.36l2.12-3.25a1.17 1.17 0 1 0-1.96-1.28l-1.32 2.03-1.35-2.05a1.17 1.17 0 0 0-1.96 1.28M43.73 36q0 1.8 1.68 2.88.89.57 1.97.57.93 0 1.73-.4c1.3-.66 2.02-1.74 2.02-3.05v-5a1.17 1.17 0 0 0-2.35 0v5c0 .3-.08.63-.72.95q-.3.15-.67.15-.4 0-.72-.2c-.55-.35-.6-.62-.6-.9v-5a1.17 1.17 0 1 0-2.34 0zM20.76 18.73h.83v6.1a1.17 1.17 0 0 0 2.35 0v-6.1h.84a1.17 1.17 0 1 0 0-2.34h-4.02a1.17 1.17 0 1 0 0 2.34m16.87 11.1a4.82 4.82 0 1 0 .01 9.63 4.82 4.82 0 0 0-.01-9.63m0 7.27a2.47 2.47 0 1 1 0-4.93 2.47 2.47 0 0 1 0 4.93" />
        <path d="m70.8 28.07-3.45-3.59V9.46a3.8 3.8 0 0 0-3.8-3.78H49.3v-.02l-2.8-2.88A9 9 0 0 0 40 0c-2.48 0-4.8.99-6.51 2.78l-2.78 2.9H16.44a3.8 3.8 0 0 0-3.79 3.78v15.02l-3.45 3.6a6.4 6.4 0 0 0-1.78 4.43v43.7A3.8 3.8 0 0 0 11.2 80h57.58a3.8 3.8 0 0 0 3.8-3.79v-43.7c0-1.66-.64-3.24-1.8-4.44m-1.7 1.63a4 4 0 0 1 1.14 2.81v2.66l-2.9 3.01V27.86zM35.19 4.4A6.6 6.6 0 0 1 40 2.34a6.6 6.6 0 0 1 4.82 2.06l1.22 1.28H33.96zM16.44 8.02h47.12c.8 0 1.44.65 1.44 1.44v31.16L52.56 53.58l-6.05-6.3A9 9 0 0 0 40 44.5c-2.48 0-4.8.98-6.51 2.77l-6.05 6.3L15 40.63V9.46c0-.8.64-1.44 1.44-1.44m9.37 47.25L9.76 72V38.55zM9.76 32.51c0-1.05.4-2.05 1.13-2.81l1.76-1.84v10.32l-2.89-3.01zM68.8 77.66H11.21c-.8 0-1.45-.65-1.45-1.45v-.84L35.18 48.9A6.6 6.6 0 0 1 40 46.84a6.6 6.6 0 0 1 4.82 2.06l9.41 9.8a1.17 1.17 0 0 0 1.7-1.62l-1.74-1.8 16.05-16.73V72L59.69 61A1.17 1.17 0 1 0 58 62.63l12.24 12.74v.84c0 .8-.65 1.45-1.45 1.45" />
      </g>
    </Icon>
  )
}
