# 💬 Real-Time Chat Application

A full-stack, real-time messaging application built with Angular and Spring Boot, featuring WebSocket communication for instant message delivery.



## 🌟 Features

### Core Messaging
- ✅ **Real-time messaging** - Instant message delivery using WebSocket/STOMP
- ✅ **Group chat** - Public group messaging for all connected users
- ✅ **Message status** - Sending, sent, delivered, and read indicators
- ✅ **Typing indicators** - See when other users are typing
- ✅ **Join/Leave notifications** - Get notified when users connect or disconnect

### Rich Messaging Features
- ✅ **Message reactions** - React to messages with emojis (❤️, 😂, 😮, etc.)
- ✅ **Reply to messages** - Quote and respond to specific messages
- ✅ **Forward messages** - Share messages with others
- ✅ **Edit messages** - Modify sent messages inline
- ✅ **Delete messages** - Remove messages from chat
- ✅ **Star/Favorite messages** - Bookmark important messages
- ✅ **Voice messages** - Send voice recordings (simulated)
- ✅ **Image sharing** - Share images in conversations
- ✅ **File attachments** - Attach and share files

### User Experience
- ✅ **Search messages** - Find specific messages in conversation
- ✅ **Date separators** - Organized message timeline (Today, Yesterday, etc.)
- ✅ **Emoji picker** - Easy emoji selection
- ✅ **Context menu** - Right-click for message actions
- ✅ **Scroll to bottom** - Quick navigation to latest messages
- ✅ **Connection status** - Real-time connection indicator with auto-reconnect
- ✅ **Group info** - View group members and details
- ✅ **WhatsApp-inspired UI** - Familiar dark theme interface

## 🏗️ Architecture

```
┌─────────────────────────┐         WebSocket/STOMP        ┌─────────────────────────┐
│                         │◄──────────────────────────────►│                         │
│   Angular Frontend      │      ws://localhost:8080/ws    │   Spring Boot Backend   │
│   (Port 4200)           │                                │   (Port 8080)           │
│                         │                                │                         │
│  - Real-time UI         │                                │  - WebSocket Server     │
│  - Message display      │                                │  - STOMP Protocol       │
│  - User interactions    │                                │  - Message broadcast    │
│                         │                                │  - Session management   │
└─────────────────────────┘                                └─────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Angular 17+ (Standalone Components)
- **Language:** TypeScript
- **Styling:** CSS3 (Custom WhatsApp-inspired theme)
- **WebSocket Client:** SockJS + STOMP.js
- **State Management:** Component-based state

### Backend
- **Framework:** Spring Boot 3.x
- **Language:** Java 17+
- **WebSocket:** Spring WebSocket + STOMP
- **Build Tool:** Maven
- **Dependencies:**
  - `spring-boot-starter-websocket`
  - `lombok`
  - `spring-boot-starter-web`

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Angular CLI** (v17+)
  ```bash
  npm install -g @angular/cli
  ```
- **Java JDK** (17 or higher) - [Download](https://adoptium.net/)
- **Maven** (3.6+) - [Download](https://maven.apache.org/download.cgi)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chat-application.git
cd chat-application
```

### 2. Backend Setup

#### Navigate to backend directory
```bash
cd backend
```

#### Install dependencies and run
```bash
# On Mac/Linux
./mvnw clean install
./mvnw spring-boot:run

# On Windows
mvnw.cmd clean install
mvnw.cmd spring-boot:run
```

**Expected output:**
```
Started BackendApplication in X.XXX seconds (JVM running for X.XXX)
```

Backend will be running on: **http://localhost:8080**

### 3. Frontend Setup

#### Open a new terminal and navigate to frontend directory
```bash
cd frontend
```

#### Install dependencies
```bash
npm install
```

#### Start development server
```bash
ng serve
```

**Expected output:**
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200 **
```

Frontend will be running on: **http://localhost:4200**

## 🧪 Testing the Application

1. **Open your browser** and navigate to `http://localhost:4200`

2. **Check browser console (F12)** - You should see:
   ```
   🔌 Attempting to connect to: http://localhost:8080/ws
   ✅ Connected to WebSocket server
   ```

3. **Test real-time messaging:**
   - Open multiple browser tabs/windows at `http://localhost:4200`
   - Send a message in one tab
   - See it appear instantly in all other tabs! 🎉

4. **Test features:**
   - Send messages
   - React with emojis
   - Reply to messages
   - Forward messages
   - Star important messages
   - Search for messages
   - Upload images

## 📁 Project Structure

