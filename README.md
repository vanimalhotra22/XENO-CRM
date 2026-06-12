# Xeno AI-Native Shopper CRM & Webhook Simulator

An engineering-grade, production-ready **AI-Native Mini CRM** designed for D2C/retail brands to reach shoppers intelligently. It features automated segment generation, conversational AI copywriting, an asynchronous webhook callback pipeline, and robust resilience simulation (automated retries and Dead Letter Queues).

This workspace has been converted to standard **ES6 JavaScript/JSX** with clean path mapping, a responsive top navigation bar, and advanced user session gateways.

---

## 📐 System Architecture & Webhook Loop

The system operates as a decoupled dual-service architecture to simulate real-world asynchronous messaging flows:

```
                  ┌─────────────────┐
                  │   Next.js 15    │
                  │   CRM Frontend  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Prisma ORM    │
                  │ (SQLite / Pg)   │
                  └────────┬────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      OpenAI API     In-Memory Queue   Session Gate
    (or NLP Mock)    (Async Retries)  (Google/Cookie)
                           │
                           ▼
              Channel Service (Port 3001)
            (Asynchronous simulation delay)
                           │
                           ▼
                  POST /api/callback
             (Attributes revenue & updates stats)
```

---

## 🛠️ Tech Stack & Production Standards

* **Frontend Framework**: Next.js 15 (App Router, JavaScript, Tailwind CSS, Recharts, Lucide Icons).
* **Database & ORM**: Prisma ORM with support for SQLite (local zero-setup evaluation) and PostgreSQL (production).
* **Authentication**: Dual-method authentication wrapper (`AuthGuard.jsx`):
  * **Google Sign-In**: Powered by Google Identity Services, auto-registering new users and decoding JWTs securely.
  * **Traditional Sign-In**: SHA-256 password hashing via Node's `crypto` module.
  * **Sessions**: Managed via secure, HTTP-Only cookies (`xeno-session`).
* **Background Processing**: Asynchronous in-memory queue processor with built-in retry backoff scheduler.
* **Microservices**: Independent Express.js Channel Simulator (port 3001) hosting callback emitters.

---

## 🌟 Advanced Features 
### 1. 🧪 A/B Testing Variant Engine
- **50/50 Audience Split**: When crafting a campaign, check "Enable A/B Testing" to specify a control (Variant A) and optimized copy (Variant B).
- **Variant Analytics**: Tracks distinct stats (Sent, Clicked, CTR) for each variant.
- **Winner Attribution**: Automatically compares click-through rates upon campaign completion and crowns the winner (Variant A or B) in the database.

### 2. 🔌 Webhook Resilience Simulator & Auto-Retry Loop
- **Disruption Toggles**: Simulate message delivery delays, open rates, and click rates.
- **Error Simulation**: If enabled, the channel service randomly throws provider-level errors: `EMAIL_BOUNCED`, `INVALID_NUMBER`, or `RATE_LIMITED`.
- **CRM Retry Engine (3 Strikes)**: Bounced messages automatically transition to a `RETRYING` state. The CRM schedules a deferred retry dispatch after a 2-second delay.
- **Dead Letter Queue (DLQ)**: If a message fails 3 times, it is permanently quarantined in the DLQ with status `DLQ` and retry logs are committed for audits.

### 3. 🧠 Smart Channel Recommendation Advisor
- **Profile Diagnostics**: Analyzes the demographics and spend histories of the selected audience segment.
- **1-Click Apply**: Recommends the highest-performing channel (Email, SMS, or WhatsApp) based on LTV values or churn risks (e.g. *"VIP shoppers convert 23% better on detailed email layouts"*).

### 4. 🎛️ Dynamic Ledger Sliders & Scroll Bounds
- **Interactive Range Sliders**: Adjust the displaying row count dynamically (5 to 50 rows) next to search filters in the Customers and Orders ledger tables.
- **Bounded Viewports**: Tables scroll inside bounded vertical boxes (`max-h-[500px] overflow-y-auto`) to stay visually aligned with diagnostic side panels.

### 5. 📄 Corporate PDF Report Exporter
- Completed campaigns render an **"Export Report"** button.
- Uses dedicated CSS print styles (`print:hidden` and `hidden print:block`) to output a professional double-column Performance & Delivery Audit document.

---

## 🚀 Getting Started locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up the Local Database
Generate the Prisma client and push the schema to SQLite:
```bash
npx prisma generate
npx prisma db push
```

### 3. Seed Database Mock Data
Populate the SQLite ledger with 50+ mock customer records, 140+ transaction logs (spanning the last 90 days), and default segment rules:
```bash
npm run prisma:seed
```

### 4. Run Development Servers
Start the Next.js CRM (port 3000) and the Channel Service (port 3001) concurrently:
```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 📦 Production Deployment Steps

### Database Migration (SQLite to PostgreSQL)
SQLite database files are read-only and ephemeral on serverless hosting like Vercel. For production, switch your database connection to a cloud database provider (e.g., Neon.tech or Supabase):
1. In `prisma/schema.prisma`, update the datasource block:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Run database migrations:
   ```bash
   npx prisma db push
   ```

### Deploying Frontend on Vercel
1. Link your GitHub repository to **Vercel**.
2. Set **Build Command**: `npx prisma generate && npm run build`.
3. Add Environment Variables:
   - `DATABASE_URL`: *Your Cloud PostgreSQL connection string.*
   - `NEXT_PUBLIC_CHANNEL_SERVICE_URL`: *The URL of your deployed Render backend.*

### Deploying Backend on Render
1. Create a new **Web Service** on **Render** linked to your repo.
2. Set **Build Command**: `npm install`.
3. Set **Start Command**: `node channel-service/server.js`.
4. Add Environment Variable:
   - `CRM_CALLBACK_URL`: *The callback URL of your Vercel frontend (e.g. `https://xeno-crm.vercel.app/api/callback`).*
