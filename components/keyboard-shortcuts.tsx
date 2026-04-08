'use client';

import { useEffect, useState } from 'react';
import { Command, Zap, Save, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsProps {
  onSave?: () => void;
  onRunAnalysis?: () => void;
  onShare?: () => void;
}

export function KeyboardShortcuts({
  onSave,
  onRunAnalysis,
  onShare,
}: KeyboardShortcutsProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + ? to open shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setOpen(true);
      }

      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }

      // Cmd/Ctrl + Enter to run analysis
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onRunAnalysis?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onRunAnalysis, onShare]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Quick access to common actions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">Editor</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Save Code</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs">
                  ⌘ S
                </kbd>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Run Analysis</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs">
                  ⌘ ↵
                </kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">AI Agents</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Bug Finder
                </span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs">
                  1
                </kbd>
              </div>
              <div className="flex justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-blue-400" />
                  Run All Agents
                </span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs">
                  0
                </kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">Navigation</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Show this help</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs">
                  ⌘ ?
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
