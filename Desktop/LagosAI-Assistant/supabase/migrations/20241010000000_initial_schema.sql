-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    user_type text not null check (user_type in ('business', 'individual')),
    phone text,
    whatsapp_number text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create agents table
create table public.agents (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    tone_style jsonb,
    whatsapp_number text,
    preferences jsonb,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    agent_id uuid references public.agents(id) on delete cascade not null,
    direction text not null check (direction in ('inbound', 'outbound')),
    content text,
    media_type text check (media_type in ('text', 'image', 'document', 'voice', 'video')),
    media_url text,
    whatsapp_message_id text,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    status text default 'sent' check (status in ('sent', 'delivered', 'read', 'failed'))
);

-- Create training_data table
create table public.training_data (
    id uuid default uuid_generate_v4() primary key,
    agent_id uuid references public.agents(id) on delete cascade not null,
    type text not null check (type in ('chat_sample', 'faq', 'product_list', 'company_info')),
    content jsonb,
    file_path text,
    processed boolean default false not null,
    uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create market_data table
create table public.market_data (
    id uuid default uuid_generate_v4() primary key,
    item text not null,
    price decimal not null,
    currency text default 'NGN' not null,
    source text not null,
    location text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index profiles_user_type_idx on public.profiles(user_type);
create index agents_user_id_idx on public.agents(user_id);
create index agents_is_active_idx on public.agents(is_active);
create index messages_agent_id_idx on public.messages(agent_id, timestamp);
create index messages_direction_idx on public.messages(direction);
create index training_data_agent_id_idx on public.training_data(agent_id, type);
create index market_data_item_updated_at_idx on public.market_data(item, updated_at desc);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.messages enable row level security;
alter table public.training_data enable row level security;
alter table public.market_data enable row level security;

-- Create RLS policies
create policy "Users can view own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
    for insert with check (auth.uid() = id);

create policy "Users can view own agents" on public.agents
    for select using (
        auth.uid() in (
            select user_id from public.profiles where id = agents.user_id
        )
    );

create policy "Users can insert own agents" on public.agents
    for insert with check (
        auth.uid() in (
            select id from public.profiles where id = agents.user_id
        )
    );

create policy "Users can update own agents" on public.agents
    for update using (
        auth.uid() in (
            select user_id from public.profiles where id = agents.user_id
        )
    );

create policy "Users can delete own agents" on public.agents
    for delete using (
        auth.uid() in (
            select user_id from public.profiles where id = agents.user_id
        )
    );

create policy "Users can view messages for own agents" on public.messages
    for select using (
        auth.uid() in (
            select p.id from public.profiles p
            join public.agents a on a.user_id = p.id
            where a.id = messages.agent_id
        )
    );

create policy "Users can insert messages for own agents" on public.messages
    for insert with check (
        auth.uid() in (
            select p.id from public.profiles p
            join public.agents a on a.user_id = p.id
            where a.id = messages.agent_id
        )
    );

create policy "Users can view training data for own agents" on public.training_data
    for select using (
        auth.uid() in (
            select p.id from public.profiles p
            join public.agents a on a.user_id = p.id
            where a.id = training_data.agent_id
        )
    );

create policy "Users can insert training data for own agents" on public.training_data
    for insert with check (
        auth.uid() in (
            select p.id from public.profiles p
            join public.agents a on a.user_id = p.id
            where a.id = training_data.agent_id
        )
    );

create policy "Users can update training data for own agents" on public.training_data
    for update using (
        auth.uid() in (
            select p.id from public.profiles p
            join public.agents a on a.user_id = p.id
            where a.id = training_data.agent_id
        )
    );

create policy "Users can delete training data for own agents" on public.training_data
    for delete using (
        auth.uid() in (
            select p.id from public.profiles p
            join public.agents a on a.user_id = p.id
            where a.id = training_data.agent_id
        )
    );

create policy "Public read access for market data" on public.market_data
    for select using (true);

create policy "Service role can insert/update market data" on public.market_data
    for all using (auth.role() = 'service_role');

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at_profiles
    before update on public.profiles
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_agents
    before update on public.agents
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_market_data
    before update on public.market_data
    for each row execute procedure public.handle_updated_at();