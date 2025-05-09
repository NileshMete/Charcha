/**
 * Socket.io event handlers
 */

import { createMessageElement, sanitizeInput } from './messageUtils.js';

// Reference to DOM elements that will be initialized
let messagesContainer;
let typingIndicator;
let onlineCount;
let username = '';
let typing = false;
let lastTypingTime;
const TYPING_TIMER_LENGTH = 1000; // 1 second

// Initialize with DOM elements
export function initSocketHandlers(elements, socket) {
  messagesContainer = elements.messagesContainer;
  typingIndicator = elements.typingIndicator;
  onlineCount = elements.onlineCount;
  
  setupSocketListeners(socket);
  return {
    handleLogin: (user) => handleLogin(user, socket),
    handleSendMessage: (message) => handleSendMessage(message, socket),
    handleTyping: () => handleTyping(socket),
  };
}

// Set up all socket event listeners
function setupSocketListeners(socket) {
  // Connection events
  socket.on('login', (data) => {
    onlineCount.textContent = data.userCount;
    addSystemMessage(`Welcome to the chat, ${username}!`);
  });
  
  socket.on('user joined', (data) => {
    onlineCount.textContent = data.userCount;
    addSystemMessage(`${data.username} joined the chat`);
  });
  
  socket.on('user left', (data) => {
    onlineCount.textContent = data.userCount;
    addSystemMessage(`${data.username} left the chat`);
  });
  
  // Message events
  socket.on('new message', (data) => {
    addMessageToChat(data, false);
  });
  
  // Typing events
  socket.on('typing', (data) => {
    typingIndicator.textContent = `${data.username} is typing...`;
    typingIndicator.classList.add('typing-animation');
  });
  
  socket.on('stop typing', () => {
    typingIndicator.textContent = '';
    typingIndicator.classList.remove('typing-animation');
  });
  
  // Connection error handling
  socket.on('connect_error', () => {
    addSystemMessage('Connection error. Please check your internet connection.');
  });
  
  socket.on('disconnect', () => {
    addSystemMessage('You have been disconnected. Trying to reconnect...');
  });
  
  socket.on('reconnect', () => {
    addSystemMessage('You have been reconnected!');
    if (username) {
      socket.emit('add user', username);
    }
  });
}

// Handle user login
function handleLogin(user, socket) {
  username = sanitizeInput(user);
  socket.emit('add user', username);
}

// Handle sending a message
function handleSendMessage(message, socket) {
  const sanitizedMessage = sanitizeInput(message);
  const timestamp = new Date().toISOString();
  
  // Add to local chat
  addMessageToChat({
    text: sanitizedMessage,
    username: username,
    timestamp: timestamp
  }, true);
  
  // Send to server
  socket.emit('new message', {
    message: sanitizedMessage
  });
  
  // Stop typing indicator
  socket.emit('stop typing');
  typing = false;
}

// Handle typing events
function handleTyping(socket) {
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
}

// Add a message to the chat
function addMessageToChat(message, isOwnMessage = false) {
  const messageElement = createMessageElement(message, isOwnMessage);
  messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

// Add a system message
function addSystemMessage(text) {
  const message = {
    system: true,
    text: text,
    timestamp: new Date().toISOString()
  };
  addMessageToChat(message);
}

// Scroll to the bottom of the message container
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}