import React from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  List,
  ListItem,
  Stack,
  Text,
  useToast,
  VStack,
  HStack,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { useGameStore } from '../store/gameStore';
import {
  GAME_STATUS,
  PLAYER_ROLES,
  BUTTON_TEXT,
  HEADINGS,
  MESSAGES,
  PLAYER_STATUS
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
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const userBgColor = useColorModeValue('blue.50', 'blue.900');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const noGamesTextColor = useColorModeValue('gray.500', 'gray.400');

  const handleCreateGame = () => {
    createGame();
    toast({
      title: MESSAGES.GAME_CREATED.TITLE,
      description: MESSAGES.GAME_CREATED.DESCRIPTION,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleJoinGame = (gameId: string) => {
    joinGame(gameId);
  };

  const handleLogout = () => {
    disconnect();
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">{HEADINGS.WELCOME(username || '')}</Heading>
          <Button colorScheme="red" onClick={handleLogout}>
            {BUTTON_TEXT.LEAVE_GAME}
          </Button>
        </HStack>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={8}>
          {/* Available Games */}
          <Box flex={2}>
            <Heading size="md" mb={4}>{HEADINGS.ACTIVE_GAMES}</Heading>
            {lobbyState.games.length === 0 ? (
              <Text color={noGamesTextColor}>{MESSAGES.NO_GAMES}</Text>
            ) : (
              <List spacing={3}>
                {(lobbyState.games as Game[]).map((game) => (
                  <ListItem
                    key={game.id}
                    p={4}
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{HEADINGS.BATTLE(game.id)}</Text>
                        <Text fontSize="sm" color={secondaryTextColor}>
                          {PLAYER_ROLES.CAPTAIN}: {game.player1}
                        </Text>
                        {game.player2 && (
                          <Text fontSize="sm" color={secondaryTextColor}>
                            {PLAYER_ROLES.CHALLENGER}: {game.player2}
                          </Text>
                        )}
                        <Badge
                          colorScheme={game.player2 ? 'red' : 'green'}
                        >
                          {game.player2 ? GAME_STATUS.IN_PROGRESS : GAME_STATUS.WAITING}
                        </Badge>
                      </VStack>
                      {!game.player2 && game.player1 !== username && (
                        <Button
                          colorScheme="blue"
                          onClick={() => handleJoinGame(game.id)}
                        >
                          {BUTTON_TEXT.JOIN_GAME}
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
              mt={4}
              onClick={handleCreateGame}
            >
              {BUTTON_TEXT.CREATE_GAME}
            </Button>
          </Box>

          {/* Online Users */}
          <Box flex={1}>
            <Heading size="md" mb={4}>{HEADINGS.ONLINE_USERS}</Heading>
            <List spacing={2}>
              {lobbyState.users.map((user) => (
                <ListItem
                  key={user}
                  p={3}
                  bg={user === username ? userBgColor : 'transparent'}
                  borderRadius="md"
                >
                  <HStack>
                    <Text>{user}</Text>
                    {user === username && (
                      <Badge colorScheme="blue">{PLAYER_STATUS.YOU}</Badge>
                    )}
                  </HStack>
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      </VStack>
    </Container>
  );
}; 