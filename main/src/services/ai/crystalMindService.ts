import { OllamaService } from './ollamaService';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../configManager';
import * as fs from 'fs';
import * as path from 'path';

export class CrystalMindService {
  constructor(
    private ollamaService: OllamaService,
    private configManager: ConfigManager,
    private logger?: Logger
  ) {}

  async analyzeError(sessionId: string, worktreePath: string, error: string, context?: string): Promise<void> {
    try {
      // 1. Check if we should run (is Ollama available?)
      // We assume availability was checked at startup, but we can double check or fail gracefully
      
      // 2. Construct Prompt
      const prompt = `
You are the "Crystal Mind", an AI subsystem analyzing coding errors.
Analyze the following error detected in a background session.

ERROR:
${error}

CONTEXT:
${context || 'No additional context provided.'}

TASK:
1. Identify the root cause.
2. Extract a single-line "Micro-Lesson" that could prevent this in the future.
3. Classify the error type (Syntax, Logic, Dependency, Security, Test Failure).

OUTPUT JSON ONLY:
{
  "cause": "...",
  "lesson": "...",
  "type": "..."
}
`;

      // 3. Call Ollama
      this.logger?.info(`[CrystalMind] Analyzing error for session ${sessionId}...`);
      const response = await this.ollamaService.generate(prompt);
      
      if (!response || !response.response) {
        this.logger?.warn('[CrystalMind] No response from Ollama');
        return;
      }

      // 4. Parse Response
      let insight: any;
      try {
        // Find JSON blob in response (in case of extra text)
        const jsonMatch = response.response.match(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*?$/);
        if (jsonMatch && jsonMatch[1]) {
            insight = JSON.parse(jsonMatch[1]);
        } else {
            return;
        }
      } catch (e) {
        this.logger?.warn('[CrystalMind] Failed to parse Ollama response', e as Error);
        return;
      }

      // 5. Log to MEMORIES.md
      this.logMemory(worktreePath, insight, error);

    } catch (error) {
      this.logger?.error('[CrystalMind] Analysis failed:', error as Error);
    }
  }

  private logMemory(worktreePath: string, insight: any, originalError: string): void {
    const memoryFile = path.join(worktreePath, 'MEMORIES.md');
    const timestamp = new Date().toISOString();
    
    const entry = `
- [${timestamp}] [${insight.type.toUpperCase()}] ${insight.lesson}
  - Cause: ${insight.cause}
  - Original Error: ${originalError.split('\n')[0].substring(0, 100)}...
`;

    try {
      fs.appendFileSync(memoryFile, entry);
      this.logger?.info(`[CrystalMind] Logged insight to ${memoryFile}`);
    } catch (e) {
      this.logger?.error(`[CrystalMind] Failed to write to memory file:`, e as Error);
    }
  }
}
