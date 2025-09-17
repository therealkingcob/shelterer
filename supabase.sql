create table shelters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  capacity int not null,
  available_beds int not null,
  updated_at timestamptz default now()
);

create table alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table shelters;
alter publication supabase_realtime add table alerts;
