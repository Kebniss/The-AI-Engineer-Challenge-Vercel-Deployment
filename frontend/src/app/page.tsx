"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Helper to build the messages array for the backend
  const buildMessagesForAPI = () => {
    const arr = [];
    if (systemPrompt.trim()) {
      arr.push({ role: "system", content: systemPrompt });
    }
    for (const m of messages) {
      if (m.role === "user" || m.role === "assistant") {
        arr.push({ role: m.role, content: m.content });
      }
    }
    return arr;
  };

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
            ...(systemPrompt.trim() ? [{ role: "system", content: systemPrompt }] : []),
            ...newMessages.map(m => ({ role: m.role, content: m.content }))
          ]
        }),
      });
      if (!res.ok || !res.body) {
        let errorMsg = `API error: ${res.status}`;
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
      let aiIndex = null;
      setMessages(msgs => {
        aiIndex = msgs.length - 1;
        return msgs;
      });
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
    } catch (err: any) {
      if (err && err.message && err.message.toLowerCase().includes("network")) {
        setError("Error: Network error.\nInstruction: Please check your internet connection or your API key. If the problem persists, your API key may be invalid or your backend may be down.");
      } else {
        setError(`Error: ${err.message || err}\nInstruction: An unexpected error occurred. Please try again or contact support.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffe5d0 0%, #fffbe6 60%, #c1f7e3 100%)",
        fontFamily: "'Montserrat', 'Futura', 'Arial', sans-serif",
        color: "#5a3a1b",
      }}
    >
      {/* Sidebar for system prompt */}
      <aside
        style={{
          width: 320,
          background: "#fffbe6",
          borderRight: "2.5px solid #ffd6a5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 18px 18px 18px",
          gap: 24,
          minHeight: "100vh",
        }}
      >
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 38 }} role="img" aria-label="tropical leaf">🌿</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#e17055", letterSpacing: 1 }}>LLM Chat Vibe</span>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, #c1f7e3 0%, #fffbe6 100%)",
            borderRadius: 18,
            boxShadow: "0 2px 8px #ffe5d0",
            padding: 18,
            width: "100%",
            marginTop: 18,
            marginBottom: 18,
            color: "#5a3a1b",
            fontSize: 16,
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <label style={{ fontWeight: 600, color: "#b26a32", marginBottom: 6 }}>Developer/System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1.5px solid #ffd6a5",
              padding: 10,
              fontSize: 15,
              background: "#fffbe6",
              color: "#5a3a1b",
              resize: "vertical",
              boxShadow: "0 1px 4px #ffe5d0",
            }}
            required
          />
        </div>
        <div style={{ width: "100%", marginTop: "auto" }}>
          <label style={{ fontWeight: 600, color: "#b26a32" }}>OpenAI API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              borderRadius: 12,
              border: "1.5px solid #ffd6a5",
              padding: 10,
              fontSize: 15,
              background: "#fffbe6",
              color: "#5a3a1b",
              boxShadow: "0 1px 4px #ffe5d0",
            }}
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
          style={{
            width: "100%",
            marginTop: 18,
            background: "linear-gradient(135deg, #e17055 0%, #ffd6a5 100%)",
            color: "#fffbe6",
            border: "none",
            borderRadius: 14,
            padding: "12px 0",
            fontWeight: 700,
            fontSize: 17,
            cursor: "pointer",
            boxShadow: "0 1px 4px #ffe5d0",
            transition: "background 0.2s, color 0.2s",
            letterSpacing: 1,
          }}
        >
          + New Chat
        </button>
      </aside>
      {/* Main chat area */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          minHeight: "100vh",
          padding: "0 0 0 0",
        }}
      >
        {/* Chat log */}
        <div
          style={{
            width: "100%",
            maxWidth: 700,
            flex: 1,
            overflowY: "auto",
            padding: "40px 0 20px 0",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: "center", color: "#b26a32", opacity: 0.7, fontSize: 16 }}>
              Start the conversation!
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user"
                    ? "flex-end"
                    : "flex-start",
                width: "100%",
              }}
            >
              <div
                style={{
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #ffe5d0 0%, #ffd6a5 100%)"
                      : "linear-gradient(135deg, #c1f7e3 0%, #fffbe6 100%)",
                  color: "#5a3a1b",
                  borderRadius: 18,
                  padding: "14px 18px",
                  maxWidth: "70%",
                  fontSize: 16,
                  boxShadow: "0 1px 4px #ffe5d0",
                  marginLeft: msg.role === "user" ? 40 : 0,
                  marginRight: msg.role === "assistant" ? 40 : 0,
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  border:
                    msg.role === "user"
                      ? "2px solid #ffd6a5"
                      : "2px solid #c1f7e3",
                }}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #c1f7e3 0%, #fffbe6 100%)",
                  color: "#5a3a1b",
                  borderRadius: 18,
                  padding: "14px 18px",
                  maxWidth: "70%",
                  fontSize: 16,
                  boxShadow: "0 1px 4px #ffe5d0",
                  border: "2px solid #c1f7e3",
                  opacity: 0.7,
                }}
              >
                AI is typing...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {/* Error message */}
        {error && (
          <div
            style={{
              color: "#e17055",
              background: "#fffbe6",
              border: "2px solid #ffd6a5",
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              maxWidth: 500,
              textAlign: "center",
              fontSize: 15,
              boxShadow: "0 1px 4px #ffe5d0",
            }}
          >
            {error}
          </div>
        )}
        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            maxWidth: 700,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 0 40px 0",
            background: "rgba(255,255,255,0.0)",
          }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={2}
            style={{
              flex: 1,
              borderRadius: 14,
              border: "1.5px solid #ffd6a5",
              padding: 12,
              fontSize: 16,
              background: "#fffbe6",
              resize: "vertical",
              color: "#5a3a1b",
              boxShadow: "0 1px 4px #ffe5d0",
              minHeight: 40,
              maxHeight: 120,
            }}
            placeholder="Type your message..."
            disabled={loading}
            required
            onKeyDown={e => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.altKey &&
                !e.metaKey
              ) {
                e.preventDefault();
                // Find the form and submit it
                const form = e.currentTarget.form;
                if (form) {
                  form.requestSubmit();
                }
              }
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#ffd6a5" : "#e17055",
              color: loading ? "#5a3a1b" : "#fffbe6",
              border: "none",
              borderRadius: 18,
              padding: "14px 24px",
              fontWeight: 700,
              fontSize: 18,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s, color 0.2s",
              boxShadow: "0 2px 8px #ffe5d0",
            }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
        <footer style={{ marginTop: 12, color: "#b26a32", fontSize: 13, opacity: 0.7, textAlign: "center" }}>
          <span>
            &copy; {new Date().getFullYear()} LLM Chat Vibe &mdash; Mid-century modern cross tropical
          </span>
        </footer>
      </main>
    </div>
  );
}
