// src/components/GameBoard.tsx
"use client"

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import Card from './Card';
import PlayArea from './PlayArea';
import AnimatedScore from './AnimatedScore';
import CardModal from './CardModal';
import { Card as CardType } from '@/types/game';

export default function GameBoard() {
  const {
    socket,
    gameState,
    isConnected,
    waitingForPlayers,
    gameFull,
    error,
    joinGame,
    startGame,
    buyCard,
    clearError
  } = useSocket();

  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCards, setModalCards] = useState<CardType[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [currentPlayedCard, setCurrentPlayedCard] = useState<CardType | null>(null);
  const [opponentPlayedCard, setOpponentPlayedCard] = useState<CardType | null>(null);
  const [shuffleAnimation, setShuffleAnimation] = useState({
    player: null as string | null,
    deck: null as string | null,
    prevDrawCount: 0
  });
  const [isMounted, setIsMounted] = useState(false);

  // Ref to track modal state without causing re-renders
  const modalStateRef = useRef({ open: false, playerId: null as string | null, deckType: null as 'draw' | 'discard' | null });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentPlayer = gameState?.players.find(p => p.id === socket?.id);
  const opponent = gameState?.players.find(p => p.id !== socket?.id);

  const handleJoinGame = () => {
    if (playerName.trim()) {
      joinGame(playerName.trim());
      setHasJoined(true);
    }
  };

  const handleBuyCard = (cardId: string) => {
    buyCard(cardId);
  };

  const canPurchaseCard = (cost: number) => {
    return currentPlayer && currentPlayer.score >= cost && gameState?.gameStarted;
  };

  // Stable callback that doesn't change on every render
  const handleDeckHover = useCallback((deckType: 'draw' | 'discard', player: any) => {
    modalStateRef.current = { open: true, playerId: player.id, deckType };

    setModalTitle(`${player.name}'s Cards`);
    setModalOpen(true);
    // Cards will be set by useEffect with fresh gameState data
  }, []); // No dependencies - this callback never changes

  const modalCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleModalClose = useCallback(() => {
    modalStateRef.current = { open: false, playerId: null, deckType: null };
    setModalOpen(false);
  }, []);

  const handleDelayedModalClose = useCallback(() => {
    // Clear any existing timeout
    if (modalCloseTimeoutRef.current) {
      clearTimeout(modalCloseTimeoutRef.current);
    }

    // Set a delay before closing
    modalCloseTimeoutRef.current = setTimeout(() => {
      handleModalClose();
    }, 150); // 150ms grace period
  }, [handleModalClose]);

  const cancelModalClose = useCallback(() => {
    if (modalCloseTimeoutRef.current) {
      clearTimeout(modalCloseTimeoutRef.current);
      modalCloseTimeoutRef.current = null;
    }
  }, []);

  // Create stable callbacks for each deck to prevent re-renders
  const handlePlayerDrawHover = useCallback(() => {
    if (currentPlayer) {
      handleDeckHover('draw', currentPlayer);
    }
  }, [handleDeckHover, currentPlayer?.id]); // Only depend on player ID, not full player object

  const handlePlayerDiscardHover = useCallback(() => {
    if (currentPlayer) {
      handleDeckHover('discard', currentPlayer);
    }
  }, [handleDeckHover, currentPlayer?.id]);

  const handleOpponentDrawHover = useCallback(() => {
    if (opponent) {
      handleDeckHover('draw', opponent);
    }
  }, [handleDeckHover, opponent?.id]);

  const handleOpponentDiscardHover = useCallback(() => {
    if (opponent) {
      handleDeckHover('discard', opponent);
    }
  }, [handleDeckHover, opponent?.id]);

  // Update modal content when modal opens or game state changes
  useEffect(() => {
    if (modalStateRef.current.open && modalStateRef.current.playerId && modalStateRef.current.deckType && gameState) {
      const player = gameState.players.find(p => p.id === modalStateRef.current.playerId);
      if (player) {
        const allCards = [...(player.deck || []), ...(player.discardPile || [])].sort((a, b) => a.order - b.order);

        setModalCards(allCards);
      }
    }
  }, [gameState, modalOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (modalCloseTimeoutRef.current) {
        clearTimeout(modalCloseTimeoutRef.current);
      }
    };
  }, []);

  // Detect deck changes for shuffle animation
  useEffect(() => {
    if (gameState && currentPlayer) {
      const currentDrawCount = currentPlayer.deck?.length || 0;
      const currentDiscardCount = currentPlayer.discardPile?.length || 0;
      const prevDrawCount = shuffleAnimation.prevDrawCount;

      // Detect shuffle: draw pile was empty, now has cards, discard is empty
      if (prevDrawCount === 0 && currentDrawCount > 0 && currentDiscardCount === 0) {
        setShuffleAnimation({
          player: currentPlayer.id,
          deck: 'draw',
          prevDrawCount: currentDrawCount
        });
        setTimeout(() => {
          setShuffleAnimation(prev => ({ ...prev, player: null, deck: null }));
        }, 1000);
      } else {
        setShuffleAnimation(prev => ({ ...prev, prevDrawCount: currentDrawCount }));
      }
    }
  }, [gameState, currentPlayer]);

  // Listen for card-played events to trigger animations
  useEffect(() => {
    if (!socket) return;

    const handleCardPlayed = (playerId: string, card: CardType) => {
      if (playerId === socket.id) {
        // Current player played a card - always update
        setCurrentPlayedCard(null); // Clear first to ensure re-render
        setTimeout(() => setCurrentPlayedCard(card), 10);
      } else {
        // Opponent played a card - always update  
        setOpponentPlayedCard(null); // Clear first to ensure re-render
        setTimeout(() => setOpponentPlayedCard(card), 10);
      }
    };

    socket.on('card-played', handleCardPlayed);

    return () => {
      socket.off('card-played', handleCardPlayed);
    };
  }, [socket]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Prevent hydration errors by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-white">Connecting to game server...</div>
      </div>
    );
  }

  if (gameFull) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Game Full</h2>
          <p className="text-lg text-white">A game is currently in progress. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8 text-white">Card Battle Game</h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-white bg-gray-800 placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            />
            <br />
            <button
              onClick={handleJoinGame}
              disabled={!playerName.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (waitingForPlayers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Waiting for another player...</h2>
          <div className="animate-pulse text-lg text-white">Looking for opponent...</div>
        </div>
      </div>
    );
  }

  if (gameState?.gameEnded) {
    const isWinner = gameState.winner === socket?.id;
    const isTie = gameState.winner === null;

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {isTie ? (
            <h2 className="text-3xl font-bold mb-4 text-yellow-500">It's a Tie!</h2>
          ) : isWinner ? (
            <h2 className="text-3xl font-bold mb-4 text-green-500">Victory!</h2>
          ) : (
            <h2 className="text-3xl font-bold mb-4 text-red-500">Defeat!</h2>
          )}

          <div className="text-xl mb-4 text-white">
            Final Scores:
          </div>

          <div className="space-y-2 mb-6">
            {gameState.players.map(player => (
              <div key={player.id} className={`
                text-white
                ${player.id === socket?.id ? 'font-bold' : ''}
              `}>
                {player.name}: {player.score} points
              </div>
            ))}
          </div>

          <p className="text-gray-300">Game will reset automatically...</p>
        </div>
      </div>
    );
  }

  if (!gameState?.gameStarted && gameState?.players.length === 2) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Ready to Start!</h2>
          <p className="mb-4 text-white">Both players are ready. Click start to begin the battle!</p>
          <button
            onClick={startGame}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (!gameState?.gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-white">Please refresh the page</div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen p-4 bg-gray-100 relative transition-all duration-200 ${modalOpen ? 'overflow-hidden brightness-50' : ''}`}>
        {/* Error Message */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50 animate-bounce">
            {error}
          </div>
        )}

        {/* Timer and Game Info */}
        <div className="text-center mb-6">
          <div className={`
          text-3xl font-bold mb-2 transition-colors duration-500
          ${gameState.timeRemaining <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800'}
        `}>
            Time: {gameState.timeRemaining}s
          </div>
        </div>

        {/* Opponent Section */}
        {opponent && (
          <div className="text-center mb-8">
            <AnimatedScore
              score={opponent.score || 0}
              playerName={opponent.name || 'Opponent'}
            />

            <PlayArea
              player={opponent}
              isCurrentPlayer={false}
              onDrawHover={handleOpponentDrawHover}
              onDiscardHover={handleOpponentDiscardHover}
              onModalClose={handleDelayedModalClose}
              playedCard={opponentPlayedCard}
              isShuffling={shuffleAnimation.player === opponent.id && shuffleAnimation.deck === 'draw'}
            />
          </div>
        )}

        {/* Shop Cards */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-center mb-4 text-black">Shop</h3>
            <div className="flex gap-4">
              {gameState.shopCards.map(card => (
                <Card
                  key={card.id}
                  card={card}
                  isShopCard={true}
                  canPurchase={canPurchaseCard(card.cost)}
                  onPurchase={() => handleBuyCard(card.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Current Player Section */}
        {currentPlayer && (
          <div className="text-center">
            <AnimatedScore
              score={currentPlayer.score || 0}
              playerName={currentPlayer.name || 'You'}
              isCurrentPlayer={true}
            />

            <PlayArea
              player={currentPlayer}
              isCurrentPlayer={true}
              onDrawHover={handlePlayerDrawHover}
              onDiscardHover={handlePlayerDiscardHover}
              onModalClose={handleDelayedModalClose}
              playedCard={currentPlayedCard}
              isShuffling={shuffleAnimation.player === currentPlayer.id && shuffleAnimation.deck === 'draw'}
            />
          </div>
        )}

      </div>

      {/* Card Modal - outside dimmed container */}
      <CardModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onCancelClose={cancelModalClose}
        cards={modalCards}
        title={modalTitle}
      />
    </>
  );
}