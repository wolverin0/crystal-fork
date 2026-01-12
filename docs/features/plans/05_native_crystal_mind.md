# Plan: Native Crystal Mind (Phase 2 & 3 Evolution)

## Objective
Implement the "Crystal Mind" intelligence layer using **Claude Code's native Sub-Agent architecture** and **Beads** for graph-based memory, eliminating the dependency on local Ollama/GPU infrastructure.

## 1. Core Architecture: The "Haiku-Managed" Brain
Instead of a separate local LLM, we utilize specialized Claude sub-agents invoked programmatically via "Headless Mode" (`claude -p`).

### components:
*   **Memory Store:** **Beads** (stored in `.beads/`). Provides a distributed, git-backed graph of project events.
*   **Memory Manager Agent:** A custom Claude sub-agent defined in `.claude/agents/memory-manager.md`.
*   **Worker Bee (Real-time):** Programmatic calls to `claude -p` using the **Haiku 4.5** model for cheap, fast error analysis.
*   **Architect (Batch):** Programmatic calls to `claude -p` using the **Sonnet/Opus 4.5** model for deep architectural synthesis.

## 2. Implementation: The Memory Manager Sub-Agent
**File:** `.claude/agents/memory-manager.md`
```markdown
---
name: memory-manager
description: Expert at managing the 'Beads' graph memory system. Stores, retrieves, and summarizes project tasks, errors, and architectural facts.
tools: Read, Write, Bash, Glob
model: claude-haiku-4-5-20251001
---
You are the Memory Manager. Your role is to maintain the long-term memory of this project using 'Beads'.
- Use the 'bd' (Beads CLI) to create and query beads.
- When an error is reported, create a Bead with the 'bug' tag.
- When asked for context, query the graph for relevant patterns.
```

## 3. Workflow Integration

### A. Worker Bee (Error Detection)
1. Crystal (via `Watchexec`/`Gitleaks`) detects an issue.
2. Crystal spawns a headless process:
   ```bash
   claude -p "Memory Manager: Analyze this error and log it to Beads: [error_log]" --agent memory-manager
   ```
3. The Memory Manager uses the `bd` tool to add a task/finding to the project graph.

### C. Compaction Interception (The Gold Panner)
Context compaction destroys detail. To prevent memory loss, Crystal intercepts this event.
1. **Monitor:** `SessionManager` watches stdout/stderr for the "Compacting conversation..." signal.
2. **Action:** Immediately captures the current session logs *before* they are squashed.
3. **Extraction:** Spawns a headless `memory-manager` with the prompt:
   > "The session is about to be compacted. Extract any specific bug fixes, library decisions, or technical facts from this raw log before they are lost."
4. **Result:** High-fidelity facts are saved to Beads, while the active session continues with a clean slate.

### D. The Full Lifecycle (Simulated Hooks)
Crystal wraps the Claude CLI, allowing us to simulate native hooks for powerful RAG features.

| Crystal Trigger | Simulated Hook | Action (Crystal Mind) |
| :--- | :--- | :--- |
| **Session Start** | `SessionStart` | **Context Injection:** Queries Beads for "Active Epics" and injects them into the system prompt. |
| **User Input** | `UserPrompt` | **Just-in-Time RAG:** Scans user text for keywords (e.g., "auth"), queries Beads, and injects relevant rules ("Use Auth0") before sending to Claude. |
| **File Save** | `PreToolUse` | **Guardrails:** Watchexec/Gitleaks run immediately on save, acting as a sanity check. |
| **Process Stop** | `Stop` | **Retrospective:** Triggers the "Session End Hook" to summarize the session into Beads. |

## 4. Advantages of this Strategy
*   **Context Efficiency:** The active session only receives *distilled* beads, not raw logs.
*   **Zero Infrastructure:** Works out-of-the-box for any user logged into Claude Code.
*   **Model Specialization:** Uses fast Haiku for logs and smart Sonnet for architecture.
*   **Distributed Memory:** Since Beads is Git-backed, the "Mind" syncs across different machines automatically.

## 5. Verification Plan (Pre-Restart Check)
1.  **Agent Visibility:** Run `claude --help` to ensure `--agent` is recognized. (DONE)
2.  **Headless Link:** Run `claude -p "test"` to ensure output can be captured programmatically. (PENDING RESTART)
3.  **Sub-Agent Call:** Run `claude -p "Say hi" --agent memory-manager`. (PENDING RESTART)
4.  **End-to-End:** Trigger a `watchexec` error and verify a Bead is created.
