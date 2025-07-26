// src/types/game.ts
export interface Card {
  id: string;
  value: number;
  order: number;
}

export interface ShopCard extends Card {
  cost: number;
}

export interface Player {
  id: string;
  name: string;
  deck: Card[];
  discardPile: Card[];
  score: number;
  connected: boolean;
}

export interface GameState {
  players: Player[];
  shopCards: ShopCard[];
  gameStarted: boolean;
  gameEnded: boolean;
  timeRemaining: number;
  winner: string | null;
}

export interface GameEvents {
  'player-join': (playerName: string) => void;
  'start-game': () => void;
  'buy-card': (cardId: string) => void;
  'game-state': (state: GameState) => void;
  'game-started': () => void;
  'game-ended': (winner: string) => void;
  'card-played': (playerId: string, card: Card) => void;
  'card-purchased': (playerId: string, cardId: string) => void;
  'error': (message: string) => void;
  'waiting-for-players': () => void;
  'game-full': () => void;
}