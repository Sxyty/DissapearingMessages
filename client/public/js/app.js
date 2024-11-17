document.addEventListener('DOMContentLoaded', () => {
  const loginPage = document.getElementById('login-page');
  const chatPage = document.getElementById('chat-page');
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const messagesDiv = document.getElementById('messages');
  const chatMessageInput = document.getElementById('chat-message');
  const sendMessageButton = document.getElementById('send-message');

  let username;
  const userColors = {}; // User-Color mapping object
  const socket = io('http://localhost:5500'); // Connect to the WebSocket backend

  function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }
  

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    username = usernameInput.value.trim();

    // Assign a color to yourself
    if (!userColors[username]) {
      userColors[username] = getRandomColor();
    }

    try {
      // Fetch authentication token
      const response = await fetch('http://localhost:5500/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      const { token } = data;

      // Authenticate the user on the WebSocket server
      socket.emit('authenticate', { username, token });

      // Switch to chat page
      loginPage.style.display = 'none';
      chatPage.style.display = 'block';

      // Listen for new messages
      socket.on('message.new', (message) => {
        addMessageToUI(message.user.id, message.text);
      });
    } catch (err) {
      console.error('Error authenticating user:', err);
    }
  });

  sendMessageButton.addEventListener('click', () => {
    const message = chatMessageInput.value.trim();
    if (!message) return;

    // Send message to the server
    socket.emit('message.new', { text: message });
    chatMessageInput.value = '';
  });

  function addMessageToUI(user, text) {
    const messageDiv = document.createElement('div');

    // Assign a color to the user if not already assigned
    if (!userColors[user]) {
      userColors[user] = getRandomColor();
    }
    const userColor = userColors[user];

    // Apply styles to the message
    messageDiv.style.backgroundColor = userColor;
    messageDiv.style.padding = '5px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.marginBottom = '5px';

    messageDiv.textContent = `${user}: ${text}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});
