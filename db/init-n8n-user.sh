#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create n8n role for workflow engine
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${N8N_DB_POSTGRESDB_USER:-n8n_user}') THEN
            CREATE ROLE ${N8N_DB_POSTGRESDB_USER:-n8n_user} WITH LOGIN PASSWORD '${N8N_DB_POSTGRESDB_PASSWORD:-n8n_password}';
        END IF;
    END
    \$\$;

    -- Create n8n schema and grant access
    CREATE SCHEMA IF NOT EXISTS n8n;
    GRANT ALL PRIVILEGES ON SCHEMA n8n TO ${N8N_DB_POSTGRESDB_USER:-n8n_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA n8n GRANT ALL ON TABLES TO ${N8N_DB_POSTGRESDB_USER:-n8n_user};
    ALTER DEFAULT PRIVILEGES IN SCHEMA n8n GRANT ALL ON SEQUENCES TO ${N8N_DB_POSTGRESDB_USER:-n8n_user};

    -- Create metabase database for Metabase app state
    SELECT 'CREATE DATABASE metabase'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'metabase');
EOSQL

# Actually create the metabase DB (SELECT trick above doesn't execute CREATE)
psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE metabase;
EOSQL

# Grant the main user access to metabase DB
psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "metabase" <<-EOSQL
    GRANT ALL PRIVILEGES ON DATABASE metabase TO ${POSTGRES_USER};
EOSQL

echo "n8n user and metabase database initialized."
