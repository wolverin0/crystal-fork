import { IpcMain } from 'electron';
import type { AppServices } from './types';

export function registerSecurityHandlers(ipcMain: IpcMain, { gitleaksService }: AppServices): void {
  ipcMain.handle('security:get-status', async () => {
    return gitleaksService.checkAvailability();
  });

  ipcMain.handle('security:scan-content', async (_event, content: string) => {
    try {
      const findings = await gitleaksService.scanContent(content);
      return { success: true, data: findings };
    } catch (error) {
      console.error('Failed to scan content for secrets:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('security:scan-worktree', async (_event, worktreePath: string) => {
    try {
      const findings = await gitleaksService.scanWorktree(worktreePath);
      return { success: true, data: findings };
    } catch (error) {
      console.error('Failed to scan worktree for secrets:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
