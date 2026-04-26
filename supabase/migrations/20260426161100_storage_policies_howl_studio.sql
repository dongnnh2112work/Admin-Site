-- Ensure storage policies exist for bucket: "Howl Studio"
-- This migration is idempotent and safe to re-run.

-- Read policies
drop policy if exists "howl_studio_public_read_v2" on storage.objects;

create policy "howl_studio_public_read_v2"
on storage.objects
for select
to public
using (bucket_id = 'Howl Studio');

-- Write policies for signed-in users
drop policy if exists "howl_studio_auth_insert_v2" on storage.objects;
drop policy if exists "howl_studio_auth_update_v2" on storage.objects;
drop policy if exists "howl_studio_auth_delete_v2" on storage.objects;

create policy "howl_studio_auth_insert_v2"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'Howl Studio');

create policy "howl_studio_auth_update_v2"
on storage.objects
for update
to authenticated
using (bucket_id = 'Howl Studio')
with check (bucket_id = 'Howl Studio');

create policy "howl_studio_auth_delete_v2"
on storage.objects
for delete
to authenticated
using (bucket_id = 'Howl Studio');
