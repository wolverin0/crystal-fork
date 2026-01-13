import { ClaudeHeadlessService } from './claudeHeadlessService';
import { BeadsService } from '../beads/beadsService';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../configManager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class CrystalMindService {
  constructor(
    private claudeService: ClaudeHeadlessService,
    private beadsService: BeadsService,
    private configManager: ConfigManager,
    private logger?: Logger
  ) {}

  async analyzeError(sessionId: string, worktreePath: string, error: string, context?: string): Promise<void> {
    try {
      // 1. Ensure Beads is initialized
      await this.beadsService.init(worktreePath);

      // 2. Ensure Agent exists
      await this.ensureMemoryManagerAgent();

      // 3. Construct Prompt
      const prompt = `
Analyze this error and log it to Beads as a 'bug'.
ERROR:
${error}

CONTEXT:
${context || 'No additional context.'}

Use the 'beads' tool. Be concise.
`;

      // 4. Call Headless Agent
      this.logger?.info(`[CrystalMind] Analyzing error for session ${sessionId} (Headless)...`);
      
      const response = await this.claudeService.execute(
        prompt,
        'memory-manager',
        'claude-haiku-4-5-20251001' // Explicitly use Haiku 4.5
      );

      if (response.error) {
        this.logger?.error('[CrystalMind] Headless execution failed:', new Error(response.error));
        return;
      }

      this.logger?.info('[CrystalMind] Analysis complete.');

    } catch (error) {
      this.logger?.error('[CrystalMind] Analysis failed:', error as Error);
    }
  }

  private async ensureMemoryManagerAgent(): Promise<void> {
    const agentDir = path.join(os.homedir(), '.claude', 'agents');
    const agentFile = path.join(agentDir, 'memory-manager.md');

    try {
      if (fs.existsSync(agentFile)) return;

      this.logger?.info('[CrystalMind] Creating memory-manager agent...');
      await fs.promises.mkdir(agentDir, { recursive: true });
      
      const content = `
---
name: memory-manager
description: A specialized agent for managing the 'Beads' graph memory system. Stores, retrieves, and summarizes project tasks and facts.
tools: Read, Write, Bash, Glob
model: claude-haiku-4-5-20251001
---
You are the Memory Manager.
Your role is to maintain the long-term memory of this project using 'Beads'.
Use the 'beads' CLI tool (bd) to add, list, and query tasks.
When creating tasks from errors, tag them as 'auto-detected' and 'bug'.
Always be concise.
`;
      await fs.promises.writeFile(agentFile, content, 'utf-8');
    } catch (error) {
      this.logger?.error('[CrystalMind] Failed to create agent file:', error as Error);
    }
  }
}
