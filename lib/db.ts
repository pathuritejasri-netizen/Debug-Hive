import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  githubId?: string;
  githubLogin?: string;
  githubAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

interface DebugSession {
  id: string;
  teamId: string;
  createdById: string;
  title: string;
  description: string;
  code: string;
  language: string;
  status: 'active' | 'paused' | 'closed';
  aiAgentResults: Record<string, any>;
  participants: string[];
  createdAt: string;
  updatedAt: string;
}

interface PullRequest {
  id: string;
  debugSessionId: string;
  teamId: string;
  githubPrUrl?: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'merged' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  teamId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  debugSessionId: string;
  userId: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  github_id: string | null;
  github_login: string | null;
  github_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMember['role'];
  created_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

interface DebugSessionRow {
  id: string;
  team_id: string;
  created_by_id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  status: DebugSession['status'];
  ai_agent_results: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DebugSessionParticipantRow {
  id: string;
  debug_session_id: string;
  user_id: string;
  created_at: string;
}

interface PullRequestRow {
  id: string;
  debug_session_id: string;
  team_id: string;
  github_pr_url: string | null;
  title: string;
  description: string;
  status: PullRequest['status'];
  created_at: string;
  updated_at: string;
}

interface AuditLogRow {
  id: string;
  team_id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface ChatMessageRow {
  id: string;
  debug_session_id: string;
  user_id: string | null;
  role: ChatMessage['role'];
  content: string;
  created_at: string;
}

function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

class Database {
  private getClient(): SupabaseClient {
    return getSupabaseAdminClient();
  }

