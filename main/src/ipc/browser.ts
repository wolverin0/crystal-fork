import { IpcMain } from 'electron';
import type { AppServices } from './types';

export function registerBrowserHandlers(ipcMain: IpcMain, { browserViewManager, getMainWindow }: AppServices): void {
  ipcMain.handle('browser:attach', async (_event, panelId: string, bounds: { x: number; y: number; width: number; height: number }) => {
    const window = getMainWindow();
    if (window) {
      browserViewManager.attachView(panelId, window, bounds);
      return { success: true };
    }
    return { success: false, error: 'Main window not found' };
  });

  ipcMain.handle('browser:detach', async (_event, panelId: string) => {
    const window = getMainWindow();
    if (window) {
      browserViewManager.detachView(panelId, window);
      return { success: true };
    }
    return { success: false, error: 'Main window not found' };
  });

  ipcMain.handle('browser:navigate', async (_event, panelId: string, url: string) => {
    browserViewManager.navigate(panelId, url);
    return { success: true };
  });

  ipcMain.handle('browser:go-back', async (_event, panelId: string) => {
    browserViewManager.goBack(panelId);
    return { success: true };
  });

  ipcMain.handle('browser:go-forward', async (_event, panelId: string) => {
    browserViewManager.goForward(panelId);
    return { success: true };
  });

  ipcMain.handle('browser:reload', async (_event, panelId: string) => {
    browserViewManager.reload(panelId);
    return { success: true };
  });

  // Listen for state changes and forward to renderer
  browserViewManager.on('state-changed', ({ panelId, state }) => {
    const window = getMainWindow();
    if (window && !window.isDestroyed()) {
      window.webContents.send('browser:state-updated', { panelId, state });
    }
  });
}
