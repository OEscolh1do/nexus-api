-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR ⚠️

-- Diagnosis: The Scraper uses the 'Anon Key', but the table only allowed 'Read' access.
-- Fix: Explicitly allow Insert/Update for the 'inverters' table.

create policy "Enable insert for all users" 
on public.inverters 
for insert 
with check (true);

create policy "Enable update for all users" 
on public.inverters 
for update 
using (true);

-- Repeat for modules if needed later
create policy "Enable insert for all users" 
on public.modules 
for insert 
with check (true);

create policy "Enable update for all users" 
on public.modules 
for update 
using (true);
