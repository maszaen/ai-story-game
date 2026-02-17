import React from 'react';

// All icons are monochrome SVGs styled to fit a medieval aesthetic.
// They inherit currentColor so they can be styled via text color.

interface IconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const svg = (d: string, props: IconProps, viewBox = '0 0 24 24') => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={props.size ?? '1em'}
    height={props.size ?? '1em'}
    className={props.className}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }}
  >
    <path d={d} />
  </svg>
);

const svgFill = (children: React.ReactNode, props: IconProps, viewBox = '0 0 24 24') => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={viewBox}
    fill="currentColor"
    width={props.size ?? '1em'}
    height={props.size ?? '1em'}
    className={props.className}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }}
  >
    {children}
  </svg>
);

// ─── UI Icons ───────────────────────────────────────────

/** Crossed swords */
export const IconSwords = (props: IconProps) => svgFill(
  <>
    <path d="M3.28 3.28l4.24 4.24M20.72 3.28l-4.24 4.24M14.12 14.12l6.6 6.6M3.28 20.72l6.6-6.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M3 2l1.5 5.5L9 12l3-3L7.5 4.5 3 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M21 2l-1.5 5.5L15 12l-3-3 4.5-4.5L21 2z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
  </>,
  props
);

/** Scroll / parchment */
export const IconScroll = (props: IconProps) => svg(
  'M8 21h-2a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2 M4 18V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12 M10 10h4 M10 14h4',
  props
);

/** Book open */
export const IconBook = (props: IconProps) => svg(
  'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  props
);

/** Skull */
export const IconSkull = (props: IconProps) => svgFill(
  <>
    <path d="M12 2C7.03 2 3 5.58 3 10c0 2.75 1.5 5.15 3.75 6.52V20a1 1 0 0 0 1 1h8.5a1 1 0 0 0 1-1v-3.48C18.5 15.15 21 12.75 21 10c0-4.42-4.03-8-9-8z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none"/>
    <path d="M10 21v1.5 M14 21v1.5 M12 15v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </>,
  props
);

/** Gear / cog */
export const IconGear = (props: IconProps) => svg(
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  props
);

/** Shield */
export const IconShield = (props: IconProps) => svg(
  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  props
);

/** People group */
export const IconPeopleGroup = (props: IconProps) => svgFill(
  <>
    <circle cx="12" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M8 21v-2a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="5" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M2 21v-1.5a3 3 0 0 1 4.5-2.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="19" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M22 21v-1.5a3 3 0 0 0-4.5-2.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </>,
  props
);

/** Sword (single) */
export const IconSword = (props: IconProps) => svg(
  'M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M19 13l2-2-6-6-2 2 M14.5 17.5L3 6',
  props
);

/** Arrow left (chevron) */
export const IconChevronLeft = (props: IconProps) => svg(
  'M15 18l-6-6 6-6',
  props
);

/** Arrow right (chevron) */
export const IconChevronRight = (props: IconProps) => svg(
  'M9 18l6-6-6-6',
  props
);

/** Checkmark for quests */
export const IconCheck = (props: IconProps) => svg(
  'M20 6L9 17l-5-5',
  props
);

/** Diamond (quest marker) */
export const IconDiamond = (props: IconProps) => svg(
  'M12 2l10 10-10 10L2 12z',
  props
);

/** Back / return arrow */
export const IconBack = (props: IconProps) => svg(
  'M19 12H5 M12 19l-7-7 7-7',
  props
);

/** Keyboard */
export const IconKeyboard = (props: IconProps) => svgFill(
  <>
    <rect x="2" y="4" width="20" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M6 8h.01 M10 8h.01 M14 8h.01 M18 8h.01 M6 12h.01 M10 12h.01 M14 12h.01 M18 12h.01 M8 16h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </>,
  props
);

/** Send arrow */
export const IconSend = (props: IconProps) => svg(
  'M22 2L11 13 M22 2l-7 20-4-9-9-4z',
  props
);

// ─── Genre Icons ────────────────────────────────────────

/** Castle / Fantasy */
export const IconCastle = (props: IconProps) =>
  svgFill(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-wand-sparkles-icon lucide-wand-sparkles"
    >
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
      <path d="m14 7 3 3" />
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </svg>,
    props
  );

/** Ghost / Horror */
export const IconGhost = (props: IconProps) =>
  svgFill(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-ghost-icon lucide-ghost"
    >
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
    </svg>,
    props
  );

/** Compass / Adventure */
export const IconCompass = (props: IconProps) => svgFill(
  <>
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" stroke="none"/>
  </>,
  props
);

