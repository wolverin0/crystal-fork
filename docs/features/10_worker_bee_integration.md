# Feature: The Worker Bee (Ollama Integration)

**Date Added:** January 11, 2026
**Status:** Live

## Overview
The "Worker Bee" is the first phase of the **Crystal Mind** intelligence system. It acts as a local, private AI observer that watches your session in the background. When a tool like **Watchexec** (Auto-Test) or **Gitleaks** (Security) detects an error, the Worker Bee wakes up, analyzes the error using a local LLM, and logs a "Micro-Lesson" to your project's memory.

## Features
*   **Automated Error Analysis:** When a test fails or a secret is leaked, the system automatically captures the error log.
*   **Root Cause Extraction:** It uses a local LLM (via Ollama) to identify *why* the error happened.
*   **Memory Logging:** It writes a structured JSON/Markdown entry to `MEMORIES.md` in the worktree, building a long-term knowledge base of project-specific pitfalls.
*   **Zero-Context Cost:** Because this happens in a background process using a separate model, it uses *none* of your active session's context window.

## Technical Implementation
*   **Service:** `OllamaService` connects to your local Ollama instance (default port `11434`).
*   **Logic:** `CrystalMindService` orchestrates the analysis loop.
*   **Model:** Defaults to `qwen2.5-coder:14b` (configurable in settings) for high-speed, accurate code analysis.

## How to Use
1.  **Install Ollama:** Ensure you have Ollama installed and running.
2.  **Pull the Model:** Run `ollama pull qwen2.5-coder:14b` (or your preferred model).
3.  **Enable in Crystal:** Go to Settings -> AI -> Ollama and verify the host/model.
4.  **Work:** Just code. If you break a test, check `MEMORIES.md` later to see what the Worker Bee learned.
