import React from 'react';
import { CardDesignId } from '../data/cards';

interface CardIllustrationProps {
  id: CardDesignId;
  className?: string;
}

const STROKE = '#3A281C';

export const CardBackPattern: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="6" y="6" width="108" height="148" rx="9" stroke="#C69C45" strokeWidth="1.5" strokeOpacity="0.65" />
    <rect x="12" y="12" width="96" height="136" rx="6" stroke="#C69C45" strokeWidth="1" strokeOpacity="0.45" />
    {/* Corner arcs */}
    <path d="M12 28C20.8 28 28 20.8 28 12" stroke="#C69C45" strokeWidth="1.2" strokeOpacity="0.55" />
    <path d="M108 28C99.2 28 92 20.8 92 12" stroke="#C69C45" strokeWidth="1.2" strokeOpacity="0.55" />
    <path d="M12 132C20.8 132 28 139.2 28 148" stroke="#C69C45" strokeWidth="1.2" strokeOpacity="0.55" />
    <path d="M108 132C99.2 132 92 139.2 92 148" stroke="#C69C45" strokeWidth="1.2" strokeOpacity="0.55" />
    {/* Center diamond & emblem */}
    <path
      d="M60 40L88 80L60 120L32 80L60 40Z"
      stroke="#C69C45"
      strokeWidth="1.4"
      strokeOpacity="0.65"
    />
    <circle cx="60" cy="80" r="16" stroke="#C69C45" strokeWidth="1.4" fill="#C69C45" fillOpacity="0.12" />
    <path d="M60 64V96M44 80H76" stroke="#C69C45" strokeWidth="1.2" strokeOpacity="0.55" />
    <path
      d="M60 69L63.5 76.5L71 80L63.5 83.5L60 91L56.5 83.5L49 80L56.5 76.5L60 69Z"
      fill="#C69C45"
      fillOpacity="0.72"
    />
  </svg>
);

