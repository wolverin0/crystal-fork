import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../../utils/logger';
import { ConfigManager } from '../configManager';
import { getShellPath } from '../../utils/shellPath';

const execAsync = promisify(exec);

export interface ClaudeHeadlessResponse {
  output: string;
  error?: string;
}

export class ClaudeHeadlessService {
  constructor(
    private logger?: Logger,
    private configManager?: ConfigManager
  ) {}

  private get useWindowsBridge(): boolean {
    // Default to true for now as native linux hangs
    const config = this.configManager?.getConfig() as any;
    return config?.useWindowsBridge ?? true;
  }

  async execute(prompt: string, agent?: string, model?: string): Promise<ClaudeHeadlessResponse> {
    const agentFlag = agent ? `--agent ${agent}` : '';
    const modelFlag = model ? `--model ${model}` : '';
    
    // We construct the prompt as a single argument
    // Use JSON output format for reliable parsing
    const commandBase = `claude -p "${prompt}" ${agentFlag} ${modelFlag} --output-format json --no-session-persistence`;

    if (this.useWindowsBridge) {
      return this.execWindows(commandBase);
    } else {
      return this.execNative(commandBase);
    }
  }

  private async execWindows(commandBase: string): Promise<ClaudeHeadlessResponse> {
    try {
      // "echo | cmd.exe /c ..." pattern
      const fullCommand = `echo. | cmd.exe /c "${commandBase}"`;
      
      this.logger?.info(`[ClaudeHeadless] Executing via Windows Bridge: ${fullCommand}`);
      
      const { stdout, stderr } = await execAsync(fullCommand, {
        env: { ...process.env, PATH: getShellPath() }
      });

      if (stderr) {
        this.logger?.warn(`[ClaudeHeadless] Stderr: ${stderr}`);
      }

      return { output: stdout };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger?.error(`[ClaudeHeadless] Execution failed:`, error as Error);
      return { output: '', error: msg };
    }
  }

  private async execNative(commandBase: string): Promise<ClaudeHeadlessResponse> {
    // Implementation for native execution (future use)
    // Needs pipe handling similar to the shell command fix
    return { output: '', error: 'Native execution not yet stable' };
  }
}
