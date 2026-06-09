-- ============================================================
-- 004_audio_urls.sql
-- ============================================================

ALTER TABLE objects ADD COLUMN IF NOT EXISTS audio_url_es TEXT;
ALTER TABLE objects ADD COLUMN IF NOT EXISTS audio_url_en TEXT;
