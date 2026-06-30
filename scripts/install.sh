#!/usr/bin/env bash
set -euo pipefail

# be-free-radius-lab  —  One-command interactive installer (self-contained)
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/tsanys/be-free-radius-lab/main/scripts/install.sh)

NC='\033[0m'; RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'

log_info()  { printf "${GREEN}[INFO]${NC}  %s\n" "$*" >&2; }
log_warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$*" >&2; }
log_error() { printf "${RED}[ERROR]${NC} %s\n" "$*" >&2; }
log_step()  { printf "\n${BLUE}==>${NC} ${CYAN}%s${NC}\n" "$*" >&2; }
log_fatal() { log_error "$*"; exit 1; }

prompt_input()   { local v=$1 m=$2 d=$3; read -rp "$(printf "${CYAN}?${NC} %s [${GREEN}%s${NC}]: " "$m" "$d")" v < /dev/tty; v=${v:-$d}; eval "$1=\$v"; }
prompt_secret()  { local v=$1 m=$2 d=$3; read -rsp "$(printf "${CYAN}?${NC} %s [${GREEN}****${NC}]: " "$m")" v < /dev/tty; echo; v=${v:-$d}; eval "$1=\$v"; }
prompt_confirm() { local m=$1 d=${2:-Y} y; read -rp "$(printf "${CYAN}?${NC} %s [${GREEN}%s${NC}]/%s: " "$m" "$d" "$([ "$d" = "Y" ] && echo "n" || echo "N")")" y < /dev/tty; case "$y" in [Yy]*) return 0;; [Nn]*) return 1;; *) [ "$d" = "Y" ]; esac }

check_command()  { command -v "$1" &>/dev/null || log_fatal "'$1' is required but not installed."; }
generate_secret() { openssl rand -hex 16 2>/dev/null || date +%s | md5sum 2>/dev/null | head -c 32; }
service_running() { systemctl is-active --quiet "$1" 2>/dev/null; }
run_as_postgres() { sudo -u postgres psql -tA -c "$1" 2>/dev/null || true; }

export DEBIAN_FRONTEND=noninteractive
sudo_ne() { sudo < /dev/null "$@"; }

DEFAULT_DB_PASS="1CvjrzbcDuiCRLXzepzfGy55qVKdqmUbeM580wFLF8vp8"
DEFAULT_MQ_USER="rapid"; DEFAULT_APP_PORT="8004"
DEFAULT_GIT_REPO="https://github.com/tsanys/be-free-radius-lab.git"
DEFAULT_GIT_BRANCH="main"

SITE_NAME=""; DB_PASS=""; MQ_HOST=""; MQ_USER=""; MQ_PASS=""
APP_PORT=""; APP_SECRET=""; GIT_REPO=""; GIT_BRANCH=""
SKIP_CODE_SERVER=false; NON_INTERACTIVE=false

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --site) SITE_NAME="$2"; shift 2 ;; --db-pass) DB_PASS="$2"; shift 2 ;;
      --mq-host) MQ_HOST="$2"; shift 2 ;; --mq-user) MQ_USER="$2"; shift 2 ;;
      --mq-pass) MQ_PASS="$2"; shift 2 ;; --app-port) APP_PORT="$2"; shift 2 ;;
      --app-secret) APP_SECRET="$2"; shift 2 ;; --git-repo) GIT_REPO="$2"; shift 2 ;;
      --git-branch) GIT_BRANCH="$2"; shift 2 ;;
      --skip-code-server) SKIP_CODE_SERVER=true; shift ;;
      --non-interactive) NON_INTERACTIVE=true; shift ;;
      --help) cat <<'HELP'; exit 0
Usage: install.sh [OPTIONS]

One-command installer for be-free-radius-lab (FreeRADIUS + Node.js app).

Options:
  --site NAME          Site name (e.g. wanasaribrebes)   [required]
  --db-pass PASS       PostgreSQL password for user 'rapid'  [default: global]
  --mq-host HOST       RabbitMQ server hostname/IP        [required]
  --mq-user USER       RabbitMQ username                  [default: rapid]
  --mq-pass PASS       RabbitMQ password                  [required]
  --app-port PORT      Node.js app port                   [default: 8004]
  --app-secret SECRET  App secret key                     [auto-generated]
  --git-repo URL       Git repository URL
  --git-branch BRANCH  Git branch                         [default: main]
  --skip-code-server   Skip code-server installation
  --non-interactive    Run without prompts (all vars must be provided)
  --help               Show this help message

