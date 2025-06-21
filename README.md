<p align="center">
  <img src="https://github.com/AI-Maker-Space/LLM-Dev-101/assets/37101144/d1343317-fa2f-41e1-8af1-1dbb18399719" width="200" alt="Vaporwave Logo">
</p>

<h1 align="center">🔮 The AI Engineer Challenge: Vaporwave Edition 🔮</h1>

<p align="center">
  <em>Ride the synthwave into the future of AI-powered chat applications.</em>
</p>

---

## ✨ Enhanced Features & Improvements

This project has been supercharged with a range of new features to provide a robust, seamless, and engaging user experience. Here's a look at what's new:

### 🚀 Backend Improvements

Our FastAPI backend is now more powerful and resilient.

#### **Multi-Turn Chat Support**
- **Endpoint:** `/api/chat-messages`
- **Functionality:** Accepts an array of messages (`role`: system/user/assistant, `content`: text) to maintain full conversation context with OpenAI.
- **Streaming:** Supports real-time, streaming responses for a dynamic chat experience.
- **Compatibility:** Backward compatible with the original `/api/chat` endpoint.

#### **Robust Error Handling**
- **Comprehensive Scenarios:** Handles invalid/missing API keys, rate limiting, network errors, malformed requests, and server errors.
- **Clear Messages:** Provides detailed, actionable error messages to help you troubleshoot with ease.

### 🎨 Frontend Features

The frontend has been rebuilt from the ground up with a focus on a clean, modern, and responsive "vaporwave" aesthetic.

#### **Modern Chat Interface**
- **UI:** A sleek, responsive interface with a side panel for settings.
- **Real-Time Responses:** Watch the AI's responses stream in real-time.
- **Markdown Support:** Full support for rich text formatting, including bold, italics, code blocks, and lists.
- **Session Management:** Start new chats, maintain full conversation history, and enjoy automatic scrolling to the latest message.

#### **Enhanced User Experience**
- **Intuitive Message Input:**
  - `Enter`: Send message
  - `Shift+Enter` / `Alt+Enter`: New line
  - Auto-expanding textarea for longer messages.
- **Persistent System Prompt:** An optional, editable prompt that persists across messages in the same chat session.
- **Clear Feedback:** "AI is typing..." indicator and disabled inputs during processing to keep you informed.

#### **Advanced Error Handling & Recovery**
- **User-Friendly Alerts:** Clear, visual error messages for issues like invalid API keys, network problems, or rate limits.
- **Actionable Steps:** Instructions to help you recover from errors and retry.

### 🛡️ Security & Best Practices
- **API Key Security:** Your API key is stored only in the frontend's state and is never persisted.
- **Secure Requests:** CORS is enabled for secure cross-origin communication.
- **Input Validation:** Sanitization and validation of user inputs.
- **Reliability:** Proper error boundaries and fallbacks to prevent crashes.

---

## 🛠️ Getting Started

Ready to dive in? Follow these steps to get the application running on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR GITHUB USERNAME>/The-AI-Engineer-Challenge.git
cd The-AI-Engineer-Challenge
```

### 2. Install Dependencies

**Backend (FastAPI):**
```bash
cd api
pip install -r requirements.txt
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
```

### 3. Run the Development Servers

**Backend:**
```bash
cd api
uvicorn app:app --reload
```
The backend will be running at `http://localhost:8000`.

**Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will be running at `http://localhost:3000`.

### 4. Launch the App
Open `http://localhost:3000` in your browser, enter your OpenAI API key, and start chatting!

---

## 💡 Usage Tips

- **System Prompt:** Use the optional system prompt to guide the AI's behavior (e.g., "You are a helpful coding assistant").
- **Chat Features:** Use `Shift+Enter` for new lines, format your messages with Markdown, and click "New Chat" to start a new conversation.
- **Error Recovery:** If you encounter an error, check your API key, network connection, or wait a few seconds if you've been rate-limited.

---

## 🚀 Deployment

This application is optimized for deployment on [Vercel](https://vercel.com/).

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```
   Follow the on-screen instructions to deploy. Vercel will automatically configure the Next.js frontend and the serverless Python backend.

---

## 🎉 Share Your Creation!

You've built and deployed an advanced, LLM-powered chat application! Share your results and experience on LinkedIn.

```
🚀🎉 Exciting News! 🎉🚀

I just enhanced and deployed my first full-stack LLM application using FastAPI, Next.js, and the OpenAI API! It features multi-turn chat, real-time streaming, and a slick vaporwave UI.

Check it out: [LINK TO YOUR APP]

A huge shoutout to the @AI Makerspace for this challenge. The community and resources have been incredible.

#AI #LLM #FastAPI #NextJS #Vercel #AIMakerspace
```

</rewritten_file>