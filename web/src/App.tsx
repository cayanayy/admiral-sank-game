import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { theme } from './theme.ts';
import { GameScreen } from './components/GameScreen.tsx';

export const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode="dark" />
      <GameScreen />
    </ChakraProvider>
  );
};
