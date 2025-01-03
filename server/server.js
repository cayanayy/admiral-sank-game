const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Configure CORS for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com'  // Replace with your frontend domain
    : true, // Allow all origins in development
  methods: ['GET', 'POST'],
  credentials: true
}));

const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  // Allow connections from any origin in development
  verifyClient: process.env.NODE_ENV !== 'production'
    ? () => true
    : undefined
});

// Store active users and game sessions
const activeUsers = new Map(); // username -> ws
const gameSessions = new Map();

// Create empty board
const createEmptyBoard = () => 
  Array(10).fill(null).map(() => 
    Array(10).fill(null).map(() => ({ 
      isShip: false, 
      isHit: false, 
      shipId: undefined 
    }))
  );

// Count ships on a board
const countShipsOnBoard = (board) => {
  const shipIds = new Set();
  board.forEach(row => {
    row.forEach(cell => {
      if (cell.shipId) {
        shipIds.add(cell.shipId);
      }
    });
  });
  return shipIds.size;
};

// Check if all ships are sunk on a board
const areAllShipsSunk = (board) => {
  for (let row of board) {
    for (let cell of row) {
      if (cell.isShip && !cell.isHit) {
        return false;
      }
    }
  }
  return true;
};

// Constants
const TOTAL_SHIPS = 5; // Total number of ships each player should place

// Broadcast lobby state to all users
const broadcastLobbyState = () => {
  const lobbyState = {
    type: 'lobby_update',
    users: Array.from(activeUsers.keys()),
    games: Array.from(gameSessions.entries()).map(([id, session]) => ({
      id,
      player1: session.player1?.username,
      player2: session.player2?.username,
      status: session.gameState.gameStarted ? 'in_progress' : 'waiting'
    }))
  };

  activeUsers.forEach((ws) => {
    ws.send(JSON.stringify(lobbyState));
  });
};

// Check if a specific ship is sunk
const isShipSunk = (board, shipId) => {
  for (let row of board) {
    for (let cell of row) {
      if (cell.shipId === shipId && !cell.isHit) {
        return false;
      }
    }
  }
  return true;
};