```
chat-application/
│
├── backend/                          # Spring Boot Backend
│   ├── src/
│   │   └── main/
│   │       └── java/
│   │           └── com/
│   │               └── chat/
│   │                   └── backend/
│   │                       ├── BackendApplication.java      # Main application
│   │                       ├── ChatController.java          # WebSocket endpoints
│   │                       ├── ChatMessage.java             # Message model
│   │                       ├── WebSocketConfig.java         # WebSocket configuration
│   │                       └── WebSocketEventListener.java  # Connection events
│   ├── pom.xml                       # Maven dependencies
│   ├── mvnw                          # Maven wrapper (Unix)
│   └── mvnw.cmd                      # Maven wrapper (Windows)
│
└── frontend/                         # Angular Frontend
    ├── src/
    │   ├── app/
    │   │   ├── app.ts                # Main component logic
    │   │   ├── app.html              # Component template
    │   │   ├── app.css               # Component styles
    │   │   └── app.config.ts         # App configuration
    │   ├── index.html                # Main HTML file
    │   ├── main.ts                   # Application entry point
    │   └── styles.css                # Global styles
    ├── angular.json                  # Angular configuration
    ├── package.json                  # npm dependencies
    └── tsconfig.json                 # TypeScript configuration
```

## 🔧 Configuration

### Backend Configuration

**WebSocket Endpoint:** `ws://localhost:8080/ws`

**STOMP Destinations:**
- **Send messages:** `/app/chat.sendMessage`
- **Add user:** `/app/chat.addUser`
- **Subscribe topic:** `/topic/public`

**CORS:** Configured to accept all origins (`*`) for development

### Frontend Configuration

**WebSocket Connection:** Configured in `app.ts`
```typescript
private readonly WS_ENDPOINT = 'http://localhost:8080/ws';
```

**Auto-reconnect:** Up to 5 attempts with exponential backoff

## 🎨 Features Demo

### Message Types
- **Text messages** - Standard chat messages
- **System notifications** - Join/leave events
- **Media messages** - Images and files
- **Voice messages** - Audio recordings
- **Quoted replies** - Reply to specific messages
- **Forwarded messages** - Reshared content

### Message Actions
- **React** - Add emoji reactions
- **Reply** - Quote and respond
- **Forward** - Share with others
- **Star** - Bookmark important messages
- **Edit** - Modify sent messages
- **Delete** - Remove messages
- **Search** - Find specific content

### UI Features
- **Dark theme** - WhatsApp-inspired design
- **Typing indicators** - Real-time typing status
- **Read receipts** - Message delivery status (✓, ✓✓, blue ✓✓)
- **Date separators** - Organized timeline
- **Scroll to bottom** - Quick navigation
- **Context menus** - Right-click actions
- **Modals** - Group info, starred messages, etc.

## 🐛 Troubleshooting

### Backend Issues

**Problem:** Port 8080 already in use
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8080
kill -9 <PID>
```

**Problem:** Maven build fails
```bash
# Clean and rebuild
./mvnw clean install -U
```

### Frontend Issues

**Problem:** Port 4200 already in use
```bash
# Use different port
ng serve --port 4201
```

**Problem:** npm install fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Problem:** Connection refused
- Ensure backend is running on port 8080
- Check browser console for WebSocket errors
- Verify `WS_ENDPOINT` in `app.ts`

### WebSocket Connection Issues

**Problem:** "Unable to connect to server"
1. Check backend is running: `http://localhost:8080/ws/info`
2. Should return JSON with `"websocket": true`
3. Check CORS settings in `WebSocketConfig.java`
4. Clear browser cache and reload

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. **Build for production:**
```bash
cd frontend
ng build --configuration production
```

2. **Deploy `dist/` folder** to your hosting service

3. **Update WebSocket endpoint** in production:
```typescript
private readonly WS_ENDPOINT = 'wss://your-backend.herokuapp.com/ws';
```

### Backend (Heroku/Railway)

1. **Add `Procfile`:**
```
web: java -jar target/backend-0.0.1-SNAPSHOT.jar
```

2. **Update CORS settings** for production domain

3. **Deploy** using Git or platform CLI

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

## 📝 Future Enhancements

- [ ] User authentication & registration
- [ ] Private/Direct messaging
- [ ] Message persistence (Database integration)
- [ ] File upload to cloud storage
- [ ] Video/Audio calls
- [ ] Message encryption
- [ ] User profiles & avatars
- [ ] Online/offline status tracking
- [ ] Push notifications
- [ ] Mobile app (React Native/Flutter)
- [ ] Message search across all chats
- [ ] Admin panel & moderation tools


## 👨‍💻 Author

**Your Name**
- GitHub: Ayush-Js((https://github.com/Ayush-js))
- LinkedIn: Ayush Mishra [https://www.linkedin.com/in/ayush-mishra-848b17254/]
## 🙏 Acknowledgments

- Inspired by WhatsApp Web
- Built with love using Angular and Spring Boot
- Special thanks to the open-source community


---

⭐ **If you found this project helpful, please give it a star!** ⭐

---

**Happy Coding! 🚀**
