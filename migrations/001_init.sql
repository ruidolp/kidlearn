-- ============================================================
-- 001_init.sql
-- ============================================================

-- Usuarios / cuentas de padres
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'es',     -- 'es' | 'en'
  theme       TEXT NOT NULL DEFAULT 'blue',   -- 'blue' | 'pink' | 'green'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Objetos de la colección (seed + los que sube el padre)
CREATE TABLE IF NOT EXISTS objects (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- NULL = seed global
  name_es     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  image_path  TEXT NOT NULL,
  is_seed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Estadísticas por objeto por usuario
CREATE TABLE IF NOT EXISTS object_stats (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_id       INTEGER NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  impressions     INTEGER NOT NULL DEFAULT 0,
  correct_total   INTEGER NOT NULL DEFAULT 0,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  max_streak      INTEGER NOT NULL DEFAULT 0,
  last_played_at  TIMESTAMPTZ,
  UNIQUE (user_id, object_id)
);

-- Sesiones de juego
CREATE TABLE IF NOT EXISTS game_sessions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id       TEXT NOT NULL DEFAULT 'mundo-cercano',
  total_objects INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  language      TEXT NOT NULL DEFAULT 'es',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

-- Resultados individuales por objeto dentro de una sesión
CREATE TABLE IF NOT EXISTS game_results (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  object_id     INTEGER NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  correct       BOOLEAN NOT NULL,
  answered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuración por usuario (N objetos por sesión, etc.)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id           INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  session_size      INTEGER NOT NULL DEFAULT 5,   -- cuántos objetos por sesión
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Palabras sugeridas (hints) para los padres
CREATE TABLE IF NOT EXISTS hint_words (
  id          SERIAL PRIMARY KEY,
  name_es     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  category_es TEXT NOT NULL,
  category_en TEXT NOT NULL
);

-- ============================================================
-- SEED: 3 objetos base globales (is_seed = true, user_id = NULL)
-- ============================================================
INSERT INTO objects (user_id, name_es, name_en, image_path, is_seed) VALUES
  (NULL, 'Zapatilla', 'Sneaker', '/seed/zapatilla.svg', TRUE),
  (NULL, 'Cuchara',   'Spoon',   '/seed/cuchara.svg',   TRUE),
  (NULL, 'Plato',     'Plate',   '/seed/plato.svg',     TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Hint words organizadas por categoría
-- ============================================================
INSERT INTO hint_words (name_es, name_en, category_es, category_en) VALUES
  ('Cepillo de dientes', 'Toothbrush', 'Higiene',   'Hygiene'),
  ('Pijama',             'Pajamas',    'Ropa',       'Clothing'),
  ('Polera',             'T-shirt',    'Ropa',       'Clothing'),
  ('Pantalón',           'Pants',      'Ropa',       'Clothing'),
  ('Perro',              'Dog',        'Animales',   'Animals'),
  ('Gato',               'Cat',        'Animales',   'Animals'),
  ('Abuelo',             'Grandpa',    'Familia',    'Family'),
  ('Abuela',             'Grandma',    'Familia',    'Family'),
  ('Mamá',               'Mom',        'Familia',    'Family'),
  ('Papá',               'Dad',        'Familia',    'Family'),
  ('Mesa',               'Table',      'Hogar',      'Home'),
  ('Silla',              'Chair',      'Hogar',      'Home'),
  ('Pelota',             'Ball',       'Juguetes',   'Toys'),
  ('Juguete',            'Toy',        'Juguetes',   'Toys'),
  ('Auto',               'Car',        'Juguetes',   'Toys')
ON CONFLICT DO NOTHING;
