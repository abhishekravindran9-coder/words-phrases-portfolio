DROP INDEX IF EXISTS idx_words_user_deleted_at;
DROP INDEX IF EXISTS idx_words_user_created_at;

ALTER TABLE words DROP COLUMN IF EXISTS ai_enrichment_version;
ALTER TABLE words DROP COLUMN IF EXISTS ai_enrichment_status;
ALTER TABLE words DROP COLUMN IF EXISTS user_mnemonic;
ALTER TABLE words DROP COLUMN IF EXISTS user_example;
ALTER TABLE words DROP COLUMN IF EXISTS source_context;
ALTER TABLE words DROP COLUMN IF EXISTS antonyms;
ALTER TABLE words DROP COLUMN IF EXISTS synonyms;
ALTER TABLE words DROP COLUMN IF EXISTS usage_note;
ALTER TABLE words DROP COLUMN IF EXISTS mnemonic;
ALTER TABLE words DROP COLUMN IF EXISTS etymology;
ALTER TABLE words DROP COLUMN IF EXISTS part_of_speech;
ALTER TABLE words DROP COLUMN IF EXISTS pronunciation;
ALTER TABLE words DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE words DROP COLUMN IF EXISTS deleted_at;