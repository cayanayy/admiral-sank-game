import React from 'react';
import { LoginScreen } from './LoginScreen';
import { LobbyScreen } from './LobbyScreen';
import { GameBoard } from './GameBoard';
import { useGameStore } from '../store/gameStore';

export const GameScreen: React.FC = () => {
  const { username, gameState } = useGameStore();

  if (!username) {
    return <LoginScreen />;
  }

  if (!gameState) {
    return <LobbyScreen />;
  }

  return <GameBoard />;
}; 