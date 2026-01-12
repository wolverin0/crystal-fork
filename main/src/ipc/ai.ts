import { IpcMain } from 'electron';
import type { AppServices } from './types';

export function registerAiHandlers(ipcMain: IpcMain, { architectService, ollamaService }: AppServices): void {
  ipcMain.handle('ai:rethink-project', async (_event, worktreePath: string) => {
    try {
      await architectService.rethinkProject(worktreePath);
      return { success: true };
    } catch (error) {
      console.error('Failed to rethink project:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('ai:get-ollama-status', async () => {
    return { success: true, available: await ollamaService.checkAvailability() };
  });
}
