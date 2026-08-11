#!/usr/bin/env bash
# Start Spring Boot against Supabase Postgres (not the local H2 profile).
set -euo pipefail
cd "$(dirname "$0")"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${DB_PASSWORD:-}" ]]; then
  echo "DB_PASSWORD is not set. Put it in backend/.env or export it first." >&2
  exit 1
fi

ROOT="$(cd .. && pwd)"
if [[ -d "$ROOT/.tools/jdk-17/Contents/Home" ]]; then
  export JAVA_HOME="$ROOT/.tools/jdk-17/Contents/Home"
  export PATH="$JAVA_HOME/bin:$ROOT/.tools/apache-maven/bin:$PATH"
fi

echo "Starting warehouse API with spring profile=supabase …"
exec mvn spring-boot:run -Dspring-boot.run.profiles=supabase
