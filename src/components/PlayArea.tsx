// src/components/PlayArea.tsx
import { useState, useEffect } from 'react';
import Card from './Card';
import Deck from './Deck';
import { Card as CardType, Player } from '@/types/game';

interface PlayAreaProps {
  player: Player;
  isCurrentPlayer?: boolean;
  onDrawHover: () => void;
  onDiscardHover: () => void;
  onModalClose: () => void;
  playedCard?: CardType | null;
  isShuffling?: boolean;
}

export default function PlayArea({
  player,
  isCurrentPlayer = false,
  onDrawHover,
  onDiscardHover,
  onModalClose,
  playedCard,
  isShuffling = false
}: PlayAreaProps) {
  const [animatingCard, setAnimatingCard] = useState<CardType | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden');

  useEffect(() => {
    if (playedCard) {
      // Always start new animation, even if one is in progress
      setAnimatingCard(playedCard);
      setAnimationPhase('entering');

      // Smooth animation sequence with proper timing
      const enterTimer = setTimeout(() => setAnimationPhase('visible'), 50);
      const exitTimer = setTimeout(() => setAnimationPhase('exiting'), 400);
      const hideTimer = setTimeout(() => {
        setAnimatingCard(null);
        setAnimationPhase('hidden');
      }, 800);

      return () => {
        clearTimeout(enterTimer);
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [playedCard]);

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'hidden':
        return 'opacity-0 scale-75 -translate-x-24';
      case 'entering':
        return 'opacity-60 scale-90 -translate-x-12 transition-all duration-300 ease-out';
      case 'visible':
        return 'opacity-100 scale-100 translate-x-0 transition-all duration-200 ease-in-out';
      case 'exiting':
        return 'opacity-60 scale-75 translate-x-24 transition-all duration-400 ease-in';
      default:
        return 'opacity-0 scale-75 -translate-x-24';
    }
  };

  return (
    <div className="flex justify-center items-center gap-8 mb-4 relative">
      {/* Draw Pile */}
      <Deck
        cardCount={player.deck?.length || 0}
        deckType="draw"
        onHover={onDrawHover}
        onLeave={onModalClose}
        isShuffling={isShuffling}
      />

      {/* Play Area */}
      <div className="w-32 h-24 flex items-center justify-center relative">
        {/* Background play area */}
        <div className="w-20 h-28 border-2 border-dashed border-gray-400 rounded-lg bg-gray-50 flex items-center justify-center">
          <div className="text-gray-400 text-xs text-center" />
        </div>

        {/* Animated card */}
        {animatingCard && (
          <div className={`absolute ${getAnimationClasses()}`}>
            <Card
              card={animatingCard}
              className={animationPhase === 'exiting' ? 'bg-blue-900 text-white' : ''}
            />
          </div>
        )}
      </div>

      {/* Discard Pile */}
      <Deck
        cardCount={player.discardPile?.length || 0}
        deckType="discard"
        onHover={onDiscardHover}
        onLeave={onModalClose}
      />
    </div>
  );
}