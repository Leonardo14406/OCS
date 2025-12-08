# Ombudsman Complaint System (OCS)

The Ombudsman Complaint System (OCS) is a full‑stack platform for citizens to file complaints against public officials and government services, and for oversight staff to triage, investigate, and resolve those complaints.

The system is designed for an Ombudsman office (for example, the Ombudsman of Sierra Leone) and combines a modern web UI, a role‑based case management backend, and an AI assistant that helps citizens articulate and submit clear, structured complaints.

---

## Core Concepts & User Roles

### Citizens

Citizens use the public portal to:

- **File complaints** via:
  - A **conversational AI assistant** that guides them step‑by‑step through describing what happened.
- **Track complaints** using a **public tracking ID** (complaint ID and tracking number are the same value, different labels).
- **Attach evidence** (documents, images, PDFs) to support their complaint.
- **Receive updates** on status changes (submitted, under review, investigating, resolved, rejected).

Citizens can file complaints anonymously or as identified complainants, depending on policy.

### Case Officers / Investigators

Officers log into an internal dashboard to:

- View **assigned complaints** for their ministry/department.
- See **key metadata**: complainant details (if not anonymous), ministry, category, priority, and timestamps.
- Review **evidence** and AI‑generated summaries.
- Update **status** and add **investigation notes**.
- Track their own workload (assigned vs. resolved complaints).

### Administrators

Admins oversee the overall system and case pipeline:

- Configure **ministries/departments** and **complaint categories**.
- Monitor **complaint statistics** and trends.
- Manage **officer accounts** and roles.
- Access higher‑level analytics such as complaint patterns and hotspots.

---

## High‑Level Architecture

The project is organized into three main parts:

- **`client/`** – Next.js 13+ App Router frontend for citizens and officers.
- **`server/`** – Node/Express backend for the AI agent, WebSocket gateway, and complaint services.
- **`Ombudsman_WA/`** – WhatsApp integration / worker (optional, for future channels such as WhatsApp chat).

Both the client and server share a **PostgreSQL** database schema (managed via Prisma) hosted on Supabase.

### Hosted services

- Agent server (AI + WebSocket backend) is hosted on Render at: https://ocs-1-qyd9.onrender.com
- WhatsApp server / worker is hosted on Render at: https://ocs-d8mm.onrender.com

---

## Key Features

### 1. Chat‑based Complaint Submission

Instead of a long, intimidating form, citizens can **chat with an AI assistant**:

- The assistant greets the user, explains what it can do, and asks clarifying questions.
- It collects:
  - Complainant identity (if not anonymous).
  - Details about what happened (who, what, where, when).
  - Ministry / department and category.
  - Preferred level of contact and urgency.
- Behind the scenes, the agent uses tools to:
  - Store session data in `ConversationSession`.
  - Classify and structure the complaint.
  - Create a `Complaint` record with a canonical OMB‑style tracking ID.

The frontend talks to the agent via **WebSockets**:

- A session is created through `POST /api/agent/session`.
- The browser connects to the backend WebSocket server using the returned `websocketUrl` and `sessionId`.
- Messages are exchanged in real time, and the full assistant response is streamed back into the chat UI.

### 2. Traditional Complaint API

For programmatic or non‑chat submissions, the system also exposes a REST endpoint (on the client side) to create complaints:

- `POST /api/complaints` accepts a JSON payload with all standard complaint fields.
- It generates a **single canonical identifier** and uses it for both `id` and `trackingNumber` so what the citizen sees matches the internal case ID.

### 3. Complaint Tracking

Citizens can track complaints by:

- Entering a tracking number (e.g. `OMB-...`) on the public **Track Complaint** page.
- Optionally viewing all complaints associated with their email address if they identify themselves.

Internally:

- The backend resolves tracking numbers to `Complaint` records.
- Officers and admins see richer status history and context; citizens see only the public‑facing status.

### 4. Officer & Admin Dashboards

The internal UI (protected by authentication) offers:

- **Officer views**:
  - My assigned complaints.
  - Complaint details with evidence and status history.
  - Tools to update status and add internal/external notes.
- **Admin views** (depending on configuration):
  - System‑wide metrics (total complaints, by ministry, by status).
  - Management of officers and roles.

### 5. AI‑Assisted Workflows

AI is used in two main ways:

- **Citizen‑side assistance**:
  - Helps users describe their complaint clearly.
  - Suggests ministries and categories.
  - Structures the narrative for efficient review.
- **Officer‑side intelligence** (optional / in progress):
  - Summaries of long complaints.
  - Suggested next actions or risk levels.
  - Pattern insights and hotspot analytics.

---

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui components.
- **Backend (Agent & API)**: Node.js, Express, WebSocket (ws), OpenAI API for the Ombudsman agent.
- **Database**: PostgreSQL (Supabase), Prisma ORM.
- **Auth**: Kinde (OIDC) on the client for secure officer/admin access.

---

## Local Development (Overview)

> Note: Commands and environment variables may vary slightly depending on your setup. See `client/` and `server/` sub‑READMEs for details.

### Prerequisites

- Node.js (LTS)
- PostgreSQL database (e.g. Supabase connection string)
- An OpenAI API key

### 1. Server (Agent + WebSocket)

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL, OPENAI_API_KEY, PORT, etc.

# Sync Prisma schema if needed
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Run the server
npm install
npm run dev
```

The server exposes:

- `POST /api/agent/session` – create a chat session.
- WebSocket upgrade on the same port for real‑time agent conversations.

### 2. Client (Next.js app)

```bash
cd client
cp .env.example .env.local  # set NEXT_PUBLIC_WS_URL, BACKEND_URL, KINDE settings, etc.

npm install
npm run dev
```

The client exposes:

- Public portal pages for citizens (`/`, `/submit`, `/track`, etc.).
- Internal routes for officers/admins under `/officer` and `/admin`.
- API routes like `/api/complaints` and `/api/agent/session` which proxy or build on the server.

Open the app at `http://localhost:3000` and the agent server at the configured `PORT`.

---

## Typical Citizen Flow

1. **Visit `/submit`** – Citizen lands on the "File a Complaint" page.
2. **Chat with AI** – Describes what happened; the assistant asks follow‑ups.
3. **Evidence upload (optional)** – Citizen attaches supporting documents.
4. **Agent files complaint** – Backend creates a `Complaint` with a canonical tracking ID.
5. **Success screen** – Citizen sees the complaint ID / tracking number and can:
   - Save it for their records.
   - Go directly to `/track` with the ID pre‑filled.

---

## Typical Officer Flow

1. Officer logs into the internal portal.
2. Views their **assigned complaints** list.
3. Opens a complaint to see details, AI summary, and evidence.
4. Adds notes, updates status, and, once resolved, closes the case.

---

## Status & Roadmap

Current capabilities:

- Chat‑based complaint intake connected to a real database.
- Basic complaint tracking and status views.
- Officer/admin‑oriented data model and routes.

Planned / in progress:

- Tighter integration between chat submissions and the web UI success state (automatic navigation when the agent creates a complaint).
- Richer officer dashboards with filters, search, and analytics.
- Additional channels (e.g. WhatsApp) using the same Ombudsman agent and tools.

---

## License & Ownership

This system is tailored for an Ombudsman / oversight institution. Adapt authentication, branding, and policies (especially around anonymity and data retention) before deploying in production.
