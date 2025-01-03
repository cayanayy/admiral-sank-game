import { create } from 'zustand'
import { SHIPS } from '../constants/gameConstants'

interface Cell {
  isShip: boolean
  isHit: boolean
  shipId?: number
}

interface GameState {
  player1Board: Cell[][]
  player2Board: Cell[][]
  currentTurn: 'player1' | 'player2'
  isPlacingShips: boolean
  gameStarted: boolean
  gameEnded?: boolean
  winner?: 'player1' | 'player2'
}

interface LobbyState {
  users: string[]
  games: {
    id: string
    player1: string | null
    player2: string | null
    status: 'waiting' | 'in_progress'
  }[]
}

interface GameStore {
  // Connection state
  ws: WebSocket | null
  isConnected: boolean
  username: string | null
  playerId: 'player1' | 'player2' | null
  gameId: string | null
  opponent: string | null
  
  // Lobby state
  lobbyState: LobbyState
  
  // Game state
  gameState: GameState | null
  
  // Actions
  connect: (username: string) => void
  createGame: () => void
  joinGame: (gameId: string) => void
  placeShip: (board: Cell[][]) => void
  makeMove: (board: Cell[][]) => void
  disconnect: () => void
  restartGame: () => void
}

// Get WebSocket URL from environment variable
const WS_URL = import.meta.env.VITE_BACKEND_URL;
// Fallback URL if environment variable is not set
const FALLBACK_URL = `ws://${window.location.hostname}:3001/ws`;
// Use environment variable if available, otherwise use fallback
const SERVER_URL = WS_URL || FALLBACK_URL;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  ws: null,
  isConnected: false,
  username: null,
  playerId: null,
  gameId: null,
  opponent: null,
  lobbyState: { users: [], games: [] },
  gameState: null,

  // Actions
  connect: (username: string) => {
    const ws = new WebSocket(SERVER_URL)

    ws.onopen = () => {
      set({ ws, isConnected: true })
      ws.send(JSON.stringify({ type: 'login', username }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'login_success':
          set({ username: data.username })
          break

        case 'lobby_update':
          set({ lobbyState: data })
          break

        case 'joined':
          set({ 
            playerId: data.playerId,
            gameId: data.gameId,
            opponent: data.opponent,
            gameState: data.gameState
          })
          break

        case 'player_joined':
          set({ 
            opponent: data.opponent,
            gameState: data.gameState
          })
          break

        case 'game_update':
          set({ gameState: data.gameState })
          break

        case 'game_ended':
          const state = get()
          if (state.gameState && state.playerId) {
            set({
              gameState: {
                ...state.gameState,
                gameEnded: true,
                winner: data.winner === state.username ? state.playerId : (state.playerId === 'player1' ? 'player2' : 'player1')
              }
            })
          }
          break

        case 'opponent_disconnected':
          set({ 
            opponent: null,
            gameState: null,
            gameId: null,
            playerId: null
          })
          break

        case 'game_restarted':
          set(state => ({
            ...state,
            gameState: {
              ...state.gameState!,
              isPlacingShips: true,
              gameStarted: false,
              gameEnded: false,
              winner: undefined
            }
          }));
          break;
      }
    }

    ws.onclose = () => {
      set({ 
        ws: null,
        isConnected: false,
        username: null,
        playerId: null,
        gameId: null,
        opponent: null,
        gameState: null
      })
    }
  },

  createGame: () => {
    const { ws, username } = get()
    if (ws && username) {
      const gameId = Math.random().toString(36).substring(7)
      ws.send(JSON.stringify({ 
        type: 'join_game',
        gameId,
        username
      }))
    }
  },

  joinGame: (gameId: string) => {
    const { ws, username } = get()
    if (ws && username) {
      ws.send(JSON.stringify({ 
        type: 'join_game',
        gameId,
        username
      }))
    }
  },

  placeShip: (newBoard: Cell[][]) => {
    const { gameState, playerId, ws } = get();
    if (!gameState || !playerId) return;

    // Update the local game state first
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

    // Update local state before sending to server
    set({ gameState: updatedState });

    // Send update to server
    if (ws) {
      ws.send(JSON.stringify({ 
        type: 'place_ship',
        board: newBoard,
        isPlacingShips: updatedState.isPlacingShips,
        gameStarted: updatedState.gameStarted
      }));
    }
  },

  makeMove: (board: Cell[][]) => {
    const { ws } = get()
    if (ws) {
      ws.send(JSON.stringify({ 
        type: 'make_move',
        board
      }))
    }
  },

  disconnect: () => {
    const { ws } = get()
    if (ws) {
      ws.close()
    }
  },

  restartGame: () => {
    const { ws } = get();
    if (ws) {
      ws.send(JSON.stringify({ type: 'restart_game' }));
    }
  }
})) 