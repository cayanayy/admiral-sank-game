export const lobbyStyles = {
  container: (isDark: boolean) => ({
    minH: "100vh",
    bg: isDark ? "gray.900" : "gray.50",
    bgGradient: isDark 
      ? "linear(to-br, gray.900, gray.800, gray.900)"
      : "linear(to-br, gray.50, white, gray.50)",
    position: "relative" as const,
    overflow: "hidden",
    _before: {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgImage: isDark 
        ? "radial-gradient(circle at 25px 25px, gray.700 2%, transparent 0%), radial-gradient(circle at 75px 75px, gray.800 2%, transparent 0%)"
        : "radial-gradient(circle at 25px 25px, gray.100 2%, transparent 0%), radial-gradient(circle at 75px 75px, gray.200 2%, transparent 0%)",
      bgSize: "100px 100px",
      opacity: 0.4,
    }
  }),

  mainContent: {
    width: "100%",
    maxW: "800px",
    p: [4, 6, 8],
    spacing: 6
  },

  lobbyCard: (isDark: boolean) => ({
    width: "100%",
    bg: isDark ? "gray.800" : "white",
    p: 6,
    borderRadius: "xl",
    boxShadow: "xl",
    borderWidth: "1px",
    borderColor: isDark ? "gray.700" : "gray.200",
    spacing: 6
  }),

  gameCard: (isDark: boolean) => ({
    width: "100%",
    p: 4,
    bg: isDark ? "gray.700" : "gray.50",
    borderRadius: "md",
    boxShadow: "sm"
  }),

  userList: (isDark: boolean) => ({
    align: "start",
    spacing: 2,
    width: "100%",
    p: 4,
    bg: isDark ? "gray.700" : "gray.50",
    borderRadius: "md",
    boxShadow: "sm"
  }),

  createGameButton: (isDark: boolean) => ({
    colorScheme: isDark ? "blue" : "green",
    width: "200px",
    size: "lg",
    _hover: {
      transform: "translateY(-2px)",
      boxShadow: "lg"
    },
    transition: "all 0.2s"
  }),

  themeToggle: (isDark: boolean) => ({
    position: "absolute" as const,
    top: 4,
    right: 4,
    colorScheme: isDark ? "yellow" : "purple",
    size: "lg"
  }),

  text: {
    heading: (isDark: boolean) => ({
      color: isDark ? "white" : "gray.800",
      fontWeight: "bold"
    }),
    sectionTitle: (isDark: boolean) => ({
      fontSize: "lg",
      fontWeight: "bold",
      color: isDark ? "white" : "gray.800"
    }),
    normal: (isDark: boolean) => ({
      color: isDark ? "white" : "gray.700",
      fontWeight: "medium"
    }),
    secondary: (isDark: boolean) => ({
      color: isDark ? "gray.200" : "gray.600",
      fontSize: "sm"
    }),
    highlight: (isDark: boolean) => ({
      color: isDark ? "blue.200" : "blue.500",
      fontSize: "sm",
      fontWeight: "bold"
    })
  }
}; 