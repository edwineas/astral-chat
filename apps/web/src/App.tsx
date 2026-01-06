import { useEffect, useRef, useState } from "react";
import type { Conversation, Message } from "@astral/db"

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const selectedIdRef = useRef<string | null>(null);

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
        setConversations((prev) => [...prev, event.payload]);
      }
    };

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!wsRef.current || !selectedId) return;

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
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        conversationId: selectedId,
        sender: "agent",
        content: input,
        createdAt: new Date(),
      },
    ]);

    setInput("");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside style={{ width: 300, borderRight: "1px solid #ccc" }}>
        <h3>Conversations</h3>
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            style={{
              padding: 8,
              cursor: "pointer",
              background: c.id === selectedId ? "#eee" : "transparent",
            }}
          >
            {c.id.slice(0, 8)}
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: 16 }}>
        <h3>Messages</h3>

        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.sender}:</strong> {m.content}
          </div>
        ))}

        {selectedId && (
          <div style={{ marginTop: 16 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={() => {sendMessage()}}>Send</button>
          </div>
        )}
      </main>
    </div>
  );
}
