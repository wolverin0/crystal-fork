import { AbstractCliManager } from '../cli/AbstractCliManager';
import type { ConversationMessage } from '../../../database/models';
import * as path from 'path';

export class LazygitManager extends AbstractCliManager {
  protected getCliToolName(): string {
    return 'lazygit';
  }

  protected async testCliAvailability(customPath?: string): Promise<{ available: boolean; error?: string; version?: string; path?: string }> {
    try {
      const cmd = customPath || 'lazygit';
      const { stdout } = await this.execAsync(`${cmd} --version`);
      return { available: true, version: stdout.trim(), path: cmd };
    } catch (error) {
      return { available: false, error: 'Lazygit not found. Please install it first.' };
    }
  }

  protected buildCommandArgs(options: any): string[] {
    return []; // No default args needed, just run 'lazygit'
  }

  protected async getCliExecutablePath(): Promise<string> {
    const config = this.configManager?.getConfig();
    // Assuming we might add a config setting later, but for now default to 'lazygit'
    return 'lazygit';
  }

  protected parseCliOutput(data: string, panelId: string, sessionId: string): any[] {
    // Lazygit is a TUI, so we just treat everything as stdout
    return [{
      panelId,
      sessionId,
      type: 'stdout',
      data,
      timestamp: new Date()
    }];
  }

  protected async initializeCliEnvironment(options: any): Promise<{ [key: string]: string }> {
    return {};
  }

  protected async cleanupCliResources(sessionId: string): Promise<void> {
    // Nothing to clean up
  }

  protected async getCliEnvironment(options: any): Promise<{ [key: string]: string }> {
    return {};
  }

  // Abstract implementations
  async startPanel(panelId: string, sessionId: string, worktreePath: string, prompt: string, ...args: unknown[]): Promise<void> {
    await this.spawnCliProcess({
      panelId,
      sessionId,
      worktreePath,
      prompt
    });
  }

  async continuePanel(panelId: string, sessionId: string, worktreePath: string, prompt: string, conversationHistory: ConversationMessage[], ...args: unknown[]): Promise<void> {
     // Lazygit doesn't support "continuation" like a chat. We just restart it.
     await this.startPanel(panelId, sessionId, worktreePath, prompt, ...args);
  }

  async stopPanel(panelId: string): Promise<void> {
    await this.killProcess(panelId);
  }

  async restartPanelWithHistory(panelId: string, sessionId: string, worktreePath: string, initialPrompt: string, conversationHistory: ConversationMessage[]): Promise<void> {
    await this.stopPanel(panelId);
    await this.startPanel(panelId, sessionId, worktreePath, initialPrompt);
  }
}
