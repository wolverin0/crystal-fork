# Feature: Auto-Test & Feedback (Watchexec)

**Date Added:** January 11, 2026
**Status:** Live

## Overview
Watchexec is now integrated into Crystal to provide an instant feedback loop during AI coding sessions. It automatically monitors the session's worktree and executes a user-defined test command whenever files are changed, reporting results directly to the session log.

## Features
*   **Instant Feedback:** Runs tests the millisecond a file is saved by an agent or user.
*   **Failure Detection:** Heuristically identifies test failures in the output and reports them as Session Errors.
*   **Configurable per Project:** Each project can define its own `Auto-Test Command` (e.g., `npm test`, `pytest`, `go test ./...`).
*   **Smart Watching:** Automatically watches relevant code extensions (`.ts`, `.js`, `.py`, `.go`, `.rs`, `.cpp`, `.c`, `.h`, `.txt`).

## Technical Implementation
*   **Backend (`WatchexecService`):** Manages background `watchexec` processes, capturing stdout/stderr and emitting events.
*   **Integration (`SessionManager`):** Automatically starts the watcher when a session is created if a test script is configured.
*   **Database:** Added `test_script` column to the `projects` table.
*   **UI:** Added "Auto-Test Command" field to Project Settings.

## How to Use
1.  Go to **Project Settings**.
2.  In the "Auto-Test Command (Watchexec)" field, enter your test command (e.g., `npm test`).
3.  Save the settings.
4.  Every new session created for this project will now automatically run this command whenever files are modified.
