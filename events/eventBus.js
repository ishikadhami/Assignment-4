const EventEmitter = require("events");

const eventBus = new EventEmitter();

eventBus.on("user:registered", ({ userId }) => {
  console.log(`[event] user registered: ${userId}`);
});

eventBus.on("note:created", ({ noteId, userId }) => {
  console.log(`[event] note created: ${noteId} by ${userId}`);
});

eventBus.on("note:updated", ({ noteId, userId }) => {
  console.log(`[event] note updated: ${noteId} by ${userId}`);
});

eventBus.on("note:deleted", ({ noteId, userId }) => {
  console.log(`[event] note deleted: ${noteId} by ${userId}`);
});

eventBus.on("chat:message", ({ room, userId }) => {
  console.log(`[event] chat message in ${room} by ${userId}`);
});

module.exports = eventBus;