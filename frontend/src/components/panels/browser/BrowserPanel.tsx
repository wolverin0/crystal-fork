import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ToolPanel } from '../../../../../shared/types/panels';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  ExternalLink,
  Globe
} from 'lucide-react';
import { IconButton } from '../../ui/Button';

interface BrowserPanelProps {
  panel: ToolPanel;
  isActive: boolean;
}

interface BrowserState {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
}

const BrowserPanel: React.FC<BrowserPanelProps> = ({ panel, isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<BrowserState>({
    url: 'about:blank',
    canGoBack: false,
    canGoForward: false,
    isLoading: false
  });
  const [urlInput, setUrlInput] = useState('');

  const updateBounds = useCallback(() => {
    if (!viewportRef.current || !isActive) return;

    const rect = viewportRef.current.getBoundingClientRect();
    
    const bounds = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };

    if (bounds.width > 0 && bounds.height > 0) {
      window.electronAPI.browser.attach(panel.id, bounds);
    }
  }, [panel.id, isActive]);

  useEffect(() => {
    const handleStateUpdate = (_event: any, data: any) => {
      if (data.panelId === panel.id) {
        setState(data.state);
        setUrlInput(data.state.url);
      }
    };

    if (window.electron) {
      window.electron.on('browser:state-updated', handleStateUpdate);
    }

    if (isActive) {
      updateBounds();
    } else {
      window.electronAPI.browser.detach(panel.id);
    }

    const observer = new ResizeObserver(() => {
      updateBounds();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (window.electron) {
        window.electron.off('browser:state-updated', handleStateUpdate);
      }
      observer.disconnect();
      window.electronAPI.browser.detach(panel.id);
    };
  }, [panel.id, isActive, updateBounds]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    window.electronAPI.browser.navigate(panel.id, urlInput);
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-surface-primary overflow-hidden">
      {/* Browser Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border-primary bg-surface-secondary">
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            disabled={!state.canGoBack}
            onClick={() => window.electronAPI.browser.goBack(panel.id)}
            icon={<ArrowLeft className="w-4 h-4" />}
            aria-label="Back"
          />
          <IconButton
            size="sm"
            disabled={!state.canGoForward}
            onClick={() => window.electronAPI.browser.goForward(panel.id)}
            icon={<ArrowRight className="w-4 h-4" />}
            aria-label="Forward"
          />
          <IconButton
            size="sm"
            onClick={() => window.electronAPI.browser.reload(panel.id)}
            icon={<RotateCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />}
            aria-label="Reload"
          />
        </div>

        <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Globe className="w-3.5 h-3.5 text-text-tertiary" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-surface-primary border border-border-primary rounded-md focus:outline-none focus:ring-1 focus:ring-interactive text-text-primary"
              placeholder="Enter URL or search..."
            />
          </div>
        </form>

        <IconButton
          size="sm"
          onClick={() => window.electronAPI.openExternal(state.url)}
          icon={<ExternalLink className="w-4 h-4" />}
          title="Open in system browser"
          aria-label="Open in system browser"
        />
      </div>

      {/* Viewport Area (Where the WebContentsView will be attached) */}
      <div ref={viewportRef} className="flex-1 w-full bg-white" />
    </div>
  );
};

export default BrowserPanel;