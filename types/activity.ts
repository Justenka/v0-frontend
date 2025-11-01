export type ActivityType =
  | "group_created"
  | "member_added"
  | "member_removed"
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "payment_registered"
  | "settlement"
  | "permission_changed"

export interface Activity {
  id: string
  groupId?: string
  userId: string
  userName: string
  type: ActivityType
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

// For real implementation with Supabase:
/*
-- Activity log table
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  type text not null,
  description text not null,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table activity_log enable row level security;

-- RLS Policy
create policy "Users can view activity in their groups"
  on activity_log for select
  using (
    group_id is null or
    exists (
      select 1 from group_permissions
      where group_id = activity_log.group_id
      and user_id = auth.uid()
    )
  );

-- Create index for performance
create index activity_log_group_id_idx on activity_log(group_id);
create index activity_log_created_at_idx on activity_log(created_at desc);
*/
