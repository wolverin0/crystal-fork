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

## 3. Graph Memory (Beads Integration)

We adopt **Beads**, a distributed, git-backed graph issue tracker, as our long-term memory store. This replaces flat text files with a structured, queryable database.

### The Data Structure
*   **Storage:** JSONL files in `.beads/graph/` (synced via Git).
*   **Cache:** Local SQLite DB for fast querying (`.beads/cache.db`).
*   **Format:** A graph of "Beads" (Tasks/Events/Facts) with dependencies.

### Integration Workflow
1.  **Worker Bee (Input):**
    *   Detects error -> Creates a new Bead: `bd task add "Fix failure in test.ts" --tag "auto-detected"`.
2.  **Architect (Management):**
    *   Queries completed beads -> Summarizes them -> Creates "Policy Beads" (Rules).
    *   Performs "Memory Decay" by archiving old/resolved beads to keep the graph clean.
3.  **Active Session (Context):**
    *   Queries relevant beads (`bd list --tag "security"`) to inject *targeted* context into the prompt.
4.  **UI (Dashboard):**
    *   Visualizes the project graph (Nodes/Edges) in a dedicated panel.

## 4. Intelligent Tooling (Serena Integration)
... (keep existing Serena section)

## 5. Implementation Roadmap

1.  **Phase 1: The Logger (DONE)**
    *   Basic logging of session events.
    *   Integration of Gitleaks and Watchexec.

2.  **Phase 2: The Worker Bee (Stream Processor) (DONE)**
    *   Ollama integration (`OllamaService`).
    *   Basic error analysis logic.

3.  **Phase 3: The Graph Memory (Beads)**
    *   **Install:** Auto-install `bd` binary.
    *   **Backend:** Create `BeadsService` to wrap the CLI and read the SQLite cache.
    *   **Migration:** Update `CrystalMindService` to write to Beads instead of `MEMORIES.md`.
    *   **Frontend:** Create `BeadsPanel` for visualization.

4.  **Phase 4: The Architect (Batch Processor)**
    *   Update `ArchitectService` to process the Beads graph.
