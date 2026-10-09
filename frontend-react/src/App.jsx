import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  FiArrowUp,
  FiCheck,
  FiChevronRight,
  FiCopy,
  FiEdit,
  FiEdit3,
  FiFileText,
  FiFolder,
  FiMenu,
  FiMic,
  FiMoreHorizontal,
  FiMoon,
  FiPaperclip,
  FiPlus,
  FiSearch,
  FiSidebar,
  FiSun,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const API = "http://127.0.0.1:5000";

const EMPTY_CHAT = () => ({
  title: "New Chat",
  pinned: false,
  messages: [],
});

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [copied, setCopied] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );
  const [toast, setToast] = useState("");
  const [dragging, setDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const [hoverSend, setHoverSend] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 820);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const savedChats = localStorage.getItem("ai_chats");
  const [chats, setChats] = useState(
    savedChats ? JSON.parse(savedChats) : [EMPTY_CHAT()]
  );
  const [activeChat, setActiveChat] = useState(0);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0b0d10" : "#f6f7fb",
    panel: isDark ? "#101318" : "#ffffff",
    panel2: isDark ? "#151922" : "#f0f2f7",
    panel3: isDark ? "#1a1f29" : "#e9ecf2",
    border: isDark ? "rgba(255,255,255,.075)" : "rgba(15,23,42,.09)",
    text: isDark ? "#f5f7fb" : "#111827",
    muted: isDark ? "#8b93a3" : "#697386",
    accent: "#8b7cff",
    accent2: "#4f8cff",
    danger: "#ff5d6c",
    shadow: isDark
      ? "0 20px 60px rgba(0,0,0,.28)"
      : "0 20px 60px rgba(30,41,59,.10)",
  };

  const currentMessages = chats[activeChat]?.messages || [];

  const showToast = (text) => {
    setToast(text);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 3000);
  };

  const refreshPdfs = async () => {
    try {
      const response = await fetch(`${API}/pdfs`);
      if (!response.ok) throw new Error("PDF request failed");
      const data = await response.json();
      setPdfs(Array.isArray(data.pdfs) ? data.pdfs : []);
    } catch (error) {
      console.warn("Could not load PDFs:", error);
    }
  };

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ai_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    refreshPdfs();
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 820;
      setIsMobile(mobile);
      if (!mobile) setShowMobileSidebar(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, loading]);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);

    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const filteredChats = chats
    .map((chat, index) => ({ chat, index }))
    .filter(({ chat }) =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const selectChat = (index) => {
    setActiveChat(index);
    setMenuOpen(null);
    if (isMobile) setShowMobileSidebar(false);
  };

  const createNewChat = () => {
    const updated = [...chats, EMPTY_CHAT()];
    setChats(updated);
    setActiveChat(updated.length - 1);
    setMessage("");
    setMenuOpen(null);
    if (isMobile) setShowMobileSidebar(false);
  };

  const deleteChat = (index) => {
    const updated = chats.filter((_, i) => i !== index);

    if (!updated.length) {
      setChats([EMPTY_CHAT()]);
      setActiveChat(0);
    } else {
      const nextIndex = Math.min(activeChat, updated.length - 1);
      setChats(updated);
      setActiveChat(nextIndex);
    }

    setMenuOpen(null);
    showToast("Chat deleted");
  };

  const deleteAllChats = () => {
    if (!window.confirm("Delete all chats?")) return;
    setChats([EMPTY_CHAT()]);
    setActiveChat(0);
    setMenuOpen(null);
    showToast("All chats cleared");
  };

  const renameChat = (index) => {
    const newTitle = window.prompt("Enter new chat name", chats[index].title);
    if (!newTitle?.trim()) return;

    const updated = chats.map((chat, i) =>
      i === index ? { ...chat, title: newTitle.trim() } : chat
    );

    setChats(updated);
    setMenuOpen(null);
    showToast("Chat renamed");
  };

  const pinChat = (index) => {
    const updated = chats.map((chat, i) =>
      i === index ? { ...chat, pinned: !chat.pinned } : chat
    );

    updated.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    setChats(updated);

    const selected = updated.findIndex(
      (chat) => chat.title === chats[index]?.title && chat.messages === chats[index]?.messages
    );
    if (selected >= 0) setActiveChat(selected);

    setMenuOpen(null);
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      showToast("Could not copy code");
    }
  };

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const userMessage = trimmed;
    const chatIndex = activeChat;

    const updatedChats = chats.map((chat, index) => {
      if (index !== chatIndex) return chat;

      const title =
        chat.title === "New Chat"
          ? userMessage.split(/\s+/).slice(0, 5).join(" ")
          : chat.title;

      return {
        ...chat,
        title,
        messages: [
          ...chat.messages,
          { sender: "user", text: userMessage },
        ],
      };
    });

    setChats(updatedChats);
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      const answer = data.answer || "I couldn't generate an answer.";

      let workingChats = updatedChats.map((chat, index) =>
        index === chatIndex
          ? {
              ...chat,
              messages: [...chat.messages, { sender: "ai", text: "" }],
            }
          : chat
      );

      setChats(workingChats);

      let currentText = "";

      for (let i = 0; i < answer.length; i++) {
        currentText += answer[i];

        workingChats = workingChats.map((chat, index) =>
          index === chatIndex
            ? {
                ...chat,
                messages: chat.messages.map((msg, msgIndex) =>
                  msgIndex === chat.messages.length - 1
                    ? { ...msg, text: currentText }
                    : msg
                ),
              }
            : chat
        );

        setChats(workingChats);
        await new Promise((resolve) => setTimeout(resolve, 4));
      }
    } catch (error) {
      console.error(error);

      setChats((previous) =>
        previous.map((chat, index) =>
          index === chatIndex
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    sender: "ai",
                    text:
                      "I couldn't connect to the backend. Make sure Flask is running on port 5000.",
                  },
                ],
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resizeTextarea = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const uploadFile = async (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Only PDF files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      showToast(`${file.name} uploaded successfully`);
      await refreshPdfs();
    } catch (error) {
      console.error(error);
      showToast("PDF upload failed");
    }
  };

  const uploadPDF = async (event) => {
    const file = event.target.files?.[0];
    await uploadFile(file);
    event.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    await uploadFile(e.dataTransfer.files?.[0]);
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Voice input is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    setListening(true);

    recognition.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || "";
      setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => setListening(false);

    recognition.onerror = () => {
      setListening(false);
      showToast("Voice recognition failed");
    };

    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  const runSuggestion = (text) => {
    setMessage(text);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const css = `
    * { box-sizing: border-box; }

    html, body, #root {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }

    body {
      overflow: hidden;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, Helvetica, Arial, sans-serif;
      background: ${colors.bg};
      color: ${colors.text};
      -webkit-font-smoothing: antialiased;
    }

    button, input, textarea { font: inherit; }

    button { -webkit-tap-highlight-color: transparent; }

    ::selection {
      background: ${isDark ? "rgba(139,124,255,.35)" : "rgba(99,102,241,.18)"};
    }

    ::-webkit-scrollbar { width: 7px; height: 7px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: ${isDark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.12)"};
      border-radius: 99px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${isDark ? "rgba(255,255,255,.2)" : "rgba(15,23,42,.2)"};
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%,100% { transform: scale(.9); opacity: .45; }
      50% { transform: scale(1.15); opacity: 1; }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @keyframes glow {
      0%,100% { opacity: .45; }
      50% { opacity: .9; }
    }

    .premium-icon-btn:hover {
      background: ${isDark ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.06)"} !important;
      transform: translateY(-1px);
    }

    .premium-new-chat:hover {
      transform: translateY(-1px);
      border-color: ${isDark ? "rgba(139,124,255,.45)" : "rgba(99,102,241,.3)"} !important;
      box-shadow: 0 12px 30px rgba(99,102,241,.12);
    }

    .premium-chat-row:hover {
      background: ${isDark ? "rgba(255,255,255,.055)" : "rgba(15,23,42,.045)"} !important;
    }

    .premium-suggestion:hover {
      transform: translateY(-2px);
      border-color: ${isDark ? "rgba(139,124,255,.35)" : "rgba(99,102,241,.25)"} !important;
      background: ${isDark ? "rgba(139,124,255,.08)" : "rgba(99,102,241,.05)"} !important;
    }

    .premium-input:focus-within {
      border-color: ${isDark ? "rgba(139,124,255,.5)" : "rgba(99,102,241,.35)"} !important;
      box-shadow:
        0 0 0 4px ${isDark ? "rgba(139,124,255,.08)" : "rgba(99,102,241,.07)"},
        0 18px 50px rgba(0,0,0,.16);
    }

    .premium-send:hover {
      transform: translateY(-2px) scale(1.02);
    }

    .premium-pdf:hover {
      background: ${isDark ? "rgba(255,255,255,.055)" : "rgba(15,23,42,.04)"} !important;
      border-color: ${isDark ? "rgba(255,255,255,.12)" : "rgba(15,23,42,.12)"} !important;
    }

    @media (max-width: 819px) {
      .desktop-sidebar { display: none !important; }
      .mobile-sidebar { display: flex !important; }
      .mobile-menu-button { display: flex !important; }
    }

    @media (min-width: 820px) {
      .mobile-sidebar { display: none !important; }
      .mobile-menu-button { display: none !important; }
    }
  `;

  return (
    <>
      <style>{css}</style>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={handleDrop}
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          overflow: "hidden",
          position: "relative",
          background: colors.bg,
          color: colors.text,
        }}
      >
        {/* Ambient premium background */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background: isDark
              ? "radial-gradient(circle at 72% 8%, rgba(112,92,255,.11), transparent 28%), radial-gradient(circle at 42% 100%, rgba(48,105,255,.07), transparent 32%)"
              : "radial-gradient(circle at 72% 8%, rgba(99,102,241,.08), transparent 28%), radial-gradient(circle at 42% 100%, rgba(59,130,246,.05), transparent 32%)",
          }}
        />

        {/* Mobile backdrop */}
        {isMobile && showMobileSidebar && (
          <div
            onClick={() => setShowMobileSidebar(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 80,
              background: "rgba(0,0,0,.48)",
              backdropFilter: "blur(5px)",
            }}
          />
        )}

        {/* Drag overlay */}
        {dragging && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(5,7,12,.72)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                width: isMobile ? "82%" : 520,
                padding: "54px 30px",
                textAlign: "center",
                borderRadius: 30,
                border: "1px dashed rgba(139,124,255,.65)",
                background:
                  "linear-gradient(145deg, rgba(139,124,255,.15), rgba(255,255,255,.04))",
                boxShadow: "0 30px 100px rgba(0,0,0,.45)",
              }}
            >
              <div
                style={{
                  width: 68,
                  height: 68,
                  margin: "0 auto 20px",
                  borderRadius: 22,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg,#8b7cff,#4f8cff)",
                  boxShadow: "0 12px 40px rgba(99,102,241,.35)",
                }}
              >
                <FiFileText size={30} color="white" />
              </div>
              <div style={{ fontSize: 25, fontWeight: 750 }}>
                Drop your PDF here
              </div>
              <div style={{ marginTop: 9, color: "#9ca3af" }}>
                Release to add it to your Second Brain
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR */}
        <aside
          className={isMobile ? "mobile-sidebar" : "desktop-sidebar"}
          style={{
            position: isMobile ? "fixed" : "relative",
            left: isMobile && !showMobileSidebar ? -340 : 0,
            top: 0,
            bottom: 0,
            zIndex: isMobile ? 90 : 2,
            width: sidebarOpen ? 292 : 82,
            minWidth: sidebarOpen ? 292 : 82,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            padding: "16px 13px",
            background: isDark
              ? "rgba(14,17,22,.88)"
              : "rgba(255,255,255,.88)",
            borderRight: `1px solid ${colors.border}`,
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            boxShadow: isMobile ? "18px 0 70px rgba(0,0,0,.28)" : "none",
            transition: "all .28s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {/* Brand */}
          <div
            style={{
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "space-between" : "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  borderRadius: 11,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg,#9c8cff,#4f8cff)",
                  boxShadow: "0 8px 26px rgba(99,102,241,.28)",
                }}
              >
                <span
                  style={{
                    color: "white",
                    fontWeight: 900,
                    fontSize: 16,
                  }}
                >
                  AI
                </span>
              </div>

              {sidebarOpen && (
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: "-.3px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    AI Second Brain
                  </div>
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: 10,
                      marginTop: 1,
                      letterSpacing: ".8px",
                      textTransform: "uppercase",
                    }}
                  >
                    Personal knowledge
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 2 }}>
              {sidebarOpen && (
                <button
                  className="premium-icon-btn"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  title={isDark ? "Light mode" : "Dark mode"}
                  style={{
                    width: 36,
                    height: 36,
                    border: 0,
                    borderRadius: 11,
                    display: "grid",
                    placeItems: "center",
                    background: "transparent",
                    color: colors.muted,
                    cursor: "pointer",
                    transition: ".2s",
                  }}
                >
                  {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
                </button>
              )}

              <button
                className="premium-icon-btn"
                onClick={() => {
                  if (isMobile) {
                    setShowMobileSidebar(false);
                  } else {
                    setSidebarOpen((v) => !v);
                  }
                }}
                title="Collapse sidebar"
                style={{
                  width: 36,
                  height: 36,
                  border: 0,
                  borderRadius: 11,
                  display: "grid",
                  placeItems: "center",
                  background: "transparent",
                  color: colors.muted,
                  cursor: "pointer",
                  transition: ".2s",
                }}
              >
                {isMobile ? <FiX size={19} /> : <FiSidebar size={18} />}
              </button>
            </div>
          </div>

          {/* New chat */}
          <button
            className="premium-new-chat"
            onClick={createNewChat}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 15,
              border: `1px solid ${colors.border}`,
              background: isDark
                ? "linear-gradient(135deg, rgba(139,124,255,.12), rgba(79,140,255,.06))"
                : "linear-gradient(135deg, rgba(99,102,241,.07), rgba(59,130,246,.04))",
              color: colors.text,
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "flex-start" : "center",
              gap: 10,
              padding: "0 15px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 650,
              transition: ".2s",
              marginBottom: 12,
            }}
          >
            <FiPlus size={18} />
            {sidebarOpen && "New chat"}
          </button>

          {sidebarOpen && (
            <>
              {/* Search */}
              <div
                style={{
                  position: "relative",
                  marginBottom: 16,
                }}
              >
                <FiSearch
                  size={17}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.muted,
                  }}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations"
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 13px 0 40px",
                    borderRadius: 13,
                    outline: "none",
                    border: `1px solid ${colors.border}`,
                    background: isDark
                      ? "rgba(255,255,255,.035)"
                      : "rgba(15,23,42,.035)",
                    color: colors.text,
                    fontSize: 13,
                  }}
                />
              </div>

              {/* Library */}
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 7px 8px",
                  }}
                >
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: ".9px",
                      textTransform: "uppercase",
                    }}
                  >
                    Knowledge library
                  </div>
                  <span
                    style={{
                      color: colors.muted,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {pdfs.length}
                  </span>
                </div>

                <div
                  style={{
                    maxHeight: 150,
                    overflowY: "auto",
                    paddingRight: 2,
                  }}
                >
                  {pdfs.length === 0 ? (
                    <div
                      style={{
                        padding: "12px 10px",
                        borderRadius: 12,
                        border: `1px dashed ${colors.border}`,
                        color: colors.muted,
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      No PDFs yet. Upload a document to build your knowledge
                      base.
                    </div>
                  ) : (
                    pdfs.map((pdf, index) => (
                      <div
                        className="premium-pdf"
                        key={`${pdf}-${index}`}
                        title={pdf}
                        style={{
                          minHeight: 40,
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "7px 9px",
                          borderRadius: 11,
                          border: "1px solid transparent",
                          transition: ".18s",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            flexShrink: 0,
                            borderRadius: 8,
                            display: "grid",
                            placeItems: "center",
                            background: isDark
                              ? "rgba(255,93,108,.1)"
                              : "rgba(239,68,68,.08)",
                            color: "#ff6875",
                          }}
                        >
                          <FiFileText size={14} />
                        </div>
                        <div
                          style={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: 11,
                            color: colors.text,
                          }}
                        >
                          {pdf}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div
                style={{
                  height: 1,
                  background: colors.border,
                  margin: "2px 5px 13px",
                }}
              />

              <div
                style={{
                  padding: "0 7px 8px",
                  color: colors.muted,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".9px",
                  textTransform: "uppercase",
                }}
              >
                Conversations
              </div>
            </>
          )}

          {/* Chats */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: 2,
            }}
          >
            {filteredChats.map(({ chat, index }) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  marginBottom: 4,
                }}
              >
                <div
                  className="premium-chat-row"
                  onClick={() => selectChat(index)}
                  style={{
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: sidebarOpen
                      ? "space-between"
                      : "center",
                    gap: 8,
                    padding: "9px 10px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background:
                      activeChat === index
                        ? isDark
                          ? "linear-gradient(90deg, rgba(139,124,255,.13), rgba(139,124,255,.04))"
                          : "rgba(99,102,241,.08)"
                        : "transparent",
                    border:
                      activeChat === index
                        ? `1px solid ${
                            isDark
                              ? "rgba(139,124,255,.16)"
                              : "rgba(99,102,241,.12)"
                          }`
                        : "1px solid transparent",
                    transition: ".18s",
                  }}
                >
                  <div
                    style={{
                      width: 27,
                      height: 27,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 8,
                      background:
                        activeChat === index
                          ? isDark
                            ? "rgba(139,124,255,.16)"
                            : "rgba(99,102,241,.1)"
                          : isDark
                          ? "rgba(255,255,255,.04)"
                          : "rgba(15,23,42,.045)",
                      color:
                        activeChat === index
                          ? colors.accent
                          : colors.muted,
                    }}
                  >
                    <FiFolder size={13} />
                  </div>

                  {sidebarOpen && (
                    <>
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                          fontWeight: activeChat === index ? 650 : 500,
                          color: colors.text,
                        }}
                      >
                        {chat.title}
                      </div>

                      <button
                        className="premium-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === index ? null : index);
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          flexShrink: 0,
                          border: 0,
                          borderRadius: 8,
                          display: "grid",
                          placeItems: "center",
                          background: "transparent",
                          color: colors.muted,
                          cursor: "pointer",
                        }}
                      >
                        <FiMoreHorizontal size={16} />
                      </button>
                    </>
                  )}
                </div>

                {menuOpen === index && sidebarOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      top: 48,
                      right: 3,
                      width: 190,
                      padding: 6,
                      zIndex: 200,
                      borderRadius: 15,
                      background: isDark
                        ? "rgba(25,29,37,.97)"
                        : "rgba(255,255,255,.98)",
                      border: `1px solid ${colors.border}`,
                      boxShadow: colors.shadow,
                      backdropFilter: "blur(22px)",
                      animation: "fadeUp .16s ease",
                    }}
                  >
                    {[
                      {
                        icon: <FiEdit size={14} />,
                        label: "Rename",
                        action: () => renameChat(index),
                      },
                      {
                        icon: <FiCheck size={14} />,
                        label: chat.pinned ? "Unpin" : "Pin",
                        action: () => pinChat(index),
                      },
                      {
                        icon: <FiTrash2 size={14} />,
                        label: "Delete",
                        danger: true,
                        action: () => deleteChat(index),
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        style={{
                          width: "100%",
                          height: 38,
                          border: 0,
                          borderRadius: 10,
                          background: "transparent",
                          color: item.danger ? colors.danger : colors.text,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "0 11px",
                          cursor: "pointer",
                          fontSize: 12,
                          textAlign: "left",
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Clear */}
          <button
            onClick={deleteAllChats}
            style={{
              width: "100%",
              height: 42,
              marginTop: 10,
              borderRadius: 12,
              border: `1px solid ${
                isDark ? "rgba(255,93,108,.13)" : "rgba(239,68,68,.13)"
              }`,
              background: "transparent",
              color: colors.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "center" : "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 650,
            }}
          >
            <FiTrash2 size={14} />
            {sidebarOpen && "Clear all chats"}
          </button>
        </aside>

        {/* MAIN */}
        <main
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            minWidth: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "transparent",
          }}
        >
          {/* Header */}
          <header
            style={{
              height: 66,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: isMobile ? "0 15px" : "0 28px",
              borderBottom: `1px solid ${colors.border}`,
              background: isDark
                ? "rgba(11,13,16,.72)"
                : "rgba(246,247,251,.76)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <button
                className="premium-icon-btn mobile-menu-button"
                onClick={() => setShowMobileSidebar(true)}
                style={{
                  display: "none",
                  width: 38,
                  height: 38,
                  border: 0,
                  borderRadius: 11,
                  background: "transparent",
                  color: colors.text,
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <FiMenu size={19} />
              </button>

              <div>
                <div
                  style={{
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 750,
                    letterSpacing: "-.2px",
                  }}
                >
                  {chats[activeChat]?.title || "New Chat"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
                    color: colors.muted,
                    fontSize: 10,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#35d399",
                      boxShadow: "0 0 10px rgba(53,211,153,.6)",
                    }}
                  />
                  AI Second Brain
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: colors.muted,
                fontSize: 10,
              }}
            >
              {!isMobile && (
                <>
                  <span
                    style={{
                      padding: "6px 9px",
                      borderRadius: 9,
                      background: isDark
                        ? "rgba(255,255,255,.04)"
                        : "rgba(15,23,42,.04)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {pdfs.length} {pdfs.length === 1 ? "document" : "documents"}
                  </span>
                </>
              )}
              <button
                className="premium-icon-btn"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                title="Toggle theme"
                style={{
                  width: 34,
                  height: 34,
                  border: 0,
                  borderRadius: 10,
                  background: "transparent",
                  color: colors.muted,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
              </button>
            </div>
          </header>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: isMobile ? "16px 10px 150px" : "30px 20px 170px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 900,
                margin: "0 auto",
              }}
            >
              {currentMessages.length === 0 ? (
                <div
                  style={{
                    minHeight: isMobile ? "58vh" : "64vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "fadeUp .35s ease",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      textAlign: "center",
                      padding: isMobile ? "20px 8px" : "50px 20px",
                    }}
                  >
                    <div
                      style={{
                        width: 68,
                        height: 68,
                        margin: "0 auto 24px",
                        borderRadius: 23,
                        display: "grid",
                        placeItems: "center",
                        background:
                          "linear-gradient(135deg, rgba(139,124,255,.18), rgba(79,140,255,.12))",
                        border: `1px solid ${
                          isDark
                            ? "rgba(139,124,255,.22)"
                            : "rgba(99,102,241,.16)"
                        }`,
                        boxShadow:
                          "0 18px 55px rgba(99,102,241,.12)",
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 13,
                          display: "grid",
                          placeItems: "center",
                          background:
                            "linear-gradient(135deg,#9c8cff,#4f8cff)",
                          color: "white",
                          fontWeight: 900,
                          fontSize: 12,
                          boxShadow:
                            "0 8px 25px rgba(99,102,241,.28)",
                        }}
                      >
                        AI
                      </div>
                    </div>

                    <h1
                      style={{
                        margin: 0,
                        fontSize: isMobile ? 34 : 48,
                        lineHeight: 1.05,
                        letterSpacing: "-2px",
                        fontWeight: 800,
                        background:
                          "linear-gradient(110deg, #ffffff 15%, #b9b1ff 50%, #78a9ff 90%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: isDark ? "transparent" : colors.text,
                      }}
                    >
                      Think. Learn. Remember.
                    </h1>

                    <p
                      style={{
                        maxWidth: 600,
                        margin: "17px auto 30px",
                        color: colors.muted,
                        fontSize: isMobile ? 14 : 16,
                        lineHeight: 1.7,
                      }}
                    >
                      Your private AI workspace for PDFs, notes, questions,
                      research, and everything you want your personal
                      knowledge base to remember.
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : "repeat(2, minmax(0, 1fr))",
                        gap: 12,
                        maxWidth: 720,
                        margin: "0 auto",
                        textAlign: "left",
                      }}
                    >
                      {[
                        {
                          title: "Chat with PDF",
                          description: "Upload a document and ask questions about it.",
                          prompt: "Summarize my PDF",
                          icon: <FiFileText size={18} />,
                        },
                        {
                          title: "Learn a Topic",
                          description: "Get a clear explanation of any concept.",
                          prompt: "Explain this topic simply",
                          icon: <span style={{ fontSize: 17 }}>🧠</span>,
                        },
                        {
                          title: "Create Study Notes",
                          description: "Turn your knowledge into structured notes.",
                          prompt: "Create study notes",
                          icon: <span style={{ fontSize: 17 }}>📝</span>,
                        },
                        {
                          title: "Search Knowledge",
                          description: "Ask questions across your personal knowledge base.",
                          prompt: "Search my knowledge base",
                          icon: <FiSearch size={18} />,
                        },
                      ].map((card) => (
                        <button
                          className="premium-suggestion"
                          key={card.title}
                          onClick={() => runSuggestion(card.prompt)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 13,
                            minHeight: 78,
                            padding: "15px 16px",
                            border: `1px solid ${colors.border}`,
                            background: isDark
                              ? "linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018))"
                              : "rgba(255,255,255,.86)",
                            color: colors.text,
                            borderRadius: 17,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "transform .2s ease, border-color .2s ease, box-shadow .2s ease",
                            boxShadow: isDark
                              ? "0 10px 30px rgba(0,0,0,.12)"
                              : "0 10px 30px rgba(30,41,59,.06)",
                          }}
                        >
                          <span
                            style={{
                              width: 40,
                              height: 40,
                              minWidth: 40,
                              borderRadius: 12,
                              display: "grid",
                              placeItems: "center",
                              color: "white",
                              background:
                                "linear-gradient(135deg,#8b7cff,#4f8cff)",
                              boxShadow: "0 8px 22px rgba(99,102,241,.22)",
                            }}
                          >
                            {card.icon}
                          </span>

                          <span style={{ minWidth: 0 }}>
                            <span
                              style={{
                                display: "block",
                                fontSize: 13,
                                fontWeight: 750,
                                marginBottom: 4,
                              }}
                            >
                              {card.title}
                            </span>
                            <span
                              style={{
                                display: "block",
                                color: colors.muted,
                                fontSize: 11,
                                lineHeight: 1.5,
                              }}
                            >
                              {card.description}
                            </span>
                          </span>

                          <FiChevronRight
                            size={16}
                            style={{
                              marginLeft: "auto",
                              flexShrink: 0,
                              color: colors.muted,
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                currentMessages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.sender === "user" ? "flex-end" : "flex-start",
                      marginBottom: 24,
                      animation: "fadeUp .22s ease",
                    }}
                  >
                    {msg.sender === "ai" && (
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                          marginRight: 11,
                          marginTop: 2,
                          borderRadius: 10,
                          display: "grid",
                          placeItems: "center",
                          background:
                            "linear-gradient(135deg,#8b7cff,#4f8cff)",
                          color: "white",
                          fontWeight: 900,
                          fontSize: 9,
                          boxShadow:
                            "0 7px 22px rgba(99,102,241,.22)",
                        }}
                      >
                        AI
                      </div>
                    )}

                    <div
                      style={{
                        maxWidth:
                          msg.sender === "user"
                            ? isMobile
                              ? "82%"
                              : "72%"
                            : isMobile
                            ? "calc(100% - 40px)"
                            : "78%",
                        padding:
                          msg.sender === "user"
                            ? "12px 16px"
                            : "2px 0",
                        borderRadius:
                          msg.sender === "user"
                            ? "19px 19px 5px 19px"
                            : 0,
                        background:
                          msg.sender === "user"
                            ? isDark
                              ? "linear-gradient(135deg, rgba(139,124,255,.22), rgba(79,140,255,.14))"
                              : "linear-gradient(135deg, rgba(99,102,241,.11), rgba(59,130,246,.07))"
                            : "transparent",
                        border:
                          msg.sender === "user"
                            ? `1px solid ${
                                isDark
                                  ? "rgba(139,124,255,.16)"
                                  : "rgba(99,102,241,.12)"
                              }`
                            : "none",
                        color: colors.text,
                        lineHeight: 1.75,
                        fontSize: 14,
                        overflowWrap: "anywhere",
                      }}
                    >
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1
                              style={{
                                fontSize: 25,
                                margin: "18px 0 10px",
                                letterSpacing: "-.6px",
                              }}
                            >
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2
                              style={{
                                fontSize: 20,
                                margin: "16px 0 8px",
                              }}
                            >
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3
                              style={{
                                fontSize: 17,
                                margin: "14px 0 7px",
                              }}
                            >
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p style={{ margin: "0 0 11px" }}>{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul style={{ paddingLeft: 22, margin: "8px 0 12px" }}>
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol style={{ paddingLeft: 22, margin: "8px 0 12px" }}>
                              {children}
                            </ol>
                          ),
                          code({
                            inline,
                            className,
                            children,
                            ...props
                          }) {
                            const match =
                              /language-(\w+)/.exec(className || "");

                            if (!inline && match) {
                              const code = String(children).replace(/\n$/, "");

                              return (
                                <div
                                  style={{
                                    position: "relative",
                                    margin: "14px 0",
                                    borderRadius: 15,
                                    overflow: "hidden",
                                    border: `1px solid ${colors.border}`,
                                  }}
                                >
                                  <button
                                    onClick={() => copyCode(code)}
                                    style={{
                                      position: "absolute",
                                      top: 9,
                                      right: 9,
                                      zIndex: 2,
                                      border: `1px solid rgba(255,255,255,.1)`,
                                      borderRadius: 8,
                                      padding: "6px 9px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                      background: "rgba(20,23,29,.86)",
                                      color: "white",
                                      cursor: "pointer",
                                      fontSize: 10,
                                    }}
                                  >
                                    {copied === code ? (
                                      <FiCheck size={12} />
                                    ) : (
                                      <FiCopy size={12} />
                                    )}
                                    {copied === code ? "Copied" : "Copy"}
                                  </button>

                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      padding: 18,
                                      paddingTop: 48,
                                      fontSize: 12,
                                      background: "#0c0f14",
                                    }}
                                    {...props}
                                  >
                                    {code}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }

                            return (
                              <code
                                className={className}
                                {...props}
                                style={{
                                  background: isDark
                                    ? "rgba(255,255,255,.08)"
                                    : "rgba(15,23,42,.07)",
                                  borderRadius: 6,
                                  padding: "2px 6px",
                                  fontSize: 12,
                                }}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    margin: "5px 0 20px 41px",
                  }}
                >
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: colors.accent,
                        animation: "pulse .8s infinite",
                        animationDelay: `${dot * 130}ms`,
                      }}
                    />
                  ))}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Composer */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: isMobile ? "10px 10px 13px" : "14px 22px 18px",
              background: isDark
                ? "linear-gradient(to top, #0b0d10 55%, rgba(11,13,16,0))"
                : "linear-gradient(to top, #f6f7fb 55%, rgba(246,247,251,0))",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                maxWidth: 900,
                margin: "0 auto",
                pointerEvents: "auto",
              }}
            >
              <div
                className="premium-input"
                style={{
                  minHeight: 64,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 7,
                  padding: "8px 9px 8px 12px",
                  borderRadius: 22,
                  border: `1px solid ${colors.border}`,
                  background: isDark
                    ? "rgba(22,26,33,.92)"
                    : "rgba(255,255,255,.94)",
                  boxShadow: colors.shadow,
                  backdropFilter: "blur(24px)",
                  transition: ".2s",
                }}
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload PDF"
                  className="premium-icon-btn"
                  style={{
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    border: 0,
                    borderRadius: 13,
                    display: "grid",
                    placeItems: "center",
                    background: "transparent",
                    color: colors.muted,
                    cursor: "pointer",
                    transition: ".2s",
                  }}
                >
                  <FiPaperclip size={19} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  onChange={uploadPDF}
                />

                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onInput={resizeTextarea}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask your Second Brain..."
                  style={{
                    flex: 1,
                    minWidth: 0,
                    maxHeight: 180,
                    minHeight: 42,
                    resize: "none",
                    overflowY: "auto",
                    border: 0,
                    outline: 0,
                    background: "transparent",
                    color: colors.text,
                    fontSize: 14,
                    lineHeight: 1.55,
                    padding: "10px 4px",
                  }}
                />

                <button
                  onClick={startVoiceInput}
                  title={listening ? "Listening..." : "Voice input"}
                  className="premium-icon-btn"
                  style={{
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    border: 0,
                    borderRadius: 13,
                    display: "grid",
                    placeItems: "center",
                    background: listening
                      ? "rgba(255,93,108,.13)"
                      : "transparent",
                    color: listening ? colors.danger : colors.muted,
                    cursor: "pointer",
                    transition: ".2s",
                  }}
                >
                  <FiMic size={18} />
                </button>

                <button
                  className="premium-send"
                  onMouseEnter={() => setHoverSend(true)}
                  onMouseLeave={() => setHoverSend(false)}
                  onClick={sendMessage}
                  disabled={loading || !message.trim()}
                  title="Send message"
                  style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    border: 0,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background:
                      loading || !message.trim()
                        ? isDark
                          ? "rgba(255,255,255,.08)"
                          : "rgba(15,23,42,.07)"
                        : "linear-gradient(135deg,#9c8cff,#4f8cff)",
                    color:
                      loading || !message.trim() ? colors.muted : "white",
                    cursor:
                      loading || !message.trim() ? "default" : "pointer",
                    boxShadow:
                      hoverSend && message.trim()
                        ? "0 8px 28px rgba(99,102,241,.35)"
                        : "0 5px 18px rgba(99,102,241,.16)",
                    transform:
                      hoverSend && message.trim()
                        ? "translateY(-2px) scale(1.02)"
                        : "none",
                    transition: ".2s",
                  }}
                >
                  {loading ? (
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        border: "2px solid rgba(255,255,255,.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "spin .7s linear infinite",
                      }}
                    />
                  ) : (
                    <FiArrowUp size={20} />
                  )}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 8,
                  color: colors.muted,
                  fontSize: 9,
                }}
              >
                <span>Enter to send</span>
                <span style={{ opacity: 0.45 }}>•</span>
                <span>Shift + Enter for new line</span>
                <span style={{ opacity: 0.45 }}>•</span>
                <span>PDF RAG enabled</span>
              </div>
            </div>
          </div>
        </main>

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: "fixed",
              right: isMobile ? 12 : 24,
              bottom: isMobile ? 86 : 92,
              zIndex: 10000,
              maxWidth: isMobile ? "calc(100% - 24px)" : 360,
              padding: "12px 15px",
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: isDark
                ? "rgba(25,29,37,.95)"
                : "rgba(255,255,255,.96)",
              border: `1px solid ${colors.border}`,
              boxShadow: colors.shadow,
              backdropFilter: "blur(20px)",
              color: colors.text,
              fontSize: 12,
              animation: "fadeUp .2s ease",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                flexShrink: 0,
                borderRadius: "50%",
                background: "#35d399",
                boxShadow: "0 0 10px rgba(53,211,153,.5)",
              }}
            />
            {toast}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
