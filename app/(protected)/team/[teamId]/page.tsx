'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, ArrowLeft, Trash2, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DebugSession {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export default function TeamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { user } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionCode, setNewSessionCode] = useState('');
  const [newSessionLanguage, setNewSessionLanguage] = useState('javascript');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoToken, setRepoToken] = useState('');
  const [isImportingRepo, setIsImportingRepo] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const team = useAuth().teams.find((t) => t.id === teamId);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
    }
    fetchSessions();
  }, [teamId, team]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/debug-sessions?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const response = await fetch('/api/debug-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          title: newSessionTitle,
          code: newSessionCode,
          language: newSessionLanguage,
          description: '',
          autoAnalyze,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const newSession = await response.json();
      setSessions([...sessions, newSession]);
      setNewSessionTitle('');
      setNewSessionCode('');
      setNewSessionLanguage('javascript');
      router.push(`/session/${newSession.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const handleImportRepo = async () => {
    setError('');
    setIsImportingRepo(true);

    try {
      const response = await fetch('/api/github/import-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, token: repoToken || undefined }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import repository');
      }

      setNewSessionTitle(data.title || `${data.owner}/${data.repo} analysis`);
      setNewSessionCode(data.code || '');
      setNewSessionLanguage(data.language || 'javascript');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import repository');
    } finally {
      setIsImportingRepo(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{teamName}</h1>
              <p className="text-sm text-slate-400">{user?.name}</p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/team/${teamId}/settings`)}
            variant="outline"
            size="sm"
            className="text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Create Session Section */}
        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Create Debug Session</CardTitle>
            <CardDescription className="text-slate-400">
              Paste code or attach a GitHub repository for full-file analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-950 border-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">GitHub Repository URL</label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://github.com/owner/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={isCreating || isImportingRepo}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Button
                    type="button"
                    onClick={handleImportRepo}
                    disabled={isCreating || isImportingRepo || !repoUrl.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isImportingRepo ? 'Importing...' : 'Attach Repo'}
                  </Button>
                </div>
                <Input
                  type="password"
                  placeholder="Optional: GitHub token (avoids API 403/rate limit)"
                  value={repoToken}
                  onChange={(e) => setRepoToken(e.target.value)}
                  disabled={isCreating || isImportingRepo}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <Input
                type="text"
                placeholder="Session title (e.g., API Error)"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                disabled={isCreating}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <div className="flex gap-2">
                <select
                  value={newSessionLanguage}
                  onChange={(e) => setNewSessionLanguage(e.target.value)}
                  disabled={isCreating}
                  className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded flex-shrink-0"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="rust">Rust</option>
                </select>
                <Button
                  type="submit"
                  disabled={isCreating || !newSessionTitle.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
              <textarea
                placeholder="Paste your code here..."
                value={newSessionCode}
                onChange={(e) => setNewSessionCode(e.target.value)}
                disabled={isCreating}
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 p-2 rounded font-mono text-sm"
              />
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={autoAnalyze}
                  onChange={(e) => setAutoAnalyze(e.target.checked)}
                  className="accent-blue-600"
                />
                Auto-run all AI agents after creating this session
              </label>
            </form>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Debug Sessions</h2>
          {loading ? (
            <p className="text-slate-400">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-center">
                  No debug sessions yet. Create one to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="bg-slate-900 border-slate-800 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => router.push(`/session/${session.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-white">{session.title}</CardTitle>
                        <CardDescription className="text-slate-400 text-xs mt-1">
                          {session.language} • {new Date(session.createdAt).toLocaleDateString()} •{' '}
                          <span className={session.status === 'active' ? 'text-green-400' : 'text-slate-500'}>
                            {session.status}
                          </span>
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <pre className="bg-slate-800 p-3 rounded text-xs text-slate-300 overflow-x-auto max-h-24 line-clamp-3">
                      {session.code}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
