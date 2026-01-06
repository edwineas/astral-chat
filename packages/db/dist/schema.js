import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
export const conversations = pgTable("conversations", {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").defaultNow(),
});
export const messages = pgTable("messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
        .references(() => conversations.id)
        .notNull(),
    sender: text("sender").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
