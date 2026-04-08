'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGithub, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [githubProfileUrl, setGithubProfileUrl] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const oauthError = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('error') : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGithub(githubProfileUrl, linkEmail || undefined);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubOAuthLogin = () => {
    window.location.href = '/api/auth/github/start';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-white">DebugHive</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || authError || oauthError) && (
              <Alert variant="destructive" className="bg-red-950 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || authError || `GitHub login failed: ${oauthError}`}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            <Button
              type="button"
              onClick={handleGithubOAuthLogin}
              className="w-full bg-black hover:bg-slate-900 text-white border border-slate-700"
            >
              Continue with GitHub (OAuth)
            </Button>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <p className="text-xs text-slate-400">Fallback: continue with GitHub profile link</p>
              <Input
                type="url"
                placeholder="https://github.com/username"
                value={githubProfileUrl}
                onChange={(e) => setGithubProfileUrl(e.target.value)}
                disabled={isLoading}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Input
                type="email"
                placeholder="Optional: existing account email to link"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                disabled={isLoading}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                type="button"
                disabled={isLoading || !githubProfileUrl.trim()}
                onClick={handleGithubLogin}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white"
              >
                Continue with GitHub
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
