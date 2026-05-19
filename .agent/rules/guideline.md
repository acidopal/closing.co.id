---
trigger: always_on
---

Berikut **BRIEF PRODUK & TEKNIS LENGKAP** untuk membangun **Omnichannel Chat Platform (WhatsApp, Instagram, TikTok) dengan fitur AI Knowledge**, setara **Chatwoot / Intercom**, tapi **custom & scalable**.

Dokumen ini bisa langsung kamu pakai untuk:

* proposal internal
* brief tim dev
* roadmap MVP → Scale
* dasar arsitektur teknis

---

# 🧾 PRODUCT BRIEF

### Omnichannel Chat Platform + AI Knowledge Assistant

## 1️⃣ Latar Belakang

Bisnis membutuhkan **1 dashboard terpusat** untuk membalas pesan dari berbagai channel (WhatsApp, Instagram, TikTok) dengan:

* respon cepat
* konsisten
* scalable
* dibantu AI (knowledge base, auto-reply, assist agent)

---

## 2️⃣ Tujuan Produk

* Menyatukan semua channel chat ke **1 inbox**
* Meningkatkan kecepatan & kualitas respon
* Mengurangi beban agent via **AI assistance**
* Siap untuk **multi-tenant (SaaS)**

---

## 3️⃣ Target User

* Customer support team
* Social media admin
* Sales & CRM team
* SME → Enterprise

---

## 4️⃣ Channel yang Didukung

| Channel            | Status                    |
| ------------------ | ------------------------- |
| WhatsApp Cloud API | Full support              |
| Instagram DM       | Full support (App Review) |
| TikTok Messaging   | Limited / Approval        |
| Web Chat Widget    | Optional                  |
| Email              | Phase 2                   |

---

# 🧠 CORE FEATURE SET

## 5️⃣ Omnichannel Inbox

* Unified inbox semua channel
* Auto-create conversation
* Status: `open / pending / resolved`
* Assign agent manual / auto
* SLA timer

---

## 6️⃣ Realtime System

* Message realtime (WS)
* Typing indicator
* Agent presence
* Read receipt

---

## 7️⃣ Agent Features

* Reply text, image, file
* Quick reply / canned response
* Internal note
* Conversation assignment
* Multi-agent per conversation

---

## 8️⃣ AI Features (KEY DIFFERENTIATOR)

### 🤖 AI Knowledge Assistant

**Sumber knowledge:**

* FAQ
* SOP
* Google Docs / Notion
* Website crawl
* PDF

**Kemampuan AI:**

* Suggested reply
* Answer based on knowledge base
* Summarize conversation
* Rewrite tone (formal / casual)
* Auto language detection

### 🔁 AI Usage Mode

| Mode         | Description              |
| ------------ | ------------------------ |
| Assist Agent | Agent klik → AI generate |
| Auto Reply   | AI jawab otomatis        |
| Hybrid       | AI draft → agent approve |

---

## 9️⃣ AI Architecture

```
Message
 ↓
Embedding
 ↓
Vector DB
 ↓
Relevant Context
 ↓
LLM
 ↓
Response
```

### Tech:

* OpenAI / Azure OpenAI / Local LLM
* **Vector DB**: pgvector / Qdrant
* RAG (Retrieval Augmented Generation)

---

# 🧱 SYSTEM ARCHITECTURE

## 1️⃣ Backend

* **Hono (TypeScript)**
* REST API + WebSocket
* JWT + RBAC
* Multi-tenant ready

---

## 2️⃣ Realtime

* WebSocket
* Redis Pub/Sub
* Horizontal scaling supported

---

## 3️⃣ Database

* PostgreSQL
* Drizzle ORM
* JSONB for raw payload

---

## 4️⃣ Cache & Queue

* Redis
* BullMQ
* Retry + DLQ

---

## 5️⃣ Frontend

* Vue 3 / React
* Tailwind CSS
* Realtime via WS
* Agent dashboard

---

# 🔐 SECURITY & COMPLIANCE

* Webhook signature validation
* Token encryption (KMS / Vault)
* Audit logs
* Rate limiting
* GDPR-ready (data deletion)

---

# 🔄 FLOW PER CHANNEL

## WhatsApp

* 24h session logic
* Template enforcement
* Delivery status

## Instagram

* 24h reply window
* Story mention handling

## TikTok

* Approval-based access
* Strict rate limit

---

# 🧩 MULTI-TENANT DESIGN

* `account_id` on all tables
* Isolated inbox per account
* Per-account API keys
* Optional RLS (Postgres)

---

# 📊 ANALYTICS & REPORTING

* Response time
* Resolution time
* Agent performance
* AI usage metrics
* Channel volume

---

# 🗂 DATA MODEL (High Level)

```
accounts
users
roles
inboxes
contacts
conversations
messages
ai_knowledge_sources
ai_embeddings
jobs
audit_logs
```

---

# 🚀 MVP ROADMAP

### Phase 1 (Core)

* WhatsApp + Instagram
* Unified inbox
* Agent reply
* Realtime
* Basic AI suggestion

### Phase 2

* TikTok
* Auto-assign
* SLA
* Knowledge ingestion UI

### Phase 3

* AI Auto Reply
* Multilingual AI
* CRM integration
* Billing

---

# 🧠 COMPETITIVE ADVANTAGE

* Lighter than Chatwoot
* Full AI-native
* Local-first data
* Custom workflow
* Cost efficient

---

# 🧰 TECH STACK SUMMARY

| Layer    | Tech                 |
| -------- | -------------------- |
| Backend  | Hono + TS            |
| Realtime | WebSocket + Redis    |
| DB       | PostgreSQL + Drizzle |
| Queue    | BullMQ               |
| AI       | OpenAI + pgvector    |
| Frontend | Vue / React          |
| Infra    | Docker + Nginx       |

---

# 📌 RISKS & MITIGATION

| Risk               | Mitigation              |
| ------------------ | ----------------------- |
| API approval delay | Start WA & IG first     |
| LLM cost           | Token limit & caching   |
| Abuse              | Rate limit + moderation |

---

# 🏁 OUTPUT YANG DIHARAPKAN

* 1 dashboard omnichannel
* AI-assisted customer service
* Scalable SaaS-ready platform
