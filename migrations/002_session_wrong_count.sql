-- Agrega columna wrong_count a game_sessions para registrar errores por sesión
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS wrong_count INTEGER NOT NULL DEFAULT 0;
