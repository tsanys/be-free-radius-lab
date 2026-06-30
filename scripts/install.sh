#!/usr/bin/env bash
set -euo pipefail

###############################################################################
#  be-free-radius-system  —  One-command interactive installer
#
#  Usage (from a fresh server):
#    curl -fsSL https://raw.githubusercontent.com/tsanys/be-free-radius-lab/main/scripts/install.sh | bash
#
#  Or with arguments (non-interactive):
#    bash scripts/install.sh \
#      --site wanasaribrebes \
#      --db-pass "1CvjrzbcDuiCRLXzepzfGy55qVKdqmUbeM580wFLF8vp8" \
#      --mq-host "103.105.217.209" \
#      --mq-user "rapid" \
#      --mq-pass "sekret" \
#      --app-port 8004 \
#      --git-branch main
###############################################################################

# ── Color & helper functions (self-contained for curl|bash mode) ──

NC='\033[0m'; RED='\033[0;31m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'

log_info()  { printf "${GREEN}[INFO]${NC}  %s\n" "$*"; }
log_warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$*"; }
log_error() { printf "${RED}[ERROR]${NC} %s\n" "$*"; }
log_step()  { printf "\n${BLUE}==>${NC} ${CYAN}%s${NC}\n" "$*"; }
log_fatal() { log_error "$*"; exit 1; }

prompt_input() {
  local var_name=$1; local msg=$2; local default=$3; local val
  read -rp "$(printf "${CYAN}?${NC} %s [${GREEN}%s${NC}]: " "$msg" "$default")" val
  val=${val:-$default}; eval "$var_name=\$val"
}

prompt_secret() {
  local var_name=$1; local msg=$2; local default=$3; local val
  read -rsp "$(printf "${CYAN}?${NC} %s [${GREEN}****${NC}]: " "$msg")" val; echo
  val=${val:-$default}; eval "$var_name=\$val"
}

prompt_confirm() {
  local msg=$1; local default=${2:-Y}; local yn
  read -rp "$(printf "${CYAN}?${NC} %s [${GREEN}%s${NC}]/%s: " "$msg" "$default" "$([ "$default" = "Y" ] && echo "n" || echo "N")")" yn
  case "$yn" in [Yy]*) return 0;; [Nn]*) return 1;; *) [ "$default" = "Y" ] && return 0 || return 1;; esac
}

check_command() { command -v "$1" &>/dev/null || log_fatal "'$1' is required but not installed."; }
generate_secret() { openssl rand -hex 16 2>/dev/null || date +%s | md5sum | head -c 32; }
service_running() { systemctl is-active --quiet "$1" 2>/dev/null; }

# ── Defaults ──

DEFAULT_DB_PASS="1CvjrzbcDuiCRLXzepzfGy55qVKdqmUbeM580wFLF8vp8"
DEFAULT_MQ_USER="rapid"
DEFAULT_APP_PORT="8004"
DEFAULT_GIT_REPO="https://github.com/tsanys/be-free-radius-lab.git"
DEFAULT_GIT_BRANCH="main"

SITE_NAME=""; DB_PASS=""; MQ_HOST=""; MQ_USER=""; MQ_PASS=""
APP_PORT=""; APP_SECRET=""; GIT_REPO=""; GIT_BRANCH=""
SKIP_CODE_SERVER=false; NON_INTERACTIVE=false

# ── Bootstrap: ensure we are running from a local repo copy ──

