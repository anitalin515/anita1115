import React from 'react';
import { CardInstance } from '../data/cards';
import { CardBackPattern, CardIllustration } from './CardIllustration';

interface MemoryCardProps {
  card: CardInstance;
  size?: 'normal' | 'compact' | 'dense';
  shufflePulse?: boolean;
  onSelect: (uid: string) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = React.memo(
  ({ card, size = 'normal', shufflePulse = false, onSelect }) => {
    const { design, isFlipped, isMatched, isClearing, isMismatch, isHinted } = card;

    // Matched cards disappear ("消除") while preserving their grid slot footprint
    // so remaining cards stay anchored in spatial memory.
    if (isMatched) {
      return (
        <div
          key="matched-slot"
          aria-hidden="true"
          className="w-full h-full min-h-[44px] min-w-[44px] rounded-xl border border-dashed border-emerald-200/15 bg-black/10 transition-opacity duration-200"
        />
      );
    }

    const isInteractive = !isFlipped && !isClearing;

    const paddingClass =
      size === 'dense'
        ? 'px-1 py-1 sm:px-1.5 sm:py-1.5'
        : size === 'compact'
          ? 'px-1.5 py-1.5 sm:px-2 sm:py-2'
          : 'px-2 py-2 sm:px-3 sm:py-2.5';

    const illustrationClass =
      size === 'dense'
        ? 'w-[74%] h-[74%] max-w-[40px] max-h-[40px] sm:max-w-[54px] sm:max-h-[54px]'
        : size === 'compact'
          ? 'w-[72%] h-[72%] max-w-[50px] max-h-[50px] sm:max-w-[64px] sm:max-h-[64px]'
          : 'w-[74%] h-[74%] max-w-[68px] max-h-[68px] sm:max-w-[84px] sm:max-h-[84px]';

    const labelClass =
      size === 'dense'
        ? 'text-[10px] sm:text-xs leading-tight'
        : size === 'compact'
          ? 'text-xs sm:text-sm leading-tight'
          : 'text-sm sm:text-base leading-tight';

    const catClass =
      size === 'dense'
        ? 'text-[9px] sm:text-[10px] leading-none'
        : size === 'compact'
          ? 'text-[10px] sm:text-xs leading-none'
          : 'text-[11px] sm:text-xs leading-none';

    return (
      <button
        key="active-card"
        type="button"
        onClick={() => onSelect(card.uid)}
        disabled={!isInteractive}
        aria-label={
          isFlipped
            ? `已翻開：${design.name}（${design.categoryLabel}）`
            : isHinted
              ? '配對提示位置卡牌'
              : '未翻開的卡牌'
        }
        className={`card-perspective group relative w-full h-full min-h-[44px] min-w-[44px] rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10332C] ${
          isInteractive ? 'cursor-pointer' : 'cursor-default'
        } ${isClearing ? 'animate-match-clear pointer-events-none' : ''} ${
          isMismatch ? 'animate-mismatch' : ''
        } ${shufflePulse ? 'animate-wind-flutter' : ''}`}
      >
        <div
          className={`card-inner rounded-xl ${isFlipped ? 'is-flipped' : ''} ${
            isInteractive ? 'group-hover:-translate-y-0.5 group-active:scale-[0.97]' : ''
          }`}
        >
          {/* Card Back (Face Down) */}
          <div
            className={`card-face rounded-xl p-1 sm:p-1.5 flex items-center justify-center overflow-hidden transition-shadow duration-200 ${
              isHinted
                ? 'bg-amber-50 ring-2 ring-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                : 'bg-[#FBF7EE] ring-1 ring-amber-900/15 shadow-[0_4px_12px_rgba(5,20,16,0.38)]'
            }`}
          >
            <CardBackPattern className="w-full h-full" />
            {isHinted && (
              <span
                className={`absolute inset-x-1 bottom-1 py-0.5 rounded-md bg-amber-400 text-[#231912] font-extrabold text-center shadow-sm whitespace-nowrap ${
                  size === 'dense' ? 'text-[9px]' : 'text-[10px] sm:text-xs'
                }`}
              >
                配對提示
              </span>
            )}
          </div>

          {/* Card Front (Face Up) */}
          <div
            className={`card-face card-face-front rounded-xl bg-[#FFFDF9] flex flex-col items-center justify-between overflow-hidden shadow-[0_6px_16px_rgba(5,20,16,0.42)] transition-shadow duration-150 ${paddingClass} ${
              isClearing
                ? 'ring-2 ring-emerald-500'
                : isMismatch
                  ? 'ring-2 ring-rose-500'
                  : isHinted
                    ? 'ring-2 ring-amber-300'
                    : 'ring-1 ring-stone-900/10'
            }`}
          >
            {/* Quiet category header (unboxed, no pill) */}
            <div className="w-full flex items-center justify-between gap-1 shrink-0">
              <span
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-xs shrink-0"
                style={{ backgroundColor: design.accentColor }}
                aria-hidden="true"
              />
              <span
                className={`font-semibold tracking-tight text-stone-500 whitespace-nowrap ${catClass}`}
              >
                {design.categoryLabel}
              </span>
            </div>

            {/* Custom SVG Illustration */}
            <div
              className="flex-1 min-h-0 w-full flex items-center justify-center rounded-lg my-0.5"
              style={{ backgroundColor: design.surfaceTint }}
            >
              <CardIllustration id={design.id} className={illustrationClass} />
            </div>

            {/* Card Name */}
            <span
              className={`font-bold text-[#2B1F18] tracking-tight whitespace-nowrap truncate max-w-full shrink-0 ${labelClass}`}
            >
              {design.name}
            </span>
          </div>
        </div>
      </button>
    );
  }
);

MemoryCard.displayName = 'MemoryCard';
