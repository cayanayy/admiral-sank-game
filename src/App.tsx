import { ChakraProvider } from '@chakra-ui/react'
import { LoginScreen } from './components/LoginScreen'
import { LobbyScreen } from './components/LobbyScreen'
import { GameBoard } from './components/GameBoard'
import { useGameStore } from './store/gameStore'

function App() {
  const { username, gameState } = useGameStore()

  return (
    <ChakraProvider>
      {!username ? (
        <LoginScreen />
      ) : !gameState ? (
        <LobbyScreen />
      ) : (
        <GameBoard />
      )}
    </ChakraProvider>
  )
}

export default App
