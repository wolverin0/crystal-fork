import { Logger } from '../../utils/logger';
import { ConfigManager } from '../configManager';

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export class OllamaService {
  constructor(
    private logger?: Logger,
    private configManager?: ConfigManager
  ) {}

  private getHost(): string {
    const config = this.configManager?.getConfig() as any;
    return config?.ollamaHost || 'http://localhost:11434';
  }

  private getModel(override?: string): string {
    if (override) return override;
    const config = this.configManager?.getConfig() as any;
    return config?.ollamaModel || 'qwen2.5-coder:14b';
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getHost()}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.getHost()}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      this.logger?.error('Failed to list Ollama models:', error as Error);
      return [];
    }
  }

  async generate(prompt: string, model?: string, system?: string): Promise<OllamaResponse | null> {
    const targetModel = this.getModel(model);
    const host = this.getHost();
    
    try {
      const response = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          prompt,
          system,
          stream: false, // Non-streaming for background tasks
          options: {
            temperature: 0.2 // Low temp for factual analysis
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger?.error(`Failed to generate with Ollama (${targetModel}):`, error as Error);
      return null;
    }
  }
}
