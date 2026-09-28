DROP INDEX IF EXISTS idx_property_money_audit_entity;
DROP TABLE IF EXISTS property_money_audit;
DROP INDEX IF EXISTS idx_properties_user_deleted_at;
ALTER TABLE properties DROP COLUMN IF EXISTS deleted_at;