  private toUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      githubId: row.github_id ?? undefined,
      githubLogin: row.github_login ?? undefined,
      githubAvatarUrl: row.github_avatar_url ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toTeam(row: TeamRow): Team {
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toTeamMember(row: TeamMemberRow): TeamMember {
    return {
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  private toSession(row: SessionRow): Session {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  private toDebugSession(row: DebugSessionRow, participants: string[]): DebugSession {
    return {
      id: row.id,
      teamId: row.team_id,
      createdById: row.created_by_id,
      title: row.title,
      description: row.description,
      code: row.code,
      language: row.language,
      status: row.status,
      aiAgentResults: row.ai_agent_results || {},
      participants,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toPullRequest(row: PullRequestRow): PullRequest {
    return {
      id: row.id,
      debugSessionId: row.debug_session_id,
      teamId: row.team_id,
      githubPrUrl: row.github_pr_url ?? undefined,
      title: row.title,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toAuditLog(row: AuditLogRow): AuditLog {
    return {
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id ?? '',
      action: row.action,
      details: row.details || {},
      createdAt: row.created_at,
    };
  }

  private toChatMessage(row: ChatMessageRow): ChatMessage {
    return {
      id: row.id,
      debugSessionId: row.debug_session_id,
      userId: row.user_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    };
  }

  private async getParticipantsMap(sessionIds: string[]): Promise<Map<string, string[]>> {
    if (sessionIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.getClient()
      .from('debug_session_participants')
      .select('debug_session_id,user_id')
      .in('debug_session_id', sessionIds);

    if (error) {
      throw new Error(`Failed to load debug session participants: ${error.message}`);
    }

    const map = new Map<string, string[]>();
    (data as Pick<DebugSessionParticipantRow, 'debug_session_id' | 'user_id'>[] | null)?.forEach((row) => {
      const participants = map.get(row.debug_session_id) ?? [];
      participants.push(row.user_id);
      map.set(row.debug_session_id, participants);
    });

    return map;
  }

  // Users
  async createUser(
    email: string,
    name: string,
    passwordHash: string,
    github?: { id?: string; login?: string; avatarUrl?: string }
  ): Promise<User> {
    const { data, error } = await this.getClient()
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        github_id: github?.id ?? null,
        github_login: github?.login ?? null,
        github_avatar_url: github?.avatarUrl ?? null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create user: ${error?.message ?? 'Unknown error'}`);
    }

    return this.toUser(data as UserRow);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }

    return data ? this.toUser(data as UserRow) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get user by id: ${error.message}`);
    }

    return data ? this.toUser(data as UserRow) : null;
  }

  async getUserByGitHubId(githubId: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .eq('github_id', githubId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get user by GitHub id: ${error.message}`);
    }

    return data ? this.toUser(data as UserRow) : null;
  }

  async updateUserGitHubLink(
    userId: string,
    github: { id: string; login: string; avatarUrl?: string }
  ): Promise<User | null> {
    const { error } = await this.getClient()
      .from('users')
      .update({
        github_id: github.id,
        github_login: github.login,
        github_avatar_url: github.avatarUrl ?? null,
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user GitHub link: ${error.message}`);
    }

    return this.getUserById(userId);
  }

  // Sessions
  async createSession(userId: string, token: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000): Promise<Session> {
    const expiresAt = new Date(Date.now() + expiresIn).toISOString();
    const { data, error } = await this.getClient()
      .from('sessions')
      .insert({ user_id: userId, token, expires_at: expiresAt })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create session: ${error?.message ?? 'Unknown error'}`);
    }

    return this.toSession(data as SessionRow);
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    const { data, error } = await this.getClient()
      .from('sessions')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get session by token: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const session = this.toSession(data as SessionRow);
    if (new Date(session.expiresAt) < new Date()) {
      await this.deleteSession(session.id);
      return null;
    }

    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await this.getClient().from('sessions').delete().eq('id', sessionId);
    if (error) {
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  // Teams
  async createTeam(name: string, ownerId: string): Promise<Team> {
    const { data, error } = await this.getClient()
      .from('teams')
      .insert({ name, owner_id: ownerId })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create team: ${error?.message ?? 'Unknown error'}`);
    }

    const team = this.toTeam(data as TeamRow);
    await this.addTeamMember(team.id, ownerId, 'owner');
    return team;
  }

  async getTeam(teamId: string): Promise<Team | null> {
    const { data, error } = await this.getClient()
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get team: ${error.message}`);
    }

    return data ? this.toTeam(data as TeamRow) : null;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const { data: memberships, error: membershipError } = await this.getClient()
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (membershipError) {
      throw new Error(`Failed to load team memberships: ${membershipError.message}`);
    }

    const teamIds = (memberships as Array<{ team_id: string }> | null)?.map((m) => m.team_id) ?? [];
    if (teamIds.length === 0) {
      return [];
    }

    const { data: teams, error: teamError } = await this.getClient()
      .from('teams')
      .select('*')
      .in('id', teamIds);

    if (teamError) {
      throw new Error(`Failed to load teams: ${teamError.message}`);
    }

    return (teams as TeamRow[] | null)?.map((team) => this.toTeam(team)) ?? [];
  }

  async addTeamMember(teamId: string, userId: string, role: TeamMember['role'] = 'member'): Promise<TeamMember> {
    const client = this.getClient();
    const { error: upsertError } = await client
      .from('team_members')
      .upsert(
        { team_id: teamId, user_id: userId, role },
        { onConflict: 'team_id,user_id' }
      );

    if (upsertError) {
      throw new Error(`Failed to add team member: ${upsertError.message}`);
    }

    const { data, error } = await client
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Failed to add team member: ${error?.message ?? 'Unknown error'}`);
    }

    return this.toTeamMember(data as TeamMemberRow);
  }

  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.getClient()
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to verify team membership: ${error.message}`);
    }

    return Boolean(data);
  }

  async getTeamMemberRole(teamId: string, userId: string): Promise<TeamMember['role'] | null> {
    const { data, error } = await this.getClient()
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get team member role: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return (data as Pick<TeamMemberRow, 'role'>).role;
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: TeamMember['role']): Promise<void> {
    const { error } = await this.getClient()
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update team member role: ${error.message}`);
    }
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const { error } = await this.getClient()
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
  }

