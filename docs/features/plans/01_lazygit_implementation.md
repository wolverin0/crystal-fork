# Plan: Lazygit Integration

## Objective
Integrate **Lazygit** as a native tool panel within Crystal sessions, allowing users to manage git operations (staging, reviewing, squashing) visually without leaving the application.

## 1. Backend Implementation
*   **Location:** `main/src/services/panels/lazygit/`
*   **Class:** `LazygitManager` (extends `AbstractCliManager`)
*   **Responsibilities:**
    *   Verify `lazygit` is installed (or use a bundled binary?). *Decision: Assume installed in PATH for MVP, or provide instruction.*
    *   Spawn `lazygit` process in the session's `worktreePath`.
    *   Handle PTY sizing and input/output (standard terminal behavior).

## 2. Frontend Implementation
*   **Location:** `frontend/src/components/panels/lazygit/`
*   **Component:** `LazygitPanel.tsx`
*   **UI:**
    *   Re-use the existing `TerminalPanel` logic (since Lazygit is a TUI).
    *   Maybe add specific control buttons if needed (e.g., "Quit", "Refresh").
*   **Factory:** Update `CliPanelFactory.tsx` to register `lazygit` type.

## 3. IPC & Registration
*   **File:** `main/src/services/cliManagerFactory.ts`
*   **Action:** Register `LazygitManager` with ID `lazygit`.
*   **Types:** Update `shared/types/panels.ts` to include `lazygit`.

## 4. Testing Strategy (Playwright)
*   **Test File:** `tests/lazygit-integration.spec.ts`
*   **Scenario:**
    1.  Create a new session.
    2.  Open the "Tools" menu.
    3.  Select "Lazygit".
    4.  Verify the panel opens.
    5.  Verify the terminal content contains "lazygit" UI text (e.g., "Status", "Files").
    6.  (Advanced) Simulate a keypress (e.g., `q`) and verify it handles input.

## 5. Execution Steps
1.  Create backend manager `lazygitManager.ts`.
2.  Register tool in `cliManagerFactory.ts`.
3.  Update types.
4.  Update frontend factory.
5.  Write Playwright test.
6.  Run test to verify.
