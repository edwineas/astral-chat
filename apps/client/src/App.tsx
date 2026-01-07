import { useEffect, useRef, useState } from "react";
import type { Message } from "@astral/db"

export default function App() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);

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
    if (!wsRef.current || !conversationId) {
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

  return (
    <div style={{ width: "100vw", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: 300, border: "1px solid #ccc", padding: 8 }}>
        <h4>Support Chat</h4>

        <div style={{ minHeight: 200, maxHeight: 400, overflowY: "auto" }}>
          {messages.map((m) => (
            <div key={m.id}>
              <strong>{m.sender}:</strong> {m.content}
            </div>
          ))}
        </div>

        <div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}