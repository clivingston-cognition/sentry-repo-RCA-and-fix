# Sentry Poller Playbook

> This playbook runs on a **schedule** (e.g., every 5 minutes) to poll Sentry
> for new unresolved issues. When it finds new issues, it spawns child Devin
> sessions to perform RCA and create fix PRs.

## How It Works

```
┌──────────────┐     ┌─────────┐     ┌──────────────┐     ┌───────────┐
│  Scheduled   │────▶│ Sentry  │────▶│  New issues   │────▶│  Child    │
│  Devin Poll  │     │  MCP    │     │  found?       │     │  Sessions │
└──────────────┘     └─────────┘     └──────────────┘     └─────┬─────┘
       ↑                                                         │
       │              (runs every N minutes)                     ▼
       └─────────────────────────────────────────────    ┌─────────────┐
                                                         │  Fix PR on  │
                                                         │   GitHub    │
                                                         └─────────────┘
```

## Prerequisites

- **Sentry MCP** installed: [Install Sentry MCP](https://app.devin.ai/settings/mcp-marketplace/setup/sentry)
- Repo: `clivingston-cognition/sentry-repo-RCA-and-fix`

## Steps

### 1. Poll Sentry for New Unresolved Issues

Use the Sentry MCP to query for recent unresolved issues:

```
mcp_tool: sentry -> list_issues(
  query="is:unresolved !has:assignee",
  project="<project-slug>",
  sort="date"
)
```

Filter the results to only issues created since the last poll window
(e.g., last 10 minutes to allow for overlap).

If no new issues are found, report "No new Sentry issues" and exit.

### 2. For Each New Issue, Spawn a Child Devin Session

For each unresolved issue found, create a child Devin session to investigate and fix it:

```
devin_session_create(sessions=[{
  "prompt": "Sentry RCA: Investigate and fix Sentry issue <ISSUE-ID> in clivingston-cognition/sentry-repo-RCA-and-fix.\n\nSentry Issue ID: <ISSUE-ID>\nSentry Org: <org-slug>\nProject: <project-slug>\n\nUse the Sentry MCP to retrieve the full issue details and stack trace. Perform root cause analysis, implement a fix, and create a PR. Then mark the Sentry issue as resolved.",
  "repos": ["clivingston-cognition/sentry-repo-RCA-and-fix"]
}])
```

### 3. Assign the Issue in Sentry

Mark the issue as assigned so the next poll doesn't pick it up again:

```
mcp_tool: sentry -> update_issue(issue_id="<issue-id>", assignedTo="devin")
```

### 4. Report Summary

Report back with:
- Number of new issues found
- Child session IDs spawned
- Issue titles and Sentry links
