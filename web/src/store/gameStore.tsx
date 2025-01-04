import { create } from 'zustand'
import { SHIPS } from '../constants/gameConstants'

interface Cell {
  isShip: boolean;
  isHit: boolean;
  shipId?: number;
}

interface GameState {
  player1Board: Cell[][];
  player2Board: Cell[][];
  isPlacingShips: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: string;
  currentTurn: string;
}

interface GameStore {
  username: string;
  playerId: string;
  opponent: string | null;
  socket: WebSocket | null;
  gameState: GameState | null;
  placeShip: (board: Cell[][]) => void;
  makeMove: (board: Cell[][]) => void;
  disconnect: () => void;
  restartGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  username: '',
  playerId: '',
  opponent: null,
  socket: null,
  gameState: null,

  placeShip: (newBoard: Cell[][]) => {
    const { gameState, playerId, socket } = get();
    if (!gameState) return;

    const updatedState = {
      ...gameState,
      [playerId === 'player1' ? 'player1Board' : 'player2Board']: newBoard
    };

    // Count ships on both boards
    const countShipsOnBoard = (board: Cell[][]) => {
      const shipIds = new Set<number>();
      board.forEach(row => {
        row.forEach(cell => {
          if (cell.shipId) {
            shipIds.add(cell.shipId);
          }
        });
      });
      return shipIds.size;
    };

    const player1ShipsCount = countShipsOnBoard(updatedState.player1Board);
    const player2ShipsCount = countShipsOnBoard(updatedState.player2Board);

    // If both players have placed all their ships, start the game
    if (player1ShipsCount === SHIPS.length && player2ShipsCount === SHIPS.length) {
      updatedState.isPlacingShips = false;
      updatedState.gameStarted = true;
      updatedState.currentTurn = 'player1';
      console.log('Game starting:', updatedState);
    }

    set({ gameState: updatedState });
    socket?.send(JSON.stringify({ type: 'update_game_state', gameState: updatedState }));
  },

  makeMove: (board: Cell[][]) => {
    const { gameState, socket } = get();
    if (!gameState) return;
    set({ gameState: { ...gameState, currentTurn: gameState.currentTurn === 'player1' ? 'player2' : 'player1' } });
    socket?.send(JSON.stringify({ type: 'make_move', board }));
  },

  disconnect: () => {
    const { socket } = get();
    socket?.close();
    set({ socket: null, opponent: null, gameState: null });
  },

  restartGame: () => {
    const { socket } = get();
    socket?.send(JSON.stringify({ type: 'restart_game' }));
  }
})); 