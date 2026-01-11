# Crystal Mind: The Shadow Observer System

**Status:** Conceptual / Brainstorming
**Date:** January 11, 2026

## Core Concept
A background daemon that utilizes unused local GPU compute to analyze "turns" of Crystal sessions, extracting architectural insights, error patterns, and project-specific knowledge. 

**Key Philosophy:** "Zero Context Cost." The active AI session does NOT read the logs it generates. Only a separate "Architect" process reads them to distill wisdom.

## 1. Architecture: The Two-Brain System

We separate the workload into "Stream Processing" (Fast, Local) and "Deep Synthesis" (Slow, Cloud).

### Tier 1: The Worker Bee (Stream Processor)
*   **Role:** Real-time extraction of facts and error classification.
*   **Trigger:** Runs on every `session.jsonl` update (new turn).
*   **Input:** The Diff + The User Prompt + The Assistant Response.
*   **Model:** **Qwen 2.5 Coder 32B** (or 14B/7B if VRAM constrained).
    *   *Why:* State-of-the-art coding performance for <70B models. Fits in consumer GPUs.
*   **Action:**
    1.  Classifies interaction: `SUCCESS`, `ERROR`, `CORRECTION`, `NOISE`.
    2.  Extracts specific file references (e.g., "Error in `src/utils/api.ts`").
    3.  **Appends** to `MEMORIES.md` (Write-Only).

### Tier 2: The Architect (Synthesizer)
*   **Role:** Root cause analysis and high-level documentation.
*   **Trigger:** Scheduled (Daily/Weekly) or Manual ("Rethink" button).
*   **Input:** The content of `MEMORIES.md` + Referenced File Content (via Gemini File Search/RAG).
*   **Model:** **DeepSeek R1** (via OpenRouter/API) or **Claude 3.5 Sonnet**.
    *   *Why:* Requires strong reasoning capabilities to spot systemic architectural flaws.
*   **Action:**
    1.  Reads `MEMORIES.md`.
    2.  Analyzes the code sections flagged by the Worker Bee.
    3.  Updates `CLAUDE.md` or suggests new Global Rules.
    4.  **Archives** processed memories to `MEMORIES.archive.md`.

## 2. Model Selection (12B-32B Range)

*Note: While "Qwen 3" models are appearing experimentally (Jan 2026), **Qwen 2.5 Coder** remains the stable, production-ready choice for local deployment.*

| Model | Size | Strength | Use Case |
| :--- | :--- | :--- | :--- |
| **Qwen 2.5 Coder 32B** | 32B | **SOTA** for Coding. Matches GPT-4o in many benchmarks. | Primary choice if VRAM allows. |
| **Qwen 2.5 Coder 14B** | 14B | Incredible efficiency/performance ratio. | Best balance for background tasks. |
| **Mistral Small 3** | 22B | Strong reasoning, good instruction following. | Good alternative. |

## 3. Data Structure: `MEMORIES.md` (The Write-Only Sink)

This file sits in the project root (or `.claude/`). It is **never** read by the active session, preserving context window.

```markdown
# Crystal Memories (Write-Only Log)
> This file is a raw log of detected issues. It is analyzed by the "Architect" process, not the active session.

- [2026-01-11T10:00:00] [ERROR] [src/components/Header.tsx] User corrected: "Use 'lucide-react' imports, not '@heroicons/react'."
- [2026-01-11T10:05:00] [ISSUE] [package.json] Dependency conflict: "react" v19 vs "react-dom" v18.
- [2026-01-11T10:15:00] [TASK] [Refactor] User requested: "Split the huge SessionManager class."
```

## 4. Agent Interoperability (Future Proofing)

Leveraging **Google A2A** and **Gemini File Search**:

*   **A2A Protocol:** We can expose the "Worker Bee" as an A2A agent. This allows other tools (or even other Crystal instances) to query it: "What are the common errors in this repo?"
*   **File Search (RAG):** instead of feeding raw files to the Architect, we upload the repo to Gemini's File Search API. The Architect then *queries* the codebase: "Show me all files that import `date-fns`." This handles massive context windows cheaply and effectively.

## 5. Implementation Roadmap

1.  **Phase 1: The Logger**
    *   Create a watcher for `~/.claude/sessions`.
    *   Parse the JSONL.
    *   Extract the last turn.
    *   Log to a local JSON file (no LLM yet).

2.  **Phase 2: The Worker Bee**
    *   Connect to local Ollama instance.
    *   Send the last turn to `qwen2.5-coder:14b`.
    *   Prompt: "Analyze this interaction. Did the user correct the AI? If so, what was the mistake?"
    *   Append result to `MEMORIES.md`.

3.  **Phase 3: The Architect**
    *   Create the "Rethink" workflow that reads `MEMORIES.md`.
    *   Uses DeepSeek R1 to summarize and suggest actions.
    *   Clears `MEMORIES.md` after processing.
