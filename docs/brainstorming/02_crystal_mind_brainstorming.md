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

## 3. Structured Layered Memory (The "Mnexium-Lite" Pattern)

We adopt a layered approach to memory, moving from raw logs to curated wisdom, inspired by Mnexium's architecture but keeping it local and file-based.

### Layer 1: The Raw Stream (`MEMORIES.jsonl`)
A high-volume, append-only log of every detected event. **Write-Only** by the Worker Bee.
```json
{"timestamp": "2026-01-11T10:00:00Z", "type": "error", "severity": "high", "location": "src/api.ts", "content": "Security leak detected", "context": "AWS Key"}
{"timestamp": "2026-01-11T10:05:00Z", "type": "correction", "severity": "medium", "location": "package.json", "content": "User corrected dependency version", "context": "react@19"}
```

### Layer 2: The Curated Knowledge (`PROJECT_KNOWLEDGE.md`)
A concise, human-readable rulebook managed by **The Architect**.
*   **Trigger:** The Architect runs (daily/weekly), reads Layer 1, consolidates patterns, and updates this file.
*   **Usage:** This file is **Read-Only** by the Active Session (injected into System Prompt).
*   **Content:**
    *   "Project Rules: Always use `pnpm`."
    *   "Architecture: `SessionManager` handles db access, not `ipc/session`."
    *   "Pitfalls: Avoid `date-fns`, use `dayjs`."

## 4. Intelligent Tooling (Serena Integration)

To make the "Worker Bee" and the "Active Agent" smarter without bloating context, we integrate **Serena** (an open-source MCP server for LSP/Code Intelligence).

*   **Role:** Provides "IDE Superpowers" to the LLM.
*   **Capabilities:** `find_symbol`, `find_references`, `get_type_definition`.
*   **Benefit:** Instead of reading a 500-line file to find a function, the agent asks Serena `find_symbol("createSession")`. This saves tokens and increases accuracy.
*   **Integration:** Crystal detects `serena` and auto-mounts it as an MCP server for every session.

## 5. Implementation Roadmap

1.  **Phase 1: The Logger (DONE)**
    *   Basic logging of session events.
    *   Integration of Gitleaks and Watchexec.

2.  **Phase 2: The Worker Bee (Stream Processor)**
    *   Implement `CrystalMindService`.
    *   Connect to local Ollama (Qwen 2.5 Coder).
    *   Parse session turns and write to `MEMORIES.jsonl`.

3.  **Phase 3: The Architect (Batch Processor)**
    *   Create the "Rethink" workflow that reads `MEMORIES.jsonl`.
    *   Uses DeepSeek R1 to generate `PROJECT_KNOWLEDGE.md`.

4.  **Phase 4: Tooling (Serena)**
    *   Add `SerenaManager` to Crystal.
    *   Auto-launch Serena MCP server if installed.
