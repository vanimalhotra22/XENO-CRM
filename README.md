# 🚀 Xeno AI-Native Shopper CRM & Webhook Simulator

An AI-powered customer engagement platform built for modern D2C and retail brands. The system combines customer intelligence, AI-driven audience segmentation, campaign automation, asynchronous messaging pipelines, and revenue attribution into a unified CRM experience.

Unlike traditional CRMs that only store customer data, this platform actively helps marketers decide:

* **Who to target**
* **What to say**
* **Which channel to use**
* **How campaigns perform**
* **How messaging failures are handled**

The project demonstrates production-style architecture including AI workflows, webhook callbacks, retry mechanisms, dead-letter queues, attribution tracking, and autonomous marketing agents.

---

# 🎯 Problem Statement

Marketing teams often struggle with:

* Identifying the right audience
* Creating personalized campaigns
* Measuring campaign effectiveness
* Handling messaging provider failures
* Understanding customer engagement behavior

This project solves those challenges through an AI-native CRM experience that combines customer analytics, campaign orchestration, and intelligent automation.

---

# ✨ Key Highlights

### AI-Native Features

* AI Segment Builder
* AI Marketing Copilot
* AI Tone & Copy Optimizer
* Smart Channel Recommendation Engine
* AI Campaign Performance Predictor
* AI Audience Recommendation System
* Autonomous Marketing Agent Workflow

### CRM Features

* Customer Management
* Order Tracking
* Customer 360° Profiles
* Dynamic Customer Tags
* Segment Management
* Campaign Builder
* Campaign Analytics
* Revenue Attribution

### Messaging Infrastructure

* Asynchronous Channel Service
* Webhook Callback Pipeline
* Retry Engine
* Dead Letter Queue (DLQ)
* Failure Simulation
* Delivery Auditing

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────┐
│           Next.js CRM               │
│        (Frontend + APIs)            │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│           Prisma ORM                │
│      SQLite / PostgreSQL            │
└──────────────────┬──────────────────┘
                   │
 ┌─────────────────┼─────────────────┐
 ▼                 ▼                 ▼

AI Engine      Queue Engine      Auth Layer
(OpenAI/Mock)  (BullMQ/InMemory) (Google/Cookies)

                   │
                   ▼

┌─────────────────────────────────────┐
│      Channel Service Simulator      │
│          (Port 3001)                │
└──────────────────┬──────────────────┘
                   │
                   ▼

       POST /api/callback

                   │
                   ▼

┌─────────────────────────────────────┐
│     Analytics & Attribution Layer   │
└─────────────────────────────────────┘
```

---

# 🤖 AI-Native Capabilities

## AI Segment Builder

Generate customer segments using natural language.

Example:

```text
Find high-value inactive customers in Mumbai
```

The AI converts prompts into structured audience filters and estimates audience size and potential revenue.

---

## AI Marketing Copilot

Interactive chat assistant capable of:

* Customer analytics queries
* Campaign performance insights
* Revenue analysis
* Segment recommendations

---

## AI Tone Optimization

Campaign copy can be analyzed and improved automatically.

The system provides:

* Improved copy suggestions
* Predicted CTR improvements
* Reasoning behind recommendations

---

## Smart Channel Recommendation

The platform evaluates audience characteristics and recommends the most effective communication channel.

Examples:

* Email
* SMS
* WhatsApp

---

## Autonomous Marketing Agent

Demonstrates an AI workflow capable of:

1. Analyzing customer data
2. Building segments
3. Generating campaign content
4. Selecting channels
5. Launching campaigns
6. Monitoring results

---

# 👥 Customer Intelligence

## Customer 360° View

Each shopper profile includes:

* Lifetime Value
* Purchase History
* RFM Analysis
* Preferred Channel
* Engagement Metrics
* AI Recommendations

---

## Dynamic Lifecycle Tags

Automatically generated customer classifications:

* VIP
* Active
* At Risk
* Sleepy
* Lead

---

# 📣 Campaign Engine

## Campaign Builder

Features:

* Message Templates
* Personalization Placeholders
* Live Preview
* Segment Selection
* Channel Selection

---

## A/B Testing Engine

Supports:

* 50/50 audience splitting
* Variant-specific analytics
* CTR comparison
* Automatic winner selection

---

## Campaign Performance Prediction

Before launch, the platform estimates:

* Open Rate
* CTR
* Expected Revenue

---

# 🔄 Webhook Resilience & Reliability

A dedicated Channel Service simulates real-world messaging providers.

## Failure Simulation

Supported failures:

* EMAIL_BOUNCED
* INVALID_NUMBER
* RATE_LIMITED

---

## Retry Engine

Failed deliveries automatically:

1. Enter RETRYING state
2. Wait 2 seconds
3. Retry dispatch

Maximum retries:

```text
3 Attempts
```

---

## Dead Letter Queue

Messages that continue failing after three attempts are moved into a DLQ for auditing and investigation.

---

# 📈 Analytics & Revenue Attribution

The platform tracks:

* Sent Messages
* Delivered Messages
* Opens
* Clicks
* Conversions
* Revenue Generated

Purchases made after campaign interactions are automatically attributed back to the originating campaign.

---

# 📄 Report Export

Completed campaigns can generate professional audit reports including:

* KPI Summaries
* Delivery Metrics
* Conversion Analytics
* A/B Test Results
* Failure Logs
* AI Campaign Insights

---

# 🔐 Authentication

Supported authentication methods:

### Google Sign-In

* Auto registration
* JWT validation
* Session creation

### Email & Password

* SHA-256 password hashing
* Secure session cookies

---

# 🛠️ Technology Stack

Frontend:

* Next.js 15
* React
* Tailwind CSS
* Recharts
* Lucide Icons

Backend:

* Next.js Route Handlers
* Express.js

Database:

* Prisma ORM
* SQLite
* PostgreSQL

AI:

* OpenAI GPT-4o
* Rule-Based Fallback Engine

Infrastructure:

* BullMQ (Optional)
* In-Memory Queue
* Webhook Simulator

---

# 🚀 Local Setup

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Push schema:

```bash
npx prisma db push
```

Seed mock data:

```bash
npm run prisma:seed
```

Start both services:

```bash
npm run dev
```

Application:
http://localhost:3000

Channel Service:
http://localhost:3001

---

# 🌐 Production Deployment

Frontend:

* Vercel

Database:

* Neon PostgreSQL
* Supabase PostgreSQL

Backend Service:

* Render
* Railway

Environment Variables:

```env
DATABASE_URL=
OPENAI_API_KEY=
NEXT_PUBLIC_CHANNEL_SERVICE_URL=
GOOGLE_CLIENT_ID=
```

---

# 📊 Future Scalability

Current Evaluation Setup:

* SQLite
* In-Memory Queue
* Mock AI Fallback

Production Evolution:

* PostgreSQL
* Redis
* BullMQ
* Kafka
* Dedicated Messaging Providers
* Distributed Worker Pools

This architecture allows the platform to scale from local evaluation environments to millions of customer interactions while maintaining reliability and observability.
