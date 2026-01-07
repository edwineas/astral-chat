import { useEffect, useRef, useState } from "react";
import type { Conversation, Message } from "@astral/db"
import { FiMessageSquare, FiUser, FiMessageCircle, FiSend } from "react-icons/fi";
import "./App.css";

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch("http://localhost:3000/conversations")
      .then((r) => r.json())
      .then(setConversations);
  }, []);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    fetch(`http://localhost:3000/conversations/${selectedId}/messages`)
      .then((r) => r.json())
      .then(setMessages);
  }, [selectedId]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);

      if (event.type === "NEW_MESSAGE" && event.payload?.conversationId === selectedIdRef.current) {
        setMessages((prev) => [...prev, event.payload]);
      }

      if (event.type === "NEW_CONVERSATION") {
        setConversations((prev) => [event.payload, ...prev]);
      }
    };

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!wsRef.current || !selectedId || !input.trim()) return;

    wsRef.current.send(
      JSON.stringify({
        type: "SEND_MESSAGE",
        payload: {
          conversationId: selectedId,
          sender: "agent",
          content: input,
        },
      })
    );

    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span>Astral Chat</span>
          </div>
          <p className="sidebar-subtitle">Agent Dashboard</p>
        </div>

        <div className="conversations-header">
          <h3>Conversations</h3>
          <span className="badge">{conversations.length}</span>
        </div>

        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <FiMessageSquare size={48} />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`conversation-item ${c.id === selectedId ? 'active' : ''}`}
              >
                <div className="conversation-avatar">
                  <FiUser size={20} />
                </div>
                <div className="conversation-info">
                  <span className="conversation-id">#{c.id.slice(0, 8)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {!selectedId ? (
          <div className="no-selection">
            <div className="no-selection-content">
              <FiMessageCircle size={80} />
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the sidebar to start responding to customers</p>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">
                  <FiUser size={24} />
                </div>
                <h3>Customer #{selectedId.slice(0, 8)}</h3>
              </div>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`message ${m.sender}`}>
                    <div className="message-bubble">
                      <p>{m.content}</p>
                      <span className="message-time">{formatTime(m.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="message-input"
                />
                <button
                  onClick={sendMessage}
                  className="send-button"
                  disabled={!input.trim()}
                >
                  <FiSend size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
