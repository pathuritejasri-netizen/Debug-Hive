// GitHub Integration Utilities

export interface GitHubRepository {
  owner: string;
  name: string;
  url: string;
  branch: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  language: string;
}

export interface RepositorySnapshot {
  owner: string;
  repo: string;
  branch: string;
  files: GitHubFile[];
  combinedCode: string;
}

export interface PullRequestOptions {
  title: string;
  description: string;
  branch: string;
  baseFile: GitHubFile;
  changes: string;
}

// Mock GitHub API client (in production would use octokit)
export class GitHubClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async searchRepositories(query: string): Promise<GitHubRepository[]> {
    // Mock implementation
    return [
      {
        owner: 'vercel',
        name: 'next.js',
        url: 'https://github.com/vercel/next.js',
        branch: 'main',
      },
      {
        owner: 'facebook',
        name: 'react',
        url: 'https://github.com/facebook/react',
        branch: 'main',
      },
    ];
  }

  async getRepositoryFile(
    owner: string,
    repo: string,
    path: string,
    branch: string = 'main'
  ): Promise<GitHubFile> {
    // Mock implementation
    return {
      path,
      content: `// File from ${owner}/${repo}\n// Path: ${path}`,
      language: this.detectLanguage(path),
    };
  }

  async createPullRequest(
    owner: string,
    repo: string,
    options: PullRequestOptions
  ): Promise<{ url: string; number: number }> {
    // Mock implementation
    const prNumber = Math.floor(Math.random() * 10000) + 1;
    const url = `https://github.com/${owner}/${repo}/pull/${prNumber}`;

    return {
      url,
      number: prNumber,
    };
  }

  async createCommit(
    owner: string,
    repo: string,
    branch: string,
    message: string,
    files: GitHubFile[]
  ): Promise<{ sha: string; url: string }> {
    // Mock implementation
    const sha = Math.random().toString(36).substring(7);
    const url = `https://github.com/${owner}/${repo}/commit/${sha}`;

    return { sha, url };
  }

  async getRepositorySnapshot(owner: string, repo: string): Promise<RepositorySnapshot> {
    const effectiveToken = this.token && this.token !== 'mock-token'
      ? this.token
      : (process.env.GITHUB_API_KEY || process.env.GITHUB_TOKEN || '');

    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'DebugHive',
    };
    if (effectiveToken) {
      headers.Authorization = `Bearer ${effectiveToken}`;
    }

    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoResponse.ok) {
      if (repoResponse.status === 403) {
        throw new Error('GitHub API rate limit or access denied (403). Add a GitHub token in request or set GITHUB_API_KEY in .env.local.');
      }
      throw new Error(`Failed to load repository metadata (${repoResponse.status})`);
    }

    const repoMeta = await repoResponse.json() as { default_branch?: string };
    const branch = repoMeta.default_branch || 'main';

    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    );
    if (!treeResponse.ok) {
      if (treeResponse.status === 403) {
        throw new Error('GitHub API rate limit or access denied (403). Add a GitHub token in request or set GITHUB_API_KEY in .env.local.');
      }
      throw new Error(`Failed to load repository tree (${treeResponse.status})`);
    }

    const treePayload = await treeResponse.json() as {
      tree?: Array<{ path: string; type: string }>;
    };

    const codeFilePaths = (treePayload.tree || [])
      .filter((item) => item.type === 'blob')
      .map((item) => item.path)
      .filter((filePath) => /\.(js|ts|tsx|jsx|py|java|go|rs|cpp|c|cs|php|rb|swift|kt|mjs|cjs)$/i.test(filePath))
      .slice(0, 12);

    const files: GitHubFile[] = [];

    for (const filePath of codeFilePaths) {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(filePath)}?ref=${branch}`,
        { headers }
      );
      if (!fileResponse.ok) continue;

      const fileJson = await fileResponse.json() as { content?: string; encoding?: string; path?: string };
      if (!fileJson.content || fileJson.encoding !== 'base64') continue;

      const content = Buffer.from(fileJson.content, 'base64').toString('utf-8');
      files.push({
        path: fileJson.path || filePath,
        content,
        language: this.detectLanguage(filePath),
      });
    }

    if (files.length === 0) {
      throw new Error('No supported source files found in this repository');
    }

    const combinedCode = files
      .map((file) => `// File: ${file.path}\n${file.content}`)
      .join('\n\n');

    return {
      owner,
      repo,
      branch,
      files,
      combinedCode,
    };
  }

  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      rs: 'rust',
      go: 'go',
      rb: 'ruby',
      php: 'php',
    };
    return languageMap[ext] || 'text';
  }
}

export function createGitHubClient(token: string): GitHubClient {
  return new GitHubClient(token);
}

export function parseGitHubUrl(url: string): {
  owner: string;
  repo: string;
  path?: string;
} | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/blob\/[^/]+\/(.+))?(?:\/)?$/);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
    path: match[3],
  };
}

export function parseGitHubProfileUrl(url: string): { username: string } | null {
  const match = url.match(/github\.com\/([^/?#]+)\/?$/);
  if (!match) return null;

  const username = match[1];
  if (username.toLowerCase() === 'settings' || username.toLowerCase() === 'orgs') {
    return null;
  }

  return { username };
}

export function formatPRDescription(
  sessionTitle: string,
  issues: string[],
  fixes: string[],
  reviewComments: string[]
): string {
  const description = `## Debug Session: ${sessionTitle}

### Issues Found
${issues.map((issue) => `- ${issue}`).join('\n')}

### Applied Fixes
${fixes.map((fix) => `- ${fix}`).join('\n')}

### Code Review
${reviewComments.map((comment) => `- ${comment}`).join('\n')}

---
*Generated by DebugHive - AI-powered collaborative debugging platform*
`;

  return description;
}
