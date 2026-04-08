'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Bot, Play, Save, Send, Share2, User as UserIcon } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PRCreatorDialog } from '@/components/pr-creator-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DebugSession {
  id: string;
  title: string;
  code: string;
  language: string;
  status: string;
  aiAgentResults: Record<string, any>;
  participants: string[];
}

interface AIResult {
  agent: string;
  result: string;
  timestamp: string;
  status: 'pending' | 'complete' | 'error';
}

interface FixHunk {
  id: string;
  startLine: number;
  endLine: number;
  beforeLines: string[];
  afterLines: string[];
  status: 'pending' | 'accepted' | 'rejected';
}

interface FixReview {
  baseCode: string;
  hunks: FixHunk[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type RunStatus = 'idle' | 'running' | 'success' | 'error';

const AI_AGENTS = [
  { id: 'bug-finder', name: 'Bug Finder', icon: '🐛' },
  { id: 'explainer', name: 'Explainer', icon: '📚' },
  { id: 'fixer', name: 'Fixer', icon: '🔧' },
  { id: 'tester', name: 'Tester', icon: '✅' },
  { id: 'reviewer', name: 'Code Reviewer', icon: '👀' },
];

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const [session, setSession] = useState<DebugSession | null>(null);
  const [code, setCode] = useState('');
  const [aiResults, setAiResults] = useState<Record<string, AIResult>>({});
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fixReview, setFixReview] = useState<FixReview | null>(null);
  const [runOutput, setRunOutput] = useState('Run output will appear here.');
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedHunkId, setSelectedHunkId] = useState<string | null>(null);

  const buildFixHunks = (before: string, after: string): FixHunk[] => {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    const maxLines = Math.max(beforeLines.length, afterLines.length);
    const hunks: FixHunk[] = [];

    let inHunk = false;
    let hunkStart = 0;
    let beforeBuffer: string[] = [];
    let afterBuffer: string[] = [];

    const flushHunk = (lineIndex: number) => {
      if (!inHunk) return;

      hunks.push({
        id: `hunk-${hunks.length + 1}`,
        startLine: hunkStart + 1,
        endLine: lineIndex,
        beforeLines: beforeBuffer,
        afterLines: afterBuffer,
        status: 'pending',
      });

      inHunk = false;
      beforeBuffer = [];
      afterBuffer = [];
    };

    for (let i = 0; i < maxLines; i += 1) {
      const beforeLine = beforeLines[i] ?? '';
      const afterLine = afterLines[i] ?? '';
      const isChanged = beforeLine !== afterLine;

      if (isChanged) {
        if (!inHunk) {
          inHunk = true;
          hunkStart = i;
        }
        beforeBuffer.push(beforeLine);
        afterBuffer.push(afterLine);
      } else {
        flushHunk(i);
      }
    }

    flushHunk(maxLines);

    return hunks;
  };

  const rebuildCodeWithAcceptedHunks = (baseCode: string, hunks: FixHunk[]): string => {
    const baseLines = baseCode.split('\n');
    const accepted = hunks
      .filter((hunk) => hunk.status === 'accepted')
      .sort((a, b) => a.startLine - b.startLine);

    let offset = 0;
    accepted.forEach((hunk) => {
      const startIndex = hunk.startLine - 1 + offset;
      baseLines.splice(startIndex, hunk.beforeLines.length, ...hunk.afterLines);
      offset += hunk.afterLines.length - hunk.beforeLines.length;
    });

    return baseLines.join('\n');
  };

  const updateHunkStatus = (hunkId: string, status: FixHunk['status']) => {
    setFixReview((current) => {
      if (!current) return current;
      const nextHunks = current.hunks.map((hunk) =>
        hunk.id === hunkId ? { ...hunk, status } : hunk
      );
      const nextCode = rebuildCodeWithAcceptedHunks(current.baseCode, nextHunks);
      setCode(nextCode);
      return { ...current, hunks: nextHunks };
    });
    setSelectedHunkId(hunkId);
  };

  const acceptAllHunks = () => {
    setFixReview((current) => {
      if (!current) return current;
      const nextHunks = current.hunks.map((hunk) => ({ ...hunk, status: 'accepted' as const }));
      const nextCode = rebuildCodeWithAcceptedHunks(current.baseCode, nextHunks);
      setCode(nextCode);
      return { ...current, hunks: nextHunks };
    });
  };

  const rejectAllHunks = () => {
    if (!fixReview) return;
    setCode(fixReview.baseCode);
    setFixReview(null);
  };

  const saveAcceptedHunks = async () => {
    await handleSaveCode();
    setFixReview(null);
  };

  const buildFixedCode = (sourceCode: string, fixerResult?: string): string => {
    if (!fixerResult) {
      return sourceCode;
    }

    let updatedCode = sourceCode;

    if (fixerResult.includes('Replace var with const/let')) {
      updatedCode = updatedCode.replace(/\bvar\b/g, 'const');
    }

    if (fixerResult.includes('Bind with context')) {
      updatedCode = updatedCode.replace(/\.bind\((\s*)\)/g, '.bind(this)');
    }

    if (fixerResult.includes('Add try/catch for async operations')) {
      updatedCode = updatedCode.replace(
        /^(\s*)(await\s+[^\n;]+;?)\s*$/m,
        (_match, indent: string, awaitLine: string) => {
          return [
            `${indent}try {`,
            `${indent}  ${awaitLine.trim()}`,
            `${indent}} catch (err) {`,
            `${indent}  console.error(err);`,
            `${indent}}`,
          ].join('\n');
        }
      );
    }

    return updatedCode;
  };

  const startFixReview = () => {
    const fixerResult = aiResults.fixer?.result;
    if (!fixerResult) return;

    const proposedCode = buildFixedCode(code, fixerResult);
    const hunks = buildFixHunks(code, proposedCode);

    if (hunks.length === 0) return;

    setFixReview({
      baseCode: code,
      hunks,
    });
    setSelectedHunkId(hunks[0]?.id || null);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!fixReview || fixReview.hunks.length === 0) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      const currentIndex = Math.max(
        0,
        fixReview.hunks.findIndex((hunk) => hunk.id === selectedHunkId)
      );

      if (event.key.toLowerCase() === 'j') {
        event.preventDefault();
        const nextIndex = Math.min(fixReview.hunks.length - 1, currentIndex + 1);
        setSelectedHunkId(fixReview.hunks[nextIndex].id);
      }

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const nextIndex = Math.max(0, currentIndex - 1);
        setSelectedHunkId(fixReview.hunks[nextIndex].id);
      }

      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        updateHunkStatus(fixReview.hunks[currentIndex].id, 'accepted');
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        updateHunkStatus(fixReview.hunks[currentIndex].id, 'rejected');
      }

      if (event.key.toLowerCase() === 'x') {
        event.preventDefault();
        updateHunkStatus(fixReview.hunks[currentIndex].id, 'pending');
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        void saveAcceptedHunks();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        rejectAllHunks();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fixReview, selectedHunkId]);

  const sendChatMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || !session) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((current) => [...current, userMessage]);
    setMessage('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          message: trimmed,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Chat failed');
      }

      if (!response.body) {
        throw new Error('Missing chat stream body');
      }

      const assistantId = `assistant-${Date.now()}`;
      setChatMessages((current) => [
        ...current,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedText = '';

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) {
          streamedText += decoder.decode(chunk.value, { stream: true });
          setChatMessages((current) =>
            current.map((msg) => (msg.id === assistantId ? { ...msg, content: streamedText } : msg))
          );
        }
      }

    } catch (error) {
      const fallback: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Chat failed',
        timestamp: new Date().toISOString(),
      };
      setChatMessages((current) => [...current, fallback]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunCode = async () => {
    setRunStatus('running');

    try {
      const response = await fetch('/api/run/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: session?.language || 'javascript',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Execution failed');
      }

      const compileOutput = data.compile
        ? `Compile:\n${data.compile.output || data.compile.stderr || data.compile.stdout || 'No compiler output'}\n\n`
        : '';
      const runOutputText = data.output || data.run?.stdout || data.run?.stderr || 'Program finished with no output.';

      setRunStatus(data.run?.code === 0 || !data.run ? 'success' : 'error');
      setRunOutput(`${compileOutput}Run:\n${runOutputText}`.trim());
    } catch (err) {
      setRunStatus('error');
      setRunOutput(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/debug-sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        setCode(data.code);
        setAiResults(data.aiAgentResults || {});

        const chatResponse = await fetch(`/api/debug-sessions/${sessionId}/chat`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          const persisted = (chatData.messages || []).map((chat: any) => ({
            id: chat.id,
            role: chat.role === 'assistant' ? 'assistant' : 'user',
            content: chat.content,
            timestamp: chat.createdAt,
          })) as ChatMessage[];
          setChatMessages(
            persisted.length > 0
              ? persisted
              : [
                  {
                    id: 'assistant-welcome',
                    role: 'assistant',
                    content: 'I am ready. Ask about bugs, fixes, tests, or architecture for this session.',
                    timestamp: new Date().toISOString(),
                  },
                ]
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCode = async () => {
    if (!session) return;
    setIsSaving(true);
    try {
      await fetch(`/api/debug-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
    } catch (err) {
      console.error('Failed to save code:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const runAIAgent = async (agentId: string) => {
    setActiveAgent(agentId);
    setAiResults((current) => ({
      ...current,
      [agentId]: {
        agent: agentId,
        result: 'Analyzing...',
        timestamp: new Date().toISOString(),
        status: 'pending',
      },
    }));

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          code,
          language: session?.language || 'javascript',
          agent: agentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiResults((current) => ({
          ...current,
          [agentId]: data.results,
        }));
      } else {
        setAiResults((current) => ({
          ...current,
          [agentId]: {
            agent: agentId,
            result: 'Failed to analyze code',
            timestamp: new Date().toISOString(),
            status: 'error',
          },
        }));
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiResults((current) => ({
        ...current,
        [agentId]: {
          agent: agentId,
          result: 'Error during analysis',
          timestamp: new Date().toISOString(),
          status: 'error',
        },
      }));
    } finally {
      setActiveAgent(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Session not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">{session.title}</h1>
              <p className="text-xs text-slate-400">{session.language} • {session.participants.length} participants{user?.name ? ` • ${user.name}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveCode}
              disabled={isSaving}
              className="text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {session && (
              <PRCreatorDialog
                sessionId={session.id}
                sessionTitle={session.title}
                aiResults={aiResults}
                code={code}
              />
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col bg-slate-900">
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <span className="text-sm font-medium text-slate-300">{session.language}</span>
              <div className="flex items-center gap-2">
                {fixReview && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={rejectAllHunks}
                      className="text-amber-200 border-amber-500/40 hover:bg-amber-900/20"
                    >
                      Cancel Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveAcceptedHunks}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Save Accepted
                    </Button>
                  </>
                )}
                <Button size="sm" onClick={handleRunCode} className="bg-green-600 hover:bg-green-700 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  {runStatus === 'running' ? 'Running...' : 'Run'}
                </Button>
              </div>
            </div>
            {fixReview && (
              <div className="border-b border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-amber-100">
                    Review each hunk and accept or reject changes, then save accepted edits.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={acceptAllHunks} className="text-emerald-200 border-emerald-500/40 hover:bg-emerald-900/20">
                      Accept All
                    </Button>
                    <Button size="sm" variant="outline" onClick={rejectAllHunks} className="text-red-200 border-red-500/40 hover:bg-red-900/20">
                      Reject All
                    </Button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto rounded border border-amber-500/30 bg-slate-900 p-2">
                  {fixReview.hunks.map((hunk) => {
                    const isSelected = selectedHunkId === hunk.id;
                    return (
                      <div
                        key={hunk.id}
                        className={`mb-3 rounded border p-2 text-xs font-mono ${isSelected ? 'border-blue-500 bg-blue-950/20' : 'border-slate-700'}`}
                        onClick={() => setSelectedHunkId(hunk.id)}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-slate-300">Lines {hunk.startLine}-{hunk.endLine}</span>
                          <span className={`rounded px-2 py-0.5 text-[10px] uppercase ${hunk.status === 'accepted' ? 'bg-emerald-800 text-emerald-100' : hunk.status === 'rejected' ? 'bg-red-800 text-red-100' : 'bg-amber-800 text-amber-100'}`}>
                            {hunk.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded border border-red-500/20 bg-red-500/5 p-1">
                            {hunk.beforeLines.map((line, index) => (
                              <div key={`before-${hunk.id}-${index}`} className="grid grid-cols-[48px_1fr] gap-2 px-2 py-1 text-red-200">
                                <span className="text-red-300/80 text-right">{hunk.startLine + index}</span>
                                <span>{line}</span>
                              </div>
                            ))}
                          </div>
                          <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-1">
                            {hunk.afterLines.map((line, index) => (
                              <div key={`after-${hunk.id}-${index}`} className="grid grid-cols-[48px_1fr] gap-2 px-2 py-1 text-emerald-200">
                                <span className="text-emerald-300/80 text-right">{hunk.startLine + index}</span>
                                <span>{line}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={() => updateHunkStatus(hunk.id, 'accepted')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateHunkStatus(hunk.id, 'rejected')} className="text-red-200 border-red-500/40 hover:bg-red-900/20">
                            Reject
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateHunkStatus(hunk.id, 'pending')} className="text-slate-300 border-slate-600">
                            Reset
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <textarea
              value={code}
              onChange={(e) => {
                if (!fixReview) {
                  setCode(e.target.value);
                }
              }}
              readOnly={Boolean(fixReview)}
              className={`flex-1 bg-slate-800 text-slate-100 p-4 font-mono text-sm resize-none focus:outline-none ${fixReview ? 'ring-1 ring-amber-500/60 cursor-not-allowed' : ''}`}
              placeholder="Paste your code here..."
            />
            <div className="border-t border-slate-800 p-3 bg-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wide text-slate-400">Output</span>
                <span className={`text-xs ${runStatus === 'error' ? 'text-red-400' : runStatus === 'success' ? 'text-emerald-400' : runStatus === 'running' ? 'text-blue-400' : 'text-slate-500'}`}>
                  {runStatus}
                </span>
              </div>
              <pre className="max-h-40 overflow-auto rounded bg-black/40 p-2 text-xs text-slate-200 whitespace-pre-wrap">
                {runOutput}
              </pre>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-slate-800 hover:bg-blue-500/30" />

        {/* AI Analysis Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800">
            <Tabs defaultValue="agents" className="flex-1 flex flex-col">
              <TabsList className="rounded-none border-b border-slate-800 bg-transparent p-3 h-auto">
                <TabsTrigger value="agents" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-800">
                  AI Agents
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-800">
                  Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="agents" className="flex-1 overflow-y-auto p-3 space-y-2">
                {AI_AGENTS.map((agent) => (
                  <Card
                    key={agent.id}
                    className="bg-slate-800 border-slate-700 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => {
                      if (!activeAgent) {
                        runAIAgent(agent.id);
                      }
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{agent.icon}</span>
                          <CardTitle className="text-sm text-white">{agent.name}</CardTitle>
                        </div>
                        {activeAgent === agent.id && (
                          <span className="text-xs text-blue-400 animate-pulse">Running...</span>
                        )}
                      </div>
                    </CardHeader>
                    {aiResults[agent.id] && (
                      <CardContent className="pt-0">
                        <pre className="text-xs text-slate-300 bg-slate-900 p-2 rounded overflow-x-auto max-h-32 line-clamp-4 whitespace-pre-wrap">
                          {aiResults[agent.id].result}
                        </pre>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedAgent(agent.id);
                            }}
                            className="text-slate-300 border-slate-600"
                          >
                            Expand
                          </Button>
                        </div>
                        {agent.id === 'fixer' && aiResults[agent.id].status === 'complete' && (
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startFixReview();
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              Review Hunks
                            </Button>
                            {fixReview && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectAllHunks();
                                }}
                                className="text-slate-300 border-slate-600"
                              >
                                Discard Review
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="chat" className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {chatMessages.map((chatMessage) => (
                      <Card key={chatMessage.id} className={`${chatMessage.role === 'assistant' ? 'bg-slate-800 border-slate-700' : 'bg-blue-950/40 border-blue-700/40'}`}>
                        <CardContent className="pt-3">
                          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                            {chatMessage.role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                            <span>{chatMessage.role === 'assistant' ? 'DebugHive AI' : 'You'}</span>
                          </div>
                          <pre className="text-xs text-slate-200 whitespace-pre-wrap">{chatMessage.content}</pre>
                        </CardContent>
                      </Card>
                    ))}
                    {chatLoading && (
                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="pt-3 text-xs text-slate-400">Analyzing your question...</CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask about your code..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    className="flex-1 bg-slate-800 text-white border border-slate-700 rounded px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Button
                    size="sm"
                    onClick={sendChatMessage}
                    disabled={chatLoading || !message.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="px-3 pb-2 text-[10px] text-slate-500">
                  Diff shortcuts: J/K navigate, A accept, R reject, X reset, Ctrl/Cmd+Enter save, Esc cancel.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={Boolean(expandedAgent)} onOpenChange={(open) => !open && setExpandedAgent(null)}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {AI_AGENTS.find((agent) => agent.id === expandedAgent)?.name || 'AI Result'}
            </DialogTitle>
          </DialogHeader>
          <pre className="max-h-[70vh] overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-200 whitespace-pre-wrap">
            {expandedAgent ? aiResults[expandedAgent]?.result || 'No results yet.' : ''}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
