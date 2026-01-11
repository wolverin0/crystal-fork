# Plan: Gitleaks Integration (Security Guard)

## Objective
Integrate **Gitleaks** to proactively scan agent-generated code for hardcoded secrets (API keys, credentials) before they are committed, acting as a crucial layer of the "Crystal Mind" system.

## 1. Backend Implementation
*   **Location:** `main/src/services/security/gitleaksService.ts`
*   **Class:** `GitleaksService`
*   **Responsibilities:**
    *   Verify `gitleaks` is installed in PATH.
    *   `scanContent(content: string)`: Scan a raw string (e.g., diff or file content) via stdin.
    *   `scanWorktree(worktreePath: string)`: Run a full scan on a session directory.
*   **Service Registration:** Add to `AppServices` in `main/src/services/index.ts`.

## 2. Integration Points
*   **Session Manager:**
    *   Intercept file saves or git commits initiated by Claude/Codex.
    *   Run `gitleaksService.scanContent` on the changed content.
*   **Memory Integration:**
    *   If a leak is found, append a formatted alert to `MEMORIES.md` (e.g., `[SECURITY] Hardcoded AWS Key detected in src/config.ts`).
    *   Add a visible alert to the Session UI (via `addSessionError` or a new security event).

## 3. IPC & API
*   **Channel:** `security:scan-content` (for frontend checks if needed).
*   **Channel:** `security:get-status` (to check if gitleaks is available).

## 4. Testing Strategy
*   **Test File:** `tests/gitleaks-integration.spec.ts`
*   **Scenario:**
    1.  Mock a "file save" operation containing a fake AWS key (`AKIA...`).
    2.  Verify `GitleaksService` returns a detection finding.
    3.  Verify the system blocks/alerts (depending on configured strictness).

## 5. Execution Steps
1.  Create `gitleaksService.ts`.
2.  Register service in `main/src/index.ts`.
3.  Add IPC handlers.
4.  Write integration test with a fake secret.
5.  Run test to verify.
