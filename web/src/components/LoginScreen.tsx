import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  useColorMode,
  Center,
} from '@chakra-ui/react';
import { useGameStore } from '../store/gameStore';

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const connect = useGameStore((state) => state.connect);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

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

    if (username.trim().toLowerCase() === 'esma') {
      toast({
        title: '💖 Hoş Geldin Tanrım!',
        description: 'Seni çok seviyorum öpeyim mi?',
        status: 'success',
        duration: 5000 * 10,
        isClosable: true,
        position: 'top',
      });
    }

    connect(username.trim());
  };

  return (
    <Center 
      minH="100vh" 
      bg={isDark ? "gray.900" : "blue.50"}
      bgImage="url('https://www.transparenttextures.com/patterns/navy.png')"
      bgBlendMode="overlay"
    >
      <Container maxW="container.sm" py={8}>
        <VStack spacing={8} align="center">
          <VStack spacing={3}>
            <Heading 
              size="2xl" 
              color={isDark ? "blue.300" : "blue.600"}
              textShadow="1px 1px 2px rgba(0,0,0,0.2)"
            >
              ⚓️ Battleship
            </Heading>
            <Text 
              fontSize="lg" 
              color={isDark ? "gray.400" : "gray.600"}
              textAlign="center"
            >
              Command your fleet in an epic naval battle!
            </Text>
          </VStack>

          <Box 
            w="full" 
            p={8} 
            borderRadius="2xl" 
            boxShadow="dark-lg"
            bg={isDark ? "gray.800" : "white"}
            border="2px solid"
            borderColor={isDark ? "blue.400" : "blue.200"}
            maxW="400px"
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel 
                    fontSize="lg"
                    color={isDark ? "blue.300" : "blue.600"}
                    fontWeight="bold"
                  >
                    Enter Your Captain Name
                  </FormLabel>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Captain..."
                    size="lg"
                    bg={isDark ? "gray.700" : "white"}
                    borderColor={isDark ? "blue.400" : "blue.200"}
                    _hover={{
                      borderColor: isDark ? "blue.300" : "blue.300"
                    }}
                    _focus={{
                      borderColor: isDark ? "blue.300" : "blue.400",
                      boxShadow: `0 0 0 1px ${isDark ? "#63B3ED" : "#4299E1"}`
                    }}
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  fontSize="lg"
                  h="56px"
                  boxShadow="md"
                  _hover={{
                    transform: "translateY(-2px)",
                    boxShadow: "lg"
                  }}
                  _active={{
                    transform: "translateY(0)",
                    boxShadow: "md"
                  }}
                >
                  🚢 Set Sail
                </Button>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Center>
  );
}; 