// Get newly sunk ships
const getNewlySunkShips = (board, oldBoard) => {
  const sunkShips = new Set();
  const shipIds = new Set();
  
  // Collect all ship IDs
  board.forEach(row => {
    row.forEach(cell => {
      if (cell.shipId) {
        shipIds.add(cell.shipId);
      }
    });
  });

  // Check which ships are newly sunk
  shipIds.forEach(shipId => {
    const wasSunkBefore = isShipSunk(oldBoard, shipId);
    const isSunkNow = isShipSunk(board, shipId);
    if (!wasSunkBefore && isSunkNow) {
      sunkShips.add(shipId);
    }
  });

  return Array.from(sunkShips);
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
  let username = null;
  let gameId = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch (data.type) {
      case 'login':
        username = data.username;
        activeUsers.set(username, ws);
        ws.send(JSON.stringify({ 
          type: 'login_success',
          username
        }));
        broadcastLobbyState();
        break;

      case 'join_game':
        // Create or join a game session
        if (!gameSessions.has(data.gameId)) {
          // Create new game session
          gameSessions.set(data.gameId, {
            player1: { ws, username: data.username },
            player2: null,
            gameState: {
              player1Board: createEmptyBoard(),
              player2Board: createEmptyBoard(),
              currentTurn: 'player1',
              isPlacingShips: true,
              gameStarted: false
            }
          });
          gameId = data.gameId;
          ws.send(JSON.stringify({ 
            type: 'joined', 
            playerId: 'player1',
            gameId: data.gameId,
            gameState: gameSessions.get(data.gameId).gameState 
          }));
        } else {
          // Join existing game session
          const session = gameSessions.get(data.gameId);
          if (!session.player2) {
            session.player2 = { ws, username: data.username };
            gameId = data.gameId;
            
            // Notify both players that game can start
            session.player1.ws.send(JSON.stringify({ 
              type: 'player_joined',
              opponent: data.username,
              gameState: session.gameState
            }));
            ws.send(JSON.stringify({ 
              type: 'joined',
              playerId: 'player2',
              gameId: data.gameId,
              opponent: session.player1.username,
              gameState: session.gameState
            }));
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
          }
        }
        broadcastLobbyState();
        break;

      case 'place_ship':
        if (gameId && gameSessions.has(gameId)) {
          const session = gameSessions.get(gameId);
          const isPlayer1 = username === session.player1.username;
          const boardKey = isPlayer1 ? 'player1Board' : 'player2Board';
          
          // Update the board with the new ship placement
          session.gameState[boardKey] = data.board;
          
          // Check if both players have placed all their ships
          const player1ShipsCount = countShipsOnBoard(session.gameState.player1Board);
          const player2ShipsCount = countShipsOnBoard(session.gameState.player2Board);

          if (player1ShipsCount === TOTAL_SHIPS && player2ShipsCount === TOTAL_SHIPS) {
            session.gameState.isPlacingShips = false;
            session.gameState.gameStarted = true;
          }

          // Notify both players
          const gameUpdate = {
            type: 'game_update',
            gameState: session.gameState
          };
          
          session.player1.ws.send(JSON.stringify(gameUpdate));
          if (session.player2) {
            session.player2.ws.send(JSON.stringify(gameUpdate));
          }
          
          broadcastLobbyState();
        }
        break;

      case 'make_move':
        if (gameId && gameSessions.has(gameId)) {
          const session = gameSessions.get(gameId);
          const isPlayer1 = username === session.player1.username;
          if (session.gameState.currentTurn === (isPlayer1 ? 'player1' : 'player2')) {
            const targetBoard = isPlayer1 ? 'player2Board' : 'player1Board';
            const oldBoard = session.gameState[targetBoard];
            session.gameState[targetBoard] = data.board;

            // Check if the move was a hit by comparing the new board with the old board
            const wasHit = data.board.some((row, x) => 
              row.some((cell, y) => 
                cell.isHit && !oldBoard[x][y].isHit && cell.isShip
              )
            );

            // Get newly sunk ships
            const newlySunkShips = getNewlySunkShips(data.board, oldBoard);

            // Check for winner
            const player1Won = areAllShipsSunk(session.gameState.player2Board);
            const player2Won = areAllShipsSunk(session.gameState.player1Board);

            if (player1Won || player2Won) {
              session.gameState.winner = player1Won ? 'player1' : 'player2';
              session.gameState.gameEnded = true;
            } else {
              // Only switch turns if it wasn't a hit
              if (!wasHit) {
                session.gameState.currentTurn = isPlayer1 ? 'player2' : 'player1';
              }
            }

            // Notify both players
            const gameUpdate = {
              type: 'game_update',
              gameState: session.gameState,
              newlySunkShips: newlySunkShips
            };
            
            session.player1.ws.send(JSON.stringify(gameUpdate));
            session.player2.ws.send(JSON.stringify(gameUpdate));

            // If game ended, send winner notification
            if (session.gameState.gameEnded) {
              const winnerUsername = session.gameState.winner === 'player1' 
                ? session.player1.username 
                : session.player2.username;

              const winnerUpdate = {
                type: 'game_ended',
                winner: winnerUsername
              };

              session.player1.ws.send(JSON.stringify(winnerUpdate));
              session.player2.ws.send(JSON.stringify(winnerUpdate));
            }
          }
        }
        break;

      case 'restart_game':
        if (gameId && gameSessions.has(gameId)) {
          const session = gameSessions.get(gameId);
          
          // Reset game state
          session.gameState = {
            player1Board: createEmptyBoard(),
            player2Board: createEmptyBoard(),
            currentTurn: 'player1',
            isPlacingShips: true,
            gameStarted: false,
            gameEnded: false,
            winner: undefined
          };

          // Notify both players
          const gameUpdate = {
            type: 'game_update',
            gameState: session.gameState
          };
          
          session.player1.ws.send(JSON.stringify(gameUpdate));
          if (session.player2) {
            session.player2.ws.send(JSON.stringify(gameUpdate));
          }
          
          // Send restart notification
          const restartUpdate = {
            type: 'game_restarted'
          };
          
          session.player1.ws.send(JSON.stringify(restartUpdate));
          if (session.player2) {
            session.player2.ws.send(JSON.stringify(restartUpdate));
          }
          
          broadcastLobbyState();
        }
        break;
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    if (username) {
      activeUsers.delete(username);
      broadcastLobbyState();
    }
    if (gameId && gameSessions.has(gameId)) {
      const session = gameSessions.get(gameId);
      const isPlayer1 = session.player1?.username === username;
      const otherPlayer = isPlayer1 ? session.player2 : session.player1;

      if (otherPlayer) {
        otherPlayer.ws.send(JSON.stringify({ type: 'opponent_disconnected' }));
      }
      gameSessions.delete(gameId);
      broadcastLobbyState();
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 