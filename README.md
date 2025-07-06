<p align="center">
  <img src="https://github.com/AI-Maker-Space/LLM-Dev-101/assets/37101144/d1343317-fa2f-41e1-8af1-1dbb18399719" width="200" alt="Vaporwave Logo">
</p>

<h1 align="center">🔮 The AI Engineer Challenge: Vaporwave Edition 🔮</h1>

<p align="center">
  <em>Ride the synthwave into the future of AI-powered chat applications.</em>
</p>

<p align="center">
  <strong>🚀 Live Demo: <a href="https://the-ai-engineer-challenge-b5gt4mqap-ludos-projects-788a6ed9.vercel.app">the-ai-engineer-challenge.vercel.app</a> 🚀</strong>
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

#### **PDF Processing & RAG Support**
- **PDF Upload Endpoint:** `/api/upload-pdf` - Handles PDF file uploads, text extraction, and vector indexing.
- **PDF Chat Endpoint:** `/api/chat-pdf` - Enables question-answering based on uploaded PDF content.
- **Smart Token Management:** Batch processing prevents token limit errors when processing large documents.
- **Vector Search:** Retrieves the most relevant PDF chunks for each user question.

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

### 📄 PDF Chat & Document Q&A

The application now supports intelligent document-based conversations through PDF upload and retrieval-augmented generation (RAG).

#### **PDF Upload & Processing**
- **Smart Chunking:** Large PDFs are automatically split into manageable chunks (500 characters with 100 character overlap) to avoid token limits.
- **Batch Processing:** Embeddings are processed in intelligent batches to handle large documents efficiently.
- **Progress Feedback:** Real-time status updates during PDF processing and indexing.

#### **Intelligent Document Q&A**
- **Context-Aware Responses:** When a PDF is uploaded, the AI automatically switches to document-aware mode.
- **Relevant Information Retrieval:** Questions are answered based on the actual content of the uploaded PDF.
- **Visual Indicators:** Clear status indicators show when a PDF is ready for questions.
- **Seamless Integration:** The same chat interface works for both general conversation and PDF-specific queries.

#### **Technical Implementation**
- **Vector Database:** Uses in-memory vector storage for fast similarity search.
- **Embedding Model:** Leverages OpenAI's text-embedding-3-small for efficient text representation.
- **Dynamic Endpoint Selection:** Automatically chooses between general chat (`/api/chat-messages`) and PDF chat (`/api/chat-pdf`) endpoints.
- **Token Limit Management:** Intelligent batch processing prevents hitting OpenAI's 300,000 token limit.

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
- **PDF Q&A:** Upload a PDF document and ask questions about its content. The AI will search through the document to provide relevant answers.
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

## Future Features

### File Picker UX: One-Step vs Two-Step

**Current Implementation:**
- Clicking the '+' button immediately opens the file picker for images and PDFs.
- This is due to browser security: file pickers must be triggered directly by a user gesture.
- The file input is always mounted (hidden) and triggered programmatically by the button.

**What We Learned:**
- If the file picker is triggered from a button inside a menu that is conditionally rendered (e.g., a dropdown that appears on the same click), browsers may block the file picker for security reasons.
- The file input must be present in the DOM and triggered directly by a user event.

**How to Add a Two-Step Selection (Menu then File Picker):**
1. The '+' button should first open a menu (e.g., with options like 'Add photos and files', 'Add PDF', etc.).
2. The menu must already be open before the user clicks the option to open the file picker (i.e., two separate clicks: one to open the menu, one to select the action).
3. The file input should remain always mounted (hidden) and be triggered by the menu option's click handler.
4. Avoid opening the menu and triggering the file picker in the same event loop/click handler.

**Example:**
- Click '+' → menu appears.
- Click 'Add photos and files' → file picker opens.

This ensures compatibility with browser security requirements and provides a more flexible UX for future enhancements.

```
🚀🎉 Exciting News! 🎉🚀

I just enhanced and deployed my first full-stack LLM application using FastAPI, Next.js, and the OpenAI API! It features multi-turn chat, real-time streaming, and a slick vaporwave UI.

Check it out: https://the-ai-engineer-challenge-b5gt4mqap-ludos-projects-788a6ed9.vercel.app

A huge shoutout to the @AI Makerspace for this challenge. The community and resources have been incredible.

#AI #LLM #FastAPI #NextJS #Vercel #AIMakerspace