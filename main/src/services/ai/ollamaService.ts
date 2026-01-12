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
  private host: string;
  private defaultModel: string;

  constructor(
    private logger?: Logger,
    private configManager?: ConfigManager
  ) {
    this.host = 'http://localhost:11434';
    this.defaultModel = 'qwen2.5-coder:14b';
    
    // Load config overrides if available
    if (this.configManager) {
      const config = this.configManager.getConfig();
      // We'll add these keys to the config type later
      this.host = (config as any).ollamaHost || this.host;
      this.defaultModel = (config as any).ollamaModel || this.defaultModel;
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.host}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      this.logger?.error('Failed to list Ollama models:', error as Error);
      return [];
    }
  }

  async generate(prompt: string, model?: string, system?: string): Promise<OllamaResponse | null> {
    const targetModel = model || this.defaultModel;
    
    try {
      const response = await fetch(`${this.host}/api/generate`, {
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
