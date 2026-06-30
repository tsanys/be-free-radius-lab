#!/usr/bin/env bash

phase_postgres_setup() {
  local db_pass=$1
  local db_user="rapid"

  log_step "Phase 2: PostgreSQL Setup"

  log_info "Ensuring PostgreSQL is running..."
  sudo systemctl enable postgresql &>/dev/null
  sudo systemctl start postgresql
  sleep 2

  log_info "Creating database user '${db_user}'..."
  local user_exists
  user_exists=$(run_as_postgres "SELECT 1 FROM pg_roles WHERE rolname='${db_user}'")
  if [ -z "$user_exists" ]; then
    sudo -u postgres psql -c "CREATE USER ${db_user} WITH ENCRYPTED PASSWORD '${db_pass}';" &>/dev/null
    log_info "User '${db_user}' created"
  else
    sudo -u postgres psql -c "ALTER USER ${db_user} WITH ENCRYPTED PASSWORD '${db_pass}';" &>/dev/null
    log_info "User '${db_user}' already exists, password updated"
  fi

  log_info "Creating databases..."
  for db in radius rapid_radius; do
    local db_exists
    db_exists=$(run_as_postgres "SELECT 1 FROM pg_database WHERE datname='${db}'")
    if [ -z "$db_exists" ]; then
      sudo -u postgres psql -c "CREATE DATABASE ${db} OWNER ${db_user};" &>/dev/null
      log_info "Database '${db}' created"
    else
      log_info "Database '${db}' already exists"
    fi
  done

  log_info "Granting privileges..."
  for db in radius rapid_radius; do
    sudo -u postgres psql -d "$db" -c "
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${db_user};
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${db_user};
      GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ${db_user};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${db_user};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ${db_user};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO ${db_user};
    " &>/dev/null
  done

  log_info "Configuring pg_hba.conf..."
  local pg_hba
  pg_hba=$(sudo -u postgres psql -tA -c "SHOW hba_file;" 2>/dev/null | tr -d ' ')
  if [ -n "$pg_hba" ]; then
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    sudo cp "$script_dir/templates/postgres/pg_hba.conf" "$pg_hba"
    log_info "pg_hba.conf copied to ${pg_hba}"
  else
    log_warn "Could not locate pg_hba.conf, skipping..."
  fi

  log_info "Restarting PostgreSQL..."
  sudo systemctl restart postgresql
  sleep 2

  log_info "Importing FreeRADIUS schema into 'radius' database..."
  local schema_path="/etc/freeradius/3.0/mods-config/sql/main/postgresql/schema.sql"
  if [ -f "$schema_path" ]; then
    PGPASSWORD="${db_pass}" psql -h 127.0.0.1 -U "${db_user}" -d radius -f "$schema_path" &>/dev/null
    log_info "FreeRADIUS schema imported successfully"
  else
    log_warn "Schema file not found at ${schema_path}. You may need to import manually."
  fi
}

phase_postgres_verify() {
  local db_pass=$1
  local db_user="rapid"

  log_info "Verifying PostgreSQL connection..."
  if PGPASSWORD="${db_pass}" psql -h 127.0.0.1 -U "${db_user}" -d radius -c "SELECT 1;" &>/dev/null; then
    log_info "PostgreSQL connection OK"
    return 0
  else
    log_error "PostgreSQL connection FAILED"
    return 1
  fi
}
