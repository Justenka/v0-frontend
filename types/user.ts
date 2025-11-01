export type UserRole = "admin" | "member" | "guest"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  friends: string[] // Array of user IDs
}

export interface AuthUser extends User {
  // Mock authentication - In production, this would include:
  // - JWT tokens
  // - Session data
  // - OAuth provider info (Google, etc.)
  isAuthenticated: boolean
}

export interface GroupPermission {
  groupId: string
  userId: string
  role: UserRole
}

// For real implementation with Supabase:
/*
-- Users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  avatar text,
  created_at timestamp with time zone default now()
);

-- Group permissions table
create table group_permissions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('admin', 'member', 'guest')),
  created_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

-- Friends table
create table friendships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  friend_id uuid references users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default now(),
  unique(user_id, friend_id)
);
*/
