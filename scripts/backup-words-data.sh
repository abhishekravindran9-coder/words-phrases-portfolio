#!/usr/bin/env bash
set -euo pipefail

# Required environment variables:
# DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
# Optional: BACKUP_DIR (defaults to ./backups/words-YYYYmmdd-HHMMSS)

: "${DB_HOST:?Set DB_HOST before running the backup}"
: "${DB_NAME:?Set DB_NAME before running the backup}"
: "${DB_USERNAME:?Set DB_USERNAME before running the backup}"
: "${DB_PASSWORD:?Set DB_PASSWORD before running the backup}"

DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-backups/words-$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$BACKUP_DIR"

export PGPASSWORD="$DB_PASSWORD"
PSQL_ARGS=(--host="$DB_HOST" --port="$DB_PORT" --username="$DB_USERNAME" --dbname="$DB_NAME" --no-password)
PG_DUMP="${PG_DUMP:-pg_dump}"
PSQL="${PSQL:-psql}"

echo "==> Creating full PostgreSQL backup"
"$PG_DUMP" "${PSQL_ARGS[@]}" --format=custom --file="$BACKUP_DIR/database.dump"

echo "==> Exporting vocabulary and review integrity snapshot"
"$PSQL" "${PSQL_ARGS[@]}" --tuples-only --no-align --field-separator='|' \
  --command="COPY (
    SELECT id, user_id, word, entry_type, definition, example_sentence, image_url,
           audio_url, notes, difficulty_tier, ease_factor, interval_days, repetitions,
           next_review_date, mastered, lapse_count, created_at, updated_at
    FROM words ORDER BY id
  ) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/words.csv"

"$PSQL" "${PSQL_ARGS[@]}" --tuples-only --no-align --field-separator='|' \
  --command="COPY (
    SELECT id, word_id, user_id, review_date, quality, time_taken_seconds, reviewed_at,
           timezone_id, question_format, interval_before_days, interval_after_days, created_at
    FROM reviews ORDER BY id
  ) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/reviews.csv"

"$PSQL" "${PSQL_ARGS[@]}" --tuples-only --no-align --field-separator='|' \
  --command="SELECT 'word_count', COUNT(*) FROM words
             UNION ALL SELECT 'word_entries', COUNT(*) FROM words WHERE entry_type = 'WORD'
             UNION ALL SELECT 'phrase_entries', COUNT(*) FROM words WHERE entry_type = 'PHRASE'
             UNION ALL SELECT 'review_count', COUNT(*) FROM reviews
             UNION ALL SELECT 'words_with_srs', COUNT(*) FROM words WHERE ease_factor IS NOT NULL
             AND interval_days IS NOT NULL AND repetitions IS NOT NULL
             ORDER BY 1" > "$BACKUP_DIR/counts.txt"

shasum -a 256 "$BACKUP_DIR/database.dump" "$BACKUP_DIR/words.csv" "$BACKUP_DIR/reviews.csv" "$BACKUP_DIR/counts.txt" > "$BACKUP_DIR/SHA256SUMS"
unset PGPASSWORD

echo "Backup complete: $BACKUP_DIR"
cat "$BACKUP_DIR/counts.txt"