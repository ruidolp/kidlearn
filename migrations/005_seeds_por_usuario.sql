-- Copiar los objetos seed globales a todos los usuarios existentes
-- que aún no los tienen, para que cada usuario pueda eliminarlos.
INSERT INTO objects (user_id, name_es, name_en, image_path, is_seed)
SELECT u.id, s.name_es, s.name_en, s.image_path, FALSE
FROM users u
CROSS JOIN objects s
WHERE s.is_seed = TRUE
  AND s.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM objects o
    WHERE o.user_id = u.id
      AND o.name_es = s.name_es
      AND o.is_seed = FALSE
  );

-- Los seeds globales ya no se muestran a los usuarios directamente.
-- Se mantienen en la tabla como plantillas para nuevos registros.
