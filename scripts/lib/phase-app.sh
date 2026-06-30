#!/usr/bin/env bash

phase_app_setup() {
  local site_name=$1
  local db_pass=$2
  local mq_host=$3
  local mq_user=$4
  local mq_pass=$5
  local app_port=$6
  local app_secret=$7
  local git_repo=$8
  local git_branch=$9

  log_step "Phase 4: Node.js Application Setup"

  local app_dir="${HOME}/${site_name}"

  log_info "Creating application directory: ${app_dir}"
  mkdir -p "$app_dir"

  if [ -d "${app_dir}/be-free-radius-system" ]; then
    log_info "Repository already cloned, pulling latest..."
    cd "${app_dir}/be-free-radius-system"
    git checkout "$git_branch" 2>/dev/null || true
    git pull origin "$git_branch" 2>/dev/null || log_warn "git pull failed"
  else
    log_info "Cloning repository ${git_repo} (branch: ${git_branch})..."
    cd "$app_dir"
    git clone "$git_repo" 2>&1 | tail -1 || log_fatal "git clone failed"
    cd "${app_dir}/be-free-radius-system"
    git checkout "$git_branch" 2>/dev/null || log_warn "Branch '${git_branch}' not found, using default"
  fi

  log_info "Generating config.yaml..."
  local config_tpl="${app_dir}/be-free-radius-system/templates/config.yaml.tpl"
  local config_out="${app_dir}/be-free-radius-system/config.yaml"

  if [ -f "$config_tpl" ]; then
    sed \
      -e "s/{{APP_PORT}}/${app_port}/g" \
      -e "s/{{SITE_NAME}}/${site_name}/g" \
      -e "s/{{APP_SECRET}}/${app_secret}/g" \
      -e "s/{{DB_PASSWORD}}/${db_pass}/g" \
      -e "s/{{MQ_USER}}/${mq_user}/g" \
      -e "s/{{MQ_PASS}}/${mq_pass}/g" \
      -e "s/{{MQ_HOST}}/${mq_host}/g" \
      "$config_tpl" > "$config_out"
    log_info "config.yaml generated"
  else
    log_fatal "Template not found: ${config_tpl}"
  fi

  log_info "Installing npm dependencies..."
  cd "${app_dir}/be-free-radius-system"
  npm install 2>&1 | tail -1 || log_fatal "npm install failed"

  log_info "Building TypeScript..."
  npm run build 2>&1 | tail -1 || log_fatal "npm run build failed"

  log_info "Configuring PM2 logrotate..."
  pm2 install pm2-logrotate 2>/dev/null || true
  pm2 set pm2-logrotate:rotateInterval '0 0 * * *' 2>/dev/null || true
  pm2 set pm2-logrotate:max_size 10M 2>/dev/null || true
  pm2 set pm2-logrotate:retain 30 2>/dev/null || true
  pm2 set pm2-logrotate:compress true 2>/dev/null || true

  log_info "Starting application with PM2..."
  if [ -f "ecosystem.config.js" ]; then
    pm2 delete ecosystem.config.js 2>/dev/null || true
    pm2 start ecosystem.config.js --env production 2>&1 | tail -3
  else
    log_warn "ecosystem.config.js not found, starting main.js directly..."
    pm2 delete be-free-radius-system 2>/dev/null || true
    pm2 start dist/cmd/web/main.js --name be-free-radius-system 2>&1 | tail -3
  fi

  pm2 save 2>/dev/null || true

  log_info "Setting up PM2 startup..."
  pm2 startup systemd -u "$(whoami)" --hp "${HOME}" 2>/dev/null | sudo bash 2>/dev/null || true

  log_info "Application deployed successfully"
}

phase_app_verify() {
  local site_name=$1
  local app_port=$2
  local app_dir="${HOME}/${site_name}/be-free-radius-system"

  log_info "Verifying application..."

  if [ -f "${app_dir}/config.yaml" ]; then
    log_info "config.yaml: present"
  else
    log_warn "config.yaml: MISSING"
  fi

  if [ -d "${app_dir}/dist" ]; then
    log_info "dist directory: present (build OK)"
  else
    log_warn "dist directory: MISSING (build may have failed)"
  fi

  local pm2_status
  pm2_status=$(pm2 list 2>/dev/null | grep -c "online" || true)
  if [ "$pm2_status" -gt 0 ]; then
    log_info "PM2: application(s) online"
  else
    log_warn "PM2: no application running"
  fi

  if command -v curl &>/dev/null; then
    local health
    health=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${app_port}/health" 2>/dev/null || echo "000")
    if [ "$health" = "200" ]; then
      log_info "Health check: OK (HTTP ${health})"
    else
      log_warn "Health check: HTTP ${health}"
    fi
  fi
}
