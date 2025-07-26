// src/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/types/game';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [gameFull, setGameFull] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    fetch('/api/socket').finally(() => {
      const socketInstance = io();

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('game-state', (state: GameState) => {
        setGameState(state);
      });

      socketInstance.on('waiting-for-players', () => {
        setWaitingForPlayers(true);
      });

      socketInstance.on('game-full', () => {
        setGameFull(true);
      });

      socketInstance.on('error', (message: string) => {
        setError(message);
      });

      socketInstance.on('game-started', () => {
        setWaitingForPlayers(false);
      });

      socketInstance.on('game-ended', () => {
        // Game ended, state will be updated via game-state event
      });

      setSocket(socketInstance);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const joinGame = (playerName: string) => {
    if (socket) {
      socket.emit('player-join', playerName);
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('start-game');
    }
  };

  const buyCard = (cardId: string) => {
    if (socket) {
      socket.emit('buy-card', cardId);
    }
  };

  return {
    socket,
    gameState,
    isConnected,
    waitingForPlayers,
    gameFull,
    error,
    joinGame,
    startGame,
    buyCard,
    clearError: () => setError(null)
  };
}