// Global variables
const socket = io();
let username = '';
let typing = false;
let lastTypingTime;
const TYPING_TIMER_LENGTH = 1000; // How long until typing indicator disappears
let currentRoom = null;

// DOM Elements
const usernameModal = document.getElementById('username-modal');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const roomModal = document.getElementById('room-modal');
const roomForm = document.getElementById('room-form');
const roomInput = document.getElementById('room-input');
const messageForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages');
const typingIndicator = document.getElementById('typing-indicator');
const onlineCount = document.getElementById('online-count');
const roomNameDisplay = document.getElementById('room-name');

// Utility functions
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sanitizeInput = (input) => {
  // Basic XSS protection
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
};

const scrollToBottom = () => {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// Adds a message to the chat
const addMessageToChat = (message, isOwnMessage = false) => {
  const messageElement = document.createElement('div');
  
  // Set class based on message type
  if (message.system) {
    messageElement.className = 'message message-system';
    messageElement.textContent = message.text;
  } else {
    messageElement.className = isOwnMessage ? 'message message-own' : 'message message-other';
    
    // Message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message.text;
    messageElement.appendChild(messageContent);
    
    // Message metadata (username and timestamp)
    const messageMeta = document.createElement('div');
    messageMeta.className = 'message-meta';
    
    if (!isOwnMessage) {
      const messageUser = document.createElement('span');
      messageUser.className = 'message-username';
      messageUser.textContent = message.username;
      messageMeta.appendChild(messageUser);
    }
    
    const messageTime = document.createElement('span');
    messageTime.className = 'message-timestamp';
    messageTime.textContent = formatTime(message.timestamp);
    messageMeta.appendChild(messageTime);
    
    messageElement.appendChild(messageMeta);
  }
  
  messagesContainer.appendChild(messageElement);
  scrollToBottom();
};

// Typing indicator functions
const updateTyping = () => {
  if (!typing) {
    typing = true;
    socket.emit('typing');
  }
  
  lastTypingTime = new Date().getTime();
  
  setTimeout(() => {
    const timeNow = new Date().getTime();
    const timeDiff = timeNow - lastTypingTime;
    
    if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
      socket.emit('stop typing');
      typing = false;
    }
  }, TYPING_TIMER_LENGTH);
};

// Event Listeners
usernameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (usernameInput.value.trim()) {
    username = sanitizeInput(usernameInput.value.trim());
    usernameModal.style.display = 'none';
    roomModal.style.display = 'flex';
    roomInput.focus();
    
    // Notify server of new user
    socket.emit('add user', username);
  }
});

roomForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (roomInput.value.trim()) {
    const room = sanitizeInput(roomInput.value.trim());
    currentRoom = room;
    roomModal.style.display = 'none';
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
    roomNameDisplay.textContent = room;
    
    // Join the room on the server
    socket.emit('join room', room);
    
    // Clear previous messages
    messagesContainer.innerHTML = '';
    
    // Show welcome message for the room
    addMessageToChat({
      system: true,
      text: `You joined room: ${room}`,
      timestamp: new Date().toISOString()
    });
  }
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const message = messageInput.value.trim();
  
  // Don't send empty messages
  if (!message) return;
  
  // Clear input
  messageInput.value = '';
  messageInput.focus();
  
  // Stop typing indicator
  socket.emit('stop typing');
  typing = false;
  
  // Create timestamp
  const timestamp = new Date().toISOString();
  
  // Add message to UI
  addMessageToChat({
    text: sanitizeInput(message),
    username: username,
    timestamp: timestamp
  }, true);
  
  // Send to server
  socket.emit('new message', {
    message: sanitizeInput(message)
  });
});

messageInput.addEventListener('input', () => {
  updateTyping();
});

// Socket Events
socket.on('login', (data) => {
  // Update online user count
  onlineCount.textContent = data.userCount;
});

socket.on('room joined', (data) => {
  // Update room info and user count
  roomNameDisplay.textContent = data.roomId;
  onlineCount.textContent = data.userCount;
});

socket.on('user joined room', (data) => {
  // Update online user count
  onlineCount.textContent = data.userCount;
  
  // Notify of new user in room
  addMessageToChat({
    system: true,
    text: `${data.username} joined the room`,
    timestamp: new Date().toISOString()
  });
});

socket.on('user left room', (data) => {
  // Update online user count
  onlineCount.textContent = data.userCount;
  
  // Notify of user leaving room
  addMessageToChat({
    system: true,
    text: `${data.username} left the room`,
    timestamp: new Date().toISOString()
  });
});

socket.on('new message', (data) => {
  // Add received message to chat
  addMessageToChat({
    text: data.message,
    username: data.username,
    timestamp: data.timestamp
  }, false);
});

socket.on('typing', (data) => {
  typingIndicator.textContent = `${data.username} is typing...`;
  typingIndicator.classList.add('typing-animation');
});

socket.on('stop typing', () => {
  typingIndicator.textContent = '';
  typingIndicator.classList.remove('typing-animation');
});

// Socket connection error handling
socket.on('connect_error', () => {
  addMessageToChat({
    system: true,
    text: 'Connection error. Please check your internet connection.',
    timestamp: new Date().toISOString()
  });
});

socket.on('disconnect', () => {
  addMessageToChat({
    system: true,
    text: 'You have been disconnected. Trying to reconnect...',
    timestamp: new Date().toISOString()
  });
});

socket.on('reconnect', () => {
  addMessageToChat({
    system: true,
    text: 'You have been reconnected!',
    timestamp: new Date().toISOString()
  });
  
  if (username) {
    socket.emit('add user', username);
    if (currentRoom) {
      socket.emit('join room', currentRoom);
    }
  }
});

// Initialize
window.onload = () => {
  usernameModal.style.display = 'flex';
  usernameInput.focus();
};
