# Troubleshooting: Headless Claude Execution (WSL/Windows)

**Issue:**
Running `claude -p "prompt"` hangs indefinitely in non-interactive environments (CI, scripts, background services) within WSL.

**Root Cause:**
The Claude CLI (even in print mode) anticipates potential user input if `stdin` is open. In headless environments, it waits for an EOF or input that never comes, causing a timeout.

**The Fix:**
You must pipe input (even empty input) to the command to force it into non-interactive mode. Additionally, invoking the Windows binary via `cmd.exe` from WSL is often more reliable for auth state sharing.

**Working Command Pattern:**
```bash
echo | cmd.exe /c "claude -p 'Your Prompt'"
```

**Crystal Implementation Note:**
When spawning the `ClaudeHeadlessService`, ensure the process `stdin` is handled (e.g., `pipe` in Node.js spawn options, or explicit `stdin.end()`).
