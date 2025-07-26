// src/lib/socket-server.ts
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameState, Player, Card, ShopCard } from '@/types/game';

class GameServer {
  private io: SocketIOServer;
  private gameState: GameState;
  private gameInterval: NodeJS.Timeout | null = null;
  private gameTimer: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.gameState = {
      players: [],
      shopCards: this.generateShopCards(),
      gameStarted: false,
      gameEnded: false,
      timeRemaining: 60,
      winner: null
    };

    this.setupSocketHandlers();
  }

  private generateShopCards(): ShopCard[] {
    return Array.from({ length: 3 }, () => ({
      id: Math.random().toString(36).substring(7),
      value: Math.floor(Math.random() * 20) + 1,
      cost: Math.floor(Math.random() * 10) + 1,
      order: 0 // Shop cards don't need meaningful order
    }));
  }

  private createStartingDeck(): Card[] {
    const deck: Card[] = [];
    let order = 1;

    // Five 1s
    for (let i = 0; i < 5; i++) {
      deck.push({ id: Math.random().toString(36).substring(7), value: 1, order: order++ });
    }

    // Four 5s
    for (let i = 0; i < 4; i++) {
      deck.push({ id: Math.random().toString(36).substring(7), value: 5, order: order++ });
    }

    // One 10
    deck.push({ id: Math.random().toString(36).substring(7), value: 10, order: order++ });

    return this.shuffleDeck(deck);
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private drawCard(player: Player): Card | null {
    if (player.deck.length === 0) {
      if (player.discardPile.length === 0) {
        return null; // No cards available
      }
      // Shuffle discard pile back into deck
      player.deck = this.shuffleDeck(player.discardPile);
      player.discardPile = [];
    }

    return player.deck.pop() || null;
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Player connected:', socket.id);

      socket.on('player-join', (playerName: string) => {
        if (this.gameState.gameStarted) {
          socket.emit('game-full');
          return;
        }

        if (this.gameState.players.length >= 2) {
          socket.emit('game-full');
          return;
        }

        const player: Player = {
          id: socket.id,
          name: playerName,
          deck: this.createStartingDeck(),
          discardPile: [],
          score: 0,
          connected: true
        };

        this.gameState.players.push(player);
        socket.emit('game-state', this.gameState);

        if (this.gameState.players.length < 2) {
          socket.emit('waiting-for-players');
        }

        this.io.emit('game-state', this.gameState);
      });

      socket.on('start-game', () => {
        if (this.gameState.players.length === 2 && !this.gameState.gameStarted) {
          this.startGame();
        }
      });

      socket.on('buy-card', (cardId: string) => {
        this.handleCardPurchase(socket.id, cardId);
      });

      socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        this.gameState.players = this.gameState.players.filter(p => p.id !== socket.id);

        if (this.gameState.gameStarted && this.gameState.players.length < 2) {
          this.endGame();
        }

        this.io.emit('game-state', this.gameState);
      });
    });
  }

  private startGame() {
    this.gameState.gameStarted = true;
    this.gameState.timeRemaining = 60;
    this.io.emit('game-started');
    this.io.emit('game-state', this.gameState);

    // Game loop - play cards every second
    this.gameInterval = setInterval(() => {
      this.playCards();
    }, 1000);

    // Game timer
    this.gameTimer = setInterval(() => {
      this.gameState.timeRemaining--;

      if (this.gameState.timeRemaining <= 0) {
        this.endGame();
      }

      this.io.emit('game-state', this.gameState);
    }, 1000);
  }

  private playCards() {
    this.gameState.players.forEach(player => {
      const card = this.drawCard(player);
      if (card) {
        player.score += card.value;
        player.discardPile.push(card);
        this.io.emit('card-played', player.id, card);
      }
    });

    this.io.emit('game-state', this.gameState);
  }

  private handleCardPurchase(playerId: string, cardId: string) {
    const player = this.gameState.players.find(p => p.id === playerId);
    const shopCard = this.gameState.shopCards.find(c => c.id === cardId);

    if (!player || !shopCard || !this.gameState.gameStarted) {
      return;
    }

    if (player.score < shopCard.cost) {
      this.io.to(playerId).emit('error', 'Insufficient points');
      return;
    }

    // Deduct cost and add card to discard pile
    player.score -= shopCard.cost;
    const allCards = [...player.deck, ...player.discardPile];
    const nextOrder = allCards.length > 0 ? Math.max(...allCards.map(c => c.order)) + 1 : 1;
    player.discardPile.push({
      id: Math.random().toString(36).substring(7),
      value: shopCard.value,
      order: nextOrder
    });

    // Replace shop card
    const cardIndex = this.gameState.shopCards.findIndex(c => c.id === cardId);
    this.gameState.shopCards[cardIndex] = {
      id: Math.random().toString(36).substring(7),
      value: Math.floor(Math.random() * 20) + 1,
      cost: Math.floor(Math.random() * 10) + 1,
      order: 0 // Shop cards don't need meaningful order
    };

    this.io.emit('card-purchased', playerId, cardId);
    this.io.emit('game-state', this.gameState);
  }

  private endGame() {
    this.gameState.gameEnded = true;
    this.gameState.gameStarted = false;

    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    // Determine winner
    if (this.gameState.players.length === 2) {
      const [player1, player2] = this.gameState.players;
      if (player1.score > player2.score) {
        this.gameState.winner = player1.id;
      } else if (player2.score > player1.score) {
        this.gameState.winner = player2.id;
      } else {
        this.gameState.winner = null; // Tie
      }
    }

    this.io.emit('game-ended', this.gameState.winner);
    this.io.emit('game-state', this.gameState);

    // Reset game state after 5 seconds
    setTimeout(() => {
      this.gameState = {
        players: [],
        shopCards: this.generateShopCards(),
        gameStarted: false,
        gameEnded: false,
        timeRemaining: 60,
        winner: null
      };
      this.io.emit('game-state', this.gameState);
    }, 5000);
  }
}

let gameServer: GameServer | null = null;

export function initializeGameServer(server: HTTPServer) {
  if (!gameServer) {
    gameServer = new GameServer(server);
  }
  return gameServer;
}