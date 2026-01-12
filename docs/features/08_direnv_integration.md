# Feature: Environment Isolation (Direnv)

**Date Added:** January 11, 2026
**Status:** Live

## Overview
Crystal now supports per-session environment variable isolation using `.env` files. This allows you to work on multiple projects or branches that require conflicting configurations (e.g., different ports, database URLs) simultaneously without interference.

## Features
*   **Automatic Loading:** When a terminal or agent starts in a session, Crystal checks the worktree root for `.env` and `.env.local` files.
*   **Isolation:** Variables are injected *only* into the processes of that specific session. They do not leak into the global environment or other concurrent sessions.
*   **Conflict Resolution:** `.env.local` overrides `.env`, allowing you to have secret local overrides that aren't committed to git.

## Technical Implementation
*   **Backend (`DirenvService`):** A lightweight parser that reads environment files and converts them to a dictionary.
*   **Integration (`TerminalPanelManager`):** Injects the parsed variables into the `env` object of the node-pty process at spawn time.

## How to Use
1.  Create a `.env` file in your project root (or inside a specific session's worktree).
    ```bash
    PORT=3005
    DATABASE_URL=postgres://localhost:5432/test_db_3
    ```
2.  Open a terminal in that Crystal session.
3.  Run `echo $PORT`. It will output `3005`.
