# Sentry Alert RCA Playbook

> This playbook is triggered automatically when a Sentry alert webhook fires.
> Devin will investigate the error, identify the root cause, and create a fix PR.

## Trigger

This playbook is designed to be triggered by a **Sentry webhook** via the Devin API.
The webhook payload includes the Sentry issue URL and error details.

## Inputs

The session will receive the following context from the Sentry webhook:
- `sentry_issue_url` — Link to the Sentry issue
- `error_title` — The error message / title from Sentry
- `error_type` — The exception type (e.g. TypeError, Error)
- `stacktrace` — The full stack trace
- `tags` — Sentry tags (environment, server name, etc.)

## Steps

### 1. Acknowledge & Parse the Alert

- Read the Sentry alert payload provided in the session prompt
- Extract: error type, error message, file path, line number, stack trace
- Identify the affected service/endpoint from the stack trace

### 2. Clone and Explore the Codebase

- Clone the repository: `https://github.com/clivingston-cognition/sentry-repo-RCA-and-fix`
- Navigate to the file and line number from the stack trace
- Read the surrounding code to understand the context

### 3. Root Cause Analysis

- Trace the code path that leads to the error
- Identify the root cause (null reference, type error, missing validation, etc.)
- Document:
  - **What**: The exact error and where it occurs
  - **Why**: The root cause (e.g., missing null check, type coercion)
  - **Impact**: What user-facing behavior is affected
  - **Fix**: What needs to change

### 4. Implement the Fix

- Create a new branch: `devin/<timestamp>-fix-<error-type>`
- Implement the minimal fix:
  - Add proper null/undefined checks
  - Add input validation
  - Add proper error handling
  - Add proper async/await handling
- Ensure the fix follows existing code conventions

### 5. Create a Pull Request

- Commit the fix with a descriptive message referencing the Sentry issue
- Create a PR with:
  - Title: `fix: <description> [Sentry-<issue-id>]`
  - Description including: root cause analysis, what was fixed, Sentry issue link
- Wait for CI to pass

### 6. Report Back

- Provide a summary of:
  - Root cause analysis
  - Fix implemented
  - PR link
  - Time from alert to fix (MTTR)
