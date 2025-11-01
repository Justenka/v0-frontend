export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  read: boolean
}

export interface GroupMessage extends Message {
  groupId: string
}

export interface PersonalMessage extends Message {
  recipientId: string
}

// For real implementation with Supabase:
/*
-- Group messages table
create table group_messages (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Personal messages table
create table personal_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references users(id) on delete cascade,
  recipient_id uuid references users(id) on delete cascade,
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table group_messages enable row level security;
alter table personal_messages enable row level security;

-- RLS Policies for group messages
create policy "Users can view messages in their groups"
  on group_messages for select
  using (
    exists (
      select 1 from group_permissions
      where group_id = group_messages.group_id
      and user_id = auth.uid()
    )
  );

-- RLS Policies for personal messages
create policy "Users can view their own messages"
  on personal_messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());
*/
