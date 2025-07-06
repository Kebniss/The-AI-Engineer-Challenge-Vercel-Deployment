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

  // State for file upload menu
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  // Upload status for feedback
  const [uploadStatus, setUploadStatus] = useState<string>("");
  // Track if a PDF has been uploaded successfully
  const [pdfUploaded, setPdfUploaded] = useState<boolean>(false);

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

      // Use PDF chat endpoint if a PDF has been uploaded, otherwise use regular chat
      const apiUrl = isLocal
        ? (pdfUploaded
          ? "http://localhost:8000/api/chat-pdf"
          : "http://localhost:8000/api/chat-messages")
        : (pdfUploaded
          ? "/api/chat-pdf"
          : "/api/chat-messages");

      const requestBody = pdfUploaded
        ? {
          query: input,
          api_key: apiKey,
          model: "gpt-4.1-mini",
          top_k: 3
        }
        : {
          model: "gpt-4.1-mini",
          api_key: apiKey,
          messages: [
            ...newMessages.map(m => ({ role: m.role, content: m.content }))
          ]
        };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

  // Handle PDF upload - currently unused but kept for future implementation
  // const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setPdfUploadStatus("");
  //   if (!e.target.files || e.target.files.length === 0) return;
  //   const file = e.target.files[0];
  //   if (file.type !== "application/pdf") {
  //     setPdfUploadStatus("Only PDF files are supported.");
  //     return;
  //   }
  //   if (!apiKey.trim()) {
  //     setPdfUploadStatus("Please enter your OpenAI API key before uploading a PDF.");
  //     return;
  //   }
  //   setPdfUploadStatus("Uploading and indexing PDF...");
  //   try {
  //     const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
  //     const apiUrl = isLocal
  //       ? "http://localhost:8000/api/upload-pdf"
  //       : "/api/upload-pdf";
  //     const formData = new FormData();
  //     formData.append("file", file);
  //     formData.append("api_key", apiKey);
  //     const res = await fetch(apiUrl, {
  //       method: "POST",
  //       body: formData,
  //     });
  //     if (!res.ok) {
  //       const data = await res.json().catch(() => ({}));
  //       let detail = data.detail;
  //       if (Array.isArray(detail)) {
  //         detail = detail.map(d => d.msg || JSON.stringify(d)).join(' | ');
  //       } else if (detail && typeof detail === "object") {
  //         detail = detail.msg || JSON.stringify(detail, null, 2);
  //       }
  //       setPdfUploadStatus(detail || `Upload failed: ${res.status}`);
  //       return;
  //     }
  //     const data = await res.json();
  //     setPdfUploadStatus(`PDF indexed! Chunks: ${data.chunks_indexed}`);
  //     setPdfUploaded(true);
  //   } catch (err) {
  //     setPdfUploadStatus(`Upload error: ${err instanceof Error ? err.message : String(err)}`);
  //   }
  // };

  // Handler for file input
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setUploadStatus("Uploading...");
      setFileMenuOpen(false);
      try {
        const isPdf = file.type === "application/pdf";
        const isImage = [
          "image/png",
          "image/jpeg",
          "image/heif",
          "image/heic"
        ].includes(file.type);
        if (!isPdf && !isImage) {
          setUploadStatus("Only PNG, JPEG, HEIF, HEIC images or PDF files are supported.");
          return;
        }
        const apiUrl = isPdf
          ? (typeof window !== "undefined" && window.location.hostname === "localhost"
            ? "http://localhost:8000/api/upload-pdf"
            : "/api/upload-pdf")
          : (typeof window !== "undefined" && window.location.hostname === "localhost"
            ? "http://localhost:8000/api/upload-file"
            : "/api/upload-file");
        const formData = new FormData();
        formData.append("file", file);
        if (isPdf) {
          formData.append("api_key", apiKey);
        }
        const res = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          let detail = data.detail;
          if (Array.isArray(detail)) {
            detail = detail.map(d => d.msg || JSON.stringify(d)).join(' | ');
          } else if (detail && typeof detail === "object") {
            detail = detail.msg || JSON.stringify(detail, null, 2);
          }
          setUploadStatus(detail || `Upload failed: ${res.status}`);
          return;
        }
        const data = await res.json();
        setUploadStatus(`File uploaded!${isPdf && data.chunks_indexed ? ` Chunks: ${data.chunks_indexed}` : ""}`);
        if (isPdf && data.chunks_indexed) {
          setPdfUploaded(true);
        }
      } catch (err) {
        setUploadStatus(`Upload error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  // Debug: Log fileInputRef after every render
  useEffect(() => {
    console.log('fileInputRef.current after render:', fileInputRef.current);
  });

  // Handler for clicking outside the menu to close it
  useEffect(() => {
    if (!fileMenuOpen) return;
    function handleClick() {
      setFileMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [fileMenuOpen]);

  return (
    <div className={styles.page}>
      {/* Sidebar for system prompt */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarText}>🏠</span>
          <span className={styles.sidebarTitle}>Advocate</span>
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
            setPdfUploaded(false);
            setUploadedFileName("");
            setUploadStatus("");
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

        <form onSubmit={handleSubmit} className={styles.form} style={{ position: 'relative' }}>
          {/* + Button triggers file picker directly */}
          <div className={styles.plusMenuWrapper}>
            <button
              type="button"
              className={styles.plusButton}
              aria-label="Add options"
              onClick={e => {
                e.stopPropagation();
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              +
            </button>
            {/* Hidden file input */}
            <input
              id="file-upload-debug"
              type="file"
              accept=".png,.jpeg,.jpg,.heif,.heic,application/pdf,image/png,image/jpeg,image/heif,image/heic"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
          </div>
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
        {/* Show uploaded file name if any */}
        {(uploadedFileName || uploadStatus) && (
          <div className={styles.uploadedFileName}>
            {uploadedFileName && `Selected: ${uploadedFileName}`}<br />
            {uploadStatus && uploadStatus}
          </div>
        )}
      </main>
    </div>
  );
}
