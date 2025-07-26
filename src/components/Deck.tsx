// src/components/Deck.tsx
import { useRef, useCallback, useEffect } from 'react';

interface DeckProps {
  cardCount: number;
  deckType: 'draw' | 'discard';
  onHover: () => void;
  onLeave: () => void;
  isShuffling?: boolean;
}

export default function Deck({
  cardCount,
  deckType,
  onHover,
  onLeave,
  isShuffling = false
}: DeckProps) {
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      onHover();
    }, 300); // Delay to prevent flickering
  }, [onHover]); // Remove changing dependencies

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    onLeave();
  }, [onLeave]); // Remove changing dependencies

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`
        w-16 h-24 bg-blue-900 border-2 border-gray-800 rounded-lg shadow-lg 
        transform group-hover:scale-105 transition-all duration-200
        ${isShuffling ? 'animate-pulse' : ''}
      `}>
        <div className="w-full h-full bg-gradient-to-br from-blue-800 to-blue-900 rounded-md flex items-center justify-center">
          <div className="text-white text-xs font-bold opacity-50">
            {deckType === 'draw' ? 'DRAW' : 'DISCARD'}
          </div>
        </div>
      </div>

      {/* Card count badge */}
      <div className="absolute -bottom-1 -left-1 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
        {cardCount}
      </div>

      {/* Shuffle animation overlay */}
      {isShuffling && (
        <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg animate-ping" />
      )}
    </div>
  );
}