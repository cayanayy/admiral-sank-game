import React from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Heading,
  useColorMode,
  Center,
  IconButton
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useGameStore } from '../store/gameStore';
import { lobbyStyles } from '../styles/lobbyStyles';

interface Game {
  id: string;
  player1: string | null;
  player2: string | null;
  status: 'waiting' | 'in_progress';
}

export const Lobby: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { username, lobbyState, createGame, joinGame } = useGameStore();

  return (
    <Box {...lobbyStyles.container(isDark)}>
      <IconButton
        aria-label="Toggle color mode"
        icon={isDark ? <SunIcon /> : <MoonIcon />}
        onClick={toggleColorMode}
        {...lobbyStyles.themeToggle(isDark)}
      />
      
      <Center minH="100vh" position="relative" zIndex={1}>
        <VStack {...lobbyStyles.mainContent}>
          <VStack {...lobbyStyles.lobbyCard(isDark)}>
            <Heading size="lg" {...lobbyStyles.text.heading(isDark)}>Game Lobby</Heading>
            
            <HStack width="100%" spacing={8} align="start">
              {/* Available Games Section */}
              <VStack flex={1} align="start" spacing={4}>
                <Text {...lobbyStyles.text.sectionTitle(isDark)}>
                  Available Games
                </Text>
                {lobbyState.games.length === 0 ? (
                  <Text {...lobbyStyles.text.secondary(isDark)}>No games available. Create one!</Text>
                ) : (
                  <VStack align="start" spacing={3} width="100%">
                    {lobbyState.games.map((game: Game) => (
                      <Box 
                        key={game.id} 
                        {...lobbyStyles.gameCard(isDark)}
                      >
                        <HStack justify="space-between" width="100%">
                          <VStack align="start" spacing={1}>
                            <Text {...lobbyStyles.text.normal(isDark)} fontWeight="bold">
                              Game #{game.id}
                            </Text>
                            <Text {...lobbyStyles.text.secondary(isDark)}>
                              {game.player1 ? `Player 1: ${game.player1}` : 'Waiting for Player 1'}
                            </Text>
                            <Text {...lobbyStyles.text.secondary(isDark)}>
                              {game.player2 ? `Player 2: ${game.player2}` : 'Waiting for Player 2'}
                            </Text>
                          </VStack>
                          {!game.player2 && game.player1 !== username && (
                            <Button 
                              colorScheme="blue" 
                              size="sm"
                              onClick={() => joinGame(game.id)}
                            >
                              Join Game
                            </Button>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>

              {/* Online Users Section */}
              <VStack flex={1} align="start" spacing={4}>
                <Text {...lobbyStyles.text.sectionTitle(isDark)}>
                  Online Users
                </Text>
                <VStack {...lobbyStyles.userList(isDark)}>
                  {lobbyState.users.map((user: string) => (
                    <HStack key={user} width="100%" spacing={2}>
                      <Text 
                        {...lobbyStyles.text.normal(isDark)}
                        fontWeight={user === username ? "bold" : "normal"}
                      >
                        {user}
                      </Text>
                      {user === username && (
                        <Text {...lobbyStyles.text.highlight(isDark)}>
                          (You)
                        </Text>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </HStack>

            <Button
              onClick={createGame}
              {...lobbyStyles.createGameButton(isDark)}
            >
              Create New Game
            </Button>
          </VStack>
        </VStack>
      </Center>
    </Box>
  );
}; 