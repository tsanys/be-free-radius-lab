app:
  mode: development
  name: be-free-radius-system
  host: 0.0.0.0
  port: "{{APP_PORT}}"
  prefix: {{SITE_NAME}}
  secret: {{APP_SECRET}}
database_radius:
  schema: public
  primary:
    host: 127.0.0.1
    port: "5432"
    user: rapid
    password: {{DB_PASSWORD}}
    database: radius
  slave:
    host: 127.0.0.1
    port: "5432"
    user: rapid
    password: {{DB_PASSWORD}}
    database: radius
database_rapid_radius:
  schema: public
  primary:
    host: 127.0.0.1
    port: "5432"
    user: rapid
    password: {{DB_PASSWORD}}
    database: rapid_radius
  slave:
    host: 127.0.0.1
    port: "5432"
    user: rapid
    password: {{DB_PASSWORD}}
    database: rapid_radius
rabbitmq:
  url: amqp://{{MQ_USER}}:{{MQ_PASS}}@{{MQ_HOST}}:5672?heartbeat=60
  max_retry: 3
queue:
  radius_nas: radius_nas_{{SITE_NAME}}
  radius_user: radius_user_{{SITE_NAME}}
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
