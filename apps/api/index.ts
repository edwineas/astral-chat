import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { db } from "./db/client";
import { conversations, messages } from "@astral/db";
import type { Conversation, Message } from "@astral/db";
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
  let result: Conversation[];
  try {
    result = await db.insert(conversations).values({}).returning();
  } catch (err) {
    console.error("Failed to create conversation:", err);
    return { error: "Failed to create conversation" };
  }
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
  let result: Conversation[];

  try {
    result = await db.select().from(conversations).orderBy(desc(conversations.createdAt));
  } catch (err) {
    console.error("Failed to retrieve conversations:", err);
    return { error: "Failed to retrieve conversations" };
  }

  return result;

});

app.get("/conversations/:id/messages", async ({ params }) => {

  let result: Message[];

  try {
    result = await db.select().from(messages).where(eq(messages.conversationId, params.id));
  } catch (err) {
    console.error("Failed to retrieve messages:", err);
    return { error: "Failed to retrieve messages" };
  }

  return result;
});

app.ws("/ws", {
  open(ws) {
    ws.subscribe("chat");
  },
  async message(ws, data: any) {
    if (data.type === "SEND_MESSAGE") {
      const { conversationId, sender, content } = data.payload;

      let result: Message[];
      try {
        result = await db
          .insert(messages)
          .values({
            conversationId,
            sender,
            content,
          })
          .returning();
      } catch (err) {
        console.error("Failed to send message:", err);
        return { error: "Failed to send message" };
      }

      const row = result[0];

      const messageEvent = JSON.stringify({
        type: "NEW_MESSAGE",
        payload: row,
      });
      ws.send(messageEvent);
      ws.publish("chat", messageEvent);
    }
  },
});

app.listen(3000);
console.log("API running on http://localhost:3000");