# Fearless Family Chat Application

A real-time family chat application built with Next.js, WebSocket, and TanStack Query.

## Features

- Real-time messaging with WebSocket support
- Family-based chat rooms
- Typing indicators
- Online user status
- Fallback to REST API when WebSocket is unavailable
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Install additional dependencies for WebSocket server:

```bash
npm install socket.io concurrently
```

## Running the Application

### Option 1: Full Stack (Recommended)

Run both the Next.js frontend and WebSocket server simultaneously:

```bash
npm run dev:full
```

This will start:

- Next.js frontend on http://localhost:3000
- WebSocket server on http://localhost:3001

### Option 2: Frontend Only

If you only want to run the frontend (WebSocket features will be disabled):

```bash
npm run dev
```

### Option 3: Separate Processes

Run the frontend and WebSocket server in separate terminals:

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run websocket
```

## WebSocket Issues Fixed

The application has been updated to handle WebSocket connection issues gracefully:

### 1. **Connection Timeout Handling**

- Reduced connection timeout from 20s to 10s
- Added exponential backoff for reconnection attempts
- Limited reconnection attempts to 3 tries

### 2. **Fallback to REST API**

- When WebSocket connection fails, the app automatically falls back to REST API
- Messages can still be sent and received via HTTP endpoints
- No functionality is lost when WebSocket is unavailable

### 3. **Better Error Handling**

- Added connection error states
- Graceful degradation when backend is not available
- Clear error messages for users

### 4. **API Routes**

- Created Next.js API routes for messages and family members
- In-memory storage for development (replace with database in production)
- Proper error handling and status codes

## API Endpoints

### Messages

- `GET /api/families/[familyId]/messages` - Get messages for a family
- `POST /api/families/[familyId]/messages` - Send a message

### Family Members

- `GET /api/families/[familyId]/members` - Get family members
- `POST /api/families/[familyId]/members` - Add a family member

## WebSocket Events

### Client to Server

- `joinFamily` - Join a family chat room
- `leaveFamily` - Leave a family chat room
- `sendMessage` - Send a message
- `typing` - Send typing indicator
- `getFamilyMembers` - Get online family members
- `ping` - Test connection

### Server to Client

- `connected` - Connection confirmation
- `joinedFamily` - Family join confirmation
- `leftFamily` - Family leave confirmation
- `newMessage` - New message received
- `recentMessages` - Recent messages when joining
- `userTyping` - User typing indicator
- `userJoined` - User joined notification
- `userLeft` - User left notification
- `familyMembers` - Online family members list
- `pong` - Ping response

## Development

### File Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── families/      # Family-related endpoints
│   └── family/            # Family chat pages
├── client/                # Client-side code
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── services/         # API and WebSocket services
│   └── types/            # TypeScript types
└── websocket-server.js   # WebSocket server
```

### Key Components

1. **useWebSocketWithQuery** - Main hook for WebSocket and API integration
2. **WebSocketService** - WebSocket client service
3. **FamilyChatPage** - Main chat interface
4. **MessageList** - Message display component
5. **MessageInput** - Message input component

## Troubleshooting

### WebSocket Connection Issues

1. Ensure the WebSocket server is running on port 3001
2. Check that CORS is properly configured
3. Verify the WebSocket URL in the client code
4. Check browser console for connection errors

### API 404 Errors

1. Ensure Next.js API routes are properly set up
2. Check that the API endpoints match the client requests
3. Verify the request/response formats

### Performance Issues

1. The app now uses exponential backoff for reconnections
2. Connection attempts are limited to prevent infinite loops
3. Fallback to REST API ensures functionality even without WebSocket

## Production Deployment

For production deployment:

1. Replace in-memory storage with a proper database
2. Configure environment variables for WebSocket server URL
3. Set up proper CORS configuration
4. Add authentication and authorization
5. Implement message persistence
6. Add rate limiting and security measures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
