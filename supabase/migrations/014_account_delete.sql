-- درع Phase 3: Account deletion function (PDPL right-to-erase)
--
-- CRITICAL: This function is irreversible. It permanently deletes ALL data
-- associated with a user across all workspaces they own.
--
-- Process:
-- 1. User signs in and requests account deletion
-- 2. API validates they control the email address
-- 3. API calls this function via service-role (RLS bypassed)
-- 4. Function cascades deletes: workspaces → companies → all detail tables
-- 5. Supabase Auth also deletes the user record
--
-- Compliance: PDPL Article 25 (right to erase)

create or replace function public.delete_user_completely(target_user_id uuid)
returns void as $$
declare
  workspace_record uuid;
begin
  -- Verify the function is called with proper privileges (service role)
  if auth.role() is null then
    raise exception 'delete_user_completely requires authentication';
  end if;

  -- Only the user themselves or service role can delete their data
  -- (service role bypasses auth checks in trigger, so we check here)
  if auth.role() = 'authenticated' and auth.uid() <> target_user_id then
    raise exception 'Cannot delete another user account';
  end if;

  -- Delete all workspaces owned by the user (ON DELETE CASCADE handles contents)
  delete from public.workspaces where owner_user_id = target_user_id;

  -- Delete all workspace memberships for the user
  delete from public.workspace_members where user_id = target_user_id;

  -- Delete chat sessions
  delete from public.chat_sessions where user_id = target_user_id;

  -- Audit the deletion
  insert into public.audit_logs (workspace_id, user_id, action, resource_type, resource_id)
  select gen_random_uuid(), target_user_id, 'account.deleted', 'user', target_user_id
  on conflict do nothing; -- May fail if workspace already deleted

exception when others then
  raise exception 'Failed to delete user data: %', sqlerrm;
end;
$$ language plpgsql security definer;

-- Grant execute to authenticated users (they can only delete themselves)
grant execute on function public.delete_user_completely(uuid) to authenticated;

-- Grant execute to service role for admin cleanup
grant execute on function public.delete_user_completely(uuid) to service_role;
