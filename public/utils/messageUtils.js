/**
 * Utility functions for message handling and formatting
 */

// Format timestamp into a readable time
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Sanitize user input to prevent XSS attacks
export function sanitizeInput(input) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Create message HTML element
export function createMessageElement(message, isOwnMessage = false) {
  const messageElement = document.createElement('div');
  
  // Set class based on message type
  if (message.system) {
    messageElement.className = 'message message-system';
    messageElement.textContent = message.text;
    return messageElement;
  }
  
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
  messageTime.textContent = formatTimestamp(message.timestamp);
  messageMeta.appendChild(messageTime);
  
  messageElement.appendChild(messageMeta);
  
  return messageElement;
}

// Validate message
export function validateMessage(message) {
  // Check if message is empty or just whitespace
  if (!message || message.trim() === '') {
    return false;
  }
  
  // Check if message is too long (e.g., 500 characters)
  if (message.length > 500) {
    return false;
  }
  
  return true;
}