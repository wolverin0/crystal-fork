import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../utils/logger';
import { getShellPath } from '../../utils/shellPath';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export class BeadsService {
  private isAvailable: boolean = false;
  private version: string | null = null;

  constructor(private logger?: Logger) {}

  async checkAvailability(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await execAsync('bd --version', {
        env: { ...process.env, PATH: getShellPath() }
      });
      this.isAvailable = true;
      this.version = stdout.trim();
      return { available: true, version: this.version };
    } catch (error) {
      this.isAvailable = false;
      return { 
        available: false, 
        error: 'Beads (bd) not found in PATH.' 
      };
    }
  }

  async init(worktreePath: string): Promise<void> {
    if (!this.isAvailable) return;
    
    // Check if .beads exists
    try {
        await execAsync('bd status', { cwd: worktreePath, env: { ...process.env, PATH: getShellPath() } });
    } catch {
        // Not initialized, try to init
        this.logger?.info(`Initializing Beads in ${worktreePath}`);
        try {
            await execAsync('bd init', { cwd: worktreePath, env: { ...process.env, PATH: getShellPath() } });
        } catch (e) {
            this.logger?.error('Failed to initialize Beads:', e as Error);
        }
    }
  }

  async addTask(worktreePath: string, title: string, tags: string[] = []): Promise<void> {
    if (!this.isAvailable) return;

    try {
      let command = `bd task add "${title}"`;
      if (tags.length > 0) {
        const tagArgs = tags.map(t => `--tag "${t}"`).join(' ');
        command += ` ${tagArgs}`;
      }

      await execAsync(command, { 
        cwd: worktreePath, 
        env: { ...process.env, PATH: getShellPath() } 
      });
      
      this.logger?.info(`Added Beads task: "${title}"`);
    } catch (error) {
      this.logger?.error('Failed to add Beads task:', error as Error);
    }
  }
}
