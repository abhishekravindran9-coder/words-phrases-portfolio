DROP INDEX IF EXISTS idx_progress_narrative_user_week;
DROP TABLE IF EXISTS progress_weekly_narratives;

DO $$
BEGIN
    IF to_regclass('public.reviews') IS NOT NULL THEN
        DROP INDEX IF EXISTS idx_reviews_user_reviewed_at;
        ALTER TABLE reviews DROP COLUMN IF EXISTS interval_after_days;
        ALTER TABLE reviews DROP COLUMN IF EXISTS interval_before_days;
        ALTER TABLE reviews DROP COLUMN IF EXISTS question_format;
        ALTER TABLE reviews DROP COLUMN IF EXISTS timezone_id;
        ALTER TABLE reviews DROP COLUMN IF EXISTS reviewed_at;
    END IF;
    IF to_regclass('public.words') IS NOT NULL THEN
        DROP INDEX IF EXISTS idx_words_user_difficulty;
        ALTER TABLE words DROP COLUMN IF EXISTS lapse_count;
        ALTER TABLE words DROP COLUMN IF EXISTS difficulty_tier;
    END IF;
END $$;DROP INDEX IF EXISTS idx_progress_narrative_user_week;
DROP TABLE IF EXISTS progress_weekly_narratives;

DO $$
BEGIN
    IF to_regclass('public.reviews') IS NOT NULL THEN
        DROP INDEX IF EXISTS idx_reviews_user_reviewed_at;
        ALTER TABLE reviews DROP COLUMN IF EXISTS interval_after_days;
        ALTER TABLE reviews DROP COLUMN IF EXISTS interval_before_days;
        ALTER TABLE reviews DROP COLUMN IF EXISTS question_format;
        ALTER TABLE reviews DROP COLUMN IF EXISTS timezone_id;
        ALTER TABLE reviews DROP COLUMN IF EXISTS reviewed_at;
    END IF;
    IF to_regclass('public.words') IS NOT NULL THEN
        DROP INDEX IF EXISTS idx_words_user_difficulty;
        ALTER TABLE words DROP COLUMN IF EXISTS lapse_count;
        ALTER TABLE words DROP COLUMN IF EXISTS difficulty_tier;
    END IF;
END $$;