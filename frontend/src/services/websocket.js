let socket = null

export const connectWebSocket = (userId, token) => {
  if (socket) {
    socket.close()
  }

  const wsUrl =
    process.env.REACT_APP_WS_URL || process.env.REACT_APP_API_URL?.replace("http", "ws") || "ws://localhost:8000"

  socket = new WebSocket(`${wsUrl}/ws/notifications?token=${token}`)

  socket.onopen = () => {
    console.log("WebSocket connection established")
    // Subscribe to user-specific notifications
    socket.send(
      JSON.stringify({
        type: "subscribe",
        channel: `user.${userId}`,
      }),
    )
  }

  socket.onclose = () => {
    console.log("WebSocket connection closed")
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      if (localStorage.getItem("token")) {
        connectWebSocket(userId, token)
      }
    }, 5000)
  }

  socket.onerror = (error) => {
    console.error("WebSocket error:", error)
  }

  return socket
}

export const disconnectWebSocket = () => {
  if (socket) {
    socket.close()
    socket = null
  }
}

export const getSocket = () => socket
