# Astral Chat — Real-Time Live Chat System

A minimal real-time live chat support system built as a **monorepo** using **Bun**, **Elysia**, **WebSockets**, **PostgreSQL**, and **Drizzle ORM**.

---

## Features

- Customer-facing **chat widget**
- Admin **dashboard** to view conversations and reply
- **Real-time messaging** using WebSockets
- Messages and conversations persisted in **PostgreSQL**
- **Shared database schema and types** via a workspace package

---

## Monorepo Structure

```
astral-chat/
├── apps/
│ ├── api/ # Backend (Elysia + WebSocket + Drizzle)
│ ├── web/ # Admin dashboard (React)
│ └── client/ # Customer chat widget (React)
└── packages/
└── db/ # Shared Drizzle schema + inferred TypeScript types
```

## Trade-offs Made

- No authentication or authorization
- Single WebSocket namespace (simpler mental model)
- No pagination or message batching
- Minimal UI styling

## What I’d Improve Next

- Conversation-scoped WebSocket channels
- Authentication and agent assignment
- Message pagination and virtualization
- Better error handling and retries
- UI polish and accessibility