bootstrap_repo() {
  local script_path
  script_path="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo "")"

  # Check if we're already in a cloned repo (has lib/ sibling)
  if [ -f "${script_path}/lib/common.sh" ] 2>/dev/null || [ -f "./lib/common.sh" ] 2>/dev/null; then
    local repo_root
    if [ -f "${script_path}/lib/common.sh" ]; then
      repo_root="$(cd "${script_path}/.." && pwd)"
    else
      repo_root="$(pwd)"
    fi
    echo "$repo_root"
    return
  fi

  # We're running standalone (curl | bash) — clone repo to /tmp
  log_info "Running from pipe — cloning repository first..."
  check_command git

  local tmp_dir
  tmp_dir=$(mktemp -d)
  GIT_TERMINAL_PROMPT=0 git clone --depth 1 --branch "$DEFAULT_GIT_BRANCH" "$DEFAULT_GIT_REPO" "${tmp_dir}/be-free-radius-system" 2>&1 | tail -1 || log_fatal "Failed to clone repository. Make sure the repository is public and accessible."

  echo "${tmp_dir}/be-free-radius-system"
}

# ── Parse CLI args ──

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --site)            SITE_NAME="$2"; shift 2 ;;
      --db-pass)         DB_PASS="$2"; shift 2 ;;
      --mq-host)         MQ_HOST="$2"; shift 2 ;;
      --mq-user)         MQ_USER="$2"; shift 2 ;;
      --mq-pass)         MQ_PASS="$2"; shift 2 ;;
      --app-port)        APP_PORT="$2"; shift 2 ;;
      --app-secret)      APP_SECRET="$2"; shift 2 ;;
      --git-repo)        GIT_REPO="$2"; shift 2 ;;
      --git-branch)      GIT_BRANCH="$2"; shift 2 ;;
      --skip-code-server) SKIP_CODE_SERVER=true; shift ;;
      --non-interactive) NON_INTERACTIVE=true; shift ;;
      --help)            cat <<EOF
Usage: install.sh [OPTIONS]

One-command installer for be-free-radius-system (FreeRADIUS + Node.js app).

Options:
  --site NAME          Site name (e.g. wanasaribrebes)        [required]
  --db-pass PASS       PostgreSQL password for user 'rapid'   [default: global]
  --mq-host HOST       RabbitMQ server hostname/IP            [required]
  --mq-user USER       RabbitMQ username                      [default: rapid]
  --mq-pass PASS       RabbitMQ password                      [required]
  --app-port PORT      Node.js app port                       [default: 8004]
  --app-secret SECRET  App secret key                         [auto-generated]
  --git-repo URL       Git repository URL                     [default: tsanys/be-free-radius-lab]
  --git-branch BRANCH  Git branch                             [default: main]
  --skip-code-server   Skip code-server installation
  --non-interactive    Run without prompts (all vars must be provided)
  --help               Show this help message

Examples:
  curl -fsSL https://raw.githubusercontent.com/tsanys/be-free-radius-lab/main/scripts/install.sh | bash
  bash install.sh --site wanasaribrebes --mq-host 10.0.0.1 --mq-pass sekret
EOF
       exit 0 ;;
      *) log_fatal "Unknown argument: $1";;
    esac
  done
}

