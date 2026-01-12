import { spawn, exec } from 'child_process';
import { Logger } from '../../utils/logger';
import { getShellPath } from '../../utils/shellPath';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

export class PiperService {
  private isAvailable: boolean = false;
  private voicePath: string;
  private modelPath: string;

  constructor(private logger?: Logger) {
    this.voicePath = path.join(os.homedir(), '.local', 'share', 'piper');
    this.modelPath = path.join(this.voicePath, 'voice.onnx');
  }

  async checkAvailability(): Promise<boolean> {
    try {
      // Check if piper is in PATH or local bin
      // We set LD_LIBRARY_PATH manually for the local bin case
      const localBin = path.join(os.homedir(), '.local', 'bin');
      const env = { 
        ...process.env, 
        PATH: `${localBin}:${process.env.PATH}`,
        LD_LIBRARY_PATH: `${localBin}:${process.env.LD_LIBRARY_PATH || ''}`
      };

      const child = spawn('piper', ['--version'], { env });
      
      return new Promise((resolve) => {
        child.on('close', (code) => {
          this.isAvailable = code === 0;
          resolve(this.isAvailable);
        });
        child.on('error', () => resolve(false));
      });
    } catch {
      return false;
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const localBin = path.join(os.homedir(), '.local', 'bin');
      const env = { 
        ...process.env, 
        PATH: `${localBin}:${process.env.PATH}`,
        LD_LIBRARY_PATH: `${localBin}:${process.env.LD_LIBRARY_PATH || ''}`
      };

      // 1. Generate Audio (echo text | piper ... --output_file -)
      const piper = spawn('piper', [
        '--model', this.modelPath,
        '--output_file', '-'
      ], { env });

      // 2. Play Audio (aplay for Linux, afplay for Mac, powershell for Windows)
      let playerCommand = 'aplay';
      let playerArgs: string[] = [];

      if (process.platform === 'darwin') {
        playerCommand = 'afplay'; // Takes filename usually, might need piping
        // afplay doesn't support stdin easily. We might need a temp file.
        // For simplicity on Linux (user's OS), aplay is fine.
      } 

      const player = spawn(playerCommand, [], { env });

      // Pipe: Text -> Piper -> Player
      piper.stdout.pipe(player.stdin);
      
      // Write text to Piper
      piper.stdin.write(text);
      piper.stdin.end();

      // Handle errors
      piper.on('error', (err) => this.logger?.error('Piper process error:', err));
      player.on('error', (err) => this.logger?.error('Audio player error:', err));

    } catch (error) {
      this.logger?.error('Failed to speak text:', error);
    }
  }
}
