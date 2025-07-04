"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";


export default function Home() {
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [pdfUploadStatus, setPdfUploadStatus] = useState<string>("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle sending a message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!input.trim() || !apiKey.trim()) {
      if (!apiKey.trim()) {
        setError("Please enter your OpenAI API key before submitting.");
        return;
      }
      setError("Please fill in all fields before submitting.");
      return;
    }
    const newMessages = [
      ...messages,
      { role: "user", content: input }
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
      const apiUrl = isLocal
        ? "http://localhost:8000/api/chat-messages"
        : "/api/chat-messages";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          api_key: apiKey,
          messages: [
            ...newMessages.map(m => ({ role: m.role, content: m.content }))
          ]
        }),
      });
      if (!res.ok || !res.body) {
        const errorMsg = `API error: ${res.status}`;
        let errorDetail = "";
        try {
          const data = await res.json();
          if (data && data.detail) {
            if (typeof data.detail === "string") {
              errorDetail = data.detail;
            } else if (Array.isArray(data.detail) && data.detail.length > 0 && data.detail[0].msg) {
              errorDetail = data.detail[0].msg;
            }
          }
        } catch { }
        switch (res.status) {
          case 400:
            setError("Invalid request. Please check your input and try again.\nInstruction: Ensure all fields are filled and valid.");
            break;
          case 401:
          case 403:
            setError("Error: Invalid or unauthorized OpenAI API key.\nInstruction: Please check your API key and try again. You can find your key in your OpenAI account.");
            break;
          case 404:
            setError("Requested resource or model not found.\nInstruction: Please check the model name or contact support if the issue persists.");
            break;
          case 422:
            setError(`Missing or invalid input.\nInstruction: ${errorDetail || "Please fill in all required fields correctly."}`);
            break;
          case 429:
            setError("Rate limit exceeded.\nInstruction: You have reached your usage limit or are sending requests too quickly. Please wait and try again later.");
            break;
          case 500:
            setError("Server error.\nInstruction: The server is currently unavailable. Please try again later or contact support if the issue persists.");
            break;
          default:
            if (errorDetail && errorDetail.toLowerCase().includes("invalid api key")) {
              setError("Error: Invalid or unauthorized OpenAI API key.\nInstruction: Please check your API key and try again. You can find your key in your OpenAI account.");
            } else {
              setError(`Error: ${errorMsg}${errorDetail ? `\nDetails: ${errorDetail}` : ""}\nInstruction: An unexpected error occurred. Please try again or contact support.`);
            }
        }
        setLoading(false);
        return;
      }
      // Stream the response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";
      setMessages(msgs => [
        ...msgs,
        { role: "assistant", content: "" }
      ]);
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setMessages(msgs => {
            // Update the last assistant message
            const updated = [...msgs];
            // Find the last assistant message
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === "assistant") {
                updated[i] = { ...updated[i], content: fullText };
                break;
              }
            }
            return updated;
          });
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message.toLowerCase().includes("network")) {
        setError("Error: Network error.\nInstruction: Please check your internet connection or your API key. If the problem persists, your API key may be invalid or your backend may be down.");
      } else {
        setError(`Error: ${err instanceof Error ? err.message : String(err)}\nInstruction: An unexpected error occurred. Please try again or contact support.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) {
        // Manually trigger form submission
        (e.target as HTMLTextAreaElement).form?.requestSubmit();
      }
    }
  };

  function convertLatexDelimiters(text: string): string {
    // Convert \[ ... \] to $$ ... $$
    text = text.replace(/\\\[((?:.|\n)*?)\\\]/g, (_, expr) => `$$${expr}$$`);
    // Convert [ ... ] to $$ ... $$
    text = text.replace(/\\[((?:.|\n)*?)\\]/g, (_, expr) => `$$${expr}$$`);
    // Convert \( ... \) to $ ... $
    text = text.replace(/\\\(((?:.|\n)*?)\\\)/g, (_, expr) => `$${expr}$`);
    // Convert ( ... ) to $ ... $
    text = text.replace(/\\(((?:.|\n)*?)\\)/g, (_, expr) => `$${expr}$`);
    return text;
  }

  // Handle PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfUploadStatus("");
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== "application/pdf") {
      setPdfUploadStatus("Only PDF files are supported.");
      return;
    }
    setPdfUploadStatus("Uploading and indexing PDF...");
    try {
      const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
      const apiUrl = isLocal
        ? "http://localhost:8000/api/upload-pdf"
        : "/api/upload-pdf";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPdfUploadStatus(data.detail || `Upload failed: ${res.status}`);
        return;
      }
      const data = await res.json();
      setPdfUploadStatus(`PDF indexed! Chunks: ${data.chunks_indexed}`);
    } catch (err) {
      setPdfUploadStatus(`Upload error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className={styles.page}>
      {/* Sidebar for system prompt */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarText}>🔮</span>
          <span className={styles.sidebarTitle}>LLM Chat</span>
        </div>
        {/* PDF Upload Option */}
        <div style={{ width: "100%", margin: "16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <label className={styles.label} htmlFor="pdf-upload">Add PDF</label>
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            className={styles.pdfInputHidden}
            onChange={handlePdfUpload}
            ref={pdfInputRef}
          />
          <button
            type="button"
            className={styles.pdfUploadButton}
            onClick={() => pdfInputRef.current?.click()}
          >
            Upload PDF
          </button>
          {pdfUploadStatus && (
            <div style={{ color: pdfUploadStatus.startsWith("PDF indexed") ? "#a7f3d0" : "#f87171", marginTop: 6, fontSize: 14, textAlign: "center" }}>
              {pdfUploadStatus}
            </div>
          )}
        </div>
        <div className={styles.apiKeyContainer}>
          <label className={styles.label}>OpenAI API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className={styles.apiKeyInput}
            required
          />
        </div>
        <button
          onClick={() => {
            setMessages([]);
            setInput("");
            setError("");
            setLoading(false);
          }}
          className={styles.clearButton}
        >
          Clear Chat
        </button>
      </aside>

      {/* Main chat area */}
      <main className={styles.mainContent}>
        <div className={styles.chatContainer}>
          {messages.map((m, i) => {
            const content = convertLatexDelimiters(m.content);
            if (m.role === "assistant") {
              console.log("Rendering assistant message:", content);
            }
            return (
              <div key={i} className={`${styles.message} ${m.role === 'user' ? styles.user : styles.assistant}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            );
          })}
          {loading && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {convertLatexDelimiters("Thinking...")}
              </ReactMarkdown>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className={styles.textarea}
            rows={5}
            style={{ maxHeight: '120px', minHeight: '40px', overflowY: 'auto' }}
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "..." : "Send"}
          </button>
        </form>
      </main>
    </div>
  );
}