validate_non_interactive() {
  local missing=()
  [ -z "$SITE_NAME" ] && missing+=("--site")
  [ -z "$MQ_HOST" ]   && missing+=("--mq-host")
  [ -z "$MQ_PASS" ]   && missing+=("--mq-pass")
  [ ${#missing[@]} -gt 0 ] && log_fatal "Non-interactive mode requires: ${missing[*]}"
}

# ── Interactive prompts ──

prompt_all() {
  echo
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║   🚀 FreeRADIUS System - Interactive Installer      ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo

  while [ -z "$SITE_NAME" ]; do
    read -rp "$(printf "${CYAN}?${NC} %s: " "Site name (e.g. wanasaribrebes, jatilawangbanyumas)")" SITE_NAME
  done
  SITE_NAME=$(echo "$SITE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')

  prompt_input APP_PORT "Application port" "$DEFAULT_APP_PORT"
  prompt_secret DB_PASS "PostgreSQL password for user 'rapid'" "$DEFAULT_DB_PASS"
  [ -z "$APP_SECRET" ] && APP_SECRET=$(generate_secret)

  echo; echo "── RabbitMQ Configuration ──"
  while [ -z "$MQ_HOST" ]; do
    read -rp "$(printf "${CYAN}?${NC} %s: " "RabbitMQ server host (IP or hostname)")" MQ_HOST
  done
  prompt_input MQ_USER "RabbitMQ username" "$DEFAULT_MQ_USER"
  while [ -z "$MQ_PASS" ]; do prompt_secret MQ_PASS "RabbitMQ password" ""; done

  echo; echo "── Git Configuration ──"
  prompt_input GIT_REPO "Git repository URL" "$DEFAULT_GIT_REPO"
  prompt_input GIT_BRANCH "Git branch" "$DEFAULT_GIT_BRANCH"

  echo
  prompt_confirm "Install code-server (VS Code in browser)?" "N" || SKIP_CODE_SERVER=true

  echo
  echo "══════════════════════════════════════════════════════"
  echo " Site:        ${SITE_NAME}"
  echo " Port:        ${APP_PORT}"
  echo " RabbitMQ:    ${MQ_USER}@${MQ_HOST}"
  echo " Git branch:  ${GIT_BRANCH}"
  echo "══════════════════════════════════════════════════════"
  echo
  prompt_confirm "Proceed with installation?" "Y" || { log_info "Cancelled."; exit 0; }
}

# ── Setup functions ──

setup_ssh_key() {
  local key_file="${HOME}/.ssh/id_rsa"
  if [ ! -f "$key_file" ]; then
    log_info "Generating SSH key for GitHub access..."
    mkdir -p "${HOME}/.ssh"
    ssh-keygen -t rsa -b 4096 -C "pandunorsyabani@gmail.com" -N "" -f "$key_file" 2>/dev/null
    log_info "SSH key generated. Add this public key to GitHub:"
    echo; cat "${key_file}.pub"; echo
    read -rp "Press Enter after adding the SSH key to GitHub (https://github.com/settings/keys)..."
  fi
}

setup_sudoers() {
  log_step "Setting up sudoers for FreeRADIUS management..."
  local sudoers_file="/etc/sudoers.d/freeradius-node"
  local current_user; current_user=$(whoami)
  if [ ! -f "$sudoers_file" ]; then
    echo "${current_user} ALL=(ALL) NOPASSWD: /usr/bin/systemctl status freeradius, /usr/bin/systemctl restart freeradius, /usr/bin/systemctl stop freeradius, /usr/bin/systemctl start freeradius, /usr/bin/systemctl reload freeradius" | sudo tee "$sudoers_file" >/dev/null
    sudo chmod 440 "$sudoers_file"
    log_info "Sudoers file created"
  else
    log_info "Sudoers file already exists"
  fi
}

setup_code_server() {
  log_step "Installing code-server (VS Code in browser)..."
  command -v code-server &>/dev/null && { log_info "code-server already installed"; return; }

  curl -fsSL https://code-server.dev/install.sh | sh -s -- --method=standalone 2>&1 | tail -1 || { log_warn "code-server installation failed, skipping..."; return; }

  local config_dir="${HOME}/.config/code-server"
  mkdir -p "$config_dir"
  local cs_pass; cs_pass=$(generate_secret | head -c 16)
  cat > "${config_dir}/config.yaml" << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: ${cs_pass}
cert: false
EOF
  sudo systemctl enable --now code-server@$(whoami) 2>/dev/null || true
  sleep 2; sudo systemctl restart code-server@$(whoami) 2>/dev/null || true
  log_info "code-server: http://$(curl -s ifconfig.me 2>/dev/null || echo "SERVER_IP"):8080"
  log_info "code-server password: ${cs_pass}"
}

print_summary() {
  local app_dir="${HOME}/${SITE_NAME}/be-free-radius-system"
  echo
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║          ✅ Installation Complete!                   ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo
  echo " Site:             ${SITE_NAME}"
  echo " App dir:          ${app_dir}"
  echo " App port:         ${APP_PORT}"
  echo " Health check:     http://127.0.0.1:${APP_PORT}/health"
  echo " PostgreSQL user:  rapid"
  echo " PostgreSQL DBs:   radius, rapid_radius"
  echo " RabbitMQ:         ${MQ_USER}@${MQ_HOST}"
  echo
  echo "── Useful Commands ──"
  echo "  pm2 list"
  echo "  pm2 logs be-free-radius-system"
  echo "  sudo systemctl status freeradius"
  echo
  echo "── Next Steps ──"
  echo "  1. Add NAS clients to database (nas table)"
  echo "  2. Add radcheck/radgroupcheck entries for users"
  echo
}

# ── Main ──

main() {
  parse_args "$@"

  # Bootstrap — if running from pipe, clone repo and re-exec
  local repo_root
  repo_root=$(bootstrap_repo)
  local script_path="${repo_root}/scripts/install.sh"

  # If we are the temporary clone, re-exec with all args preserved
  if [ "$repo_root" != "$(cd "$(dirname "$0")/.." 2>/dev/null && pwd || echo "")" ]; then
    # Re-exec from cloned repo, passing all collected args
    exec bash "$script_path" \
      ${SITE_NAME:+--site "$SITE_NAME"} \
      ${DB_PASS:+--db-pass "$DB_PASS"} \
      ${MQ_HOST:+--mq-host "$MQ_HOST"} \
      ${MQ_USER:+--mq-user "$MQ_USER"} \
      ${MQ_PASS:+--mq-pass "$MQ_PASS"} \
      ${APP_PORT:+--app-port "$APP_PORT"} \
      ${APP_SECRET:+--app-secret "$APP_SECRET"} \
      ${GIT_REPO:+--git-repo "$GIT_REPO"} \
      ${GIT_BRANCH:+--git-branch "$GIT_BRANCH"} \
      $($SKIP_CODE_SERVER && echo "--skip-code-server") \
      $($NON_INTERACTIVE && echo "--non-interactive")
  fi

  # From here: we are running from the cloned repo
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  LIB_DIR="${SCRIPT_DIR}/lib"

  echo
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║   🚀 be-free-radius-system Installer                ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo

  check_command bash; check_command curl; check_command sudo; check_command openssl

  if [ "$NON_INTERACTIVE" = true ]; then
    validate_non_interactive
  else
    [ -z "$DB_PASS" ]    && DB_PASS="$DEFAULT_DB_PASS"
    [ -z "$MQ_USER" ]    && MQ_USER="$DEFAULT_MQ_USER"
    [ -z "$APP_PORT" ]   && APP_PORT="$DEFAULT_APP_PORT"
    [ -z "$GIT_REPO" ]   && GIT_REPO="$DEFAULT_GIT_REPO"
    [ -z "$GIT_BRANCH" ] && GIT_BRANCH="$DEFAULT_GIT_BRANCH"
    [ -z "$APP_SECRET" ] && APP_SECRET=$(generate_secret)
    prompt_all
  fi

  source "${LIB_DIR}/phase-system.sh"
  phase_system_install; phase_system_verify

  source "${LIB_DIR}/phase-postgres.sh"
  phase_postgres_setup "$DB_PASS"; phase_postgres_verify "$DB_PASS"

  source "${LIB_DIR}/phase-freeradius.sh"
  phase_freeradius_setup "$DB_PASS" "$APP_PORT"; phase_freeradius_verify

  source "${LIB_DIR}/phase-app.sh"
  phase_app_setup "$SITE_NAME" "$DB_PASS" "$MQ_HOST" "$MQ_USER" "$MQ_PASS" "$APP_PORT" "$APP_SECRET" "$GIT_REPO" "$GIT_BRANCH"
  phase_app_verify "$SITE_NAME" "$APP_PORT"

  setup_ssh_key
  setup_sudoers
  $SKIP_CODE_SERVER || setup_code_server
  print_summary
}

main "$@"
