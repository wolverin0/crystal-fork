# Feature: Linked Plans & CLAUDE.md Management

**Date Added:** January 11, 2026
**Status:** Live

## Overview
This feature set bridges the gap between Crystal's UI and the underlying Claude CLI state, focusing on Context persistence and Documentation health.

## 1. Linked Plans
Crystal now automatically detects the "Plan" associated with a specific Claude Session.

### How it works
1.  **Slug Detection:** When a session is loaded, Crystal reads the underlying `~/.claude/sessions/{id}.jsonl` file.
2.  **Extraction:** It extracts the `slug` field from the session metadata.
3.  **Plan Retrieval:** It locates the corresponding plan file in `~/.claude/plans/{slug}.md`.
4.  **UI:** A "Plan Linked" button appears in the Session Header. Clicking it opens the full markdown plan in a modal.

## 2. CLAUDE.md Management ("Rethink")
Crystal now actively monitors and helps maintain the `CLAUDE.md` project documentation file.

### Features
*   **Staleness Detection:** Checks if `CLAUDE.md` hasn't been modified in over 7 days.
*   **Visual Alerts:** Displays an "Outdated Docs" warning in the UI if stale.
*   **"Rethink" Workflow:** A one-click automated process to regenerate documentation:
    1.  **Backup:** Automatically backs up the existing `CLAUDE.md` to a `backups/` directory (timestamped).
    2.  **Template Injection:** Loads a standardized "Metaclaude" template ensuring consistent documentation structure.
    3.  **Prompt Engineering:** Constructs and sends a high-context prompt to the active Claude session, instructing it to analyze the codebase and regenerate the file based on the template.

## Technical Implementation
*   **Service:** `ClaudeStateService` (Backend) handles file system operations on the hidden `.claude` directory.
*   **IPC:** New channels `sessions:get-linked-plan`, `sessions:get-claude-md-status`, etc.
*   **Template:** The Metaclaude template is hardcoded in the backend to ensure consistency across all projects.
