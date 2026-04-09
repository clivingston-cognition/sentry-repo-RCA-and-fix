# Sentry RCA & Fix Demo

A demo test harness showing how **Devin** can automatically **poll Sentry** for new issues, perform **Root Cause Analysis (RCA)**, and create **fix PRs** — demonstrating automated MTTR reduction.

## Architecture

```
┌─────────────┐     ┌─────────┐     ┌──────────────┐     ┌───────────┐
│  Demo API   │────▶│ Sentry  │     │  Scheduled   │────▶│  Child    │
│  (Express)  │     │ (Issue) │◀────│  Devin Poll  │     │  Sessions │
└─────────────┘     └─────────┘     │  (Sentry MCP)│     └─────┬─────┘
                                    └──────────────┘           │
                                          ↑                    ▼
                                    (every N min)        ┌─────────────┐
                                                         │  Fix PR on  │
                                                         │   GitHub    │
                                                         └─────────────┘
```

**Flow (polling-based):**
1. The API app has intentional bugs that get triggered by API calls
2. Sentry SDK captures the errors and creates issues
3. A **scheduled Devin session** polls Sentry via the **Sentry MCP** for new unresolved issues
4. For each new issue, Devin spawns a **child session** that retrieves the full stack trace via Sentry MCP
5. The child session performs RCA, implements a fix, and creates a PR
6. MTTR is measured from issue creation → PR created

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

## Setting Up Polling-Based Devin Sessions

### Step 1: Install the Sentry MCP Integration

The Sentry MCP gives Devin direct access to query issues, stack traces, and event data:

1. Go to your [Devin MCP Marketplace settings](https://app.devin.ai/settings/mcp-marketplace/setup/sentry)
2. Click **Install** and provide your Sentry auth token
3. Devin can now use `mcp_tool: sentry` to list issues, get stack traces, update issue status, etc.

> **What the Sentry MCP enables:**
> - `list_issues` — Search/filter Sentry issues by project, status, query
> - `get_issue` — Get full issue details (title, type, frequency, assignee)
> - `get_latest_event` — Get the latest event with full stack trace + request context
> - `update_issue` — Resolve issues, assign them, update tags

### Step 2: Create a Scheduled Devin Session (Poller)

Set up a recurring Devin session that polls Sentry for new issues. In Devin's
[Schedule settings](https://app.devin.ai/settings), create a new scheduled session:

- **Name**: `Sentry Issue Poller`
- **Frequency**: Every 5-10 minutes (e.g., cron `*/5 * * * *`)
- **Prompt**:
  ```
  Poll Sentry for new unresolved issues in the sentry-rca-demo project using
  the Sentry MCP. For each new unresolved and unassigned issue, spawn a child
  Devin session to investigate the root cause and create a fix PR in
  clivingston-cognition/sentry-repo-RCA-and-fix. Assign the issue in Sentry
  so it won't be picked up again on the next poll.
  ```
- **Playbook**: Use the `sentry-poller` playbook (in `.devin/playbooks/sentry-poller.md`)

Alternatively, you can create the schedule via the Devin API:

```bash
curl -X POST "https://api.devin.ai/v1/schedules" \
  -H "Authorization: Bearer ${DEVIN_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sentry Issue Poller",
    "frequency": "*/5 * * * *",
    "prompt": "Poll Sentry for new unresolved issues using the Sentry MCP. For each new issue, spawn a child session to perform RCA and create a fix PR in clivingston-cognition/sentry-repo-RCA-and-fix."
  }'
```

### Step 3: Demo Flow

1. Start the API server: `npm start`
2. Trigger a bug: `npm run trigger:null-ref`
3. Sentry captures the error and creates an issue
4. Within minutes, the scheduled Devin poller detects the new issue via Sentry MCP
5. Devin spawns a child session that:
   - Retrieves the full stack trace from Sentry
   - Performs root cause analysis
   - Implements a fix and creates a PR
   - Resolves the issue in Sentry
6. Measure MTTR: time from Sentry issue creation → PR created

### For a Quick Manual Demo

If you don't want to wait for the poller, you can manually trigger a Devin session:

```bash
curl -X POST "https://api.devin.ai/v1/sessions" \
  -H "Authorization: Bearer ${DEVIN_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Use the Sentry MCP to check for unresolved issues in the sentry-rca-demo project. For the most recent unresolved issue, retrieve the full stack trace, perform root cause analysis in clivingston-cognition/sentry-repo-RCA-and-fix, implement a fix, and create a PR. Then resolve the issue in Sentry."
  }'
```

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
│       ├── sentry-poller.md       # Scheduled poller — finds new Sentry issues
│       └── sentry-rca.md          # Child session — RCA & fix for one issue
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
