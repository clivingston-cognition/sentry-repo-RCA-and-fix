# Sentry RCA & Fix Demo

A demo test harness showing how **Sentry alerts** can trigger **Devin sessions** to automatically perform **Root Cause Analysis (RCA)** and create **fix PRs** — demonstrating event-driven MTTR reduction.

## Architecture

```
┌─────────────┐     ┌─────────┐     ┌──────────────┐     ┌───────────┐
│  Demo API   │────▶│ Sentry  │────▶│  Webhook /   │────▶│   Devin   │
│  (Express)  │     │ (Alert) │     │  Devin API   │     │  Session  │
└─────────────┘     └─────────┘     └──────────────┘     └─────┬─────┘
                                                               │
                                                               ▼
                                                        ┌─────────────┐
                                                        │  Fix PR on  │
                                                        │   GitHub    │
                                                        └─────────────┘
```

**Flow:**
1. The API app has intentional bugs that get triggered by API calls
2. Sentry SDK captures the errors and creates issues/alerts
3. A Sentry alert rule sends a webhook to the Devin API
4. Devin starts an event-driven session, investigates the error, and creates a fix PR
5. MTTR is measured from alert → PR created

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Sentry

Copy `.env.example` to `.env` and add your Sentry DSN:

```bash
cp .env.example .env
# Edit .env and set SENTRY_DSN
```

Get your DSN from: **Sentry > Project Settings > Client Keys (DSN)**

### 3. Start the server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 4. Trigger the bugs

```bash
# Trigger all bugs at once:
npm run trigger:all

# Or individually:
npm run trigger:null-ref      # Bug 1: Null reference
npm run trigger:type-error    # Bug 2: Type coercion / NaN
npm run trigger:async-error   # Bug 3: Unhandled promise rejection
```

## Demo Bugs

### Bug 1: Null Reference Error (`src/routes/users.js`)

**Trigger:** `GET /api/users/9999`

The endpoint fetches a user by ID but doesn't check if the result is `undefined` before accessing `.name`. Requesting a non-existent user causes:

```
TypeError: Cannot read properties of undefined (reading 'name')
```

**Root Cause:** Missing null check after database query.

### Bug 2: Type Coercion / NaN Error (`src/routes/orders.js`)

**Trigger:** `POST /api/orders` with `"quantity": "two"`

The order creation endpoint multiplies `quantity * price` without validating that `quantity` is a number. When a string is passed, the result is `NaN`, which cascades through the order total calculation.

```
TypeError: Order total calculation failed: expected a number but got NaN
```

**Root Cause:** Missing input type validation on the `quantity` field.

### Bug 3: Unhandled Promise Rejection (`src/routes/orders.js`)

**Trigger:** `GET /api/orders/process-queue`

The queue processor uses `.forEach()` with an `async` callback. When processing fails, the promise rejection is never caught because `.forEach()` doesn't await its callback.

```
Error: Failed to process order X: invalid total (NaN)
(UnhandledPromiseRejection)
```

**Root Cause:** Using `async` callbacks with `.forEach()` instead of `Promise.all()` with `.map()`.

## Setting Up Event-Driven Devin Sessions

### Step 1: Create a Sentry Alert Rule

In your Sentry project:
1. Go to **Alerts > Create Alert Rule**
2. Set conditions (e.g., "A new issue is created")
3. Under **Actions**, select **Send a notification via an integration > Webhooks**
4. Set the webhook URL to trigger the Devin API (see Step 2)

### Step 2: Configure the Devin API Webhook

You have two options for triggering Devin from Sentry:

#### Option A: Direct Devin API Call (Recommended)

Create a small webhook relay (e.g., on Vercel, AWS Lambda, or Cloudflare Workers) that:
1. Receives the Sentry webhook payload
2. Extracts the error details (title, stacktrace, issue URL)
3. Calls the Devin API to create a new session:

```bash
curl -X POST "https://api.devin.ai/v1/sessions" \
  -H "Authorization: Bearer ${DEVIN_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Sentry Alert RCA: A new error was detected in sentry-repo-RCA-and-fix.\n\nError: TypeError: Cannot read properties of undefined (reading '\''name'\'')\nFile: src/routes/users.js:33\nEndpoint: GET /api/users/:id\n\nSentry Issue: https://your-org.sentry.io/issues/12345/\n\nPlease investigate the root cause, implement a fix, and create a PR.",
    "playbook_id": "<your-playbook-id>"
  }'
```

#### Option B: Sentry Integration via Devin App

If your organization has the Devin Sentry integration installed:
1. Go to **Sentry > Settings > Integrations > Devin**
2. Configure the integration to auto-trigger sessions on new issues
3. Devin will automatically pick up the `.devin/playbooks/sentry-rca.md` playbook

### Step 3: Demo Flow

1. Start the API server: `npm start`
2. Trigger a bug: `npm run trigger:null-ref`
3. Watch Sentry create a new issue
4. The alert rule fires the webhook → Devin session starts
5. Devin investigates, finds root cause, creates a fix PR
6. Measure MTTR: time from Sentry alert to PR creation

## API Endpoints

| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| GET    | `/api/health`             | Health check                   |
| GET    | `/api/users`              | List all users                 |
| GET    | `/api/users/:id`          | Get user by ID (Bug 1)        |
| POST   | `/api/users`              | Create a new user              |
| GET    | `/api/products`           | List all products              |
| GET    | `/api/products/:id`       | Get product by ID              |
| GET    | `/api/orders`             | List all orders                |
| POST   | `/api/orders`             | Create an order (Bug 2)        |
| GET    | `/api/orders/process-queue` | Process pending orders (Bug 3) |

## Running Tests

```bash
npm test
```

Tests document both expected behavior and the known bugs.

## Project Structure

```
sentry-repo-RCA-and-fix/
├── .devin/
│   └── playbooks/
│       └── sentry-rca.md          # Devin playbook for Sentry RCA
├── scripts/
│   ├── trigger-null-ref.sh        # Trigger Bug 1
│   ├── trigger-type-error.sh      # Trigger Bug 2
│   ├── trigger-async-error.sh     # Trigger Bug 3
│   └── trigger-all.sh             # Trigger all bugs
├── src/
│   ├── db/
│   │   └── database.js            # SQLite database setup & seed
│   ├── middleware/
│   │   └── errorHandler.js        # Global error handler
│   ├── routes/
│   │   ├── health.js              # Health check route
│   │   ├── users.js               # User routes (Bug 1)
│   │   ├── orders.js              # Order routes (Bug 2 & 3)
│   │   └── products.js            # Product routes (clean)
│   ├── app.js                     # Express app setup
│   └── index.js                   # Server entry point
├── tests/
│   ├── health.test.js
│   ├── users.test.js
│   ├── orders.test.js
│   └── products.test.js
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .nvmrc
├── package.json
└── README.md
```
