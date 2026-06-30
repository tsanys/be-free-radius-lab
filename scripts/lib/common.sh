#!/usr/bin/env bash

export NC='\033[0m'
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'

log_info()  { printf "${GREEN}[INFO]${NC}  %s\n" "$*" >&2; }
log_warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$*" >&2; }
log_error() { printf "${RED}[ERROR]${NC} %s\n" "$*" >&2; }
log_step()  { printf "\n${BLUE}==>${NC} ${CYAN}%s${NC}\n" "$*" >&2; }
log_fatal() { log_error "$*"; exit 1; }

spinner() {
  local pid=$1
  local msg=$2
  local spin='-\|/'
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    i=$(( (i+1) % 4 ))
    printf "\r${YELLOW}[%s]${NC} %s" "${spin:$i:1}" "$msg"
    sleep 0.15
  done
  printf "\r${GREEN}[✔]${NC} %s\n" "$msg"
}

prompt_input() {
  local var_name=$1
  local prompt_msg=$2
  local default_value=$3
  local val
  if [ -n "$default_value" ]; then
    read -rp "$(printf "${CYAN}?${NC} %s [${GREEN}%s${NC}]: " "$prompt_msg" "$default_value")" val
    val=${val:-$default_value}
  else
    read -rp "$(printf "${CYAN}?${NC} %s: " "$prompt_msg")" val
  fi
  eval "$var_name=\$val"
}

prompt_secret() {
  local var_name=$1
  local prompt_msg=$2
  local default_value=$3
  local val
  if [ -n "$default_value" ]; then
    read -rsp "$(printf "${CYAN}?${NC} %s [${GREEN}****${NC}]: " "$prompt_msg")" val
    echo
    val=${val:-$default_value}
  else
    read -rsp "$(printf "${CYAN}?${NC} %s: " "$prompt_msg")" val
    echo
  fi
  eval "$var_name=\$val"
}

prompt_confirm() {
  local prompt_msg=$1
  local default=${2:-Y}
  local yn
  read -rp "$(printf "${CYAN}?${NC} %s [${GREEN}%s${NC}]/${NC}%s: " "$prompt_msg" "$default" "$([ "$default" = "Y" ] && echo "n" || echo "N")")" yn
  case "$yn" in
    [Yy]*) return 0 ;;
    [Nn]*) return 1 ;;
    *) [ "$default" = "Y" ] && return 0 || return 1 ;;
  esac
}

check_command() {
  if ! command -v "$1" &>/dev/null; then
    log_fatal "'$1' is required but not installed. Please install it first."
  fi
}

check_root() {
  if [ "$EUID" -ne 0 ]; then
    log_warn "This script requires sudo privileges for many operations."
    if ! sudo -v; then
      log_fatal "No sudo access. This script needs root privileges."
    fi
  fi
}

sed_inplace() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

generate_secret() {
  openssl rand -hex 16 2>/dev/null || date +%s | md5sum | head -c 32
}

run_as_postgres() {
  sudo -u postgres psql -tA -c "$1" 2>/dev/null || true
}

file_exists() {
  [ -f "$1" ]
}

symlink_exists() {
  [ -L "$1" ]
}

service_running() {
  systemctl is-active --quiet "$1" 2>/dev/null
}
