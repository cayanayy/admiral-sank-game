// Grid coordinates
export const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
export const ROWS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

// Ship configurations
export const SHIPS = [
  { id: 1, name: 'Carrier', size: 5 },
  { id: 2, name: 'Battleship', size: 4 },
  { id: 3, name: 'Cruiser', size: 3 },
  { id: 4, name: 'Submarine', size: 3 },
  { id: 5, name: 'Destroyer', size: 2 }
]

// Ship designs for different types
export const SHIP_DESIGNS = {
  Carrier: {
    start: '⟨',
    middle: '◢',
    end: '▶',
    single: '◆',
    vstart: '▼',
    vmiddle: '█',
    vend: '▲',
    color: 'purple.500'
  },
  Battleship: {
    start: '◄',
    middle: '■',
    end: '►',
    single: '◼',
    vstart: '▼',
    vmiddle: '█',
    vend: '▲',
    color: 'blue.600'
  },
  Cruiser: {
    start: '⟨',
    middle: '▢',
    end: '⟩',
    single: '◇',
    vstart: '▽',
    vmiddle: '□',
    vend: '△',
    color: 'cyan.500'
  },
  Submarine: {
    start: '(',
    middle: '◎',
    end: ')',
    single: '○',
    vstart: '⌄',
    vmiddle: '◉',
    vend: '⌃',
    color: 'teal.500'
  },
  Destroyer: {
    start: '<',
    middle: '◈',
    end: '>',
    single: '◊',
    vstart: '▾',
    vmiddle: '◇',
    vend: '▴',
    color: 'green.500'
  }
}

// Hit/Miss markers
export const HIT_MARKER = '✸'
export const MISS_MARKER = '•' 

// Game Status
export const GAME_STATUS = {
  WAITING: '⏳ Seeking Challenger',
  IN_PROGRESS: '⚔️ Battle in Progress',
  FINISHED: '🏆 Battle Ended'
};

// Player Roles
export const PLAYER_ROLES = {
  CAPTAIN: 'Captain',
  CHALLENGER: 'Challenger'
};

// UI Elements
export const UI_ELEMENTS = {
  WELCOME: '⚓️',
  GAMES_SECTION: '🎮',
  BATTLE_FLAG: '🏴‍☠️',
  USERS_SECTION: '👥',
  CURRENT_USER: '⭐️',
  SWORD: '⚔️'
};

// Button Text
export const BUTTON_TEXT = {
  CREATE_GAME: 'Start New Battle ⚔️',
  JOIN_GAME: 'Join Battle',
  LEAVE_GAME: 'Leave Game'
};

// Headings
export const HEADINGS = {
  WELCOME: (username: string) => `Ahoy, ${username}! ${UI_ELEMENTS.WELCOME}`,
  ACTIVE_GAMES: `${UI_ELEMENTS.GAMES_SECTION} Active Games`,
  ONLINE_USERS: `${UI_ELEMENTS.USERS_SECTION} Sailors Online`,
  BATTLE: (id: string | null | undefined) => 
    id ? `Battle #${id} ${UI_ELEMENTS.BATTLE_FLAG}` : `Battle ${UI_ELEMENTS.BATTLE_FLAG}`
};

// Messages
export const MESSAGES = {
  NO_GAMES: `No games yet - why not start a new adventure? ${UI_ELEMENTS.SWORD}`,
  GAME_CREATED: {
    TITLE: 'Game Created! 🎮',
    DESCRIPTION: 'Get ready! Waiting for an opponent to join your game...'
  }
};

// Player Status
export const PLAYER_STATUS = {
  YOU: `${UI_ELEMENTS.CURRENT_USER} You`
}; 