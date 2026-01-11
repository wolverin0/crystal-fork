import { spawn, ChildProcess } from 'child_process';
import { Logger } from '../../utils/logger';
import { getShellPath } from '../../utils/shellPath';
import { EventEmitter } from 'events';

export class WatchexecService extends EventEmitter {
  private watchers = new Map<string, ChildProcess>();

  constructor(private logger?: Logger) {
    super();
  }

  async checkAvailability(): Promise<{ available: boolean; version?: string; error?: string }> {
    return new Promise((resolve) => {
      const child = spawn('watchexec', ['--version'], {
        env: { ...process.env, PATH: getShellPath() }
      });

      let stdout = '';
      child.stdout.on('data', (data) => stdout += data);
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ available: true, version: stdout.trim() });
        } else {
          resolve({ available: false, error: 'Watchexec not found in PATH' });
        }
      });

      child.on('error', () => {
        resolve({ available: false, error: 'Failed to spawn watchexec' });
      });
    });
  }

  startWatcher(sessionId: string, worktreePath: string, testCommand: string): void {
    if (this.watchers.has(sessionId)) {
      this.stopWatcher(sessionId);
    }

    this.logger?.info(`[Watchexec] Starting watcher for session ${sessionId} in ${worktreePath} with command: ${testCommand}`);
    console.log(`[Watchexec] Starting watcher for session ${sessionId} in ${worktreePath} with command: ${testCommand}`);
    
    // We watch common code extensions
    const child = spawn('watchexec', [
      '--exts', 'ts,js,py,go,rs,cpp,c,h,txt', 
      '--restart', 
      '--clear', 
      '--watch', worktreePath,
      '--', 
      testCommand
    ], {
      cwd: worktreePath,
      env: { ...process.env, PATH: getShellPath() },
      shell: true
    });

    child.stdout.on('data', (data) => {
      const output = data.toString();
      this.emit('output', { sessionId, type: 'stdout', data: output });
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      this.emit('output', { sessionId, type: 'stderr', data: output });
    });

    child.on('close', (code) => {
      this.logger?.info(`Watchexec for session ${sessionId} exited with code ${code}`);
      this.watchers.delete(sessionId);
    });

    this.watchers.set(sessionId, child);
  }

  stopWatcher(sessionId: string): void {
    const child = this.watchers.get(sessionId);
    if (child) {
      this.logger?.info(`Stopping watchexec for session ${sessionId}`);
      // Try SIGTERM first
      child.kill('SIGTERM');
      
      // Force kill after a small delay
      const pid = child.pid;
      if (pid) {
        setTimeout(() => {
          try {
            process.kill(pid, 'SIGKILL');
          } catch (e) {
            // Process already dead
          }
        }, 500);
      }
      
      this.watchers.delete(sessionId);
    }
  }

  stopAll(): void {
    for (const [sessionId, child] of this.watchers) {
      child.kill();
    }
    this.watchers.clear();
  }
}
