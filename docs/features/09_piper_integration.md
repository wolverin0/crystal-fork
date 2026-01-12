# Feature: Ambient Voice Alerts (Piper TTS)

**Date Added:** January 11, 2026
**Status:** Live

## Overview
Crystal now features **Ambient Computing** capabilities using **Piper**, a fast, local, neural text-to-speech engine. Instead of forcing you to constantly monitor multiple session windows, Crystal will verbally notify you of critical events.

## Features
*   **Audio Notifications:** Crystal speaks out loud when a session encounters a critical error (e.g., "Session error: Auto-Test Failure detected").
*   **Local & Private:** Runs entirely on your machine using the `en_US-lessac-medium` voice model. No audio is sent to the cloud.
*   **Low Latency:** synthesis is near-instant, providing immediate feedback.

## Technical Implementation
*   **Backend (`PiperService`):** Wraps the `piper` binary and manages audio playback via `aplay` (Linux), `afplay` (macOS), or `powershell` (Windows - planned).
*   **Integration:** Hooks into `SessionManager.addSessionError` to trigger speech whenever a high-severity error occurs.

## How to Use
1.  Ensure `piper` is installed (Crystal attempts to use the local binary).
2.  Work on your code.
3.  If an agent triggers a security alert (Gitleaks) or a test failure (Watchexec), Crystal will speak the error summary.
