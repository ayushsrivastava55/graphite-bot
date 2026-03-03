#!/bin/bash
# ============================================================
# PostgreSQL Backup Utility for FCI Competitive Intelligence
# Creates gzipped backups, auto-deletes backups older than 7 days
# Usage: ./backup_db.sh
# ============================================================

set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/graphite_intel_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Load environment variables
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

DB_USER="${POSTGRES_USER:-graphite_admin}"
DB_NAME="${POSTGRES_DB:-graphite_intel}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup of ${DB_NAME}..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup created: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"

# Delete backups older than retention period
DELETED=$(find "$BACKUP_DIR" -name "graphite_intel_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Deleted ${DELETED} backup(s) older than ${RETENTION_DAYS} days."
fi

echo "[$(date)] Backup complete."
