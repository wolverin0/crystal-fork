import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../utils/logger';
import { getShellPath } from '../../utils/shellPath';
import * as path from 'path';

const execAsync = promisify(exec);

export interface GitleaksFinding {
  Description: string;
  StartLine: number;
  EndLine: number;
  StartColumn: number;
  EndLineColumn: number;
  Match: string;
  Secret: string;
  File: string;
  SymlinkFile: string;
  Commit: string;
  Entropy: number;
  Author: string;
  Email: string;
  Date: string;
  Message: string;
  Tags: string[];
  RuleID: string;
  Fingerprint: string;
}

export class GitleaksService {
  private isAvailable: boolean | null = null;
  private version: string | null = null;

  constructor(private logger?: Logger) {}

  /**
   * Checks if gitleaks is available in the system PATH.
   */
  async checkAvailability(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await execAsync('gitleaks version', {
        env: { ...process.env, PATH: getShellPath() }
      });
      this.isAvailable = true;
      this.version = stdout.trim();
      return { available: true, version: this.version };
    } catch (error) {
      this.isAvailable = false;
      return { 
        available: false, 
        error: 'Gitleaks not found in PATH. Security scanning disabled.' 
      };
    }
  }

  /**
   * Scans raw content (e.g., a diff or a specific file's content) for secrets.
   */
  async scanContent(content: string): Promise<GitleaksFinding[]> {
    if (this.isAvailable === false) return [];

    return new Promise((resolve, reject) => {
      const child = spawn('gitleaks', ['detect', '--pipe', '--report-path', '-', '--report-format', 'json', '--no-banner'], {
        env: { ...process.env, PATH: getShellPath() }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // Gitleaks returns 1 if leaks are found, 0 if none.
        if (code === 0 || code === 1) {
          try {
            if (!stdout.trim()) return resolve([]);
            const findings = JSON.parse(stdout);
            resolve(findings);
          } catch (e) {
            this.logger?.error('Failed to parse gitleaks output:', e as Error);
            resolve([]);
          }
        } else {
          this.logger?.error(`Gitleaks process exited with code ${code}: ${stderr}`);
          resolve([]);
        }
      });

      child.stdin.write(content);
      child.stdin.end();
    });
  }

  /**
   * Scans an entire directory (worktree) for secrets.
   */
  async scanWorktree(worktreePath: string): Promise<GitleaksFinding[]> {
    if (this.isAvailable === false) return [];

    try {
      const { stdout } = await execAsync(
        `gitleaks detect --source "${worktreePath}" --report-path - --report-format json --no-git --no-banner`,
        { env: { ...process.env, PATH: getShellPath() } }
      );
      
      if (!stdout.trim()) return [];
      return JSON.parse(stdout);
    } catch (error: any) {
      // Gitleaks returns exit code 1 if findings are present
      if (error.code === 1 && error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch {
          return [];
        }
      }
      this.logger?.error('Gitleaks worktree scan failed:', error);
      return [];
    }
  }
}
