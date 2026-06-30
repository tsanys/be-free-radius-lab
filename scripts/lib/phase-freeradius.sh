#!/usr/bin/env bash

FREERADIUS_PATH=$(sudo find /etc/freeradius -maxdepth 1 -type d -name "3.*" 2>/dev/null | head -1 || echo "/etc/freeradius/3.0")

phase_freeradius_setup() {
  local db_pass=$1
  local app_port=$2

  log_step "Phase 3: FreeRADIUS Configuration"

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

  log_info "Ensuring FreeRADIUS is stopped during configuration..."
  sudo systemctl stop freeradius 2>/dev/null || true

  log_info "Configuring SQL module..."
  if [ -f "$script_dir/templates/freeradius/mods-available/sql" ]; then
    local sql_tmp
    sql_tmp=$(mktemp)
    sed -e "s/{{DB_PASSWORD}}/${db_pass}/g" \
      "$script_dir/templates/freeradius/mods-available/sql" >"$sql_tmp"
    sudo cp "$sql_tmp" "${FREERADIUS_PATH}/mods-available/sql"
    sudo chown freerad:freerad "${FREERADIUS_PATH}/mods-available/sql"
    sudo chmod 640 "${FREERADIUS_PATH}/mods-available/sql"
    rm -f "$sql_tmp"
    log_info "SQL module configured"
  else
    log_warn "SQL template not found, skipping..."
  fi

  log_info "Configuring REST module..."
  if [ -f "$script_dir/templates/freeradius/mods-available/rest" ]; then
    local rest_tmp
    rest_tmp=$(mktemp)
    sed -e "s/{{APP_PORT}}/${app_port}/g" \
      "$script_dir/templates/freeradius/mods-available/rest" >"$rest_tmp"
    sudo cp "$rest_tmp" "${FREERADIUS_PATH}/mods-available/rest"
    sudo chown freerad:freerad "${FREERADIUS_PATH}/mods-available/rest"
    sudo chmod 640 "${FREERADIUS_PATH}/mods-available/rest"
    rm -f "$rest_tmp"
    log_info "REST module configured"
  else
    log_warn "REST template not found, skipping..."
  fi

  log_info "Enabling SQL module symlink..."
  if [ ! -L "${FREERADIUS_PATH}/mods-enabled/sql" ]; then
    sudo ln -sf "${FREERADIUS_PATH}/mods-available/sql" "${FREERADIUS_PATH}/mods-enabled/sql"
    log_info "SQL module enabled"
  else
    log_info "SQL module already enabled"
  fi

  log_info "Enabling REST module symlink..."
  if [ ! -L "${FREERADIUS_PATH}/mods-enabled/rest" ]; then
    sudo ln -sf "${FREERADIUS_PATH}/mods-available/rest" "${FREERADIUS_PATH}/mods-enabled/rest"
    log_info "REST module enabled"
  else
    log_info "REST module already enabled"
  fi

  log_info "Configuring default site..."
  if [ -f "$script_dir/templates/freeradius/sites-available/default" ]; then
    sudo cp "$script_dir/templates/freeradius/sites-available/default" \
      "${FREERADIUS_PATH}/sites-available/default"
    sudo chown freerad:freerad "${FREERADIUS_PATH}/sites-available/default"
    sudo chmod 640 "${FREERADIUS_PATH}/sites-available/default"
    log_info "Default site configured"
  else
    log_warn "Default site template not found, skipping..."
  fi

  log_info "Starting FreeRADIUS..."
  sudo systemctl enable freeradius 2>/dev/null || true
  sudo systemctl start freeradius
  sleep 2

  if service_running freeradius; then
    log_info "FreeRADIUS is running"
  else
    log_warn "FreeRADIUS may have failed to start. Check with: sudo systemctl status freeradius"
  fi
}

phase_freeradius_verify() {
  log_info "Verifying FreeRADIUS configuration..."
  if service_running freeradius; then
    log_info "FreeRADIUS is running"
  else
    log_warn "FreeRADIUS is NOT running"
  fi

  if [ -L "${FREERADIUS_PATH}/mods-enabled/sql" ]; then
    log_info "SQL module: enabled"
  else
    log_warn "SQL module: NOT enabled"
  fi

  if [ -L "${FREERADIUS_PATH}/mods-enabled/rest" ]; then
    log_info "REST module: enabled"
  else
    log_warn "REST module: NOT enabled"
  fi
}
