module.exports = {
  apps: [{
    name: "battleship-frontend",
    cwd: "/var/www/battleship-game/web", // Your Vite project directory
    script: "npm",
    args: "run dev", // Or "run preview" for production
    env: {
      VITE_BACKEND_URL: "ws://167.71.57.215:1403/ws"
    },
  }]
}
