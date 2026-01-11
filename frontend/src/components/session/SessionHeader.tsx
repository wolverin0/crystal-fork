import React, { useEffect, useState } from 'react';
import { Session } from '../../types/session';
import { StatusIndicator } from '../StatusIndicator';
import { CommitModeIndicator } from '../CommitModeIndicator';
import { FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { API } from '../../utils/api';
import { Modal, ModalHeader, ModalBody } from '../ui/Modal';
// Import markdown renderer (assuming it exists or using simple pre/code for now)
import ReactMarkdown from 'react-markdown';

interface SessionHeaderProps {
  activeSession: Session;
  isEditingName: boolean;
  editName: string;
  setEditName: (name: string) => void;
  handleNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSaveEditName: () => void;
  handleStartEditName: () => void;
  mergeError: string | null;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  activeSession,
  isEditingName,
  editName,
  setEditName,
  handleNameKeyDown,
  handleSaveEditName,
  handleStartEditName,
  mergeError,
}) => {
  const [linkedPlan, setLinkedPlan] = useState<{ name: string; content: string; path: string } | null>(null);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [claudeMdStatus, setClaudeMdStatus] = useState<{ exists: boolean; lastUpdated?: Date; stale: boolean } | null>(null);
  const [isRethinking, setIsRethinking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPlan = async () => {
      if (!activeSession) return;
      try {
        const response = await API.sessions.getLinkedPlan(activeSession.id);
        if (mounted && response.success && response.data) {
          setLinkedPlan(response.data);
        } else if (mounted) {
          setLinkedPlan(null);
        }
      } catch (error) {
        if (mounted) setLinkedPlan(null);
      }
    };
    fetchPlan();
    return () => { mounted = false; };
  }, [activeSession.id]);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      if (!activeSession || !activeSession.worktreePath) return;
      try {
        const response = await API.sessions.getClaudeMdStatus(activeSession.worktreePath);
        if (mounted && response.success && response.data) {
           const data = response.data;
           setClaudeMdStatus({
               ...data,
               lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : undefined
           });
        }
      } catch (e) {
          console.error(e);
      }
    };
    fetchStatus();
    return () => { mounted = false; };
  }, [activeSession.id, activeSession.worktreePath]);

  const handleRethink = async () => {
     if (!activeSession?.worktreePath) return;
     setIsRethinking(true);
     try {
         // 1. Backup
         await API.sessions.backupClaudeMd(activeSession.worktreePath);
         
         // 2. Get Template
         const tmplRes = await API.sessions.getMetaclaudeTemplate();
         if (!tmplRes.success || !tmplRes.data) throw new Error('Failed to get template');
         
         // 3. Send Prompt
         const prompt = `I am initiating a "Rethink" of the CLAUDE.md file. 
I have backed up the current version.
Please analyze the codebase and REGENERATE the CLAUDE.md file using the following template.

TEMPLATE:
${tmplRes.data}

Ensure you preserve critical patterns from the previous version if they are still relevant.`;

         await API.sessions.sendInput(activeSession.id, prompt);
         
     } catch (error) {
         console.error(error);
         alert('Failed to initiate Rethink: ' + (error instanceof Error ? error.message : String(error)));
     } finally {
         setIsRethinking(false);
     }
  };

  return (
    <div className="bg-surface-primary border-b border-border-primary flex-shrink-0">
      {/* Top Row: Session Identity (left) and Session Actions (right) */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          {/* Cluster 1: Session Identity (left-aligned) */}
          <div className="flex-1 min-w-0">
            {/* Session Name */}
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleSaveEditName}
                  className="font-bold text-xl bg-surface-primary text-text-primary px-2 py-1 rounded border border-border-primary focus:border-interactive focus:outline-none flex-1"
                  autoFocus
                />
              ) : (
                <h2 
                  className="font-bold text-xl text-text-primary truncate cursor-pointer hover:text-text-secondary transition-colors"
                  onDoubleClick={handleStartEditName}
                  title="Double-click to rename"
                >
                  {activeSession.name}
                </h2>
              )}
              
              {/* Linked Plan Button */}
              {linkedPlan && (
                <button
                  onClick={() => setIsPlanOpen(true)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-interactive bg-interactive/10 hover:bg-interactive/20 rounded-full transition-colors border border-interactive/20"
                  title={`View Plan: ${linkedPlan.name}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Plan Linked</span>
                </button>
              )}

              {/* CLAUDE.md Status */}
              {claudeMdStatus?.exists && (
                  <div className="flex items-center gap-2">
                      {claudeMdStatus.stale && (
                          <div className="flex items-center gap-1 text-status-warning text-xs font-medium" title="CLAUDE.md is older than 1 week">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Outdated Docs</span>
                          </div>
                      )}
                      
                      <button
                          onClick={handleRethink}
                          disabled={isRethinking}
                          className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full transition-colors border ${
                              claudeMdStatus.stale 
                              ? 'text-status-warning bg-status-warning/10 border-status-warning/20 hover:bg-status-warning/20'
                              : 'text-text-secondary bg-surface-secondary border-border-primary hover:bg-surface-tertiary'
                          }`}
                          title="Regenerate CLAUDE.md using latest analysis"
                      >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRethinking ? 'animate-spin' : ''}`} />
                          <span>{isRethinking ? 'Rethinking...' : 'Rethink Docs'}</span>
                      </button>
                  </div>
              )}
            </div>
            
            {/* Status and Mode Indicators */}
            <div className="flex items-center gap-3 mt-2">
              <StatusIndicator 
                key={`status-${activeSession.id}-${activeSession.status}`} 
                session={activeSession} 
                size="medium" 
                showText 
                showProgress 
              />
              {activeSession.commitMode && activeSession.commitMode !== 'disabled' && (
                <CommitModeIndicator mode={activeSession.commitMode} />
              )}
            </div>
          </div>

        </div>

        {/* Error Messages */}
        {mergeError && (
          <div className="mt-3 p-2 bg-status-error/10 border border-status-error/30 rounded-md">
            <p className="text-sm text-status-error">{mergeError}</p>
          </div>
        )}
      </div>

      {/* Plan Modal */}
      {linkedPlan && (
        <Modal
          isOpen={isPlanOpen}
          onClose={() => setIsPlanOpen(false)}
          size="xl"
        >
          <ModalHeader 
            title={`Plan: ${linkedPlan.name}`}
            icon={<FileText className="w-5 h-5 text-interactive" />}
            onClose={() => setIsPlanOpen(false)}
          />
          <ModalBody>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{linkedPlan.content}</ReactMarkdown>
            </div>
          </ModalBody>
        </Modal>
      )}

      {/* Old tab bar removed - now using panel system */}
    </div>
  );
};