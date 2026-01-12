import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv'; // We'll need to check if dotenv is available or implement a parser

// Simple parser to avoid adding dependencies if possible, 
// but sticking to standard format KEY=VAL
export class DirenvService {
  
  /**
   * Loads environment variables from .env files in the target directory.
   * Supports: .env, .env.local
   */
  async loadEnv(worktreePath: string): Promise<Record<string, string>> {
    const envVars: Record<string, string> = {};
    
    // Priority order: .env.local > .env
    const files = ['.env', '.env.local'];
    
    for (const file of files) {
      const filePath = path.join(worktreePath, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = this.parseEnv(content);
        Object.assign(envVars, parsed);
      } catch (error) {
        // File doesn't exist or can't be read, ignore
      }
    }
    
    return envVars;
  }

  private parseEnv(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'" ) && value.endsWith("'" ))) {
          value = value.slice(1, -1);
        }

        result[key] = value;
      }
    }
    
    return result;
  }
}
