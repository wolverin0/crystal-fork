import { WebContentsView, BrowserWindow, screen } from 'electron';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';

export interface BrowserViewState {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

export class BrowserViewManager extends EventEmitter {
  private views = new Map<string, WebContentsView>();
  private activeViewId: string | null = null;

  constructor(private logger?: Logger) {
    super();
  }

  /**
   * Creates or retrieves a browser view for a specific panel.
   */
  getOrCreateView(panelId: string): WebContentsView {
    if (this.views.has(panelId)) {
      return this.views.get(panelId)!;
    }

    this.logger?.info(`Creating new browser view for panel ${panelId}`);
    const view = new WebContentsView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    view.webContents.loadURL('about:blank');
    
    // Setup event listeners
    view.webContents.on('did-finish-load', () => this.emitState(panelId));
    view.webContents.on('did-start-loading', () => this.emitState(panelId));
    view.webContents.on('did-navigate', () => this.emitState(panelId));
    view.webContents.on('did-navigate-in-page', () => this.emitState(panelId));

    this.views.set(panelId, view);
    return view;
  }

  private emitState(panelId: string) {
    const view = this.views.get(panelId);
    if (view) {
      const state: BrowserViewState = {
        url: view.webContents.getURL(),
        canGoBack: view.webContents.canGoBack(),
        canGoForward: view.webContents.canGoForward(),
        isLoading: view.webContents.isLoading()
      };
      this.emit('state-changed', { panelId, state });
    }
  }

  /**
   * Attaches a view to the main window and sets its bounds.
   */
  attachView(panelId: string, window: BrowserWindow, bounds: { x: number; y: number; width: number; height: number }): void {
    const view = this.getOrCreateView(panelId);
    
    // Detach current active view if different
    if (this.activeViewId && this.activeViewId !== panelId) {
        const oldView = this.views.get(this.activeViewId);
        if (oldView) {
            window.contentView.removeChildView(oldView);
        }
    }

    window.contentView.addChildView(view);
    view.setBounds(bounds);
    this.activeViewId = panelId;
    
    this.logger?.info(`Attached browser view for panel ${panelId} at bounds: ${JSON.stringify(bounds)}`);
  }

  /**
   * Detaches a view from the window.
   */
  detachView(panelId: string, window: BrowserWindow): void {
    const view = this.views.get(panelId);
    if (view) {
      window.contentView.removeChildView(view);
      if (this.activeViewId === panelId) {
        this.activeViewId = null;
      }
    }
  }

  /**
   * Destroys a view and cleans up resources.
   */
  destroyView(panelId: string): void {
    const view = this.views.get(panelId);
    if (view) {
      // Note: WebContentsView doesn't have a destroy() method like BrowserWindow, 
      // but its webContents will be garbage collected if no references remain.
      this.views.delete(panelId);
    }
  }

  navigate(panelId: string, url: string): void {
    const view = this.views.get(panelId);
    if (view) {
      let finalUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = `https://${url}`;
      }
      view.webContents.loadURL(finalUrl).catch(err => {
        this.logger?.error(`Failed to navigate browser to ${finalUrl}:`, err);
      });
    }
  }

  goBack(panelId: string): void {
    this.views.get(panelId)?.webContents.goBack();
  }

  goForward(panelId: string): void {
    this.views.get(panelId)?.webContents.goForward();
  }

  reload(panelId: string): void {
    this.views.get(panelId)?.webContents.reload();
  }
}
