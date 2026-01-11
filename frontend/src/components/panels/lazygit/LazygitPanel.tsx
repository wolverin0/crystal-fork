import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ToolPanel } from '../../../../../shared/types/panels';
import { useSession } from '../../../contexts/SessionContext';
import { getTerminalTheme } from '../../../utils/terminalTheme';
import '@xterm/xterm/css/xterm.css';

interface LazygitPanelProps {
  panel: ToolPanel;
  isActive: boolean;
}

const LazygitPanel: React.FC<LazygitPanelProps> = React.memo(({ panel, isActive }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const sessionContext = useSession();
  const workingDirectory = sessionContext?.workingDirectory;

  useEffect(() => {
    if (!terminalRef.current) return;

    let terminal: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let disposed = false;

    const initializeLazygit = async () => {
      try {
        // Check if already initialized on backend
        const initialized = await window.electronAPI.invoke('panels:checkInitialized', panel.id);

        if (!initialized) {
          await window.electronAPI.invoke('panels:initialize', panel.id, {
            cwd: workingDirectory || process.cwd(),
            sessionId: panel.sessionId
          });
        }

        if (disposed) return;

        terminal = new Terminal({
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: getTerminalTheme(),
          scrollback: 1000
        });

        fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);

        if (terminalRef.current && !disposed) {
          terminal.open(terminalRef.current);
          fitAddon.fit();

          xtermRef.current = terminal;
          fitAddonRef.current = fitAddon;

          setIsInitialized(true);

          // Subscribed to output
          const unsubscribeOutput = window.electronAPI.events.onTerminalOutput((data: any) => {
            if (data && data.panelId === panel.id && terminal && !disposed) {
              terminal.write(data.output);
            }
          });

          // Handle input
          const inputDisposable = terminal.onData((data) => {
            window.electronAPI.invoke('terminal:input', panel.id, data);
          });

          // Handle resize
          const resizeObserver = new ResizeObserver(() => {
            if (fitAddon && !disposed) {
              fitAddon.fit();
              const dimensions = fitAddon.proposeDimensions();
              if (dimensions) {
                window.electronAPI.invoke('terminal:resize', panel.id, dimensions.cols, dimensions.rows);
              }
            }
          });
          resizeObserver.observe(terminalRef.current);

          return () => {
            disposed = true;
            resizeObserver.disconnect();
            unsubscribeOutput();
            inputDisposable.dispose();
          };
        }
      } catch (error) {
        console.error('Failed to initialize lazygit terminal:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    const cleanupPromise = initializeLazygit();

    return () => {
      disposed = true;
      cleanupPromise.then(cleanupFn => cleanupFn?.());
      
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
      if (fitAddonRef.current) {
        fitAddonRef.current.dispose();
        fitAddonRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [panel.id]);

  useEffect(() => {
    if (isActive && fitAddonRef.current && xtermRef.current) {
      setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
          const dimensions = fitAddonRef.current.proposeDimensions();
          if (dimensions) {
            window.electronAPI.invoke('terminal:resize', panel.id, dimensions.cols, dimensions.rows);
          }
        }
      }, 50);
    }
  }, [isActive, panel.id]);

  if (initError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Lazygit initialization failed: {initError}
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-[#1e1e1e]">
      <div ref={terminalRef} className="h-full w-full" />
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-primary bg-opacity-80">
          <div className="text-text-secondary">Initializing lazygit...</div>
        </div>
      )}
    </div>
  );
});

LazygitPanel.displayName = 'LazygitPanel';

export default LazygitPanel;
