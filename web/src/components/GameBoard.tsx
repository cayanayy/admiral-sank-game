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
    visibility: hidden;
  }
`;

const explosionAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
    visibility: visible;
  }
  50% {
    transform: scale(2);
    opacity: 0.8;
  }
  100% {
    transform: scale(3);
    opacity: 0;
    visibility: hidden;
  }
`;

const hitBackgroundAnimation = keyframes`
  0% {
    background-color: transparent;
  }
  99% {
    background-color: transparent;
  }
  100% {
    background-color: var(--hit-bg-color);
  }
`;

const hitMarkerAnimation = keyframes`
  0%, 95% { 
    opacity: 0;
    transform: scale(0);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
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

  type BoardCell = {
    isShip: boolean;
    isHit: boolean;
    shipId?: number;
  };

  type Board = BoardCell[][];

  const [previewCells, setPreviewCells] = useState<{ x: number; y: number }[]>([])
  const [isValidPreview, setIsValidPreview] = useState(true)
  const [selectedOrientation, setSelectedOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [draggedShip, setDraggedShip] = useState<typeof SHIPS[0] | null>(null)
  const [placedShips, setPlacedShips] = useState<number[]>([])
  const [touchStartCoords, setTouchStartCoords] = useState<{ x: number, y: number } | null>(null);
  const [sunkShips, setSunkShips] = useState<number[]>([]);
  const [hasFinalized, setHasFinalized] = useState(false);
  const [localBoard, setLocalBoard] = useState<Board | null>(null);

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

  // Reset ship placement when game restarts
  useEffect(() => {
    if (gameState?.isPlacingShips && !gameState.gameStarted) {
      setPlacedShips([]);
    }
  }, [gameState?.isPlacingShips, gameState?.gameStarted]);

  // Show game over notification
  useEffect(() => {
    if (gameState?.gameEnded) {
      const isWinner = gameState.winner === playerId;
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

  // Show waiting message when player has finished but opponent hasn't
  useEffect(() => {
    if (gameState && hasFinishedPlacing && !hasFinalized && !gameState.gameStarted) {
      toast({
        title: 'All Ships Placed!',
        description: 'Click Finish Placement button when you are ready.',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }, [hasFinishedPlacing, gameState?.gameStarted, hasFinalized]);

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

  // Reset states when game restarts
  useEffect(() => {
    const currentGameState = gameState;
    if (!currentGameState) return;
    
    // Only reset if we're starting a new game AND we haven't just finalized placement
    const isNewGame = currentGameState.isPlacingShips && !currentGameState.gameStarted;
    const shouldReset = isNewGame && !hasFinalized;

    if (shouldReset) {
      // Clear stored finalized state
      localStorage.removeItem('hasFinalized');
      localStorage.removeItem('finalizedAt');
      
      const initialBoard = playerId === 'player1' ? currentGameState.player1Board : currentGameState.player2Board;
      setLocalBoard(initialBoard.map(row => row.map(cell => ({ ...cell }))));
      setPlacedShips([]);
      setHasFinalized(false);
      setSunkShips([]);
    }
  }, [gameState, playerId, hasFinalized]);

  // Add effect to restore finalized state if needed
  useEffect(() => {
    if (!gameState) return;

    // Only try to restore if we're in placement phase and haven't finalized
    const shouldTryRestore = gameState.isPlacingShips && !hasFinalized && !gameState.gameStarted;
    
    if (shouldTryRestore) {
      const storedFinalized = localStorage.getItem('hasFinalized');
      const finalizedAt = localStorage.getItem('finalizedAt');
      
      if (storedFinalized === 'true' && finalizedAt) {
        // Only restore if it was stored recently (within last 5 minutes)
        const storedTime = new Date(finalizedAt).getTime();
        const now = new Date().getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - storedTime < fiveMinutes) {
          setHasFinalized(true);
        } else {
          // Clear old stored state
          localStorage.removeItem('hasFinalized');
          localStorage.removeItem('finalizedAt');
        }
      }
    }
  }, [gameState, hasFinalized]);

  const validateShipPlacement = (x: number, y: number, ship: typeof SHIPS[0], board: Board) => {
    const previewPositions: { x: number; y: number }[] = [];
    let isValid = true;

    for (let i = 0; i < ship.size; i++) {
      const previewX = selectedOrientation === 'vertical' ? x + i : x;
      const previewY = selectedOrientation === 'horizontal' ? y + i : y;
      
      if (previewX >= 10 || previewY >= 10) {
        isValid = false;
        break;
      }

      previewPositions.push({ x: previewX, y: previewY });
    }

    if (isValid) {
      isValid = !previewPositions.some(pos => {
        if (board[pos.x][pos.y].isShip) return true;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const adjX = pos.x + dx;
            const adjY = pos.y + dy;
            if (
              adjX >= 0 && adjX < 10 &&
              adjY >= 0 && adjY < 10 &&
              board[adjX][adjY].isShip
            ) {
              return true;
            }
          }
        }
        return false;
      });
    }

    return { isValid, previewPositions };
  };

  const handleCellClick = (x: number, y: number) => {
    if (!gameState) return;

    // During ship placement phase
    if (gameState.isPlacingShips) {
      if (hasFinalized || !localBoard) return;

      // Check if clicking on an existing ship to remove it
      const clickedCell = localBoard[x][y];
      if (clickedCell.isShip && clickedCell.shipId && !draggedShip) {
        // Remove ship logic
        setPlacedShips(prev => prev.filter(id => id !== clickedCell.shipId));
        const newBoard = localBoard.map(row => row.map(cell => 
          cell.shipId === clickedCell.shipId 
            ? { isShip: false, isHit: false, shipId: undefined }
            : { ...cell }
        ));
        setLocalBoard(newBoard);

        const removedShip = SHIPS.find(ship => ship.id === clickedCell.shipId);
        if (removedShip) {
          toast({
            title: `${removedShip.name} Removed`,
            description: 'You can now place this ship in a new position.',
            status: 'info',
            duration: 2000,
            isClosable: true,
            position: 'top',
          });
        }
        return;
      }

      // Only proceed with placement if we have a dragged ship
      if (!draggedShip || placedShips.includes(draggedShip.id)) return;

      const { isValid, previewPositions } = validateShipPlacement(x, y, draggedShip, localBoard);

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

      const newBoard = localBoard.map(row => row.map(cell => ({ ...cell })));
      previewPositions.forEach(cell => {
        newBoard[cell.x][cell.y] = { 
          isShip: true, 
          isHit: false,
          shipId: draggedShip.id
        };
      });

      setLocalBoard(newBoard);
      setPlacedShips(prev => [...prev, draggedShip.id]);
      setDraggedShip(null);
      setPreviewCells([]);
      return;
    }

    // During battle phase
    if (gameState.gameStarted && gameState.currentTurn === playerId) {
      const targetBoard = playerId === 'player1' ? gameState.player2Board : gameState.player1Board;
      
      // Prevent hitting the same cell twice
      if (targetBoard[x][y].isHit) {
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
      
      const isHit = targetBoard[x][y].isShip;
      const newBoard = targetBoard.map(row => row.map(cell => ({ ...cell })));
      newBoard[x][y].isHit = true;
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
    } else if (gameState.gameStarted) {
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
    if (!gameState?.isPlacingShips || hasFinalized || !localBoard || !draggedShip || placedShips.includes(draggedShip.id)) {
      setPreviewCells([]);
      return;
    }

    const { isValid, previewPositions } = validateShipPlacement(x, y, draggedShip, localBoard);
    setIsValidPreview(isValid);
    setPreviewCells(previewPositions);
  };

  const handleDragOver = (x: number, y: number) => (event: React.DragEvent) => {
    event.preventDefault();
    handleCellHover(x, y);
  };

  const toggleOrientation = () => {
    const newOrientation = selectedOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    setSelectedOrientation(newOrientation);
  }

  const handleLeaveGame = () => {
    disconnect();
  }

  const handleRestartGame = () => {
    restartGame();
    toast({
      title: 'Game Restarted',
      description: 'Place your ships to begin a new game!',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
  }

  const handleDragStart = (ship: typeof SHIPS[0]) => {
    setDraggedShip(ship);
  };

  const handleDrop = () => (event: React.DragEvent) => {
    event.preventDefault();
    if (!draggedShip || !isValidPreview || placedShips.includes(draggedShip.id) || !localBoard) return;

    const newBoard = localBoard.map(row => row.map(cell => ({ ...cell })));
    previewCells.forEach(cell => {
      newBoard[cell.x][cell.y] = {
        isShip: true,
        isHit: false,
        shipId: draggedShip.id
      };
    });

    setLocalBoard(newBoard);
    setPlacedShips(prev => [...prev, draggedShip.id]);
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
    if (!draggedShip || !touchStartCoords || !gameState?.isPlacingShips || hasFinalized) return;

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
    if (!draggedShip || !touchStartCoords || !gameState?.isPlacingShips || hasFinalized) return;

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

  // Update finalize placement handler to send the final board
  const handleFinalizePlacement = () => {
    if (!gameState || !localBoard) return;
    
    // Update all related states atomically
    setHasFinalized(true);
    placeShip(localBoard);
    
    // Store finalized state in localStorage as backup
    try {
      localStorage.setItem('hasFinalized', 'true');
      localStorage.setItem('finalizedAt', new Date().toISOString());
    } catch (e) {
      // Silently handle storage errors
    }
    
    toast({
      title: 'Ships Placed!',
      description: 'Waiting for opponent to place their ships...',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
  };

  // Modify the waiting overlay to show only after finalization
  const renderWaitingOverlay = () => {
    if (!hasFinalized || !gameState?.isPlacingShips) return null;

    return (
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
          bg={isDark ? "gray.800" : "white"}
          p={4}
          borderRadius="md"
          boxShadow="lg"
          textAlign="center"
          border="2px solid"
          borderColor={isDark ? "blue.400" : "blue.200"}
        >
          <Text fontSize="xl" fontWeight="bold" color={isDark ? "blue.300" : "blue.600"} mb={2}>
            Ships Positioned!
          </Text>
          <Text color={isDark ? "gray.300" : "gray.700"} fontSize="md">
            Waiting for opponent to finish placement...
          </Text>
        </Box>
      </Center>
    );
  };

  // Reset finalized state when game restarts
  useEffect(() => {
    if (gameState?.isPlacingShips && !gameState.gameStarted) {
      setHasFinalized(false);
      setPlacedShips([]);
      setSunkShips([]);
    }
  }, [gameState?.isPlacingShips, gameState?.gameStarted]);

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

  // Modify the ship container to hide after finalization
  const renderShipContainer = () => {
    if (!gameState?.isPlacingShips || hasFinalized) return null;

    const remainingShips = SHIPS.filter(ship => !placedShips.includes(ship.id));
    const allShipsPlaced = remainingShips.length === 0;

    return (
      <VStack spacing={4} width="100%" maxW="400px" mb={6}>
        <Text fontSize="lg" fontWeight="bold" color={isDark ? "white" : "gray.700"}>
          {!allShipsPlaced 
            ? `Place your ships (${remainingShips.length} remaining)`
            : 'All ships placed! Review and click Finish Placement when ready.'
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
        {allShipsPlaced && !hasFinalized && (
          <Button
            colorScheme="green"
            size="lg"
            width="full"
            onClick={handleFinalizePlacement}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg"
            }}
          >
            ✅ Finish Placement
          </Button>
        )}
      </VStack>
    );
  };

  // Update the game status text
  const getGameStatusText = () => {
    // We can assert gameState is non-null since we check at component level
    const state = gameState!;

    if (state.gameEnded) {
      return state.winner === playerId 
        ? '🏆 Victory is yours!' 
        : '💀 Your fleet has been destroyed!';
    }

    if (state.isPlacingShips) {
      if (hasFinalized) {
        return '⏳ Waiting for opponent to finish placement...';
      }
      return hasFinishedPlacing
        ? '✅ All ships placed! Click Finish Placement when ready.'
        : '🎯 Position your fleet!';
    }

    return state.currentTurn === playerId
      ? '🎯 Fire at will, Captain!'
      : "⏳ Enemy is taking aim...";
  };

  if (!gameState) return null;

  const myBoard = gameState.isPlacingShips 
    ? (localBoard || (playerId === 'player1' ? gameState.player1Board : gameState.player2Board))
    : (playerId === 'player1' ? gameState.player1Board : gameState.player2Board);
  const opponentBoard = playerId === 'player1' ? gameState.player2Board : gameState.player1Board;
  const currentBoard = gameState.isPlacingShips ? myBoard : opponentBoard;

  const isPreviewCell = (x: number, y: number, isMyBoard: boolean) => 
    isMyBoard && gameState.isPlacingShips && previewCells.some(cell => cell.x === x && cell.y === y);

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

  const getCellContent = (x: number, y: number, cell: { isShip: boolean; isHit: boolean; shipId?: number }, isMyBoard: boolean) => {
    // For new hits, don't show content until animations complete
    if (cell.isHit && isMyBoard) {
      return '';
    }

    // For already hit cells or opponent's board
    if (cell.isHit) {
      return cell.isShip ? HIT_MARKER : MISS_MARKER;
    }

    // Only show ships on my board during placement or if they're hit on opponent's board
    const showShip = cell.isShip && (isMyBoard || cell.isHit);
    if (showShip && !gameState.isPlacingShips) {
      const design = getShipDesign(cell.shipId);
      const partType = getShipPartType(x, y, cell);
      if (design && partType) {
        return design[partType];
      }
      return '■';
    }

    // Show preview during placement
    if (isPreviewCell(x, y, isMyBoard)) {
      if (!draggedShip) return '';
      
      const design = SHIP_DESIGNS[draggedShip.name as keyof typeof SHIP_DESIGNS];
      const index = previewCells.findIndex(pos => pos.x === x && pos.y === y);
      
      if (previewCells.length === 1) return design.single;
      
      return selectedOrientation === 'horizontal'
        ? (index === 0 ? design.start : index === previewCells.length - 1 ? design.end : design.middle)
        : (index === 0 ? design.vstart : index === previewCells.length - 1 ? design.vend : design.vmiddle);
    }

    return '';
  };

  const renderBoard = (board: typeof gameState.player1Board, isMyBoard: boolean) => {
    const isGameEnded = gameState.gameEnded;
    const canInteract = !isGameEnded && (
      (isMyBoard && gameState.isPlacingShips && !hasFinalized) ||
      (!isMyBoard && gameState.gameStarted && gameState.currentTurn === playerId)
    );

    return (
      <Box position="relative" width="100%">
        <Grid
          templateColumns="auto repeat(10, 1fr)"
          templateRows="auto repeat(10, 1fr)"
          gap={0.5}
          bg={isDark ? "gray.600" : "gray.100"}
          p={2}
          borderRadius="lg"
          opacity={isGameEnded ? 0.8 : 1}
          pointerEvents={canInteract ? "auto" : "none"}
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
                      : showShip && isMyBoard
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
                    cursor={canInteract ? "pointer" : "default"}
                    onClick={() => canInteract && handleCellClick(x, y)}
                    onDragOver={isMyBoard && gameState.isPlacingShips ? (e) => handleDragOver(x, y)(e) : undefined}
                    onDrop={isMyBoard && gameState.isPlacingShips ? (e) => handleDrop()(e) : undefined}
                    onDragLeave={isMyBoard && gameState.isPlacingShips ? handleDragLeave : undefined}
                    data-coords={`${x},${y}`}
                    borderWidth={1}
                    borderColor={isDark ? "gray.600" : "gray.200"}
                    transition="all 0.2s"
                    _hover={canInteract ? { bg: isDark ? 'blue.700' : 'blue.100' } : {}}
                    sx={{
                      '--hit-bg-color': cell.isShip ? 'var(--chakra-colors-red-100)' : isDark ? 'var(--chakra-colors-gray-500)' : 'var(--chakra-colors-gray-100)',
                      animation: isNewHit ? `${hitBackgroundAnimation} 0.95s ease-in forwards` : undefined,
                      backgroundColor: isNewHit ? 'transparent' : undefined,
                      '@media (prefers-reduced-motion: reduce)': {
                        animation: 'none'
                      }
                    }}
                  >
                    {isNewHit ? (
                      <>
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          fontSize="xl"
                          color="red.500"
                          animation={`${missileAnimation} 0.5s ease-in forwards`}
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
                            animation={`${explosionAnimation} 0.5s ease-out 0.45s forwards`}
                            opacity={0}
                            visibility="hidden"
                            zIndex={3}
                          >
                            💥
                          </Box>
                        )}
                        <Text 
                          fontSize={["md", "xl", "2xl"]} 
                          color={cell.isShip ? 'red.500' : isDark ? 'gray.300' : 'gray.500'}
                          animation={`${hitMarkerAnimation} 1s ease-out forwards`}
                          opacity={0}
                          sx={{
                            '@media (prefers-reduced-motion: reduce)': {
                              animation: 'none'
                            }
                          }}
                        >
                          {cell.isShip ? HIT_MARKER : MISS_MARKER}
                        </Text>
                      </>
                    ) : (
                      <Text 
                        fontSize={(!isMyBoard && cell.isHit) ? ["md", "xl", "2xl"] : ["xs", "sm"]} 
                        color={cell.isHit 
                          ? (cell.isShip ? 'red.500' : isDark ? 'gray.300' : 'gray.500') 
                          : isDark ? 'white' : 'currentColor'
                        }
                      >
                        {getCellContent(x, y, cell, isMyBoard)}
                      </Text>
                    )}
                  </GridItem>
                );
              })}
            </React.Fragment>
          ))}
        </Grid>
      </Box>
    );
  };

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

          {gameState.isPlacingShips && !hasFinalized && (
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
              position="relative"
            >
              {renderBoard(myBoard, true)}
              {renderWaitingOverlay()}
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
            {getGameStatusText()}
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