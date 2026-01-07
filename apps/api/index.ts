import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { db } from "./db/client";
import { conversations, messages } from "@astral/db";
import { desc, eq } from "drizzle-orm";

const app = new Elysia()
  .use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:5174"],
    })
  );

app.get("/", () => {
  return "API is running";
});

app.post("/conversations", async ({ server }) => {
  const result = await db.insert(conversations).values({}).returning();
  const row = result[0];

  const conversation = {
    id: row.id,
    createdAt: row.createdAt,
  };

  if (server) {
    server.publish(
      "chat",
      JSON.stringify({
        type: "NEW_CONVERSATION",
        payload: conversation,
      })
    );
  }

  return conversation;
});

app.get("/conversations", async () => {
  const rows = await db.select().from(conversations).orderBy(desc(conversations.createdAt));

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
  }));
});

app.get("/conversations/:id/messages", async ({ params }) => {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.id));

  return rows.map((row) => ({
    id: row.id,
    conversationId: row.conversationId,
    sender: row.sender,
    content: row.content,
    createdAt: row.createdAt,
  }));
});

app.ws("/ws", {
  open(ws) {
    ws.subscribe("chat");
  },
  async message(ws, data: any) {
    if (data.type === "SEND_MESSAGE") {
      const { conversationId, sender, content } = data.payload;

      const result = await db
        .insert(messages)
        .values({
          conversationId,
          sender,
          content,
        })
        .returning();

      const row = result[0];

      const message = {
        id: row.id,
        conversationId: row.conversationId,
        sender: row.sender,
        content: row.content,
        createdAt: row.createdAt,
      };

      const messageEvent = JSON.stringify({
        type: "NEW_MESSAGE",
        payload: message,
      });

      ws.publish("chat", messageEvent);
    }
  },
});

app.listen(3000);
console.log("API running on http://localhost:3000");