'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Github } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PRCreatorProps {
  sessionId: string;
  sessionTitle: string;
  aiResults: Record<string, any>;
  code: string;
}

export function PRCreatorDialog({ sessionId, sessionTitle, aiResults, code }: PRCreatorProps) {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('debughive-fix');
  const [prTitle, setPrTitle] = useState(`Fix: ${sessionTitle}`);
  const [githubToken, setGithubToken] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsCreating(true);

    try {
      // Extract issues and fixes from AI results
      const issues = aiResults['bug-finder']?.result?.split('\n').filter((line: string) => line.startsWith('•')) || [];
      const fixes = aiResults['fixer']?.result?.split('\n').filter((line: string) => line.startsWith('•')) || [];
      const reviewComments = aiResults['reviewer']?.result?.split('\n').filter((line: string) => line.includes('•') || line.includes('✓') || line.includes('⚠')) || [];

      const response = await fetch('/api/github/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          githubToken: githubToken || undefined,
          owner,
          repo,
          branch,
          title: prTitle,
          issues,
          fixes,
          reviewComments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create PR');
      }

      const data = await response.json();
      setSuccess(`PR created successfully! View it at: ${data.githubUrl}`);
      setPrTitle(`Fix: ${sessionTitle}`);
      setOwner('');
      setRepo('');
      setBranch('debughive-fix');

      // Close dialog after 2 seconds
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PR');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Github className="w-4 h-4 mr-2" />
          Create PR
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create Pull Request</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a GitHub PR with the AI-suggested fixes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreatePR} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-950 border-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-950 border-green-800">
              <AlertDescription className="text-green-200">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Repository Owner</label>
            <Input
              placeholder="e.g., vercel"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              disabled={isCreating}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Repository Name</label>
            <Input
              placeholder="e.g., next.js"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              disabled={isCreating}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Branch Name</label>
            <Input
              placeholder="e.g., debughive-fix"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isCreating}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">PR Title</label>
            <Input
              placeholder="PR title"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              disabled={isCreating}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">GitHub Token (Optional)</label>
            <Input
              type="password"
              placeholder="ghp_xxxxx (optional for public repos)"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              disabled={isCreating}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isCreating || !owner || !repo || !prTitle}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isCreating ? 'Creating...' : 'Create Pull Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