  async getTeamMembers(teamId: string): Promise<Array<{ id: string; userId: string; email: string; name: string; role: TeamMember['role']; createdAt: string }>> {
    const { data: members, error: membersError } = await this.getClient()
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (membersError) {
      throw new Error(`Failed to get team members: ${membersError.message}`);
    }

    const memberRows = (members as TeamMemberRow[] | null) ?? [];
    const userIds = memberRows.map((member) => member.user_id);

    if (userIds.length === 0) {
      return [];
    }

    const { data: users, error: usersError } = await this.getClient()
      .from('users')
      .select('id,email,name')
      .in('id', userIds);

    if (usersError) {
      throw new Error(`Failed to load users for team members: ${usersError.message}`);
    }

    const userMap = new Map((users as Array<Pick<UserRow, 'id' | 'email' | 'name'>> | null)?.map((user) => [user.id, user]) ?? []);

    return memberRows
      .map((member) => {
        const user = userMap.get(member.user_id);
        if (!user) return null;
        return {
          id: member.id,
          userId: member.user_id,
          email: user.email,
          name: user.name,
          role: member.role,
          createdAt: member.created_at,
        };
      })
      .filter((value): value is { id: string; userId: string; email: string; name: string; role: TeamMember['role']; createdAt: string } => Boolean(value));
  }

  // Debug Sessions
  async createDebugSession(
    teamId: string,
    createdById: string,
    title: string,
    description: string,
    code: string,
    language: string
  ): Promise<DebugSession> {
    const { data, error } = await this.getClient()
      .from('debug_sessions')
      .insert({
        team_id: teamId,
        created_by_id: createdById,
        title,
        description,
        code,
        language,
        status: 'active',
        ai_agent_results: {},
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create debug session: ${error?.message ?? 'Unknown error'}`);
    }

    const debugSession = data as DebugSessionRow;
    await this.addDebugSessionParticipant(debugSession.id, createdById);
    return this.toDebugSession(debugSession, [createdById]);
  }

  async getDebugSession(sessionId: string): Promise<DebugSession | null> {
    const { data, error } = await this.getClient()
      .from('debug_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get debug session: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const participantMap = await this.getParticipantsMap([sessionId]);
    return this.toDebugSession(data as DebugSessionRow, participantMap.get(sessionId) ?? []);
  }

  async getTeamDebugSessions(teamId: string): Promise<DebugSession[]> {
    const { data, error } = await this.getClient()
      .from('debug_sessions')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get team debug sessions: ${error.message}`);
    }

    const rows = (data as DebugSessionRow[] | null) ?? [];
    const ids = rows.map((row) => row.id);
    const participantMap = await this.getParticipantsMap(ids);

    return rows.map((row) => this.toDebugSession(row, participantMap.get(row.id) ?? []));
  }

  async updateDebugSession(sessionId: string, updates: Partial<DebugSession>): Promise<DebugSession | null> {
    const updatePayload: Record<string, unknown> = {};

    if (updates.teamId !== undefined) updatePayload.team_id = updates.teamId;
    if (updates.createdById !== undefined) updatePayload.created_by_id = updates.createdById;
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.code !== undefined) updatePayload.code = updates.code;
    if (updates.language !== undefined) updatePayload.language = updates.language;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.aiAgentResults !== undefined) updatePayload.ai_agent_results = updates.aiAgentResults;

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await this.getClient()
        .from('debug_sessions')
        .update(updatePayload)
        .eq('id', sessionId);

      if (error) {
        throw new Error(`Failed to update debug session: ${error.message}`);
      }
    }

    if (updates.participants !== undefined) {
      const uniqueParticipants = Array.from(new Set(updates.participants));
      const client = this.getClient();
      const { error: deleteError } = await client
        .from('debug_session_participants')
        .delete()
        .eq('debug_session_id', sessionId);
      if (deleteError) {
        throw new Error(`Failed to replace debug session participants: ${deleteError.message}`);
      }

      if (uniqueParticipants.length > 0) {
        const participantRows = uniqueParticipants.map((userId) => ({
          debug_session_id: sessionId,
          user_id: userId,
        }));

        const { error: insertError } = await client
          .from('debug_session_participants')
          .insert(participantRows);
        if (insertError) {
          throw new Error(`Failed to replace debug session participants: ${insertError.message}`);
        }
      }
    }

