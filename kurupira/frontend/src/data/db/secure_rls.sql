-- 🔒 SECURE RLS POLICIES 🔒

-- 1. Drop the unsafe permissive policies
drop policy if exists "Enable insert for all users" on public.inverters;
drop policy if exists "Enable update for all users" on public.inverters;
drop policy if exists "Enable insert for all users" on public.modules;
drop policy if exists "Enable update for all users" on public.modules;

-- 2. Create "Public Read Only" policies
create policy "Public Read Access" 
on public.inverters 
for select 
using (true);

create policy "Public Read Access" 
on public.modules 
for select 
using (true);

-- 3. Note: Writes will now be BLOCKED for the 'Anon' key.
-- To write data, the application (Scraper) must use the SERVICE_ROLE_KEY.
