'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Zap, BookOpen, Code } from 'lucide-react';
import Link from 'next/link';

interface QuickActionsProps {
  firstTeamId?: string;
  onAction?: (action: string) => void;
}

export function QuickActions({ firstTeamId, onAction }: QuickActionsProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/50 mb-8">
      <CardHeader>
        <CardTitle className="text-white text-lg">Getting Started</CardTitle>
        <CardDescription className="text-slate-400">
          Quickly access common actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-start p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-700"
          >
            <Link href={firstTeamId ? `/team/${firstTeamId}` : '#'}>
              <div className="flex items-center gap-2 w-full mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold text-white">Start Debug Session</span>
              </div>
              <span className="text-xs text-slate-400">Create a new debugging session</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-start p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-700"
          >
            <Link href="/dashboard">
              <div className="flex items-center gap-2 w-full mb-2">
                <Plus className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-white">Create Team</span>
              </div>
              <span className="text-xs text-slate-400">Organize your team</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-700"
            onClick={() => onAction?.('docs')}
          >
            <div className="flex items-center gap-2 w-full mb-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">Documentation</span>
            </div>
            <span className="text-xs text-slate-400">Learn how to use DebugHive</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-700"
            onClick={() => onAction?.('tutorial')}
          >
            <div className="flex items-center gap-2 w-full mb-2">
              <Code className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">Tutorial</span>
            </div>
            <span className="text-xs text-slate-400">Watch a quick tutorial</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
