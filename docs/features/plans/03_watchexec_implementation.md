# Plan: Watchexec Integration (Auto-Test)

## Objective
Integrate **Watchexec** to provide an instant feedback loop by automatically running project tests whenever an AI agent saves a file, allowing the agent to "know" if its code works without waiting for a manual turn.

## 1. Backend Implementation
*   **Location:** `main/src/services/testing/watchexecService.ts`
*   **Class:** `WatchexecService`
*   **Responsibilities:**
    *   Verify `watchexec` is installed in PATH.
    *   `startWatcher(sessionId, worktreePath, testCommand)`: Spawn a `watchexec` process that monitors the worktree.
    *   `stopWatcher(sessionId)`: Kill the watcher process.
*   **Service Registration:** Add to `AppServices`.

## 2. Integration Points
*   **Project Config:** Allow users to define a `testCommand` in project settings (e.g., `npm test`, `pytest`).
*   **Session Start:** When a session starts, if a `testCommand` is configured, automatically start a `watchexec` process.
*   **Feedback Loop:**
    *   Capture `stdout/stderr` from the test run.
    *   If tests fail, send an event to the UI and (optionally) notify the agent via a system message.

## 3. IPC & API
*   **Channel:** `testing:start-watcher`
*   **Channel:** `testing:stop-watcher`
*   **Channel:** `testing:get-status`

## 4. Testing Strategy
*   **Test File:** `tests/watchexec-integration.spec.ts`
*   **Scenario:**
    1.  Start a session in a mock project.
    2.  Write a file that triggers a "failing" test.
    3.  Verify Crystal detects the test failure automatically.

## 5. Execution Steps
1.  Install `watchexec` in the environment.
2.  Create `watchexecService.ts`.
3.  Register service and IPC handlers.
4.  Update project settings to support `testCommand`.
5.  Implement the automatic watcher startup in `SessionManager`.
6.  Verify with Playwright.