/** Star / Sci-Fi */
export const IconStar = (props: IconProps) =>
  svgFill(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-orbit-icon lucide-orbit"
    >
      <path d="M20.341 6.484A10 10 0 0 1 10.266 21.85" />
      <path d="M3.659 17.516A10 10 0 0 1 13.74 2.152" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
    </svg>,
    props
  );

/** Eye / Mystery */
export const IconEye = (props: IconProps) => svgFill(
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8"/>
  </>,
  props
);

/** Heart / Romance */
export const IconHeart = (props: IconProps) => svg(
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  props
);

/** Anchor / Pirate */
export const IconAnchor = (props: IconProps) => svg(
  'M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 8v13 M5 12H2a10 10 0 0 0 20 0h-3',
  props
);

/** Radiation / Post-apocalyptic */
export const IconRadiation = (props: IconProps) =>
  svgFill(
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-radiation-icon lucide-radiation"
      >
        <path d="M12 12h.01" />
        <path d="M14 15.4641a4 4 0 0 1-4 0L7.52786 19.74597 A 1 1 0 0 0 7.99303 21.16211 10 10 0 0 0 16.00697 21.16211 1 1 0 0 0 16.47214 19.74597z" />
        <path d="M16 12a4 4 0 0 0-2-3.464l2.472-4.282a1 1 0 0 1 1.46-.305 10 10 0 0 1 4.006 6.94A1 1 0 0 1 21 12z" />
        <path d="M8 12a4 4 0 0 1 2-3.464L7.528 4.254a1 1 0 0 0-1.46-.305 10 10 0 0 0-4.006 6.94A1 1 0 0 0 3 12z" />
      </svg>
    </>,
    props
  );

/** Lightning bolt / Mythology */
export const IconLightning = (props: IconProps) => svg(
  'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  props
);

/** Campfire / Survival */
export const IconCampfire = (props: IconProps) =>
  svgFill(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-flame-kindling-icon lucide-flame-kindling"
    >
      <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z" />
      <path d="m5 22 14-4" />
      <path d="m5 18 14 4" />
    </svg>,
    props
  );

/** Cog / Steampunk */
export const IconCog = (props: IconProps) => svgFill(
  <>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 1v3 M12 20v3 M4.22 4.22l2.12 2.12 M17.66 17.66l2.12 2.12 M1 12h3 M20 12h3 M4.22 19.78l2.12-2.12 M17.66 6.34l2.12-2.12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </>,
  props
);

/** Katana / Samurai */
export const IconKatana = (props: IconProps) =>
  svgFill(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-swords-icon lucide-swords"
    >
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" x2="19" y1="19" y2="13" />
      <line x1="16" x2="20" y1="16" y2="20" />
      <line x1="19" x2="21" y1="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" x2="9" y1="14" y2="18" />
      <line x1="7" x2="4" y1="17" y2="20" />
      <line x1="3" x2="5" y1="19" y2="21" />
    </svg>,
    props
  );

/** Waves / Underwater */
export const IconWaves = (props: IconProps) => svg(
  'M2 6c1.5 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3.5 1.5 5 0 3.5-1.5 5 0 M2 12c1.5 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3.5 1.5 5 0 3.5-1.5 5 0 M2 18c1.5 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3.5 1.5 5 0 3.5-1.5 5 0',
  props
);

/** Monocle / Detective */
export const IconMonocle = (props: IconProps) => svgFill(
  <>
    <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 8l6 6" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
  </>,
  props
);

/** Comedy masks */
export const IconMasks = (props: IconProps) =>
  svgFill(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-laugh-icon lucide-laugh"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>,
    props
  );

/** Walking dead / Zombie */
export const IconZombie = (props: IconProps) => svgFill(
  <>
    <path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5.5 4 7v5h8v-5c2.5-1.5 4-4 4-7a8 8 0 0 0-8-8z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M9 9l1.5 1.5 M15 9l-1.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 14h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M10 14v2 M14 14v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </>,
  props
);

// ─── Genre icon map ────────────────────────────────────

export const GENRE_ICONS: Record<string, React.FC<IconProps>> = {
  'fantasy': IconCastle,
  'horror': IconGhost,
  'adventure': IconCompass,
  'scifi': IconStar,
  'mystery': IconEye,
  'romance': IconHeart,
  'pirate': IconAnchor,
  'postapocalyptic': IconRadiation,
  'mythology': IconLightning,
  'survival': IconCampfire,
  'steampunk': IconCog,
  'samurai': IconKatana,
  'underwater': IconWaves,
  'detective': IconMonocle,
  'comedy': IconMasks,
  'zombie': IconZombie,
};
