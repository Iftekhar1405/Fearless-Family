const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Store connected users and family rooms
const connectedUsers = new Map();
const familyRooms = new Map();

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  // Handle connection confirmation
  socket.emit("connected", {
    socketId: socket.id,
    serverTime: new Date().toISOString(),
    transport: socket.conn.transport.name,
  });

  // Handle ping
  socket.on("ping", (data) => {
    console.log("🏓 Received ping from:", data.userId);
    socket.emit("pong", {
      userId: data.userId,
      timestamp: data.timestamp,
      serverTime: new Date().toISOString(),
      transport: socket.conn.transport.name,
    });
  });

  // Handle joining a family
  socket.on("joinFamily", (data) => {
    const { familyId, userId, username } = data;
    console.log(`👥 User ${username || userId} joining family: ${familyId}`);

    // For development, allow any user to join any family
    // In production, you would check if the user is actually a member of this family

    // Join the family room
    socket.join(familyId);

    // Store user info
    connectedUsers.set(socket.id, {
      userId,
      username: username || "Anonymous",
      familyId,
      socketId: socket.id,
    });

    // Add user to family room
    if (!familyRooms.has(familyId)) {
      familyRooms.set(familyId, new Set());
    }
    familyRooms.get(familyId).add(socket.id);

    // Confirm join
    socket.emit("joinedFamily", { familyId, success: true });

    // Notify other users in the family
    socket.to(familyId).emit("userJoined", {
      userId,
      username: username || "Anonymous",
    });

    // Send current online users
    const onlineUsers = Array.from(familyRooms.get(familyId) || [])
      .map((socketId) => {
        const user = connectedUsers.get(socketId);
        return user
          ? {
              socketId: user.socketId,
              username: user.username,
            }
          : null;
      })
      .filter(Boolean);

    socket.emit("familyMembers", {
      familyId,
      onlineUsers,
      count: onlineUsers.length,
    });

    // Send recent messages (empty for now)
    socket.emit("recentMessages", {
      familyId,
      messages: [],
    });
  });

  // Handle leaving a family
  socket.on("leaveFamily", () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const { familyId, userId, username } = user;
      console.log(`👋 User ${username || userId} leaving family: ${familyId}`);

      // Remove from family room
      if (familyRooms.has(familyId)) {
        familyRooms.get(familyId).delete(socket.id);
        if (familyRooms.get(familyId).size === 0) {
          familyRooms.delete(familyId);
        }
      }

      // Notify other users
      socket.to(familyId).emit("userLeft", {
        userId,
        username: username || "Anonymous",
      });

      // Remove user info
      connectedUsers.delete(socket.id);
    }

    socket.emit("leftFamily", { success: true });
  });

  // Handle sending messages
  socket.on("sendMessage", (data) => {
    const { familyId, userId, username, content } = data;
    const user = connectedUsers.get(socket.id);

    if (user && user.familyId === familyId) {
      const message = {
        id: Date.now().toString(),
        familyId,
        senderId: userId,
        senderName: username || "Anonymous",
        content,
        timestamp: new Date(),
      };

      console.log(`💬 Message from ${username || userId}: ${content}`);

      // Broadcast to all users in the family
      io.to(familyId).emit("newMessage", message);
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { familyId, userId, username, isTyping } = data;
    const user = connectedUsers.get(socket.id);

    if (user && user.familyId === familyId) {
      socket.to(familyId).emit("userTyping", {
        userId,
        username: username || "Anonymous",
        isTyping,
      });
    }
  });

  // Handle getting family members
  socket.on("getFamilyMembers", (data) => {
    const { familyId } = data;
    const user = connectedUsers.get(socket.id);

    if (user && user.familyId === familyId) {
      const onlineUsers = Array.from(familyRooms.get(familyId) || [])
        .map((socketId) => {
          const user = connectedUsers.get(socketId);
          return user
            ? {
                socketId: user.socketId,
                username: user.username,
              }
            : null;
        })
        .filter(Boolean);

      socket.emit("familyMembers", {
        familyId,
        onlineUsers,
        count: onlineUsers.length,
      });
    }
  });

  // Handle demo/test connection
  socket.on("demo", (data) => {
    console.log("🧪 Demo/test connection:", data);
    socket.emit("onTesting", { success: true });
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log("🔌 Client disconnected:", socket.id, "Reason:", reason);

    const user = connectedUsers.get(socket.id);
    if (user) {
      const { familyId, userId, username } = user;

      // Remove from family room
      if (familyRooms.has(familyId)) {
        familyRooms.get(familyId).delete(socket.id);
        if (familyRooms.get(familyId).size === 0) {
          familyRooms.delete(familyId);
        }
      }

      // Notify other users
      socket.to(familyId).emit("userLeft", {
        userId,
        username: username || "Anonymous",
      });

      // Remove user info
      connectedUsers.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 CORS enabled for http://localhost:3000`);
  console.log(`🔗 WebSocket endpoint: http://localhost:${PORT}/chat`);
});
