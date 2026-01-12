import { OllamaService } from './ollamaService';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../configManager';
import * as fs from 'fs';
import * as path from 'path';

export class ArchitectService {
  constructor(
    private ollamaService: OllamaService,
    private configManager: ConfigManager,
    private logger?: Logger
  ) {}

  async rethinkProject(worktreePath: string): Promise<void> {
    const memoryFile = path.join(worktreePath, 'MEMORIES.md');
    const knowledgeFile = path.join(worktreePath, 'PROJECT_KNOWLEDGE.md');
    const archiveFile = path.join(worktreePath, 'MEMORIES.archive.md');

    if (!fs.existsSync(memoryFile)) {
      this.logger?.info('[Architect] No memories to process.');
      return;
    }

    try {
      const rawMemories = fs.readFileSync(memoryFile, 'utf-8');
      if (!rawMemories.trim()) return;

      this.logger?.info('[Architect] Analyzing memories...');

      // 1. Synthesize Wisdom
      const prompt = `
      You are the Chief Architect of this software project.
      Review the following raw error logs and "Micro-Lessons" collected by the team (Worker Bees).

      RAW MEMORIES:
      ${rawMemories}

      TASK:
      1. Identify recurrent patterns (e.g., "The team keeps making syntax errors in React components").
      2. Consolidate these into high-level "Architectural Rules" or "Best Practices".
      3. Ignore one-off noise.
      4. Output a Markdown formatted "Project Knowledge" update.

      OUTPUT FORMAT (Markdown):
      ## Architectural Patterns
      - [Pattern 1]
      ## Recurring Pitfalls
      - [Pitfall 1]
      ## Action Items
      - [Action 1]
      `;

      // Use a "Thinking" model if available (DeepSeek R1), otherwise standard coder
      // We rely on the configured default model for now
      const analysis = await this.ollamaService.generate(prompt);

      if (!analysis || !analysis.response) {
        throw new Error('No response from Architect model');
      }

      // 2. Update Knowledge Base
      let currentKnowledge = '';
      if (fs.existsSync(knowledgeFile)) {
        currentKnowledge = fs.readFileSync(knowledgeFile, 'utf-8');
      }

      const updatedKnowledge = `
      # Project Wisdom (Updated: ${new Date().toISOString()})

      ${analysis.response}

      ---
      ${currentKnowledge}
      `;
      fs.writeFileSync(knowledgeFile, updatedKnowledge);
      this.logger?.info(`[Architect] Updated ${knowledgeFile}`);

      // 3. Archive processed memories
      const archiveEntry = `\n\n--- Processed ${new Date().toISOString()} ---\n${rawMemories}`;
      fs.appendFileSync(archiveFile, archiveEntry);
      
      // 4. Clear active memory
      fs.writeFileSync(memoryFile, '');
      this.logger?.info('[Architect] Memories archived and cleared.');

    } catch (error) {
      this.logger?.error('[Architect] Rethink failed:', error as Error);
    }
  }
}
