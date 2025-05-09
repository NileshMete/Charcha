# Real-Time Chat App

This is a real-time chat application built with Node.js, Express, Socket.IO, and a simple frontend using HTML, CSS, and JavaScript. The app supports multiple chat rooms, allowing users to join different rooms and chat with others in real-time.

## Features

- User authentication by entering a username.
- Join or create chat rooms by entering a room name.
- Real-time messaging within chat rooms.
- Typing indicators to show when users are typing.
- Online user count display.
- Responsive and clean UI design.

## Technologies Used

- **Backend:** Node.js, Express, Socket.IO
- **Frontend:** HTML, CSS, JavaScript
- **Real-time Communication:** WebSockets via Socket.IO

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open your browser and navigate to:

   ```
   http://localhost:3000
   ```

## Usage

1. Enter a username to join the chat.
2. Enter a chat room name to join or create a new room.
3. Start sending messages in the chat room.
4. See who is online and when others are typing.

## Project Structure

- `server.js` - Backend server and Socket.IO setup.
- `public/` - Frontend static files:
  - `index.html` - Main HTML file.
  - `style.css` - Stylesheet for the app.
  - `script.js` - Frontend JavaScript handling UI and Socket.IO client.
- `package.json` - Project metadata and dependencies.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact [Your Name] at [your.email@example.com].
