# Supabase deployment

1. In the Supabase dashboard, open **SQL Editor** and run the migration in `migrations/`.
2. Create one email/password user for the raffle operator in **Authentication → Users → Add user**. Use a strong, unique password.
3. In SQL Editor, whitelist that email:

   ```sql
   insert into public.raffle_admins (email)
   values ('admin@example.com')
   on conflict (email) do nothing;
   ```

   Replace `admin@example.com` with the exact email for the operator, in lowercase.
4. Deploy the updated app. Then test one registration, one duplicate registration, a raffle login, and logging in with a non-admin account.

The migration intentionally does not grant public read access to participant data. The public registration page can only call `register_participant`; the raffle page requires a signed-in, whitelisted admin account.
