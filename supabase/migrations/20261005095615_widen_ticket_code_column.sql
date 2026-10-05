-- Older PAPI ticket codes used PAPI-1234. The secure format is longer:
-- PAPI-XXXXXXXXXX. Convert restrictive varchar columns safely to text.
alter table public.participants
  alter column unique_code type text,
  alter column phone_number type text,
  alter column full_name type text;