Examples:
  bash <(curl -fsSL https://raw.githubusercontent.com/tsanys/be-free-radius-lab/main/scripts/install.sh)
  bash <(curl -fsSL https://raw.githubusercontent.com/tsanys/be-free-radius-lab/main/scripts/install.sh) --site wanasaribrebes --mq-host 10.0.0.1 --mq-pass sekret --non-interactive
HELP
        exit 0 ;;
      *) log_fatal "Unknown argument: $1";;
    esac
  done
}

validate_non_interactive() {
  local missing=()
  [ -z "$SITE_NAME" ] && missing+=("--site"); [ -z "$MQ_HOST" ] && missing+=("--mq-host"); [ -z "$MQ_PASS" ] && missing+=("--mq-pass")
  [ ${#missing[@]} -gt 0 ] && log_fatal "Non-interactive mode requires: ${missing[*]}"
  return 0
}

prompt_all() {
  echo; echo "╔══════════════════════════════════════════════════════╗"; echo "║   🚀 FreeRADIUS System - Interactive Installer      ║"; echo "╚══════════════════════════════════════════════════════╝"; echo
  while [ -z "$SITE_NAME" ]; do read -rp "$(printf "${CYAN}?${NC} %s: " "Site name (e.g. wanasaribrebes)")" SITE_NAME < /dev/tty; done
  SITE_NAME=$(echo "$SITE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
  prompt_input APP_PORT "Application port" "$DEFAULT_APP_PORT"
  prompt_secret DB_PASS "PostgreSQL password for user 'rapid'" "$DEFAULT_DB_PASS"
  [ -z "$APP_SECRET" ] && APP_SECRET=$(generate_secret)
  echo; echo "── RabbitMQ Configuration ──"
  while [ -z "$MQ_HOST" ]; do read -rp "$(printf "${CYAN}?${NC} %s: " "RabbitMQ server host")" MQ_HOST < /dev/tty; done
  prompt_input MQ_USER "RabbitMQ username" "$DEFAULT_MQ_USER"
  while [ -z "$MQ_PASS" ]; do prompt_secret MQ_PASS "RabbitMQ password" ""; done
  echo; echo "── Git Configuration ──"
  prompt_input GIT_REPO "Git repository URL" "$DEFAULT_GIT_REPO"
  prompt_input GIT_BRANCH "Git branch" "$DEFAULT_GIT_BRANCH"
  echo; prompt_confirm "Install code-server (VS Code in browser)?" "N" || SKIP_CODE_SERVER=true
  echo; echo "══════════════════════════════════════════════════════"
  echo " Site: ${SITE_NAME} | Port: ${APP_PORT} | RabbitMQ: ${MQ_USER}@${MQ_HOST} | Branch: ${GIT_BRANCH}"
  echo "══════════════════════════════════════════════════════"; echo
  prompt_confirm "Proceed with installation?" "Y" || { log_info "Cancelled."; exit 0; }
}

phase_system_install() {
  log_step "Phase 1: Installing System Packages"
  echo "   Updating package lists (this may take a minute)..." >&2
  sudo_ne apt update || log_fatal "apt update failed"
  echo "   Installing PostgreSQL..." >&2
  sudo_ne apt install -y postgresql postgresql-contrib libpq-dev || log_fatal "PostgreSQL install failed"
  echo "   Installing FreeRADIUS with SQL and REST modules..." >&2
  sudo_ne apt install -y freeradius freeradius-postgresql freeradius-rest || log_fatal "FreeRADIUS install failed"
  echo "   Installing SNMP..." >&2
  sudo_ne apt install -y snmp snmpd || true
  if ! command -v node &>/dev/null; then
    echo "   Installing Node.js 20.x..." >&2
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - || log_fatal "NodeSource setup failed"
    sudo_ne apt install -y nodejs || log_fatal "Node.js install failed"
  fi
  if ! command -v pm2 &>/dev/null; then
    echo "   Installing PM2..." >&2
    sudo_ne npm install -g pm2 || true
  fi
  if ! command -v git &>/dev/null; then sudo_ne apt install -y git || true; fi
  log_info "System packages installed"
}

phase_system_verify() {
  log_info "PostgreSQL: $(psql --version 2>/dev/null | head -1)"
  log_info "FreeRADIUS: $(radiusd -v 2>&1 | head -1)"
  log_info "Node.js: $(node -v 2>/dev/null) | PM2: $(pm2 -v 2>/dev/null) | Git: $(git --version 2>/dev/null)"
}

phase_postgres_setup() {
  local db_pass=$1 db_user="rapid"
  log_step "Phase 2: PostgreSQL Setup"
  sudo systemctl enable postgresql &>/dev/null; sudo systemctl start postgresql; sleep 2
  local exists; exists=$(run_as_postgres "SELECT 1 FROM pg_roles WHERE rolname='${db_user}'")
  if [ -z "$exists" ]; then sudo -u postgres psql -c "CREATE USER ${db_user} WITH ENCRYPTED PASSWORD '${db_pass}';" &>/dev/null; log_info "User '${db_user}' created"
  else sudo -u postgres psql -c "ALTER USER ${db_user} WITH ENCRYPTED PASSWORD '${db_pass}';" &>/dev/null; log_info "User '${db_user}' password updated"; fi
  for db in radius rapid_radius; do
    local de; de=$(run_as_postgres "SELECT 1 FROM pg_database WHERE datname='${db}'")
    if [ -z "$de" ]; then sudo -u postgres psql -c "CREATE DATABASE ${db} OWNER ${db_user};" &>/dev/null; log_info "DB '${db}' created"
    else log_info "DB '${db}' exists"; fi
    sudo -u postgres psql -d "$db" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${db_user}; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${db_user}; GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO ${db_user}; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${db_user}; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${db_user}; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${db_user};" &>/dev/null
  done
  local pg_hba; pg_hba=$(sudo -u postgres psql -tA -c "SHOW hba_file;" 2>/dev/null | tr -d ' ')
  if [ -n "$pg_hba" ]; then
    echo "host    radius          rapid           127.0.0.1/32            scram-sha-256" | sudo tee -a "$pg_hba" >/dev/null
    echo "host    radius          rapid           ::1/128                 scram-sha-256" | sudo tee -a "$pg_hba" >/dev/null
    log_info "pg_hba.conf configured for local rapid user"
  fi
  sudo systemctl restart postgresql; sleep 3
  local schema; schema=$(sudo find /etc/freeradius -name "schema.sql" -path "*/main/postgresql/*" 2>/dev/null | head -1)
  if [ -z "$schema" ]; then
    for p in /etc/freeradius/3.0 /etc/freeradius/3.2; do
      [ -f "${p}/mods-config/sql/main/postgresql/schema.sql" ] && schema="${p}/mods-config/sql/main/postgresql/schema.sql" && break
    done
  fi
  if [ -n "$schema" ]; then
    sudo cat "$schema" | PGPASSWORD="${db_pass}" psql -w -h 127.0.0.1 -U "${db_user}" -d radius && log_info "FreeRADIUS schema imported" || log_error "Schema import failed. Try: PGPASSWORD='${db_pass}' psql -h 127.0.0.1 -U ${db_user} -d radius -f ${schema}"
  else
    log_warn "FreeRADIUS schema not found. Import manually."
  fi
}

phase_postgres_verify() {
  PGPASSWORD="$1" psql -w -h 127.0.0.1 -U rapid -d radius -c "SELECT 1;" &>/dev/null && log_info "PostgreSQL OK" || log_error "PostgreSQL connection FAILED"
}

phase_freeradius_setup() {
  local db_pass=$1 app_port=$2
  log_step "Phase 3: FreeRADIUS Configuration"
  local fr; fr=$(sudo find /etc/freeradius -maxdepth 1 -type d -name "3.*" 2>/dev/null | head -1 || echo "/etc/freeradius/3.0")
  sudo systemctl stop freeradius 2>/dev/null || true
  printf 'sql { dialect = "postgresql"; driver = "rlm_sql_postgresql"; postgresql { send_application_name = yes }; radius_db = "dbname=radius host=localhost user=rapid password=%s"; acct_table1 = "radacct"; acct_table2 = "radacct"; postauth_table = "radpostauth"; authcheck_table = "radcheck"; groupcheck_table = "radgroupcheck"; authreply_table = "radreply"; groupreply_table = "radgroupreply"; usergroup_table = "radusergroup"; delete_stale_sessions = yes; pool { start = ${thread[pool].start_servers}; min = ${thread[pool].min_spare_servers}; max = ${thread[pool].max_servers}; spare = ${thread[pool].max_spare_servers}; uses = 0; retry_delay = 30; lifetime = 0; idle_timeout = 60 }; read_clients = yes; client_table = "nas"; group_attribute = "SQL-Group"; $INCLUDE ${modconfdir}/${.:name}/main/${dialect}/queries.conf }\n' "$db_pass" | sudo tee "${fr}/mods-available/sql" >/dev/null
  printf 'rest { tls {}; connect_uri = "http://127.0.0.1:%s/api"; authorize { uri = "${..connect_uri}/user/%%{User-Name}/mac/%%{Called-Station-ID}?action=authorize"; method = "get"; tls = ${..tls} }; authenticate { uri = "${..connect_uri}/user/%%{User-Name}/mac/%%{Called-Station-ID}?action=authenticate"; method = "get"; tls = ${..tls} }; preacct { uri = "${..connect_uri}/user/%%{User-Name}/sessions/%%{Acct-Unique-Session-ID}?action=preacct"; method = "post"; tls = ${..tls}; body = "json" }; accounting { uri = "${..connect_uri}/user/%%{User-Name}/sessions/%%{Acct-Unique-Session-ID}?action=accounting"; method = "post"; tls = ${..tls}; body = "json" }; post-auth { uri = "${..connect_uri}/user/%%{User-Name}/mac/%%{Called-Station-ID}?action=post-auth"; method = "post"; tls = ${..tls}; body = "json" }; pre-proxy { uri = "${..connect_uri}/user/%%{User-Name}/mac/%%{Called-Station-ID}?action=pre-proxy"; method = "post"; tls = ${..tls}; body = "json" }; post-proxy { uri = "${..connect_uri}/user/%%{User-Name}/mac/%%{Called-Station-ID}?action=post-proxy"; method = "post"; tls = ${..tls}; body = "json" }; pool { start = ${thread[pool].start_servers}; min = ${thread[pool].min_spare_servers}; max = ${thread[pool].max_servers}; spare = ${thread[pool].max_spare_servers}; uses = 0; retry_delay = 30; lifetime = 0; idle_timeout = 60 } }\n' "$app_port" | sudo tee "${fr}/mods-available/rest" >/dev/null
  [ ! -L "${fr}/mods-enabled/sql" ] && sudo ln -sf "${fr}/mods-available/sql" "${fr}/mods-enabled/sql"
  [ ! -L "${fr}/mods-enabled/rest" ] && sudo ln -sf "${fr}/mods-available/rest" "${fr}/mods-enabled/rest"
  sudo chown -R freerad:freerad "${fr}/mods-available/sql" "${fr}/mods-available/rest"
  sudo chmod 640 "${fr}/mods-available/sql" "${fr}/mods-available/rest"
  log_info "SQL + REST modules enabled"
  sudo systemctl enable freeradius 2>/dev/null || true
  sudo systemctl start freeradius 2>/dev/null || true; sleep 2
  service_running freeradius && log_info "FreeRADIUS running" || log_warn "FreeRADIUS may have failed"
}

phase_freeradius_verify() {
  local fr; fr=$(sudo find /etc/freeradius -maxdepth 1 -type d -name "3.*" 2>/dev/null | head -1 || echo "/etc/freeradius/3.0")
  service_running freeradius && log_info "FreeRADIUS: running" || log_warn "FreeRADIUS: NOT running"
  [ -L "${fr}/mods-enabled/sql" ] && log_info "SQL: enabled" || log_warn "SQL: NOT enabled"
  [ -L "${fr}/mods-enabled/rest" ] && log_info "REST: enabled" || log_warn "REST: NOT enabled"
}

phase_app_setup() {
  local sn=$1 dp=$2 mh=$3 mu=$4 mp=$5 ap=$6 as=$7 gr=$8 gb=$9
  log_step "Phase 4: Node.js Application Setup"
  local dir="${HOME}/${sn}"; mkdir -p "$dir"
  if [ -d "${dir}/be-free-radius-system" ]; then
    cd "${dir}/be-free-radius-system"; git checkout "$gb" 2>/dev/null || true; git pull origin "$gb" 2>/dev/null || true
  else
    cd "$dir"; GIT_TERMINAL_PROMPT=0 git clone --depth 1 --branch "$gb" "$gr" "${dir}/be-free-radius-system" || log_fatal "git clone failed"
    cd "${dir}/be-free-radius-system"
  fi
  log_info "Generating config.yaml..."
  cat > config.yaml << CFGEOF
app:
  mode: development
  name: be-free-radius-system
  host: 0.0.0.0
  port: "${ap}"
  prefix: ${sn}
  secret: ${as}
database_radius:
  schema: public
  primary:
    host: 127.0.0.1
    port: "5432"
    user: rapid
    password: ${dp}
    database: radius
  slave:
    host: 127.0.0.1
    port: "5432"
    user: rapid
    password: ${dp}
    database: radius
database_rapid_radius:
  schema: public
  primary:
    host: 127.0.0.1
    port: "5432"
    user: rapid
    password: ${dp}
    database: rapid_radius
  slave:
    host: 127.0.0.1
    port: "5432"
    user: rapid
    password: ${dp}
    database: rapid_radius
rabbitmq:
  url: amqp://${mu}:${mp}@${mh}:5672?heartbeat=60
  max_retry: 3
queue:
  radius_nas: radius_nas_${sn}
  radius_user: radius_user_${sn}
  radius_user_status: radius_user
  radius_group: radius_group
  radius_connection: radius_connection
  radius_nas_status: radius_nas_status
  radius_server_status: radius_server_status
  radius_user_log: radius_user_log
  radius_cleanup: radius_cleanup
cron:
  nas_status: "*/5 * * * *"
  server_status: "*/5 * * * *"
log:
  level: info
CFGEOF
  log_info "config.yaml generated"
  npm install || log_fatal "npm install failed"
  npm run build || log_fatal "npm build failed"
  pm2 install pm2-logrotate 2>/dev/null || true
  if [ -f ecosystem.config.js ]; then pm2 delete ecosystem.config.js 2>/dev/null || true; pm2 start ecosystem.config.js --env production
  else pm2 delete be-free-radius-system 2>/dev/null || true; pm2 start dist/cmd/web/main.js --name be-free-radius-system; fi
  pm2 save 2>/dev/null || true; pm2 startup systemd -u "$(whoami)" --hp "${HOME}" 2>/dev/null | sudo bash 2>/dev/null || true
}

phase_app_verify() {
  local d="${HOME}/${1}/be-free-radius-system"
  [ -f "${d}/config.yaml" ] && log_info "config.yaml: present" || log_warn "config.yaml: MISSING"
  [ -d "${d}/dist" ] && log_info "build: OK" || log_warn "build: MISSING"
  local n; n=$(pm2 list 2>/dev/null | grep -c "online" || true)
  [ "$n" -gt 0 ] && log_info "PM2: online" || log_warn "PM2: no app"
  local h; h=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${2}/health" 2>/dev/null || echo "000")
  [ "$h" = "200" ] && log_info "Health: OK" || log_warn "Health: HTTP ${h}"
}

setup_ssh_key() {
  local f="${HOME}/.ssh/id_rsa"
  if [ ! -f "$f" ]; then
    log_info "Generating SSH key..."; mkdir -p "${HOME}/.ssh"
    ssh-keygen -t rsa -b 4096 -C "pandunorsyabani@gmail.com" -N "" -f "$f" 2>/dev/null
    log_info "Add this key to GitHub:"; echo; cat "${f}.pub"; echo; read -rp "Press Enter after adding..." < /dev/tty
  fi
}

setup_sudoers() {
  log_step "Setting up sudoers..."
  local f="/etc/sudoers.d/freeradius-node" u; u=$(whoami)
  if [ ! -f "$f" ]; then echo "${u} ALL=(ALL) NOPASSWD: /usr/bin/systemctl status freeradius, /usr/bin/systemctl restart freeradius, /usr/bin/systemctl stop freeradius, /usr/bin/systemctl start freeradius, /usr/bin/systemctl reload freeradius" | sudo tee "$f" >/dev/null; sudo chmod 440 "$f"; log_info "Sudoers created"; fi
}

setup_code_server() {
  log_step "Installing code-server..."; command -v code-server &>/dev/null && { log_info "Already installed"; return; }
  curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone || { log_warn "Failed"; return; }
  local d="${HOME}/.config/code-server" p; p=$(generate_secret | head -c 16); mkdir -p "$d"
  printf 'bind-addr: 0.0.0.0:8080\nauth: password\npassword: %s\ncert: false\n' "$p" > "${d}/config.yaml"
  sudo systemctl enable --now code-server@$(whoami) 2>/dev/null || true; sleep 2
  sudo systemctl restart code-server@$(whoami) 2>/dev/null || true
  log_info "code-server: http://$(curl -s ifconfig.me 2>/dev/null || echo "IP"):8080 | pass: ${p}"
}

print_summary() {
  echo; echo "╔══════════════════════════════════════════════════════╗"
  echo "║          ✅ Installation Complete!                   ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo " Site: ${SITE_NAME}  |  App: ${HOME}/${SITE_NAME}/be-free-radius-system"
  echo " Port: ${APP_PORT}  |  Health: http://127.0.0.1:${APP_PORT}/health"
  echo " PostgreSQL: rapid@localhost  |  RabbitMQ: ${MQ_USER}@${MQ_HOST}"
  echo; echo "── Commands ──"
  echo " pm2 list | pm2 logs be-free-radius-system | sudo systemctl status freeradius"
  echo
}

main() {
  parse_args "$@"
  echo; echo "╔══════════════════════════════════════════════════════╗"; echo "║   🚀 be-free-radius-lab Installer                      ║"; echo "╚══════════════════════════════════════════════════════╝"; echo
  check_command bash; check_command curl; check_command sudo; check_command openssl
  [ -z "$DB_PASS" ] && DB_PASS="$DEFAULT_DB_PASS"
  [ -z "$MQ_USER" ] && MQ_USER="$DEFAULT_MQ_USER"
  [ -z "$APP_PORT" ] && APP_PORT="$DEFAULT_APP_PORT"
  [ -z "$GIT_REPO" ] && GIT_REPO="$DEFAULT_GIT_REPO"
  [ -z "$GIT_BRANCH" ] && GIT_BRANCH="$DEFAULT_GIT_BRANCH"
  [ -z "$APP_SECRET" ] && APP_SECRET=$(generate_secret)
  if [ ! -t 0 ] && [ "$NON_INTERACTIVE" = false ]; then
    log_fatal "Cannot prompt interactively because stdin is not a terminal.

Use non-interactive mode with all required arguments:
  bash <(curl -fsSL https://raw.githubusercontent.com/tsanys/be-free-radius-lab/main/scripts/install.sh) \\
    --site SITE_NAME \\
    --mq-host MQ_HOST \\
    --mq-pass MQ_PASS \\
    --non-interactive"
  fi
  if [ "$NON_INTERACTIVE" = true ]; then validate_non_interactive
  else prompt_all; fi
  phase_system_install; phase_system_verify
  if [ -n "$DB_PASS" ]; then
    phase_postgres_setup "$DB_PASS"; phase_postgres_verify "$DB_PASS"
  else
    log_error "DB_PASS is empty, skipping PostgreSQL setup"
  fi
  phase_freeradius_setup "$DB_PASS" "$APP_PORT"; phase_freeradius_verify
  phase_app_setup "$SITE_NAME" "$DB_PASS" "$MQ_HOST" "$MQ_USER" "$MQ_PASS" "$APP_PORT" "$APP_SECRET" "$GIT_REPO" "$GIT_BRANCH"
  phase_app_verify "$SITE_NAME" "$APP_PORT"
  setup_ssh_key; setup_sudoers; $SKIP_CODE_SERVER || setup_code_server; print_summary
}

main "$@"
