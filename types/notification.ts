export type NotificationType =
  | "group_invite"
  | "friend_request"
  | "payment_received"
  | "payment_reminder"
  | "new_expense"
  | "group_message"
  | "personal_message"
  | "system"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  timestamp: Date
  actionUrl?: string
  metadata?: Record<string, any>
}

// For real implementation with Supabase:
/*
-- Notifications table
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean default false,
  action_url text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table notifications enable row level security;

-- RLS Policy
create policy "Users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());
*/
