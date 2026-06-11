# Xeno AI-Native Shopper CRM

An engineering take-home assignment implementation for **Xeno**. This project is a working, production-ready AI-Native Mini CRM designed for D2C/retail brands to reach shoppers intelligently. It features automated segment generation, conversational AI copywriting, and a **Level 5 Autonomous AI Agent** that executes and monitors marketing campaigns end-to-end.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Database**: Prisma ORM, SQLite (local database for zero-setup ease of evaluation)
- **Services**: Express.js (independent Channel Service running on port 3001)
- **AI Engine**: Dual-mode AI Service (uses OpenAI GPT-4o if a key is provided, falls back to a smart rule-based NLP parser if missing)
- **Queue System**: Dual-mode queue (in-memory async queue processor by default, supports BullMQ + Redis if configured)

```
                ┌──────────────┐
                │   Next.js    │
                │ Frontend UI  │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ API Routes   │
                │ Server Layer │
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Prisma DB       OpenAI API    In-Memory Queue
 (SQLite/Postgres) (or NLP Mock)  (or BullMQ)
                       │
                       ▼
              Channel Service (Port 3001)
              (Asynchronous dispatch callback)
                       │
                       ▼
               POST /api/callback
            (Attributes revenue & updates stats)
```

---

## 🚀 Getting Started in 2 Minutes

Follow these quick commands to spin up the local development environment:

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up the Database
Generate the Prisma Client and load our SQLite database schema:
```bash
npx prisma db push
```

### 3. Seed Shopper & Order Logs
Populate the database with 50+ mock customer records, 140+ transaction logs (spanning the last 90 days), and predefined marketing segments:
```bash
npm run prisma:seed
```

### 4. Run Development Servers
Start both the **Next.js app** (port 3000) and the independent **Channel Service** (port 3001) concurrently:
```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser!

*Note: To test using real OpenAI GPT-4o, add your key to a `.env` file at the root: `OPENAI_API_KEY=your-api-key`. If omitted, the app automatically switches to a smart NLP rule-based fallback so that all AI Segment Builders, AI Copilots, and AI Agent dispatches remain fully functional.*

---

## 🌟 Core Features Walkthrough

### 1. Interactive Marketer Dashboard
- **Aggregate KPIs**: Displays Total Shoppers, LTV Revenue, active Campaigns, and aggregate funnel rates (Open, Click-Through, Conversion).
- **Interactive Visualizations**: Renders area charts for daily revenue, side-by-side bar charts for campaign funnels, and customer growth lines.
- **Top Spenders Leaderboard**: Sorts and lists the most valuable customers.

### 2. Shopper CSV Importer
- Pasting text or dragging-and-dropping a CSV parses headers and inserts records.
- If a `total_spent` column is present, the importer auto-creates simulated purchases so segment filters (e.g. *Spent > 10,000*) immediately compute the new shopper's category.

### 3. Traditional & AI Segment Builder
- **Criteria Selector**: Filter based on total spent (₹), order count, city, gender, or inactivity period.
- **AI Planner**: Type *"Find shoppers who spent more than 5k and live in Mumbai"*. The AI parses the request, shows you the proposed structured rules, and saves the segment on approval.

### 4. Live-Preview Campaign Builder
- Select target audiences and communication channels (WhatsApp, Email, SMS).
- Personalize templates using bracket placeholders like `{{firstName}}`, `{{city}}`, or `{{lastPurchase}}`.
- View a **live preview container** rendering real-time replacements against a mock customer profile before dispatching.

### 5. AI Copilot Chat Interface
- Type questions like *"How can I increase repeat purchases?"* or *"Draft a discount for VIPs"*.
- The Copilot replies conversationally and embeds an **interactive campaign installer card**. Clicking *"1-Click Launch"* immediately executes the recommended campaign.

### 6. Level 5 Autonomous Campaign Agent (Differentiator)
- Enter a broad marketing goal: *"Bring back inactive customers who haven't ordered in 30 days"*.
- Launch the agent and watch a live status panel trace its autonomous plan:
  1. **Research Audience**: Scans SQLite histories to find matching shopper profiles.
  2. **Build Segment**: Automatically creates and registers the segment in the CRM.
  3. **Personalize Copy**: Drafts promotional copy and selects the highest-performing channel.
  4. **Queue Launch**: Deploys the campaign to the async queue.
  5. **Fulfillment Webhook**: Listens for callback receipts to attribute conversions.

### 7. Dual-Service Webhook Simulator
- When a campaign launches, messages are pushed to the queue. The Next.js worker dispatches dispatches to the **Channel Service** (port 3001).
- The Channel Service accepts the dispatches and asynchronously simulates user behavior.
- It triggers a sequence of callback webhooks back to the CRM (`POST /api/callback`) with random delays: **Sent ➔ Delivered ➔ Opened ➔ Clicked** (or Failed).
- The CRM ingests these callbacks, increments campaign metrics, and tracks attributed revenue (if a target customer makes a purchase after receiving the message).

---

## 📐 System Design Decisions

1. **SQLite Database Choice**: SQLite is fully self-contained in a single file (`prisma/dev.db`). This makes the take-home project incredibly easy for the reviewer to clone and run immediately, without having to spin up local docker containers or connect to external RDS servers. The schema and Prisma clients are fully compatible with PostgreSQL/Neon for production staging.
2. **Sequential Webhook State Loop**: The separate channel service is not a simple "return status immediately" stub. It schedules sequential callbacks (Delivered after 2s, Opened after 4s, Clicked after 6s). When a campaign is launched, you can watch the campaign metrics charts and lists increment dynamically in real-time, showing how a real-world asynchronous webhook lifecycle works.
3. **Dynamic Attribution**: Conversion revenue is calculated dynamically when campaigns are fetched. It attributes any delivered order placed by a customer *after* their campaign dispatch timestamp. This makes the database highly transactional and guarantees accurate data without double-entry side effects.
