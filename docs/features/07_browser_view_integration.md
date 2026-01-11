# Feature: Embedded Browser (Canvas)

**Date Added:** January 11, 2026
**Status:** Live

## Overview
Crystal now includes an embedded browser engine that can be used as a "Canvas" for AI agents. This allows Claude or Codex to perform visual testing, interact with web UIs, and verify front-end changes in real-time without leaving the Crystal application.

## Features
*   **Live Preview:** See your web application render side-by-side with your code.
*   **Agent Interaction:** Fully compatible with "Claude in Chrome" capabilities, allowing the agent to "click" and "type" inside the embedded view.
*   **Address Bar & Controls:** Includes standard navigation controls (Back, Forward, Reload) and an address bar.
*   **Context Aware:** Can be docked as a persistent tool panel within any session.
*   **High Performance:** Built using Electron's native `WebContentsView` for zero-latency rendering and maximum security isolation.

## Technical Implementation
*   **Backend (`BrowserViewManager`):** Manages the lifecycle and positioning of native Electron browser views.
*   **UI (`BrowserPanel`):** A custom React component that calculates absolute screen coordinates to perfectly dock the native browser view within the web-based UI.
*   **IPC:** Comprehensive set of channels for navigation (`browser:navigate`), state synchronization (`browser:state-updated`), and window management (`browser:attach`/`browser:detach`).

## How to Use
1.  Open any session.
2.  Click **"Add Tool"** and select **"Browser"**.
3.  Enter a URL (e.g., `http://localhost:3000`) to start visual testing.
4.  Optionally, instruct Claude to use its browser tools to interact with the page.
