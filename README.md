# Admiral Sank - Multiplayer Battleship Game

Admiral Sank is a modern, real-time multiplayer battleship game built with React, TypeScript, and WebSocket technology. Challenge your friends to an exciting naval warfare game where strategy and luck combine for an engaging gaming experience.

![Admiral Sank Game](screenshot.png)

## Features

- 🎮 Real-time multiplayer gameplay
- 🚢 Classic battleship mechanics with modern UI
- 🎯 Interactive ship placement
- 💫 Smooth animations and effects
- 🌓 Dark/Light mode support
- 🔄 Real-time game state updates
- 📱 Responsive design for all devices

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Chakra UI
  - Vite
  - WebSocket client

- Backend:
  - Node.js
  - Express
  - WebSocket server
  - CORS support

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/admiral-sank-game.git
cd admiral-sank-game
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
npm install

# Install server dependencies
cd server
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3001
VITE_WS_URL=ws://localhost:3001
NODE_ENV=development
```

### Running the Game

1. Start the server:
```bash
cd server
npm start
```

2. In a new terminal, start the client:
```bash
# From the project root
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## How to Play

1. **Starting a Game**
   - Enter your username
   - Create a new game or join an existing one using a game code
   - Share the game code with your friend to start playing

2. **Ship Placement**
   - Place your ships on the board
   - Use the rotation button to change ship orientation
   - Ships cannot be placed adjacent to each other
   - Place all 5 ships to begin the game

3. **Gameplay**
   - Take turns firing at your opponent's grid
   - 💥 Hit marker indicates a successful hit
   - ❌ Miss marker shows where you missed
   - Sink all enemy ships to win!

4. **Game Controls**
   - Left click to place ships/fire at enemy grid
   - Toggle button to rotate ships during placement
   - Dark/Light mode toggle for visual preference

## Development

### Project Structure
```
admiral-sank-game/
├── src/
│   ├── components/     # React components
│   ├── store/         # Game state management
│   ├── constants/     # Game constants
│   └── styles/        # Styling files
├── server/
│   └── server.js      # WebSocket server
└── public/            # Static assets
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests (if configured)

## Deployment

1. Build the client:
```bash
npm run build
```

2. Set up environment variables for production:
```env
PORT=3001
VITE_WS_URL=wss://your-production-domain.com
NODE_ENV=production
```

3. Deploy the built files to your hosting service

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the classic Battleship board game
- Built with modern web technologies
- Special thanks to all contributors

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
