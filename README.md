# be-free-radius-lab

Backend system for managing FreeRADIUS servers across multiple sites. Built with Express.js, TypeScript, PostgreSQL, and RabbitMQ.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   NAS/Router │────▶│  FreeRADIUS  │────▶│  REST API   │
│  (MikroTik,  │     │  (SQL + REST │     │  :8004/api  │
│   VyOS, etc) │     │   modules)   │     │             │
└─────────────┘     └──────┬───────┘     └──────┬──────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌──────────────┐
                    │  PostgreSQL  │     │   RabbitMQ   │
                    │   (radius,   │     │  (workers:   │
                    │ rapid_radius)│     │  user, group,│
                    └──────────────┘     │  nas, cleanup)│
                                         └──────────────┘
```

## One-Command Install

```bash
curl -fsSL https://raw.githubusercontent.com/tsanys/be-free-radius-lab/main/scripts/install.sh | bash
```

Script akan otomatis:
1. Install PostgreSQL, FreeRADIUS (SQL + REST), Node.js, PM2
2. Setup database, user, dan schema FreeRADIUS
3. Konfigurasi SQL + REST module FreeRADIUS
4. Clone repo, generate config, dan deploy aplikasi

Untuk mode non-interaktif:
```bash
bash scripts/install.sh \
  --site wanasaribrebes \
  --mq-host 103.105.217.209 \
  --mq-pass "password"
```

## Development

```bash
npm run dev        # nodemon (hot reload)
npm run build      # tsc + tsc-alias
npm start          # node dist/...
npm run lint       # eslint
npm run format     # prettier
```

## Project Structure

```
src/
├── cmd/web/main.ts              # Entry point
├── internal/
│   ├── config/                  # Bootstrap, Express, Sequelize, etc.
│   ├── delivery/
│   │   ├── http/                # REST API (router, handler, middleware)
│   │   ├── rabbitmq/            # Queue workers
│   │   └── scheduled/           # Cron jobs
│   ├── infrastructure/
│   │   ├── sequelize/           # Model definitions
│   │   └── converter/           # Data converters
│   ├── model/                   # Domain models
│   ├── pkg/                     # Utilities
│   ├── repository/              # Data access
│   └── usecase/                 # Business logic
├── db/migrations/               # Database migrations
└── types/                       # TypeScript declarations
scripts/
├── install.sh                   # Interactive installer
├── lib/                         # Installer phase scripts
└── templates/                   # FreeRADIUS & config templates
```

## FreeRADIUS Attributes

### radgroupreply
- Framed-IP-Address, Framed-IP-Netmask, Framed-Route
- Session-Timeout, Idle-Timeout, Max-Daily-Session
- Framed-Protocol, Service-Type, Class
- Login-IP-Host, Login-Service, Reply-Message
- Tunnel-Type, Tunnel-Medium-Type, Tunnel-Client-Address
- NAS-Port-Type, NAS-Port

### radreply
- Framed-IP-Netmask, Framed-Route, NAS-IP-Address
- Framed-Protocol, Calling-Station-Id, Service-Type
- Framed-Compression, Mikrotik-Local-Address, Mikrotik-Remote-Address

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | PostgreSQL (via @sequelize/postgres) |
| Message Queue | RabbitMQ (via amqplib) |
| RADIUS | FreeRADIUS 3.0 (SQL + REST modules) |
| Device Mgmt | SSH (node-ssh), SNMP |
| Logging | Winston |
| Scheduling | node-schedule |
