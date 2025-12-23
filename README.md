# NovaFrames AI - AI-Powered Chat & Image Generation

A beautiful, ChatGPT-like AI chatbot application with Google authentication, Firebase integration, and support for both text and image generation.

## ✨ Features

- 🔐 **Google Authentication** - Secure login with Firebase Auth
- 💬 **Text Generation** - Intelligent AI conversations
- 🎨 **Image Generation** - Create stunning images from text descriptions
- 💾 **Chat History** - All conversations saved to Firebase Firestore
- 🌓 **Dark/Light Mode** - Toggle between themes
- 📱 **Responsive Design** - Works on all devices
- 🎯 **ChatGPT-like UI** - Familiar and intuitive interface

## 🚀 Setup Instructions

### 1. Firebase Configuration

The Firebase configuration is already set up in `src/utils/firebase.ts`. Make sure to:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `novaframes-ai`
3. Enable **Authentication** → **Google Sign-in**
4. Enable **Firestore Database**
5. Set Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

### 2. OpenRouter API Key

**Option 1: Environment Variable (Recommended)**
1. Create a `.env` file in the project root
2. Add: `VITE_OPENROUTER_API_KEY=your_api_key_here`
3. Restart the dev server
4. The app will automatically use this key!

**Option 2: Manual Entry**
1. Get your API key from [OpenRouter](https://openrouter.ai/)
2. You'll be prompted to enter it when you first use the chatbot
3. The key is stored in your browser session

📖 **See [API_KEY_SETUP.md](./API_KEY_SETUP.md) for detailed instructions**

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Login.tsx          # Google authentication page
│   └── Chatbot.tsx        # Main chat interface
├── utils/
│   └── firebase.ts        # Firebase configuration
└── App.tsx                # Main app with routing
```

## 🎯 How to Use

1. **Login**: Click "Continue with Google" to authenticate
2. **Enter API Key**: Provide your OpenRouter API key
3. **Start Chatting**: 
   - Select **Text** mode for conversations
   - Select **Image** mode to generate images
4. **Manage Chats**:
   - Click "New chat" to start a fresh conversation
   - Previous chats are saved in the sidebar
   - Delete chats by clicking the trash icon

## 🔑 Key Technologies

- **React** + **TypeScript**
- **Material-UI (MUI)** - Premium UI components
- **Firebase** - Authentication & Firestore database
- **React Router** - Navigation
- **OpenRouter API** - AI text & image generation

## 🎨 Features Breakdown

### Authentication
- Google OAuth integration
- Protected routes
- Automatic session management
- User profile display

### Chat Interface
- Real-time message updates
- Markdown-like text formatting
- Image display in chat
- Loading states
- Error handling

### Firebase Integration
- User-specific chat sessions
- Automatic chat title generation
- Real-time sync across devices
- Secure data access rules

### AI Capabilities
- **Text Mode**: Powered by `sourceful/riverflow-v2-fast-preview`
- **Image Mode**: Same model with image generation modality
- Fast response times
- Error recovery

## 🔒 Security

- Firebase Authentication for user verification
- Firestore security rules for data protection
- API keys stored client-side (not in database)
- User-specific data isolation

## 📱 Responsive Design

- Mobile-friendly sidebar drawer
- Adaptive layouts for all screen sizes
- Touch-optimized controls
- Smooth animations and transitions

## 🎨 UI/UX Highlights

- **Glassmorphism** design elements
- **Gradient backgrounds** for visual appeal
- **Smooth animations** using MUI transitions
- **ChatGPT-inspired** layout for familiarity
- **Dark mode** by default with light mode option

## 🐛 Troubleshooting

### Authentication Issues
- Ensure Google Sign-in is enabled in Firebase Console
- Check that your domain is authorized in Firebase settings

### Chat Not Saving
- Verify Firestore is enabled
- Check Firestore security rules
- Ensure user is authenticated

### Image Generation Not Working
- Verify your OpenRouter API key is valid
- Check browser console for error messages
- Ensure you're in "Image" mode when requesting images

## 📝 License

MIT License - Feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Built with ❤️ using React, Firebase, and OpenRouter AI
