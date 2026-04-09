# Sentry Alert RCA Playbook

> This playbook is used by child sessions spawned from the **Sentry Poller** playbook.
> Each child session receives a specific Sentry issue ID, uses the **Sentry MCP** to
> retrieve full details, performs root cause analysis, and creates a fix PR.

## Prerequisites

- The **Sentry MCP integration** must be installed in your Devin org settings:
  [Install Sentry MCP](https://app.devin.ai/settings/mcp-marketplace/setup/sentry)
- Repo: `clivingston-cognition/sentry-repo-RCA-and-fix`

## Input

This playbook expects the session prompt to include:
- The **Sentry issue ID** to investigate
- The **Sentry organization slug** and **project slug**

## Steps

### 1. Retrieve Issue Details via Sentry MCP

Use the Sentry MCP tools to get complete issue context:

```
# Get full issue details including stack trace
mcp_tool: sentry -> get_issue(issue_id="<issue-id>")

# Get the latest event for the issue (full stack trace + request data)
mcp_tool: sentry -> get_latest_event(issue_id="<issue-id>")
```

Extract from the Sentry response:
- Error type and message
- Full stack trace with file paths and line numbers
- Request URL / endpoint that triggered the error
- Environment, release, and tags
- Number of occurrences and affected users

### 2. Analyze the Stack Trace

- Identify the file and line number from the top of the stack trace
- Navigate to the file in the codebase
- Read the surrounding code to understand the context
- Trace the code path that leads to the error

### 3. Root Cause Analysis

- Identify the root cause (null reference, type error, missing validation, etc.)
- Document:
  - **What**: The exact error and where it occurs
  - **Why**: The root cause (e.g., missing null check, type coercion, unhandled async)
  - **Impact**: What user-facing behavior affected (from Sentry's user/event counts)
  - **Fix**: What needs to change

### 4. Implement the Fix

- Create a new branch: `devin/<timestamp>-fix-<error-type>`
- Implement the minimal fix:
  - Add proper null/undefined checks
  - Add input validation
  - Add proper error handling
  - Add proper async/await handling
- Run tests: `npm test`
- Run lint: `npm run lint`
- Ensure the fix follows existing code conventions

### 5. Update Sentry Issue Status

Use the Sentry MCP to update the issue:

```
# Mark the issue as resolved
mcp_tool: sentry -> update_issue(issue_id="<issue-id>", status="resolved")
```

### 6. Create a Pull Request

- Commit the fix with a descriptive message referencing the Sentry issue
- Create a PR with:
  - Title: `fix: <description> [SENTRY-<issue-id>]`
  - Description including:
    - Root cause analysis
    - What was fixed
    - Link to the Sentry issue
    - Number of affected users/events
- Wait for CI to pass

### 7. Report Back

- Provide a summary of:
  - Root cause analysis
  - Fix implemented
  - PR link
  - Sentry issue link
  - Time from alert to fix (MTTR)
