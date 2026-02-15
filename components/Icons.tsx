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

// ─── Genre Icons ────────────────────────────────────────

/** Castle / Fantasy */
export const IconCastle = (props: IconProps) => svg(
  'M3 21V11l2-2V6l2-2v3l2-2v3l2-2v3l2-2v3l2-2V6l2-2v3l2 2v10 M3 21h18 M8 21v-4h3v4 M13 21v-4h3v4',
  props
);

/** Ghost / Horror */
export const IconGhost = (props: IconProps) => svg(
  'M12 2a8 8 0 0 0-8 8v12l3-3 2.5 3 2.5-3 2.5 3 2.5-3 3 3V10a8 8 0 0 0-8-8z M9 10h.01 M15 10h.01',
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
export const IconStar = (props: IconProps) => svg(
  'M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z',
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
export const IconRadiation = (props: IconProps) => svgFill(
  <>
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
    <path d="M12 2a10 10 0 0 1 8.66 5L12 12z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 2a10 10 0 0 0-8.66 5L12 12z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 22a10 10 0 0 1-8.66-5L12 12z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 22a10 10 0 0 0 8.66-5L12 12z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
  </>,
  props
);

/** Lightning bolt / Mythology */
export const IconLightning = (props: IconProps) => svg(
  'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  props
);

/** Campfire / Survival */
export const IconCampfire = (props: IconProps) => svg(
  'M12 4c0 4-6 6-6 10a6 6 0 0 0 12 0c0-4-6-6-6-10z M12 18a2 2 0 0 1-2-2c0-2 2-3 2-3s2 1 2 3a2 2 0 0 1-2 2z M2 22l5-3 M22 22l-5-3 M7 19l5 3 5-3',
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
export const IconKatana = (props: IconProps) => svg(
  'M5 19L19 5 M8.5 15.5l-4 4 M15.5 8.5l-7 7 M19 5c.5-.5 1-2 0-3s-2.5-.5-3 0',
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
export const IconMasks = (props: IconProps) => svg(
  'M2 10a7 7 0 0 0 14 0V8a7 7 0 0 0-14 0v2z M6 11a1 1 0 0 0 2 0 M10 11a1 1 0 0 0 2 0 M7 14c1 1 3 1 4 0 M10 8a7 7 0 0 1 12 4v2a7 7 0 0 1-6.5 4 M16 11a1 1 0 0 0 2 0',
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
