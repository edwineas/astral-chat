import { useEffect, useRef, useState } from "react";
import type { Message } from "@astral/db"
import { FiMessageSquare, FiSend } from "react-icons/fi";
import "./App.css";

export default function App() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch("http://localhost:3000/conversations", { method: "POST" })
      .then((r) => r.json())
      .then((c) => setConversationId(c.id));
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    fetch(`http://localhost:3000/conversations/${conversationId}/messages`)
      .then((r) => r.json())
      .then(setMessages);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const ws = new WebSocket("ws://localhost:3000/ws");
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (e) => {
      let event: any;
      try {
        event = JSON.parse(e.data);
      } catch (err) {
        return;
      }

      if (event.type === "NEW_MESSAGE" && event.payload?.conversationId === conversationId) {
        setMessages((prev) => [...prev, event.payload]);
      }
    };

    return () => {
      ws.close();
    };
  }, [conversationId]);

  const sendMessage = () => {
    if (!wsRef.current || !conversationId || !input.trim()) {
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "SEND_MESSAGE",
        payload: {
          conversationId,
          sender: "client",
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
    <div className="chat-widget">
      {/* Header */}
      <div className="widget-header">
        <div className="header-content">
          <div className="header-info">
            <h4>Astral Support</h4>
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {isConnected ? 'Online' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-icon">
              <FiMessageSquare size={32} />
            </div>
            <h3>Welcome! 👋</h3>
            <p>How can we help you today? Send us a message and we'll respond as soon as possible.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`message ${m.sender}`}>
              <div className="message-content">
                <p>{m.content}</p>
                <span className="message-time">{formatTime(m.createdAt)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button
            onClick={sendMessage}
            className="send-btn"
            disabled={!input.trim() || !isConnected}
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}