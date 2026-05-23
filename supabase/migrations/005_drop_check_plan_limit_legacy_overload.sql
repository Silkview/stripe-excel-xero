-- PostgREST/supabase-js calls check_plan_limit with two args; the legacy overload
-- (user/workspace only) shadowed the three-arg function and blocked stripe/xero.
drop function if exists core.check_plan_limit(uuid, text);
