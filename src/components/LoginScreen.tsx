import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useGameStore } from '../store/gameStore';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const connect = useGameStore((state) => state.connect);
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a username',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    connect(username.trim());
  };

  return (
    <Container maxW="container.sm" py={8}>
      <VStack spacing={8}>
        <Heading>Admiral Sank Game</Heading>
        <Box w="full" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </FormControl>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
              >
                Join Game
              </Button>
            </Stack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}; 