const jwt = require("jsonwebtoken");
const User = require("../models/User");
const eventBus = require("../events/eventBus");

function attachChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const bearer = socket.handshake.headers.authorization;
const token = socket.handshake.auth?.token || bearer?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("username role");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join("general");
    socket.emit("chat:connected", {
      message: "Connected to general chat",
      user: socket.user.username,
      room: "general",
    });

    socket.on("chat:join", (roomName, acknowledge) => {
      const room = String(roomName || "").trim();

      if (!/^[a-zA-Z0-9_-]{1,40}$/.test(room)) {
        if (typeof acknowledge === "function") {
          acknowledge({ ok: false, message: "Invalid room name" });
        }
        return;
      }

      socket.join(room);

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true, room });
      }

      socket.to(room).emit("chat:user-joined", {
        username: socket.user.username,
        room,
      });
    });

    socket.on("chat:message", (payload = {}, acknowledge) => {
      const room = String(payload.room || "general").trim();
      const content = String(payload.content || "").trim();

      if (!socket.rooms.has(room)) {
        if (typeof acknowledge === "function") {
          acknowledge({ ok: false, message: "Join this room before sending messages" });
        }
        return;
      }

      if (!/^[a-zA-Z0-9_-]{1,40}$/.test(room) || !content || content.length > 1000) {
        if (typeof acknowledge === "function") {
          acknowledge({ ok: false, message: "Room or message is invalid" });
        }
        return;
      }

      const message = {
        room,
        content,
        sender: {
          id: socket.user._id.toString(),
          username: socket.user.username,
        },
        sentAt: new Date().toISOString(),
      };

      eventBus.emit("chat:message", {
        room,
        userId: socket.user._id.toString(),
      });

      io.to(room).emit("chat:message", message);

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true, message });
      }
    });

    socket.on("chat:typing", (roomName) => {
      const room = String(roomName || "general").trim();

      if (socket.rooms.has(room)) {
        socket.to(room).emit("chat:typing", {
          username: socket.user.username,
          room,
        });
      }
    });
  });
}

module.exports = attachChatSocket;