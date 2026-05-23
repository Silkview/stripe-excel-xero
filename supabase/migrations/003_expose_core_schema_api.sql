-- Expose core schema via PostgREST (Data API) and grant API roles access.
GRANT USAGE ON SCHEMA core TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA core TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA core TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA core TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA core
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA core
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA core
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, core';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