    return this.getDebugSession(sessionId);
  }

  async addDebugSessionParticipant(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.getClient()
      .from('debug_session_participants')
      .upsert(
        { debug_session_id: sessionId, user_id: userId },
        { onConflict: 'debug_session_id,user_id', ignoreDuplicates: true }
      );

    if (error) {
      throw new Error(`Failed to add debug session participant: ${error.message}`);
    }
  }

  // Pull Requests
  async createPullRequest(
    debugSessionId: string,
    teamId: string,
    title: string,
    description: string
  ): Promise<PullRequest> {
    const { data, error } = await this.getClient()
      .from('pull_requests')
      .insert({
        debug_session_id: debugSessionId,
        team_id: teamId,
        title,
        description,
        status: 'draft',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create pull request: ${error?.message ?? 'Unknown error'}`);
    }

    return this.toPullRequest(data as PullRequestRow);
  }

  async getPullRequest(prId: string): Promise<PullRequest | null> {
    const { data, error } = await this.getClient()
      .from('pull_requests')
      .select('*')
      .eq('id', prId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get pull request: ${error.message}`);
    }

    return data ? this.toPullRequest(data as PullRequestRow) : null;
  }

  async getDebugSessionPullRequests(sessionId: string): Promise<PullRequest[]> {
    const { data, error } = await this.getClient()
      .from('pull_requests')
      .select('*')
      .eq('debug_session_id', sessionId);

    if (error) {
      throw new Error(`Failed to get debug session pull requests: ${error.message}`);
    }

    return (data as PullRequestRow[] | null)?.map((row) => this.toPullRequest(row)) ?? [];
  }

  async updatePullRequest(prId: string, updates: Partial<PullRequest>): Promise<PullRequest | null> {
    const updatePayload: Record<string, unknown> = {};
    if (updates.debugSessionId !== undefined) updatePayload.debug_session_id = updates.debugSessionId;
    if (updates.teamId !== undefined) updatePayload.team_id = updates.teamId;
    if (updates.githubPrUrl !== undefined) updatePayload.github_pr_url = updates.githubPrUrl;
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.status !== undefined) updatePayload.status = updates.status;

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await this.getClient()
        .from('pull_requests')
        .update(updatePayload)
        .eq('id', prId);
      if (error) {
        throw new Error(`Failed to update pull request: ${error.message}`);
      }
    }

    return this.getPullRequest(prId);
  }

  // Audit Logs
  async createAuditLog(teamId: string, userId: string, action: string, details: Record<string, unknown>): Promise<AuditLog> {
    const { data, error } = await this.getClient()
      .from('audit_logs')
      .insert({
        team_id: teamId,
        user_id: userId,
        action,
        details,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create audit log: ${error?.message ?? 'Unknown error'}`);
    }

    return this.toAuditLog(data as AuditLogRow);
  }

  async getTeamAuditLogs(teamId: string, limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await this.getClient()
      .from('audit_logs')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get team audit logs: ${error.message}`);
    }

    const rows = (data as AuditLogRow[] | null) ?? [];
    return rows.reverse().map((row) => this.toAuditLog(row));
  }

  async createChatMessage(
    debugSessionId: string,
    role: ChatMessage['role'],
    content: string,
    userId?: string | null
  ): Promise<ChatMessage> {
    const { data, error } = await this.getClient()
      .from('chat_messages')
      .insert({
        debug_session_id: debugSessionId,
        role,
        content,
        user_id: userId ?? null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create chat message: ${error?.message ?? 'Unknown error'}`);
    }

    return this.toChatMessage(data as ChatMessageRow);
  }

  async getChatMessages(debugSessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.getClient()
      .from('chat_messages')
      .select('*')
      .eq('debug_session_id', debugSessionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get chat messages: ${error.message}`);
    }

    return ((data as ChatMessageRow[] | null) ?? []).map((row) => this.toChatMessage(row));
  }
}

export const db = new Database();
export type { User, Team, TeamMember, Session, DebugSession, PullRequest, AuditLog, ChatMessage };
