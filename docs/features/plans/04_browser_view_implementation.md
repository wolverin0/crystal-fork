# Plan: Claude in Chrome (Embedded View)

## Objective
Embed a live browser view directly within Crystal sessions, allowing AI agents to perform visual testing and interact with the application they are building using the "Claude in Chrome" capability.

## 1. Architectural Approach
We will use Electron's `WebContentsView` (or the legacy `BrowserView`) to create a persistent browser instance that is docked side-by-side with the code and logs.

## 2. Backend Implementation
*   **Location:** `main/src/services/browser/browserViewManager.ts`
*   **Class:** `BrowserViewManager`
*   **Responsibilities:**
    *   Manage a pool of `WebContentsView` instances (one per session or singleton).
    *   Inject the "Claude in Chrome" bridge logic if necessary.
    *   Handle navigation and state persistence.
*   **IPC:** 
    *   `browser:navigate(url)`
    *   `browser:get-state()`

## 3. Frontend Implementation
*   **Location:** `frontend/src/components/panels/browser/BrowserPanel.tsx`
*   **UI:**
    *   A "Canvas" like panel that renders the browser output.
    *   Address bar, refresh, and navigation controls.
*   **Factory:** Register `browser` panel type in `CliPanelFactory`.

## 4. Claude Integration
*   When a session starts with `--chrome` or similar flags, Crystal automatically opens the Browser Panel.
*   The agent can then use its built-in browser tools to interact with the embedded view.

## 5. Testing Strategy
*   **Test File:** `tests/browser-integration.spec.ts`
*   **Scenario:**
    1.  Open Browser Panel.
    2.  Navigate to `localhost:3000` (or a mock page).
    3.  Verify the browser renders correctly.

## 6. Execution Steps
1.  Implement `BrowserViewManager` in the main process.
2.  Expose IPC handlers for browser control.
3.  Create `BrowserPanel.tsx` in the frontend.
4.  Update `shared/types/panels.ts` to include `browser`.
5.  Implement the automatic docking logic.
