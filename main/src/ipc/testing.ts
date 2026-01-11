import { IpcMain } from 'electron';
import type { AppServices } from './types';

export function registerTestingHandlers(ipcMain: IpcMain, { watchexecService }: AppServices): void {
  ipcMain.handle('testing:get-status', async () => {
    return watchexecService.checkAvailability();
  });

  ipcMain.handle('testing:start-watcher', async (_event, sessionId: string, worktreePath: string, testCommand: string) => {
    try {
      watchexecService.startWatcher(sessionId, worktreePath, testCommand);
      return { success: true };
    } catch (error) {
      console.error('Failed to start test watcher:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('testing:stop-watcher', async (_event, sessionId: string) => {
    try {
      watchexecService.stopWatcher(sessionId);
      return { success: true };
    } catch (error) {
      console.error('Failed to stop test watcher:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
