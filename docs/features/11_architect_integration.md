# Feature: The Architect (Cloud Intelligence)

**Date Added:** January 11, 2026
**Status:** Live

## Overview
The "Architect" is the second phase of the **Crystal Mind**. While the "Worker Bee" handles real-time error logging, the Architect performs deep, periodic analysis of those logs to derive high-level architectural insights and best practices.

## Features
*   **Batch Processing:** Reads the accumulated `MEMORIES.md` log.
*   **Pattern Recognition:** Uses a reasoning model (e.g., DeepSeek R1 via Ollama or Claude 3.5 Sonnet) to identify recurring issues (e.g., "5 different sessions failed because of the same missing dependency").
*   **Knowledge Curation:** Updates `PROJECT_KNOWLEDGE.md` with consolidated rules and action items.
*   **Automatic Archival:** Rotates processed memories to `MEMORIES.archive.md` to keep the active log clean.

## Technical Implementation
*   **Backend (`ArchitectService`):** Manages the "Rethink" workflow.
*   **Integration:** Can be triggered manually via the UI or scheduled (future).
*   **Intelligence:** Leverages the same `OllamaService` connection but uses a more complex, reasoning-heavy prompt.

## How to Use
1.  Accumulate work (and errors) in your sessions.
2.  Open the Command Palette or AI Menu (future UI).
3.  Trigger **"Rethink Project"**.
4.  Review the updated `PROJECT_KNOWLEDGE.md` to see what your AI team has learned.
