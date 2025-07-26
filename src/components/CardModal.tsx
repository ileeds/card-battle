// src/components/CardModal.tsx
import { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { Card as CardType } from '@/types/game';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelClose: () => void;
  cards: CardType[];
  title: string;
}

export default function CardModal({ isOpen, onClose, onCancelClose, cards, title }: CardModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isMouseOverModal = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, title, cards.length]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        fixed inset-0 flex items-center justify-center z-50 pointer-events-none
        transition-opacity duration-200
        ${isOpen ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        className={`
          bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto
          transition-transform duration-200 pointer-events-auto shadow-2xl
          ${isOpen ? 'scale-100' : 'scale-95'}
        `}
        onClick={e => {
          e.stopPropagation();
        }}
        onMouseEnter={() => {
          isMouseOverModal.current = true;
          // Cancel any pending closure when mouse enters modal
          onCancelClose();
        }}
        onMouseLeave={() => {
          isMouseOverModal.current = false;
          // Close modal when mouse leaves modal
          onClose();
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {cards.map((card, index) => (
            <Card key={`${card.id}-${index}`} card={card} />
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No cards to display
          </div>
        )}
      </div>
    </div>
  );
}