import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(join(__dirname, 'public')));

// Store active users and rooms
const users = {};
const rooms = new Map();
let userCount = 0;

io.on('connection', (socket) => {
  let addedUser = false;
  let currentRoom = null;

  // Handle joining a room
  socket.on('join room', (roomId) => {
    // Leave current room if in one
    if (currentRoom) {
      socket.leave(currentRoom);
      socket.to(currentRoom).emit('user left room', {
        username: socket.username,
        userCount: rooms.get(currentRoom)?.size || 0
      });
    }

    // Join new room
    socket.join(roomId);
    currentRoom = roomId;

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.username);

    // Notify room members
    socket.to(roomId).emit('user joined room', {
      username: socket.username,
      userCount: rooms.get(roomId).size
    });

    // Send room info to the user
    socket.emit('room joined', {
      roomId,
      userCount: rooms.get(roomId).size
    });
  });

  // Handle new messages
  socket.on('new message', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('new message', {
        username: socket.username,
        message: data.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle user joining
  socket.on('add user', (username) => {
    if (addedUser) return;

    socket.username = username;
    users[socket.id] = username;
    ++userCount;
    addedUser = true;

    socket.emit('login', {
      userCount: userCount
    });
  });

  // Handle typing events
  socket.on('typing', () => {
    if (currentRoom) {
      socket.to(currentRoom).emit('typing', {
        username: socket.username
      });
    }
  });

  // Handle stop typing events
  socket.on('stop typing', () => {
    if (currentRoom) {
      socket.to(currentRoom).emit('stop typing', {
        username: socket.username
      });
    }
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    if (addedUser) {
      --userCount;
      delete users[socket.id];

      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(socket.username);
        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom);
        } else {
          socket.to(currentRoom).emit('user left room', {
            username: socket.username,
            userCount: rooms.get(currentRoom).size
          });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`For local network access, use your computer's IP address: http://<your-ip>:${PORT}`);
});