export const CardIllustration: React.FC<CardIllustrationProps> = ({ id, className = 'w-14 h-14' }) => {
  switch (id) {
    case 'shiba':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Ears */}
          <path d="M18 32L14 13L31 23Z" fill="#DF8134" stroke={STROKE} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M62 32L66 13L49 23Z" fill="#DF8134" stroke={STROKE} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M19 28L17 17L27 23Z" fill="#FDE6C4" />
          <path d="M61 28L63 17L53 23Z" fill="#FDE6C4" />
          {/* Head */}
          <ellipse cx="40" cy="43" rx="25" ry="22" fill="#E68B3C" stroke={STROKE} strokeWidth="2.4" />
          {/* Cream cheeks */}
          <path
            d="M16 45C16 37 25 36 33 41C36 43 38 41 40 37C42 41 44 43 47 41C55 36 64 37 64 45C64 57 53 65 40 65C27 65 16 57 16 45Z"
            fill="#FFF5E4"
          />
          <ellipse cx="40" cy="43" rx="25" ry="22" stroke={STROKE} strokeWidth="2.4" />
          {/* Eyebrows */}
          <ellipse cx="30" cy="34" rx="3" ry="1.8" fill="#FFF5E4" />
          <ellipse cx="50" cy="34" rx="3" ry="1.8" fill="#FFF5E4" />
          {/* Eyes */}
          <circle cx="29" cy="41" r="2.8" fill={STROKE} />
          <circle cx="51" cy="41" r="2.8" fill={STROKE} />
          <circle cx="28" cy="40" r="0.9" fill="#FFFFFF" />
          <circle cx="50" cy="40" r="0.9" fill="#FFFFFF" />
          {/* Nose & smile */}
          <ellipse cx="40" cy="47" rx="3.6" ry="2.6" fill={STROKE} />
          <path d="M35 52C37 55 40 53 40 50C40 53 43 55 45 52" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Collar */}
          <path d="M25 62C34 65 46 65 55 62" stroke="#D63B2F" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="40" cy="65.5" r="3" fill="#FBBF24" stroke={STROKE} strokeWidth="1.5" />
        </svg>
      );

    case 'cat':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Ears */}
          <path d="M18 35L16 14L33 24Z" fill="#EA7B32" stroke={STROKE} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M62 35L64 14L47 24Z" fill="#4B3E39" stroke={STROKE} strokeWidth="2.4" strokeLinejoin="round" />
          {/* Head */}
          <ellipse cx="40" cy="44" rx="24" ry="20" fill="#FFFBF2" stroke={STROKE} strokeWidth="2.4" />
          {/* Calico patches */}
          <path d="M18 37C20 27 29 24 36 25C36 33 29 39 18 37Z" fill="#EA7B32" />
          <path d="M62 38C60 27 51 24 44 25C44 34 52 40 62 38Z" fill="#4B3E39" />
          <ellipse cx="40" cy="44" rx="24" ry="20" stroke={STROKE} strokeWidth="2.4" />
          {/* Eyes */}
          <circle cx="29" cy="43" r="3" fill="#2F6E49" />
          <circle cx="51" cy="43" r="3" fill="#2F6E49" />
          <circle cx="29" cy="43" r="1.4" fill={STROKE} />
          <circle cx="51" cy="43" r="1.4" fill={STROKE} />
          {/* Nose & mouth */}
          <path d="M37.5 48H42.5L40 51Z" fill="#F472B6" stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M35 53C37 55 40 53.5 40 51C40 53.5 43 55 45 53" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
          {/* Whiskers */}
          <path d="M13 44H22M12 49H22M58 44H67M58 49H68" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'panda':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Ears */}
          <circle cx="21" cy="24" r="9" fill="#2D2A29" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="59" cy="24" r="9" fill="#2D2A29" stroke={STROKE} strokeWidth="2.2" />
          {/* Head */}
          <ellipse cx="40" cy="45" rx="24" ry="21" fill="#FFFFFF" stroke={STROKE} strokeWidth="2.4" />
          {/* Eye patches */}
          <ellipse cx="29" cy="43" rx="7" ry="8.5" transform="rotate(-18 29 43)" fill="#2D2A29" />
          <ellipse cx="51" cy="43" rx="7" ry="8.5" transform="rotate(18 51 43)" fill="#2D2A29" />
          {/* Eyes */}
          <circle cx="30" cy="42" r="2.2" fill="#FFFFFF" />
          <circle cx="50" cy="42" r="2.2" fill="#FFFFFF" />
          <circle cx="30.5" cy="42" r="1" fill="#2D2A29" />
          <circle cx="49.5" cy="42" r="1" fill="#2D2A29" />
          {/* Blushes */}
          <ellipse cx="22" cy="52" rx="3.5" ry="2" fill="#FDA4AF" />
          <ellipse cx="58" cy="52" rx="3.5" ry="2" fill="#FDA4AF" />
          {/* Nose & smile */}
          <ellipse cx="40" cy="50" rx="3.5" ry="2.4" fill="#2D2A29" />
          <path d="M35 55C37 57.5 40 55.5 40 52.5C40 55.5 43 57.5 45 55" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'penguin':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Feet */}
          <ellipse cx="30" cy="67" rx="7" ry="4" fill="#F59E0B" stroke={STROKE} strokeWidth="2" />
          <ellipse cx="50" cy="67" rx="7" ry="4" fill="#F59E0B" stroke={STROKE} strokeWidth="2" />
          {/* Body */}
          <path
            d="M19 46C19 25 28 14 40 14C52 14 61 25 61 46C61 60 52 66 40 66C28 66 19 60 19 46Z"
            fill="#334E68"
            stroke={STROKE}
            strokeWidth="2.4"
          />
          {/* White belly & face */}
          <path
            d="M25 48C25 38 28 24 35 24C37.5 24 39 27 40 29C41 27 42.5 24 45 24C52 24 55 38 55 48C55 59 48 63 40 63C32 63 25 59 25 48Z"
            fill="#FFFFFF"
          />
          {/* Flippers */}
          <path d="M19 37C12 43 12 52 18 55" fill="#334E68" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M61 37C68 43 68 52 62 55" fill="#334E68" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="32" cy="34" r="2.6" fill={STROKE} />
          <circle cx="48" cy="34" r="2.6" fill={STROKE} />
          <circle cx="31.3" cy="33.2" r="0.8" fill="#FFFFFF" />
          <circle cx="47.3" cy="33.2" r="0.8" fill="#FFFFFF" />
          {/* Beak */}
          <path d="M35 38H45L40 45L35 38Z" fill="#F59E0B" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          {/* Scarf */}
          <path d="M25 47C34 50 46 50 55 47" stroke="#E11D48" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );

    case 'firetruck':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Siren light */}
          <rect x="21" y="21" width="7" height="5" rx="2" fill="#FBBF24" stroke={STROKE} strokeWidth="1.8" />
          {/* Ladder */}
          <rect x="33" y="22" width="34" height="5" rx="1.5" fill="#E2E8F0" stroke={STROKE} strokeWidth="2" />
          <path d="M39 22V27M46 22V27M53 22V27M60 22V27" stroke={STROKE} strokeWidth="1.6" />
          {/* Truck body */}
          <path
            d="M10 42C10 38 14 29 19 27H32V56H10V42Z"
            fill="#DC2626"
            stroke={STROKE}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <rect x="32" y="30" width="38" height="26" rx="3" fill="#EF4444" stroke={STROKE} strokeWidth="2.3" />
          {/* Cab window */}
          <path d="M16 32H28V42H13L16 32Z" fill="#BAE6FD" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          {/* White stripe & compartment */}
          <rect x="34" y="42" width="34" height="4" fill="#FFFFFF" />
          <rect x="44" y="34" width="16" height="6" rx="1" fill="#F8FAFC" stroke={STROKE} strokeWidth="1.6" />
          {/* Wheels */}
          <circle cx="22" cy="58" r="7" fill="#334155" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="22" cy="58" r="2.6" fill="#E2E8F0" />
          <circle cx="56" cy="58" r="7" fill="#334155" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="56" cy="58" r="2.6" fill="#E2E8F0" />
        </svg>
      );

    case 'bus':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Double-decker bus */}
          <rect x="12" y="18" width="56" height="39" rx="6" fill="#2563EB" stroke={STROKE} strokeWidth="2.4" />
          {/* Roof stripe */}
          <path d="M18 18H62" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
          {/* Upper deck windows */}
          <rect x="17" y="23" width="11" height="10" rx="2" fill="#E0F2FE" stroke={STROKE} strokeWidth="1.8" />
          <rect x="31" y="23" width="11" height="10" rx="2" fill="#E0F2FE" stroke={STROKE} strokeWidth="1.8" />
          <rect x="45" y="23" width="11" height="10" rx="2" fill="#E0F2FE" stroke={STROKE} strokeWidth="1.8" />
          <rect x="59" y="23" width="5" height="10" rx="1.5" fill="#E0F2FE" stroke={STROKE} strokeWidth="1.8" />
          {/* Middle divider */}
          <rect x="13" y="36" width="54" height="3.5" fill="#FBBF24" />
          {/* Lower deck windows & door */}
          <rect x="17" y="42" width="11" height="10" rx="2" fill="#E0F2FE" stroke={STROKE} strokeWidth="1.8" />
          <rect x="31" y="42" width="11" height="10" rx="2" fill="#E0F2FE" stroke={STROKE} strokeWidth="1.8" />
          <rect x="46" y="41" width="10" height="15" rx="1.5" fill="#BFDBFE" stroke={STROKE} strokeWidth="1.8" />
          {/* Wheels */}
          <circle cx="24" cy="59" r="6.5" fill="#334155" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="24" cy="59" r="2.4" fill="#E2E8F0" />
          <circle cx="56" cy="59" r="6.5" fill="#334155" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="56" cy="59" r="2.4" fill="#E2E8F0" />
        </svg>
      );

    case 'train':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Track */}
          <path d="M8 62H72" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 62L13 67M32 62L30 67M48 62L50 67M64 62L67 67" stroke={STROKE} strokeWidth="2.2" strokeLinecap="round" />
          {/* Bullet train body */}
          <path
            d="M11 49C11 41 18 28 31 28H67C69 28 70 29.5 70 31.5V52C70 54 68.5 55.5 66.5 55.5H16C12.5 55.5 11 53 11 49Z"
            fill="#F8FAFC"
            stroke={STROKE}
            strokeWidth="2.4"
          />
          {/* Teal accent stripe */}
          <path d="M13 46H70V51H13C11.8 51 11 49.8 11 48.5C11 47 12 46 13 46Z" fill="#0D9488" />
          {/* Nose cockpit window */}
          <path d="M18 39L28 31H37V41H18C16.8 41 17 39.8 18 39Z" fill="#38BDF8" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
          {/* Passenger windows */}
          <rect x="42" y="33" width="9" height="8" rx="2" fill="#BAE6FD" stroke={STROKE} strokeWidth="1.8" />
          <rect x="55" y="33" width="9" height="8" rx="2" fill="#BAE6FD" stroke={STROKE} strokeWidth="1.8" />
          {/* Headlight */}
          <circle cx="15" cy="49" r="2.2" fill="#FDE047" stroke={STROKE} strokeWidth="1.2" />
          {/* Bogie wheels */}
          <circle cx="29" cy="58" r="3.5" fill="#475569" stroke={STROKE} strokeWidth="1.8" />
          <circle cx="57" cy="58" r="3.5" fill="#475569" stroke={STROKE} strokeWidth="1.8" />
        </svg>
      );

    case 'taxi':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Taxi roof sign */}
          <rect x="33" y="21" width="14" height="6" rx="2" fill="#FEF08A" stroke={STROKE} strokeWidth="2" />
          <path d="M37 24H43" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          {/* Upper cabin */}
          <path d="M21 40L28 27H52L59 40H21Z" fill="#FACC15" stroke={STROKE} strokeWidth="2.4" strokeLinejoin="round" />
          {/* Windows */}
          <path d="M25 38L30 30H39V38H25Z" fill="#BAE6FD" stroke={STROKE} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M42 30H50L55 38H42V30Z" fill="#BAE6FD" stroke={STROKE} strokeWidth="1.8" strokeLinejoin="round" />
          {/* Main chassis */}
          <rect x="11" y="39" width="58" height="16" rx="5" fill="#EAB308" stroke={STROKE} strokeWidth="2.4" />
          {/* Checker stripe */}
          <rect x="24" y="45" width="5" height="4" fill={STROKE} />
          <rect x="29" y="49" width="5" height="4" fill={STROKE} />
          <rect x="34" y="45" width="5" height="4" fill={STROKE} />
          <rect x="39" y="49" width="5" height="4" fill={STROKE} />
          <rect x="44" y="45" width="5" height="4" fill={STROKE} />
          <rect x="49" y="49" width="5" height="4" fill={STROKE} />
          {/* Headlight & taillight */}
          <circle cx="66" cy="46" r="2.4" fill="#FEF9C3" stroke={STROKE} strokeWidth="1.5" />
          <circle cx="14" cy="46" r="2.2" fill="#EF4444" stroke={STROKE} strokeWidth="1.5" />
          {/* Wheels */}
          <circle cx="24" cy="57" r="7" fill="#334155" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="24" cy="57" r="2.6" fill="#E2E8F0" />
          <circle cx="56" cy="57" r="7" fill="#334155" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="56" cy="57" r="2.6" fill="#E2E8F0" />
        </svg>
      );

    case 'cake':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Plate */}
          <ellipse cx="40" cy="64" rx="28" ry="6" fill="#F1F5F9" stroke={STROKE} strokeWidth="2.2" />
          {/* Sponge cake base */}
          <rect x="18" y="37" width="44" height="24" rx="5" fill="#FDE68A" stroke={STROKE} strokeWidth="2.3" />
          {/* Strawberry jam filling */}
          <rect x="18" y="48" width="44" height="5" fill="#FB7185" stroke={STROKE} strokeWidth="1.8" />
          {/* Cream frosting */}
          <path
            d="M17 37C17 34 20 32 24 32H56C60 32 63 34 63 37C63 40 60 43 57 43C54 43 53 39 50 39C47 39 46 44 43 44C40 44 39 39 36 39C33 39 32 44 29 44C26 44 25 40 22 40C19 40 17 39 17 37Z"
            fill="#FFFFFF"
            stroke={STROKE}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Top strawberry */}
          <path
            d="M40 15C45 15 48 19 47 25C46 29 43 32 40 32C37 32 34 29 33 25C32 19 35 15 40 15Z"
            fill="#E11D48"
            stroke={STROKE}
            strokeWidth="2.2"
          />
          <path d="M35 16L40 19L45 16L42 13H38L35 16Z" fill="#16A34A" stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="38" cy="22" r="0.9" fill="#FFE4E6" />
          <circle cx="42" cy="24" r="0.9" fill="#FFE4E6" />
          <circle cx="39" cy="27" r="0.9" fill="#FFE4E6" />
        </svg>
      );

    case 'donut':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Dough ring */}
          <circle cx="40" cy="42" r="25" fill="#E8B87D" stroke={STROKE} strokeWidth="2.4" />
          {/* Pink strawberry glaze */}
          <path
            d="M40 17C53.8 17 65 28.2 65 42C65 45 62 47 59 45C56 43 54 48 50 47C46 46 44 42 40 42C36 42 33 47 29 46C25 45 24 41 21 43C18 45 15 44 15 42C15 28.2 26.2 17 40 17Z"
            fill="#F472B6"
            stroke={STROKE}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Center hole */}
          <circle cx="40" cy="42" r="8.5" fill="#FFFDF9" stroke={STROKE} strokeWidth="2.4" />
          {/* Sprinkles */}
          <path d="M27 28L31 25" stroke="#FEF08A" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M48 24L53 26" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M36 22L41 23" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M55 34L58 38" stroke="#FEF08A" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M21 36L25 38" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );

    case 'macaron':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Bottom shell */}
          <path
            d="M17 51C17 58 27 62 40 62C53 62 63 58 63 51C63 48 61 46 58 46H22C19 46 17 48 17 51Z"
            fill="#A78BFA"
            stroke={STROKE}
            strokeWidth="2.3"
          />
          {/* Cream filling */}
          <rect x="16" y="38" width="48" height="9" rx="4.5" fill="#FFFBEB" stroke={STROKE} strokeWidth="2.2" />
          {/* Top shell */}
          <path
            d="M17 34C17 22 27 17 40 17C53 17 63 22 63 34C63 37 61 39 58 39H22C19 39 17 37 17 34Z"
            fill="#C4B5FD"
            stroke={STROKE}
            strokeWidth="2.3"
          />
          {/* Shell ruffle dots */}
          <path d="M21 38H59" stroke="#7C3AED" strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
          <path d="M21 47H59" stroke="#7C3AED" strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
          {/* Highlight */}
          <path d="M27 25C31 22 36 21 41 21" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'pudding':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Plate */}
          <ellipse cx="40" cy="63" rx="28" ry="6" fill="#F1F5F9" stroke={STROKE} strokeWidth="2.2" />
          {/* Custard body */}
          <path
            d="M24 25C25 21 31 19 40 19C49 19 55 21 56 25L62 56C63 59 53 62 40 62C27 62 17 59 18 56L24 25Z"
            fill="#FDE047"
            stroke={STROKE}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Caramel crown & drips */}
          <path
            d="M24 25C25 21 31 19 40 19C49 19 55 21 56 25L57 31C54 34 51 31 48 34C45 37 43 32 40 34C37 36 35 31 31 33C28 35 25 32 23 30L24 25Z"
            fill="#92400E"
            stroke={STROKE}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Whipped cream & cherry */}
          <circle cx="40" cy="18" r="5" fill="#FFFFFF" stroke={STROKE} strokeWidth="1.8" />
          <circle cx="40" cy="14" r="3.5" fill="#E11D48" stroke={STROKE} strokeWidth="1.6" />
          {/* Gloss */}
          <path d="M27 40L25 51" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
      );

    case 'rabbit':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Long ears */}
          <ellipse cx="30" cy="23" rx="6" ry="15" transform="rotate(-10 30 23)" fill="#FFFFFF" stroke={STROKE} strokeWidth="2.3" />
          <ellipse cx="50" cy="23" rx="6" ry="15" transform="rotate(10 50 23)" fill="#FFFFFF" stroke={STROKE} strokeWidth="2.3" />
          <ellipse cx="30" cy="24" rx="2.8" ry="10" transform="rotate(-10 30 24)" fill="#FBCFE8" />
          <ellipse cx="50" cy="24" rx="2.8" ry="10" transform="rotate(10 50 24)" fill="#FBCFE8" />
          {/* Head */}
          <ellipse cx="40" cy="49" rx="22" ry="18" fill="#FFFFFF" stroke={STROKE} strokeWidth="2.4" />
          {/* Rosy cheeks */}
          <ellipse cx="25" cy="52" rx="4" ry="2.4" fill="#FDA4AF" />
          <ellipse cx="55" cy="52" rx="4" ry="2.4" fill="#FDA4AF" />
          {/* Eyes */}
          <circle cx="31" cy="46" r="2.8" fill={STROKE} />
          <circle cx="49" cy="46" r="2.8" fill={STROKE} />
          <circle cx="30.2" cy="45.2" r="0.9" fill="#FFFFFF" />
          <circle cx="48.2" cy="45.2" r="0.9" fill="#FFFFFF" />
          {/* Pink nose & smile */}
          <ellipse cx="40" cy="51" rx="3" ry="2.2" fill="#F472B6" stroke={STROKE} strokeWidth="1.4" />
          <path d="M36 55C38 57.5 40 56 40 53.5C40 56 42 57.5 44 55" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'truck':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Cargo box */}
          <rect x="11" y="23" width="38" height="31" rx="3.5" fill="#22C55E" stroke={STROKE} strokeWidth="2.3" />
          <path d="M16 32H44" stroke="#BBF7D0" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M16 39H36" stroke="#BBF7D0" strokeWidth="2.5" strokeLinecap="round" />
          {/* Cab */}
          <path
            d="M49 32H61C64 32 68 38 69 43V54H49V32Z"
            fill="#F8FAFC"
            stroke={STROKE}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Cab window */}
          <path d="M53 36H61L65 44H53V36Z" fill="#BAE6FD" stroke={STROKE} strokeWidth="1.8" strokeLinejoin="round" />
          {/* Chassis */}
          <rect x="10" y="52" width="60" height="5" rx="2" fill="#475569" stroke={STROKE} strokeWidth="1.8" />
          {/* Wheels */}
          <circle cx="24" cy="58" r="6.8" fill="#334155" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="24" cy="58" r="2.5" fill="#E2E8F0" />
          <circle cx="58" cy="58" r="6.8" fill="#334155" stroke={STROKE} strokeWidth="2.2" />
          <circle cx="58" cy="58" r="2.5" fill="#E2E8F0" />
        </svg>
      );

    case 'croissant':
      return (
        <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
          {/* Outer crescent wings */}
          <path
            d="M12 49C10 39 18 28 29 25C33 24 47 24 51 25C62 28 70 39 68 49C66 56 59 57 54 53C50 50 46 47 40 47C34 47 30 50 26 53C21 57 14 56 12 49Z"
            fill="#F59E0B"
            stroke={STROKE}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Layered golden folds */}
          <path
            d="M27 25C25 32 25 41 28 51"
            stroke={STROKE}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M53 25C55 32 55 41 52 51"
            stroke={STROKE}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M35 24C34 31 35 40 37 47"
            stroke={STROKE}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M45 24C46 31 45 40 43 47"
            stroke={STROKE}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Butter highlight */}
          <path d="M36 30C39 29 41 29 44 30" stroke="#FEF3C7" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
  }
};
