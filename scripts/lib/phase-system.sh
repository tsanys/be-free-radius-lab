#!/usr/bin/env bash

phase_system_install() {
  log_step "Phase 1: Installing System Packages"

  log_info "Updating package lists..."
  sudo apt update -qq || log_fatal "apt update failed"

  log_info "Installing PostgreSQL 14..."
  sudo apt install -y -qq postgresql postgresql-contrib libpq-dev 2>&1 | tail -1 || log_fatal "Failed to install PostgreSQL"

  log_info "Installing FreeRADIUS 3.0 with SQL and REST modules..."
  sudo apt install -y -qq freeradius freeradius-postgresql freeradius-rest 2>&1 | tail -1 || log_fatal "Failed to install FreeRADIUS"

  log_info "Installing SNMP..."
  sudo apt install -y -qq snmp snmpd 2>&1 | tail -1 || log_fatal "Failed to install SNMP"

  log_info "Installing Git, Node.js 20.x..."
  if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - &>/dev/null
    sudo apt install -y -qq nodejs 2>&1 | tail -1 || log_fatal "Failed to install Node.js"
  else
    log_info "Node.js already installed: $(node -v)"
  fi

  if ! command -v pm2 &>/dev/null; then
    log_info "Installing PM2 globally..."
    sudo npm install -g pm2 2>&1 | tail -1 || log_fatal "Failed to install PM2"
  else
    log_info "PM2 already installed: $(pm2 -v)"
  fi

  if ! command -v git &>/dev/null; then
    sudo apt install -y -qq git 2>&1 | tail -1
  fi

  log_info "System packages installed successfully"
}

phase_system_verify() {
  local packages=("psql" "pg_config" "radiusd" "node" "npm" "pm2" "git")
  local missing=()

  for pkg in "${packages[@]}"; do
    if ! command -v "$pkg" &>/dev/null; then
      missing+=("$pkg")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    log_warn "Missing commands: ${missing[*]}"
    return 1
  fi

  log_info "PostgreSQL:  $(psql --version | head -1)"
  log_info "PostgreSQL:  $(pg_config --version)"
  log_info "FreeRADIUS:  $(radiusd -v 2>&1 | head -1)"
  log_info "Node.js:     $(node -v)"
  log_info "NPM:         $(npm -v)"
  log_info "PM2:         $(pm2 -v)"
  log_info "Git:         $(git --version)"

  return 0
}
