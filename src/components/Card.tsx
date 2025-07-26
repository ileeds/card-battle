// src/components/Card.tsx
import { Card as CardType, ShopCard } from '@/types/game';

interface CardProps {
  card: CardType | ShopCard;
  isShopCard?: boolean;
  canPurchase?: boolean;
  onPurchase?: () => void;
  isAnimating?: boolean;
  animationType?: string;
  className?: string;
}

export default function Card({
  card,
  isShopCard = false,
  canPurchase = false,
  onPurchase,
  isAnimating = false,
  animationType = '',
  className = ''
}: CardProps) {
  const shopCard = card as ShopCard;
  const isFlipped = className.includes('bg-blue-900'); // Check if this is the flipped state

  return (
    <div className={`
      ${isFlipped ? 'bg-blue-900 border-blue-700' : 'bg-white border-gray-800'} 
      border-2 rounded-lg p-4 shadow-lg
      ${isShopCard ? 'w-24 h-32' : 'w-16 h-24'}
      flex flex-col items-center justify-center
      ${canPurchase ? 'cursor-pointer hover:bg-gray-100 hover:shadow-xl' : ''}
      ${isShopCard && !canPurchase ? 'opacity-50' : ''}
      ${isAnimating ? 'transition-all duration-500 ease-in-out' : ''}
      ${animationType === 'play' ? 'transform translate-y-[-20px] scale-110 opacity-75' : ''}
      ${animationType === 'discard' ? 'transform translate-x-[100px] scale-90 opacity-50' : ''}
      ${className}
    `}
      onClick={canPurchase ? onPurchase : undefined}
    >
      {isFlipped ? (
        <div className="text-white text-xs font-bold opacity-50">
          CARD
        </div>
      ) : (
        <>
          <div className={`
            font-bold text-center text-gray-800
            ${isShopCard ? 'text-2xl' : 'text-lg'}
          `}>
            {card.value}
          </div>

          {isShopCard && (
            <div className="mt-2 text-xs text-gray-700 text-center">
              Cost: {shopCard.cost}
            </div>
          )}
        </>
      )}
    </div>
  );
}