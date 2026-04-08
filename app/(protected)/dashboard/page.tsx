'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, LogOut, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DashboardPage() {
  const router = useRouter();
  const { user, teams, logout, createTeam } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [error, setError] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      await createTeam(newTeamName);
      setNewTeamName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">DebugHive</h1>
            <p className="text-sm text-slate-400">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push('/help')}
              variant="outline"
              size="sm"
              className="text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Create Team Section */}
        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Create New Team</CardTitle>
            <CardDescription className="text-slate-400">
              Start collaborating with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-950 border-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleCreateTeam} className="flex gap-2">
              <Input
                type="text"
                placeholder="Team name (e.g., Backend Team)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                disabled={isCreating}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 flex-1"
              />
              <Button
                type="submit"
                disabled={isCreating || !newTeamName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Teams Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Teams</h2>
          {teams.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-center">
                  No teams yet. Create one to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="bg-slate-900 border-slate-800 hover:border-blue-500 cursor-pointer transition-colors"
                  onClick={() => router.push(`/team/${team.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-white">{team.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      Created {new Date(team.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Open Team
                    </Button>
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
