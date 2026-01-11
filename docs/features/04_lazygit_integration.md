# Feature: Visual Git Management (Lazygit)

**Date Added:** January 11, 2026
**Status:** Live

## Overview
Lazygit is now integrated as a native tool panel within Crystal. This replaces the need to switch to an external terminal to stage files, review hunks, or resolve merge conflicts in a session's worktree.

## Features
*   **Embedded TUI:** A full-featured `lazygit` interface rendered using xterm.js within a Crystal panel.
*   **Context Aware:** Automatically opens in the specific git worktree associated with the active session.
*   **Interactive Review:** Staging, discarding, and commit management are now visual and keyboard-driven.
*   **Automatic Sizing:** Seamlessly handles panel resizing and terminal re-flow.

## Technical Implementation
*   **Backend (`LazygitManager`):** Manages the lifecycle of the `lazygit` PTY process.
*   **UI (`LazygitPanel`):** A high-performance terminal component dedicated to the Lazygit TUI.
*   **Discovery:** Crystal checks for the `lazygit` binary in the system PATH and reports availability via the "Add Tool" menu.

## How to Use
1.  Open any session in Crystal.
2.  Click **"Add Tool"** in the panel tab bar.
3.  Select **"Lazygit"**.
4.  The TUI will initialize instantly, showing the current state of the worktree.
