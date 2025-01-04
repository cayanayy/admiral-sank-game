import React from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  List,
  ListItem,
  Text,
  VStack,
  useToast,
  HStack,
  Badge,
  useColorMode,
  Center,
  Flex,
  Divider
} from '@chakra-ui/react';
import { useGameStore } from '../store/gameStore';
import {
  HEADINGS,
  MESSAGES,
} from '../constants/gameConstants';

interface Game {
  id: string;
  player1: string | null;
  player2: string | null;
  status: 'waiting' | 'in_progress';
}

export const LobbyScreen: React.FC = () => {
  const {
    username,
    lobbyState,
    createGame,
    joinGame,
    disconnect
  } = useGameStore();

  const toast = useToast();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const handleCreateGame = () => {
    createGame();
    toast({
      title: MESSAGES.GAME_CREATED.TITLE,
      description: MESSAGES.GAME_CREATED.DESCRIPTION,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
  };

  const handleJoinGame = (gameId: string) => {
    joinGame(gameId);
  };

  const handleLogout = () => {
    disconnect();
  };

  return (
    <Center 
      minH="100vh" 
      bg={isDark ? "gray.900" : "blue.50"}
      bgImage="url('https://www.transparenttextures.com/patterns/navy.png')"
      bgBlendMode="overlay"
    >
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box
            bg={isDark ? "gray.800" : "white"}
            p={6}
            borderRadius="2xl"
            boxShadow="dark-lg"
            border="2px solid"
            borderColor={isDark ? "blue.400" : "blue.200"}
          >
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading 
                  size="lg" 
                  color={isDark ? "blue.300" : "blue.600"}
                  textShadow="1px 1px 2px rgba(0,0,0,0.2)"
                >
                  {HEADINGS.WELCOME(username || '')}
                </Heading>
                <Text color={isDark ? "gray.400" : "gray.600"}>
                  Ready for battle, Captain?
                </Text>
              </VStack>
              <Button 
                colorScheme="red" 
                onClick={handleLogout}
                size="lg"
                variant="outline"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "lg"
                }}
              >
                🚪 Return to Port
              </Button>
            </HStack>
          </Box>

          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            gap={8}
          >
            {/* Available Games */}
            <Box flex={2}>
              <VStack 
                spacing={4} 
                align="stretch"
                bg={isDark ? "gray.800" : "white"}
                p={6}
                borderRadius="2xl"
                boxShadow="dark-lg"
                border="2px solid"
                borderColor={isDark ? "blue.400" : "blue.200"}
              >
                <Heading 
                  size="md" 
                  color={isDark ? "blue.300" : "blue.600"}
                  textShadow="1px 1px 2px rgba(0,0,0,0.2)"
                >
                  {HEADINGS.ACTIVE_GAMES}
                </Heading>
                
                <Divider borderColor={isDark ? "blue.400" : "blue.200"} />

                {lobbyState.games.length === 0 ? (
                  <Text 
                    color={isDark ? "gray.400" : "gray.600"}
                    fontSize="lg"
                    textAlign="center"
                    py={4}
                  >
                    {MESSAGES.NO_GAMES}
                  </Text>
                ) : (
                  <List spacing={4}>
                    {(lobbyState.games as Game[]).map((game) => (
                      <ListItem
                        key={game.id}
                        p={4}
                        bg={isDark ? "gray.700" : "gray.50"}
                        borderRadius="xl"
                        borderWidth="2px"
                        borderColor={isDark ? "blue.500" : "blue.200"}
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "lg",
                          borderColor: isDark ? "blue.400" : "blue.300"
                        }}
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={2}>
                            <HStack>
                              <Text 
                                fontWeight="bold"
                                color={isDark ? "blue.300" : "blue.600"}
                              >
                                Battle #{game.id}
                              </Text>
                              <Badge
                                colorScheme={game.player2 ? 'red' : 'green'}
                                fontSize="sm"
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                {game.player2 ? '⚔️ In Battle' : '⏳ Recruiting'}
                              </Badge>
                            </HStack>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" color={isDark ? "gray.400" : "gray.600"}>
                                Captain: {game.player1}
                              </Text>
                              {game.player2 && (
                                <Text fontSize="sm" color={isDark ? "gray.400" : "gray.600"}>
                                  Challenger: {game.player2}
                                </Text>
                              )}
                            </VStack>
                          </VStack>
                          {!game.player2 && game.player1 !== username && (
                            <Button
                              colorScheme="blue"
                              onClick={() => handleJoinGame(game.id)}
                              size="lg"
                              _hover={{
                                transform: "translateY(-2px)",
                                boxShadow: "lg"
                              }}
                            >
                              ⚔️ Join Battle
                            </Button>
                          )}
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                )}

                <Button
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  onClick={handleCreateGame}
                  h="56px"
                  fontSize="lg"
                  boxShadow="md"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "lg"
                  }}
                >
                  🚢 Start New Battle
                </Button>
              </VStack>
            </Box>

            {/* Online Users */}
            <Box flex={1}>
              <VStack 
                spacing={4} 
                align="stretch"
                bg={isDark ? "gray.800" : "white"}
                p={6}
                borderRadius="2xl"
                boxShadow="dark-lg"
                border="2px solid"
                borderColor={isDark ? "blue.400" : "blue.200"}
              >
                <Heading 
                  size="md"
                  color={isDark ? "blue.300" : "blue.600"}
                  textShadow="1px 1px 2px rgba(0,0,0,0.2)"
                >
                  {HEADINGS.ONLINE_USERS}
                </Heading>

                <Divider borderColor={isDark ? "blue.400" : "blue.200"} />

                <List spacing={2}>
                  {lobbyState.users.map((user) => (
                    <ListItem
                      key={user}
                      p={3}
                      bg={user === username ? (isDark ? "blue.900" : "blue.50") : "transparent"}
                      borderRadius="lg"
                      transition="all 0.2s"
                      _hover={{
                        bg: isDark ? "gray.700" : "gray.50"
                      }}
                    >
                      <HStack>
                        <Text 
                          color={user === username 
                            ? (isDark ? "blue.300" : "blue.600") 
                            : (isDark ? "gray.300" : "gray.700")}
                          fontWeight={user === username ? "bold" : "normal"}
                        >
                          {user}
                        </Text>
                        {user === username && (
                          <Badge 
                            colorScheme="blue"
                            fontSize="sm"
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            ⭐️ You
                          </Badge>
                        )}
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </VStack>
            </Box>
          </Flex>
        </VStack>
      </Container>
    </Center>
  );
}; 