'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold text-white">Help & Documentation</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Getting Started */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">1. Create Your First Debug Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <p>
                  Start by creating a team from your dashboard. Each team can have multiple debug sessions where you
                  and your team members can collaborate on debugging code together.
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to Dashboard</li>
                  <li>Click "Create New Team"</li>
                  <li>Enter your team name and create the team</li>
                  <li>Click on the team to access it</li>
                  <li>Create a debug session by pasting your code</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* AI Agents */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Understanding AI Agents</h2>
            <div className="grid gap-4">
              {[
                {
                  icon: '🐛',
                  name: 'Bug Finder',
                  description: 'Identifies potential issues and bugs in your code. Looks for common patterns, null pointer exceptions, array access issues, and more.',
                },
                {
                  icon: '📚',
                  name: 'Explainer',
                  description: 'Explains what your code does. Useful for understanding legacy code, complex algorithms, or unfamiliar code patterns.',
                },
                {
                  icon: '🔧',
                  name: 'Fixer',
                  description: 'Suggests fixes for identified issues. Provides code snippets and solutions to resolve problems.',
                },
                {
                  icon: '✅',
                  name: 'Tester',
                  description: 'Analyzes test coverage and suggests test cases. Recommends testing frameworks and edge cases to cover.',
                },
                {
                  icon: '👀',
                  name: 'Code Reviewer',
                  description: 'Provides comprehensive code review feedback covering style, performance, security, and best practices.',
                },
              ].map((agent) => (
                <Card key={agent.name} className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <span className="text-2xl">{agent.icon}</span>
                      {agent.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300">{agent.description}</CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* GitHub Integration */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">GitHub Integration</h2>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Create Pull Requests Automatically</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <p>
                  After running AI analysis, you can create a pull request directly from DebugHive with all the suggested
                  fixes and improvements.
                </p>
                <h4 className="font-semibold text-white mt-4">Steps:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Run AI analysis on your code</li>
                  <li>Click "Create PR" button in the session header</li>
                  <li>Fill in the repository details (owner, repo name, branch)</li>
                  <li>Optionally provide your GitHub token for private repositories</li>
                  <li>Review the generated PR description with AI insights</li>
                  <li>Create the pull request</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* Collaboration */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Team Collaboration</h2>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Work Together with Your Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-300">
                <p>
                  Invite team members to your debug sessions to collaborate in real-time. Share findings, discuss fixes,
                  and track changes through audit logs.
                </p>
                <h4 className="font-semibold text-white mt-4">Team Features:</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>Invite members by email</li>
                  <li>Role-based access control (Owner, Admin, Member)</li>
                  <li>Real-time code synchronization</li>
                  <li>Audit logs for all team activities</li>
                  <li>Team settings and billing management</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Tips */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Tips & Best Practices</h2>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6 space-y-3 text-slate-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">For Better Analysis:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Provide complete, runnable code snippets</li>
                    <li>Include context about what the code is supposed to do</li>
                    <li>Specify the programming language for accurate analysis</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Keyboard Shortcuts:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Cmd+S (or Ctrl+S) - Save code</li>
                    <li>Cmd+Enter (or Ctrl+Enter) - Run AI analysis</li>
                    <li>Cmd+? (or Ctrl+?) - Show keyboard shortcuts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Support */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Support</h2>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6 space-y-3 text-slate-300">
                <p>
                  Have questions or need help? Check out these resources:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Documentation:</strong> Full API and feature documentation available online
                  </li>
                  <li>
                    <strong>Tutorial:</strong> Step-by-step guide to get started with DebugHive
                  </li>
                  <li>
                    <strong>Keyboard Shortcuts:</strong> Press Cmd+? in any debug session to see shortcuts
                  </li>
                  <li>
                    <strong>Audit Logs:</strong> Check team audit logs to understand what happened
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
