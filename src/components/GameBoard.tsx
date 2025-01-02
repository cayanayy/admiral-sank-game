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
  keyframes
} from '@chakra-ui/react'
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

export const GameBoard: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const [previewCells, setPreviewCells] = useState<{ x: number; y: number }[]>([])
  const [isValidPreview, setIsValidPreview] = useState(true)
  const [currentShipIndex, setCurrentShipIndex] = useState(0)
  const [selectedOrientation, setSelectedOrientation] = useState<'horizontal' | 'vertical'>('horizontal')

  const { 
    username,
    playerId,
    opponent,
    gameState,
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

  // Add initial game state log
  useEffect(() => {
    if (gameState) {
      logGameAction('Game State', {
        username,
        playerId,
        opponent,
        isPlacingShips: gameState.isPlacingShips,
        gameStarted: gameState.gameStarted,
        currentTurn: gameState.currentTurn
      });
    }
  }, [gameState?.gameStarted, gameState?.currentTurn, opponent]);

  // Reset ship placement when game restarts
  useEffect(() => {
    if (gameState?.isPlacingShips && !gameState.gameStarted) {
      setCurrentShipIndex(0);
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
      });
    }
  }, [gameState?.gameEnded]);

  // Check if current player has finished placing ships
  const hasFinishedPlacing = currentShipIndex >= SHIPS.length;
  
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
      });
    }
  }, [hasFinishedPlacing, opponentFinishedPlacing, gameState?.gameStarted]);

  const handleCellClick = (x: number, y: number) => {
    // During ship placement phase
    if (gameState?.isPlacingShips) {
      // Prevent placing more ships if all ships are placed
      if (hasFinishedPlacing || !isValidPreview) return;

      logGameAction('Placing Ship', {
        ship: SHIPS[currentShipIndex].name,
        position: { x, y },
        orientation: selectedOrientation,
        playerId
      });
      const currentBoard = playerId === 'player1' ? gameState.player1Board : gameState.player2Board;
      const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
      const currentShip = SHIPS[currentShipIndex];
      
      previewCells.forEach(cell => {
        newBoard[cell.x][cell.y] = { 
          isShip: true, 
          isHit: false,
          shipId: currentShip.id
        };
      });

      placeShip(newBoard);
      
      const nextShipIndex = currentShipIndex + 1;
      if (nextShipIndex >= SHIPS.length) {
        logGameAction('All Ships Placed', { playerId });
        setCurrentShipIndex(nextShipIndex);
      } else {
        setCurrentShipIndex(nextShipIndex);
      }
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
        });
        return;
      }
      
      logGameAction('Attack Move', {
        position: { x, y },
        playerId,
        target: opponent
      });
      
      newBoard[x][y] = { ...newBoard[x][y], isHit: true };
      makeMove(newBoard);
    } else if (gameState?.gameStarted) {
      toast({
        title: 'Not your turn',
        description: 'Wait for your opponent to make their move.',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleCellHover = (x: number, y: number) => {
    // Prevent showing preview if all ships are placed
    if (hasFinishedPlacing || !gameState?.isPlacingShips || currentShipIndex >= SHIPS.length) {
      setPreviewCells([]);
      return;
    }

    const currentShip = SHIPS[currentShipIndex];
    const previewPositions: { x: number; y: number }[] = [];
    let isValid = true;

    // Calculate preview positions
    for (let i = 0; i < currentShip.size; i++) {
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

  const handleCellLeave = () => {
    setPreviewCells([])
  }

  const toggleOrientation = () => {
    const newOrientation = selectedOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    logGameAction('Orientation Changed', {
      from: selectedOrientation,
      to: newOrientation,
      playerId
    });
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
    })
  }

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
    if (!cell.isShip || !cell.shipId) return null

    const board = currentBoard
    const isHorizontalShip = (x: number, y: number) => {
      return y > 0 && board[x][y - 1]?.shipId === cell.shipId ||
             y < 9 && board[x][y + 1]?.shipId === cell.shipId
    }

    const isStart = (x: number, y: number) => {
      const isHorizontal = isHorizontalShip(x, y)
      if (isHorizontal) {
        return y === 0 || board[x][y - 1]?.shipId !== cell.shipId
      } else {
        return x === 0 || board[x - 1][y]?.shipId !== cell.shipId
      }
    }

    const isEnd = (x: number, y: number) => {
      const isHorizontal = isHorizontalShip(x, y)
      if (isHorizontal) {
        return y === 9 || board[x][y + 1]?.shipId !== cell.shipId
      } else {
        return x === 9 || board[x + 1][y]?.shipId !== cell.shipId
      }
    }

    const isSingle = !isHorizontalShip(x, y) && 
                    (x === 0 || board[x - 1][y]?.shipId !== cell.shipId) &&
                    (x === 9 || board[x + 1][y]?.shipId !== cell.shipId)

    if (isSingle) return 'single'
    if (isStart(x, y)) return isHorizontalShip(x, y) ? 'start' : 'vstart'
    if (isEnd(x, y)) return isHorizontalShip(x, y) ? 'end' : 'vend'
    return isHorizontalShip(x, y) ? 'middle' : 'vmiddle'
  }

  const getCellContent = (x: number, y: number, cell: { isShip: boolean; isHit: boolean; shipId?: number }) => {
    if (cell.isHit) {
      return cell.isShip ? HIT_MARKER : MISS_MARKER
    }

    if (cell.isShip && !gameState.isPlacingShips) {
      const design = getShipDesign(cell.shipId)
      const partType = getShipPartType(x, y, cell)
      if (design && partType) {
        return design[partType]
      }
      return '■'
    }

    if (isPreviewCell(x, y, true)) {
      const currentShip = SHIPS[currentShipIndex]
      const design = SHIP_DESIGNS[currentShip.name as keyof typeof SHIP_DESIGNS]
      const index = previewCells.findIndex(pos => pos.x === x && pos.y === y)
      
      if (previewCells.length === 1) return design.single
      
      if (selectedOrientation === 'horizontal') {
        if (index === 0) return design.start
        if (index === previewCells.length - 1) return design.end
        return design.middle
      } else {
        if (index === 0) return design.vstart
        if (index === previewCells.length - 1) return design.vend
        return design.vmiddle
      }
    }

    return ''
  }

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
                  onClick={() => (!isMyBoard && gameState.gameStarted) || (isMyBoard && gameState.isPlacingShips) ? handleCellClick(x, y) : null}
                  onMouseEnter={() => gameState.isPlacingShips && isMyBoard ? handleCellHover(x, y) : null}
                  onMouseLeave={handleCellLeave}
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
                    fontSize={["xs", "sm"]} 
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

  return (
    <Center minH="100vh" bg={isDark ? "gray.800" : "gray.50"}>
      <VStack spacing={4} p={[2, 4, 6]} position="relative" width="100%" maxW="1200px" mx="auto">
        <IconButton
          aria-label="Toggle color mode"
          icon={isDark ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          position="absolute"
          top={4}
          right={4}
          colorScheme={isDark ? "yellow" : "purple"}
        />

        {!opponent && (
          <Center
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg={isDark ? "blackAlpha.800" : "blackAlpha.700"}
            zIndex={10}
            flexDirection="column"
            gap={4}
            p={4}
            textAlign="center"
          >
            <Box bg={isDark ? "gray.700" : "white"} p={6} borderRadius="xl" boxShadow="lg" maxW="400px" w="90%">
              <VStack spacing={4}>
                <Text fontSize={["xl", "2xl"]} fontWeight="bold" color={isDark ? "white" : "gray.800"}>
                  Waiting for Opponent
                </Text>
                <Text color={isDark ? "gray.300" : "gray.600"} fontSize={["sm", "md"]}>
                  Share your room code with a friend to start playing!
                </Text>
              </VStack>
            </Box>
          </Center>
        )}

        <VStack width="100%" spacing={6} bg={isDark ? "gray.700" : "white"} p={6} borderRadius="xl" boxShadow="lg">
          <VStack align="center" spacing={3} width="100%">
            <Heading size={["md", "lg"]} color={isDark ? "white" : "inherit"}>Admiral Sank Game</Heading>
            <VStack spacing={1}>
              <Text fontSize={["sm", "md"]} color={isDark ? "gray.300" : "gray.600"}>Playing as: {username}</Text>
              {opponent && <Text fontSize={["sm", "md"]} color={isDark ? "gray.300" : "gray.600"}>Opponent: {opponent}</Text>}
            </VStack>
            {gameState.gameEnded && (
              <Badge 
                colorScheme={gameState.winner === playerId ? 'green' : 'red'} 
                fontSize={["md", "lg"]}
                p={2}
              >
                {gameState.winner === playerId ? 'You Won!' : 'You Lost!'}
              </Badge>
            )}
          </VStack>

          {gameState.isPlacingShips && !hasFinishedPlacing && (
            <VStack spacing={3} width="100%" maxW="400px">
              <Text fontSize={["sm", "md"]} textAlign="center">
                Placing: {SHIPS[currentShipIndex].name} ({SHIPS[currentShipIndex].size} cells)
              </Text>
              <Button size="sm" onClick={toggleOrientation} width="200px">
                Orientation: {selectedOrientation}
              </Button>
            </VStack>
          )}

          <HStack spacing={4} justifyContent="center">
            {gameState.gameEnded && (
              <Button 
                colorScheme="green" 
                onClick={handleRestartGame}
                size={["sm", "md"]}
                minW="120px"
              >
                Play Again
              </Button>
            )}
            <Button 
              colorScheme="red" 
              onClick={handleLeaveGame}
              isDisabled={!gameState.gameEnded && gameState.gameStarted}
              size={["sm", "md"]}
              minW="120px"
            >
              {gameState.gameEnded ? 'Leave Game' : 'Surrender'}
            </Button>
          </HStack>
        </VStack>

        <VStack spacing={8} width="100%" align="center">
          <VStack spacing={3} width="100%" align="center">
            <Text fontSize={["md", "lg"]} fontWeight="bold" textAlign="center" color={isDark ? "white" : "inherit"}>
              Your Board
              {hasFinishedPlacing && !gameState.gameStarted && (
                <Badge colorScheme="green" ml={2}>Ready</Badge>
              )}
            </Text>
            <Center width="100%">
              {renderBoard(myBoard, true)}
            </Center>
          </VStack>
          
          {opponent && (
            <VStack spacing={3} width="100%" align="center">
              <Text fontSize={["md", "lg"]} fontWeight="bold" textAlign="center" color={isDark ? "white" : "inherit"}>
                Opponent's Board
              </Text>
              <Center width="100%">
                {renderBoard(opponentBoard, false)}
              </Center>
            </VStack>
          )}
        </VStack>

        <Text 
          fontSize={["md", "lg"]} 
          fontWeight="bold"
          textAlign="center"
          color={
            gameState.gameEnded 
              ? (gameState.winner === playerId ? 'green.500' : 'red.500')
              : (gameState.currentTurn === playerId ? 'green.500' : 'red.500')
          }
          mt={4}
        >
          {gameState.gameEnded
            ? (gameState.winner === playerId ? 'Victory!' : 'Defeat!')
            : (gameState.isPlacingShips
              ? (hasFinishedPlacing 
                  ? 'Waiting for opponent to place ships...'
                  : 'Place your ships!')
              : gameState.currentTurn === playerId
                ? 'Your turn!'
                : "Opponent's turn")}
        </Text>
      </VStack>
    </Center>
  );
}; 