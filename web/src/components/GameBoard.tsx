import React, { useEffect, useState } from 'react'
import {
  Grid,
  GridItem,
  Button,
  Text,
  HStack,
  useToast,
  Center,
  VStack,
  Heading,
  Box,
  Badge,
  useColorMode,
  IconButton,
  Flex,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { useGameStore } from '../store/gameStore'
import {
  COLS,
  ROWS,
  SHIPS,
  SHIP_DESIGNS,
  HIT_MARKER,
  MISS_MARKER
} from '../constants/gameConstants'

// Add animation keyframes
const hitAnimation = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const missAnimation = keyframes`
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
  100% { transform: scale(1) rotate(360deg); opacity: 1; }
`;

const missileAnimation = keyframes`
  0% { 
    transform: translateY(-100vh) scale(0.5);
    opacity: 0;
  }
  50% { 
    transform: translateY(-50vh) scale(1);
    opacity: 1;
  }
  90% { 
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% { 
    transform: translateY(0) scale(1.5);
    opacity: 0;
  }
`;

const explosionAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(2);
    opacity: 0.8;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
`;

interface DraggableShipProps {
  ship: typeof SHIPS[0]
  isSelected: boolean
  onDragStart: (ship: typeof SHIPS[0]) => void
  onTouchStart: (ship: typeof SHIPS[0], event: React.TouchEvent) => void
  orientation: 'horizontal' | 'vertical'
}

const DraggableShip: React.FC<DraggableShipProps> = ({ ship, isSelected, onDragStart, onTouchStart, orientation }) => {
  const design = SHIP_DESIGNS[ship.name as keyof typeof SHIP_DESIGNS];
  const isDark = useColorMode().colorMode === 'dark';

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onTouchStart(ship, e);
  };

  return (
    <Flex
      draggable
      onDragStart={() => onDragStart(ship)}
      onTouchStart={handleTouchStart}
      cursor="move"
      bg={isDark ? 'whiteAlpha.200' : 'gray.100'}
      p={2}
      borderRadius="md"
      direction={orientation === 'horizontal' ? 'row' : 'column'}
      w="fit-content"
      opacity={isSelected ? 0.5 : 1}
      _hover={{ bg: isDark ? 'whiteAlpha.300' : 'gray.200' }}
      userSelect="none"
      style={{ touchAction: 'none' }}
      alignItems="center"
      justifyContent="center"
    >
      {Array.from({ length: ship.size }).map((_, index) => (
        <Text
          key={index}
          color={design.color}
          fontSize="xl"
          mx={0.5}
        >
          {orientation === 'horizontal'
            ? (index === 0 ? design.start : index === ship.size - 1 ? design.end : design.middle)
            : (index === 0 ? design.vstart : index === ship.size - 1 ? design.vend : design.vmiddle)
          }
        </Text>
      ))}
    </Flex>
  );
};

export const GameBoard: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const [previewCells, setPreviewCells] = useState<{ x: number; y: number }[]>([])
  const [isValidPreview, setIsValidPreview] = useState(true)
  const [selectedOrientation, setSelectedOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [draggedShip, setDraggedShip] = useState<typeof SHIPS[0] | null>(null)
  const [placedShips, setPlacedShips] = useState<number[]>([])
  const [touchStartCoords, setTouchStartCoords] = useState<{ x: number, y: number } | null>(null);
  const [sunkShips, setSunkShips] = useState<number[]>([]);

  const { 
    username,
    playerId,
    opponent,
    gameState,
    gameId,
    placeShip,
    makeMove,
    disconnect,
    restartGame
  } = useGameStore()

  const toast = useToast()

  // Add logging function
  const logGameAction = (action: string, details?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(
      `%c[${timestamp}] ${action}`,
      'background: #2D3748; color: #48BB78; padding: 2px 4px; border-radius: 2px; font-weight: bold',
      details ? details : ''
    );
  };

  // // Add initial game state log
  // useEffect(() => {
  //   if (gameState) {
  //     logGameAction('Game State', {
  //       username,
  //       playerId,
  //       opponent,
  //       isPlacingShips: gameState.isPlacingShips,
  //       gameStarted: gameState.gameStarted,
  //       currentTurn: gameState.currentTurn
  //     });
  //   }
  // }, [gameState?.gameStarted, gameState?.currentTurn, opponent]);

  // Reset ship placement when game restarts
  useEffect(() => {
    if (gameState?.isPlacingShips && !gameState.gameStarted) {
      setPlacedShips([]);
      logGameAction('Game Reset', { playerId, username });
    }
  }, [gameState?.isPlacingShips, gameState?.gameStarted]);

  // Show game over notification
  useEffect(() => {
    if (gameState?.gameEnded) {
      const isWinner = gameState.winner === playerId;
      logGameAction('Game Over', { 
        winner: gameState.winner === playerId ? username : opponent,
        playerId,
        isWinner 
      });
      toast({
        title: isWinner ? 'Victory!' : 'Defeat!',
        description: isWinner 
          ? 'Congratulations! You have sunk all enemy ships!' 
          : 'Your opponent has sunk all your ships!',
        status: isWinner ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
  }, [gameState?.gameEnded]);

  // Modify hasFinishedPlacing calculation
  const hasFinishedPlacing = placedShips.length === SHIPS.length;
  
  // Check if opponent has finished placing ships
  const currentOpponentBoard = playerId === 'player1' ? gameState?.player2Board : gameState?.player1Board;
  const opponentShipsCount = currentOpponentBoard?.reduce((count, row) => 
    count + row.reduce((rowCount, cell) => cell.isShip ? rowCount + 1 : rowCount, 0), 0
  ) ?? 0;
  const opponentFinishedPlacing = opponentShipsCount > 0 && !gameState?.isPlacingShips;

  // Show waiting message when player has finished but opponent hasn't
  useEffect(() => {
    if (gameState && hasFinishedPlacing && !opponentFinishedPlacing && !gameState.gameStarted) {
      logGameAction('Waiting for Opponent', { 
        playerId,
        shipsPlaced: SHIPS.length,
        opponentShipsCount 
      });
      toast({
        title: 'Waiting for opponent',
        description: 'Your opponent is still placing their ships...',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }, [hasFinishedPlacing, opponentFinishedPlacing, gameState?.gameStarted]);

  // Add effect to track sunk ships
  useEffect(() => {
    if (gameState?.gameStarted && !gameState.isPlacingShips) {
      const targetBoard = playerId === 'player1' ? gameState.player2Board : gameState.player1Board;
      const newSunkShips = SHIPS.filter(ship => {
        return targetBoard.every(row =>
          row.every(cell =>
            cell.shipId !== ship.id || (cell.shipId === ship.id && cell.isHit)
          )
        );
      }).map(ship => ship.id);
      setSunkShips(newSunkShips);
    } else {
      setSunkShips([]);
    }
  }, [gameState?.player1Board, gameState?.player2Board]);

  // Reset sunk ships when game restarts
  useEffect(() => {
    if (gameState?.isPlacingShips && !gameState.gameStarted) {
      setSunkShips([]);
    }
  }, [gameState?.isPlacingShips, gameState?.gameStarted]);

  const handleCellClick = (x: number, y: number) => {
    // During ship placement phase
    if (gameState?.isPlacingShips) {
      // Prevent placing more ships if all ships are placed
      if (hasFinishedPlacing) return;

      if (!draggedShip || placedShips.includes(draggedShip.id)) return;

      // Calculate preview positions first
      const previewPositions: { x: number; y: number }[] = [];
      let isValid = true;

      for (let i = 0; i < draggedShip.size; i++) {
        const previewX = selectedOrientation === 'vertical' ? x + i : x;
        const previewY = selectedOrientation === 'horizontal' ? y + i : y;
        
        if (previewX >= 10 || previewY >= 10) {
          isValid = false;
          break;
        }

        previewPositions.push({ x: previewX, y: previewY });
      }

      if (isValid) {
        const currentBoard = playerId === 'player1' ? gameState.player1Board : gameState.player2Board;
        isValid = !previewPositions.some(pos => {
          if (currentBoard[pos.x][pos.y].isShip) return true;

          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const adjX = pos.x + dx;
              const adjY = pos.y + dy;
              if (
                adjX >= 0 && adjX < 10 &&
                adjY >= 0 && adjY < 10 &&
                currentBoard[adjX][adjY].isShip
              ) {
                return true;
              }
            }
          }
          return false;
        });
      }

      if (!isValid) {
        toast({
          title: 'Invalid Placement',
          description: 'Ships cannot overlap or be placed adjacent to each other',
          status: 'warning',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
        return;
      }

      // logGameAction('Placing Ship', {
      //   ship: draggedShip.name,
      //   position: { x, y },
      //   orientation: selectedOrientation,
      //   playerId
      // });

      const currentBoard = playerId === 'player1' ? gameState.player1Board : gameState.player2Board;
      const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
      
      previewPositions.forEach(cell => {
        newBoard[cell.x][cell.y] = { 
          isShip: true, 
          isHit: false,
          shipId: draggedShip.id
        };
      });

      placeShip(newBoard);
      const newPlacedShips = [...placedShips, draggedShip.id];
      setPlacedShips(newPlacedShips);
      setDraggedShip(null);
      setPreviewCells([]);
      return;
    }

    // During battle phase
    if (gameState?.gameStarted && gameState.currentTurn === playerId) {
      const targetBoard = playerId === 'player1' ? gameState.player2Board : gameState.player1Board;
      const newBoard = targetBoard.map(row => row.map(cell => ({ ...cell })));
      
      // Prevent hitting the same cell twice
      if (newBoard[x][y].isHit) {
        toast({
          title: 'Invalid Move',
          description: 'This cell has already been hit!',
          status: 'warning',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
        return;
      }
      
      // logGameAction('Attack Move', {
      //   position: { x, y },
      //   playerId,
      //   target: opponent
      // });
      
      const isHit = newBoard[x][y].isShip;
      newBoard[x][y] = { ...newBoard[x][y], isHit: true };
      makeMove(newBoard);

      if (isHit) {
        toast({
          title: 'Direct Hit! 🎯',
          description: 'You hit a ship! Take another shot!',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
      }
    } else if (gameState?.gameStarted) {
      toast({
        title: 'Not your turn',
        description: 'Wait for your opponent to make their move.',
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  const handleCellHover = (x: number, y: number) => {
    // Prevent showing preview if all ships are placed
    if (hasFinishedPlacing || !gameState?.isPlacingShips) {
      setPreviewCells([]);
      return;
    }

    if (!draggedShip || placedShips.includes(draggedShip.id)) {
      setPreviewCells([]);
      return;
    }

    const previewPositions: { x: number; y: number }[] = [];
    let isValid = true;

    // Calculate preview positions
    for (let i = 0; i < draggedShip.size; i++) {
      const previewX = selectedOrientation === 'vertical' ? x + i : x;
      const previewY = selectedOrientation === 'horizontal' ? y + i : y;
      
      if (previewX >= 10 || previewY >= 10) {
        isValid = false;
        break;
      }

      previewPositions.push({ x: previewX, y: previewY });
    }

    if (isValid) {
      const currentBoard = playerId === 'player1' ? gameState.player1Board : gameState.player2Board;
      isValid = !previewPositions.some(pos => {
        if (currentBoard[pos.x][pos.y].isShip) return true;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const adjX = pos.x + dx;
            const adjY = pos.y + dy;
            if (
              adjX >= 0 && adjX < 10 &&
              adjY >= 0 && adjY < 10 &&
              currentBoard[adjX][adjY].isShip
            ) {
              return true;
            }
          }
        }
        return false;
      });
    }

    setIsValidPreview(isValid);
    setPreviewCells(previewPositions);
  };

  const toggleOrientation = () => {
    const newOrientation = selectedOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    // logGameAction('Orientation Changed', {
    //   from: selectedOrientation,
    //   to: newOrientation,
    //   playerId
    // });
    setSelectedOrientation(newOrientation);
  }

  const handleLeaveGame = () => {
    logGameAction('Player Left Game', { playerId, username });
    disconnect()
  }

  const handleRestartGame = () => {
    logGameAction('Game Restart Requested', { playerId, username });
    restartGame()
    toast({
      title: 'Game Restarted',
      description: 'Place your ships to begin a new game!',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top',
    })
  }

  const handleDragStart = (ship: typeof SHIPS[0]) => {
    setDraggedShip(ship);
  };

  const handleDragOver = (x: number, y: number) => (event: React.DragEvent) => {
    event.preventDefault();
    if (!draggedShip || placedShips.includes(draggedShip.id)) return;

    const previewPositions: { x: number; y: number }[] = [];
    let isValid = true;

    for (let i = 0; i < draggedShip.size; i++) {
      const previewX = selectedOrientation === 'vertical' ? x + i : x;
      const previewY = selectedOrientation === 'horizontal' ? y + i : y;
      
      if (previewX >= 10 || previewY >= 10) {
        isValid = false;
        break;
      }

      previewPositions.push({ x: previewX, y: previewY });
    }

    if (isValid) {
      const currentBoard = playerId === 'player1' ? gameState?.player1Board : gameState?.player2Board;
      if (!currentBoard) return;

      isValid = !previewPositions.some(pos => {
        if (currentBoard[pos.x][pos.y].isShip) return true;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const adjX = pos.x + dx;
            const adjY = pos.y + dy;
            if (
              adjX >= 0 && adjX < 10 &&
              adjY >= 0 && adjY < 10 &&
              currentBoard[adjX][adjY].isShip
            ) {
              return true;
            }
          }
        }
        return false;
      });
    }

    setIsValidPreview(isValid);
    setPreviewCells(previewPositions);
  };

  const handleDrop = () => (event: React.DragEvent) => {
    event.preventDefault();
    if (!draggedShip || !isValidPreview || placedShips.includes(draggedShip.id)) return;

    const currentBoard = playerId === 'player1' ? gameState?.player1Board : gameState?.player2Board;
    if (!currentBoard) return;

    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

    previewCells.forEach(cell => {
      newBoard[cell.x][cell.y] = {
        isShip: true,
        isHit: false,
        shipId: draggedShip.id
      };
    });

    placeShip(newBoard);
    const newPlacedShips = [...placedShips, draggedShip.id];
    setPlacedShips(newPlacedShips);
    
    // Log placement
    // logGameAction('Ship Placed', {
    //   ship: draggedShip.name,
    //   position: previewCells[0],
    //   orientation: selectedOrientation,
    //   remainingShips: SHIPS.length - newPlacedShips.length
    // });

    setDraggedShip(null);
    setPreviewCells([]);
  };

  const handleDragLeave = () => {
    setPreviewCells([]);
  };

  const handleTouchStart = (ship: typeof SHIPS[0], event: React.TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    setTouchStartCoords({ x: touch.clientX, y: touch.clientY });
    setDraggedShip(ship);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    event.preventDefault();
    if (!draggedShip || !touchStartCoords) return;

    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    const cellCoords = element?.getAttribute('data-coords');

    if (cellCoords) {
      const [x, y] = cellCoords.split(',').map(Number);
      handleCellHover(x, y);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault();
    if (!draggedShip || !touchStartCoords) return;

    const touch = event.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    const cellCoords = element?.getAttribute('data-coords');

    if (cellCoords && isValidPreview) {
      const [x, y] = cellCoords.split(',').map(Number);
      handleCellClick(x, y);
    }

    setTouchStartCoords(null);
    setDraggedShip(null);
  };

  // Modify renderShipContainer
  const renderShipContainer = () => {
    if (!gameState?.isPlacingShips || hasFinishedPlacing) return null;

    const remainingShips = SHIPS.filter(ship => !placedShips.includes(ship.id));

    return (
      <VStack spacing={4} width="100%" maxW="400px" mb={6}>
        <Text fontSize="lg" fontWeight="bold" color={isDark ? "white" : "gray.700"}>
          {remainingShips.length > 0 
            ? `Place your ships (${remainingShips.length} remaining)`
            : 'All ships placed!'
          }
        </Text>
        <Button 
                size="lg" 
                onClick={toggleOrientation} 
                width="200px"
                colorScheme="blue"
                variant="outline"
                _hover={{ bg: isDark ? "blue.800" : "blue.50" }}
              >
                {selectedOrientation === 'horizontal' ? '↔️' : '↕️'} {selectedOrientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
              </Button>
        <Flex
          wrap="wrap"
          gap={4}
          justify="center"
          bg={isDark ? "gray.700" : "gray.50"}
          p={4}
          borderRadius="lg"
          boxShadow="md"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {SHIPS.map((ship) => (
            <DraggableShip
              key={ship.id}
              ship={ship}
              isSelected={placedShips.includes(ship.id)}
              onDragStart={handleDragStart}
              onTouchStart={handleTouchStart}
              orientation={selectedOrientation}
            />
          ))}
        </Flex>
      </VStack>
    );
  };

  // Add effect to prevent scrolling during drag
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (draggedShip) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [draggedShip]);

  if (!gameState) return null;

  const myBoard = playerId === 'player1' ? gameState.player1Board : gameState.player2Board;
  const opponentBoard = playerId === 'player1' ? gameState.player2Board : gameState.player1Board;
  const currentBoard = gameState.isPlacingShips ? myBoard : opponentBoard;

  const isPreviewCell = (x: number, y: number, isMyBoard: boolean) => 
    isMyBoard && gameState.isPlacingShips && previewCells.some(cell => cell.x === x && cell.y === y)

  const getShipDesign = (shipId?: number) => {
    if (!shipId) return null
    const ship = SHIPS.find(s => s.id === shipId)
    return ship ? SHIP_DESIGNS[ship.name as keyof typeof SHIP_DESIGNS] : null
  }

  const getShipPartType = (x: number, y: number, cell: { isShip: boolean; isHit: boolean; shipId?: number }) => {
    if (!cell.isShip || !cell.shipId) return null;

    const board = currentBoard;
    const isHorizontalShip = (x: number, y: number) => {
      return y > 0 && board[x][y - 1]?.shipId === cell.shipId ||
             y < 9 && board[x][y + 1]?.shipId === cell.shipId;
    };

    const isStart = (x: number, y: number) => {
      const isHorizontal = isHorizontalShip(x, y);
      if (isHorizontal) {
        return y === 0 || board[x][y - 1]?.shipId !== cell.shipId;
      } else {
        return x === 0 || board[x - 1][y]?.shipId !== cell.shipId;
      }
    };

    const isEnd = (x: number, y: number) => {
      const isHorizontal = isHorizontalShip(x, y);
      if (isHorizontal) {
        return y === 9 || board[x][y + 1]?.shipId !== cell.shipId;
      } else {
        return x === 9 || board[x + 1][y]?.shipId !== cell.shipId;
      }
    };

    const isSingle = !isHorizontalShip(x, y) && 
                    (x === 0 || board[x - 1][y]?.shipId !== cell.shipId) &&
                    (x === 9 || board[x + 1][y]?.shipId !== cell.shipId);

    if (isSingle) return 'single';
    if (isStart(x, y)) return isHorizontalShip(x, y) ? 'start' : 'vstart';
    if (isEnd(x, y)) return isHorizontalShip(x, y) ? 'end' : 'vend';
    return isHorizontalShip(x, y) ? 'middle' : 'vmiddle';
  };

  const getCellContent = (x: number, y: number, cell: { isShip: boolean; isHit: boolean; shipId?: number }) => {
    if (cell.isHit) {
      return cell.isShip ? HIT_MARKER : MISS_MARKER;
    }

    if (cell.isShip && !gameState.isPlacingShips) {
      const design = getShipDesign(cell.shipId);
      const partType = getShipPartType(x, y, cell);
      if (design && partType) {
        return design[partType];
      }
      return '■';
    }

    if (isPreviewCell(x, y, true)) {
      if (!draggedShip) return '';
      
      const design = SHIP_DESIGNS[draggedShip.name as keyof typeof SHIP_DESIGNS];
      const index = previewCells.findIndex(pos => pos.x === x && pos.y === y);
      
      if (previewCells.length === 1) return design.single;
      
      if (selectedOrientation === 'horizontal') {
        if (index === 0) return design.start;
        if (index === previewCells.length - 1) return design.end;
        return design.middle;
      } else {
        if (index === 0) return design.vstart;
        if (index === previewCells.length - 1) return design.vend;
        return design.vmiddle;
      }
    }

    return '';
  };

  const renderBoard = (board: typeof currentBoard, isMyBoard: boolean) => (
    <Box position="relative" width="100%">
      <Grid
        templateColumns="auto repeat(10, 1fr)"
        templateRows="auto repeat(10, 1fr)"
        gap={0.5}
        bg={isDark ? "gray.600" : "gray.100"}
        p={2}
        borderRadius="lg"
        opacity={gameState.gameEnded ? 0.8 : 1}
        pointerEvents={gameState.gameEnded ? "none" : "auto"}
        maxWidth="100vw"
      >
        {/* Column headers */}
        <GridItem />
        {COLS.map(col => (
          <GridItem key={col} textAlign="center">
            <Text fontSize={["xs", "sm"]} fontWeight="bold" color={isDark ? "white" : "inherit"}>{col}</Text>
          </GridItem>
        ))}

        {/* Game grid */}
        {ROWS.map((row, x) => (
          <React.Fragment key={row}>
            <GridItem>
              <Text fontSize={["xs", "sm"]} fontWeight="bold" color={isDark ? "white" : "inherit"}>{row}</Text>
            </GridItem>
            {COLS.map((_, y) => {
              const cell = board[x][y];
              const isPreview = isPreviewCell(x, y, isMyBoard);
              const design = cell.shipId ? getShipDesign(cell.shipId) : null;
              const showShip = cell.isShip && (isMyBoard || cell.isHit);
              const isNewHit = cell.isHit && isMyBoard;
              
              return (
                <GridItem
                  key={`${x}-${y}`}
                  position="relative"
                  bg={isPreview 
                    ? (isValidPreview ? 'green.200' : 'red.200') 
                    : isMyBoard && showShip
                      ? design?.color || 'blue.500'
                      : cell.isHit
                        ? (cell.isShip ? 'red.100' : isDark ? 'gray.500' : 'gray.100')
                        : isDark ? 'gray.700' : 'white'
                  }
                  w={["25px", "30px", "35px"]}
                  h={["25px", "30px", "35px"]}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor={(!isMyBoard && gameState.gameStarted) || (isMyBoard && gameState.isPlacingShips) ? "pointer" : "default"}
                  onClick={() => (!isMyBoard && gameState.gameStarted) ? handleCellClick(x, y) : null}
                  onDragOver={isMyBoard && gameState.isPlacingShips ? (e) => handleDragOver(x, y)(e) : undefined}
                  onDrop={isMyBoard && gameState.isPlacingShips ? (e) => handleDrop()(e) : undefined}
                  onDragLeave={isMyBoard && gameState.isPlacingShips ? handleDragLeave : undefined}
                  data-coords={`${x},${y}`}
                  borderWidth={1}
                  borderColor={isDark ? "gray.600" : "gray.200"}
                  transition="all 0.2s"
                  _hover={(!isMyBoard && gameState.gameStarted) || (isMyBoard && gameState.isPlacingShips) ? { bg: isDark ? 'blue.700' : 'blue.100' } : {}}
                >
                  {isNewHit && (
                    <>
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        fontSize="xl"
                        color="red.500"
                        animation={`${missileAnimation} 0.5s ease-in`}
                        zIndex={2}
                      >
                        🚀
                      </Box>
                      {cell.isShip && (
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          fontSize="2xl"
                          color="orange.500"
                          animation={`${explosionAnimation} 0.5s ease-out 0.5s`}
                          zIndex={3}
                        >
                          💥
                        </Box>
                      )}
                    </>
                  )}
                  <Text 
                    fontSize={(!isMyBoard && cell.isHit) ? ["md", "xl", "2xl"] : ["xs", "sm"]} 
                    color={cell.isHit 
                      ? (cell.isShip ? 'red.500' : isDark ? 'gray.300' : 'gray.500') 
                      : isDark ? 'white' : 'currentColor'
                    }
                    animation={cell.isHit ? `${cell.isShip ? hitAnimation : missAnimation} 0.5s ease-out` : undefined}
                    sx={{
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none'
                      }
                    }}
                  >
                    {cell.isHit 
                      ? (cell.isShip ? HIT_MARKER : MISS_MARKER)
                      : showShip && design
                        ? design[getShipPartType(x, y, cell) || 'single']
                        : isPreview
                          ? getCellContent(x, y, cell)
                          : ''}
                  </Text>
                </GridItem>
              );
            })}
          </React.Fragment>
        ))}
      </Grid>
      {/* Waiting overlay */}
      {hasFinishedPlacing && isMyBoard && !gameState.gameStarted && !opponentFinishedPlacing && gameState.isPlacingShips && (
        <Center
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          borderRadius="lg"
          flexDirection="column"
          gap={3}
          p={4}
        >
          <Box
            bg="white"
            p={4}
            borderRadius="md"
            boxShadow="lg"
            textAlign="center"
          >
            <Text fontSize="xl" fontWeight="bold" color="blue.600" mb={2}>
              Ships Placed!
            </Text>
            <Text color="gray.700" fontSize="md">
              Waiting for opponent to place their ships...
            </Text>
          </Box>
        </Center>
      )}
      {/* Game over overlay */}
      {gameState.gameEnded && (
        <Center
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          borderRadius="lg"
          flexDirection="column"
          gap={3}
          p={4}
          zIndex={5}
        >
          <Box
            bg="white"
            p={4}
            borderRadius="md"
            boxShadow="lg"
            textAlign="center"
          >
            <Text 
              fontSize="xl" 
              fontWeight="bold" 
              color={gameState.winner === playerId ? "green.500" : "red.500"}
              mb={2}
            >
              {isMyBoard 
                ? (gameState.winner === playerId ? "Victory!" : "Defeat!")
                : (gameState.winner === playerId ? "You sank all enemy ships!" : "All your ships were sunk!")}
            </Text>
            <Text color="gray.700" fontSize="md">
              {isMyBoard
                ? "Game Over - Click Play Again to start a new game"
                : gameState.winner === playerId 
                  ? "Your strategy led you to victory!"
                  : "Better luck next time!"}
            </Text>
          </Box>
        </Center>
      )}
    </Box>
  );

  const renderShipStatus = () => {
    if (!gameState?.gameStarted || gameState.isPlacingShips) return null;

    return (
      <VStack 
        width="100%" 
        maxW="400px" 
        spacing={4} 
        bg={isDark ? "gray.800" : "white"}
        p={4}
        borderRadius="lg"
        boxShadow="md"
        mt={4}
      >
        <Text fontSize="lg" fontWeight="bold" color={isDark ? "white" : "gray.700"}>
          Enemy Fleet Status
        </Text>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Ship</Th>
              <Th>Size</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {SHIPS.map(ship => {
              const isSunk = sunkShips.includes(ship.id);
              const design = SHIP_DESIGNS[ship.name as keyof typeof SHIP_DESIGNS];
              return (
                <Tr key={ship.id}>
                  <Td>
                    <HStack>
                      <Text color={design.color}>{ship.name}</Text>
                      <Text color={design.color}>
                        {Array(ship.size).fill(design.middle).join('')}
                      </Text>
                    </HStack>
                  </Td>
                  <Td isNumeric>{ship.size}</Td>
                  <Td>
                    <Badge
                      colorScheme={isSunk ? 'red' : 'green'}
                      variant={isDark ? 'solid' : 'subtle'}
                    >
                      {isSunk ? '💥 Sunk' : '🌊 Afloat'}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </VStack>
    );
  };

  return (
    <Center 
      minH="100vh" 
      bg={isDark ? "gray.900" : "blue.50"}
      bgImage="url('https://www.transparenttextures.com/patterns/navy.png')"
      bgBlendMode="overlay"
      position="absolute"
      w="100%"
      overflowY="auto"
      py={16}
    >
      <VStack 
        spacing={4} 
        p={[2, 4, 6]} 
        position="relative" 
        width="100%" 
        maxW="1200px" 
        mx="auto"
        mb={20}
      >
        <IconButton
          aria-label="Toggle color mode"
          icon={isDark ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          position="absolute"
          top={4}
          right={4}
          colorScheme={isDark ? "yellow" : "purple"}
          variant="solid"
          boxShadow="lg"
        />

        {!opponent && (
          <Center
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg={isDark ? "blackAlpha.800" : "blackAlpha.700"}
            backdropFilter="blur(8px)"
            zIndex={10}
            flexDirection="column"
            gap={4}
            p={4}
            textAlign="center"
          >
            <Box 
              bg={isDark ? "gray.800" : "white"} 
              p={8} 
              borderRadius="2xl" 
              boxShadow="dark-lg" 
              maxW="400px" 
              w="90%"
              border="2px solid"
              borderColor={isDark ? "blue.400" : "blue.200"}
            >
              <VStack spacing={6}>
                <Text 
                  fontSize={["2xl", "3xl"]} 
                  fontWeight="bold" 
                  color={isDark ? "blue.300" : "blue.600"}
                  textShadow="1px 1px 2px rgba(0,0,0,0.2)"
                >
                  Waiting for Opponent
                </Text>
                <VStack spacing={4}>
                  <Text 
                    color={isDark ? "gray.300" : "gray.600"} 
                    fontSize={["md", "lg"]}
                    fontWeight="medium"
                  >
                    Share your room code with a friend to start playing!
                  </Text>
                  <Box
                    bg={isDark ? "gray.700" : "gray.100"}
                    p={4}
                    borderRadius="lg"
                    border="2px dashed"
                    borderColor={isDark ? "blue.400" : "blue.200"}
                  >
                    <Text
                      fontSize={["xl", "2xl"]}
                      fontWeight="bold"
                      color={isDark ? "blue.300" : "blue.600"}
                      letterSpacing="wider"
                    >
                      {gameId}
                    </Text>
                  </Box>
                </VStack>
              </VStack>
            </Box>
          </Center>
        )}

        <VStack 
          width="100%" 
          spacing={6} 
          bg={isDark ? "gray.800" : "white"} 
          p={8} 
          borderRadius="2xl" 
          boxShadow="dark-lg"
          border="2px solid"
          borderColor={isDark ? "blue.400" : "blue.200"}
        >
          <VStack align="center" spacing={4} width="100%">
            <Heading 
              size={["lg", "xl"]} 
              color={isDark ? "blue.300" : "blue.600"}
              textShadow="1px 1px 2px rgba(0,0,0,0.2)"
            >
              Battleship
            </Heading>
            <HStack spacing={4} divider={<Text color="gray.500">vs</Text>}>
              <VStack spacing={0}>
                <Text 
                  fontSize={["md", "lg"]} 
                  color={isDark ? "blue.200" : "blue.500"}
                  fontWeight="bold"
                >
                  {username}
                </Text>
                <Text fontSize="sm" color={isDark ? "gray.400" : "gray.600"}>
                  Captain
                </Text>
              </VStack>
              {opponent && (
                <VStack spacing={0}>
                  <Text 
                    fontSize={["md", "lg"]} 
                    color={isDark ? "red.300" : "red.500"}
                    fontWeight="bold"
                  >
                    {opponent}
                  </Text>
                  <Text fontSize="sm" color={isDark ? "gray.400" : "gray.600"}>
                    Enemy
                  </Text>
                </VStack>
              )}
            </HStack>
            {gameState.gameEnded && (
              <Badge 
                colorScheme={gameState.winner === playerId ? 'green' : 'red'} 
                fontSize={["lg", "xl"]}
                p={3}
                borderRadius="lg"
                boxShadow="md"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {gameState.winner === playerId ? '🏆 Victory!' : '💀 Defeated!'}
              </Badge>
            )}
          </VStack>

          {gameState.isPlacingShips && !hasFinishedPlacing && (
            <VStack spacing={4} width="100%" maxW="400px">
              <Text 
                fontSize={["md", "lg"]} 
                textAlign="center"
                color={isDark ? "blue.200" : "blue.600"}
                fontWeight="medium"
              >
                Position your fleet for battle!
              </Text>
            </VStack>
          )}

          <HStack spacing={4} justifyContent="center">
            {gameState.gameEnded && (
              <Button 
                colorScheme="green" 
                onClick={handleRestartGame}
                size="lg"
                minW="120px"
                boxShadow="md"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
              >
                🔄 Play Again
              </Button>
            )}
            <Button 
              colorScheme="red" 
              onClick={handleLeaveGame}
              isDisabled={!gameState.gameEnded && gameState.gameStarted}
              size="lg"
              minW="120px"
              boxShadow="md"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            >
              {gameState.gameEnded ? '🚪 Leave Game' : '🏳️ Surrender'}
            </Button>
          </HStack>
        </VStack>

        {/* Ship container with game-like styling */}
        {renderShipContainer()}

        <VStack spacing={8} width="100%" align="center">
          <VStack spacing={4} width="100%" align="center">
            <Box
              borderRadius="xl"
              overflow="hidden"
              boxShadow="dark-lg"
              border="2px solid"
              borderColor={isDark ? "blue.400" : "blue.200"}
              p={2}
              bg={isDark ? "gray.800" : "white"}
            >
              {renderBoard(myBoard, true)}
            </Box>
          </VStack>
          
          <Text 
            fontSize={["lg", "xl"]} 
            fontWeight="bold"
            textAlign="center"
            color={
              gameState.gameEnded 
                ? (gameState.winner === playerId ? 'green.400' : 'red.400')
                : (gameState.currentTurn === playerId ? 'blue.400' : 'gray.400')
            }
            textShadow="1px 1px 2px rgba(0,0,0,0.2)"
          >
            {gameState.gameEnded
              ? (gameState.winner === playerId ? '🏆 Victory is yours!' : '💀 Your fleet has been destroyed!')
              : (gameState.isPlacingShips
                ? (hasFinishedPlacing 
                    ? '⏳ Waiting for enemy to position their fleet...'
                    : '🎯 Position your fleet, Captain!')
                : gameState.currentTurn === playerId
                  ? '🎯 Fire at will, Captain!'
                  : "⏳ Enemy is taking aim...")}
          </Text>
          
          {opponent && (
            <VStack spacing={4} width="100%" align="center">
              <Box
                borderRadius="xl"
                overflow="hidden"
                boxShadow="dark-lg"
                border="2px solid"
                borderColor={isDark ? "red.400" : "red.200"}
                p={2}
                bg={isDark ? "gray.800" : "white"}
              >
                {renderBoard(opponentBoard, false)}
              </Box>
              {renderShipStatus()}
            </VStack>
          )}
        </VStack>
      </VStack>
    </Center>
  );
}; 