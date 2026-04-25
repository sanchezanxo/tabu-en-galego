-- Esquema SQLite (desenvolvemento local).
-- Mantéñase paralelo a schema.mariadb.sql.
-- CLAUDE.md §7.3.

PRAGMA foreign_keys = ON;

-- Base léxica (espello opcional do JSON; non usada pola API v1).
CREATE TABLE IF NOT EXISTS palabras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  palabra TEXT NOT NULL,
  nivel TEXT NOT NULL CHECK(nivel IN ('facil','medio','dificil')),
  categoria TEXT NOT NULL,
  notas TEXT,
  activa INTEGER DEFAULT 1,
  creada_en TEXT DEFAULT (datetime('now')),
  actualizada_en TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_palabras_nivel ON palabras(nivel);
CREATE INDEX IF NOT EXISTS idx_palabras_categoria ON palabras(categoria);

CREATE TABLE IF NOT EXISTS prohibidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  palabra_id INTEGER NOT NULL,
  prohibida TEXT NOT NULL,
  FOREIGN KEY (palabra_id) REFERENCES palabras(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_prohibidas_palabra ON prohibidas(palabra_id);

-- Partidas
CREATE TABLE IF NOT EXISTS partidas (
  id TEXT PRIMARY KEY,
  organizador TEXT,
  organizador_fp TEXT,
  num_equipos INTEGER NOT NULL,
  nivel TEXT NOT NULL,
  segundos_quenda INTEGER NOT NULL,
  modo TEXT NOT NULL CHECK(modo IN ('puntos','roldas')),
  obxectivo INTEGER NOT NULL,
  duracion_total INTEGER,
  inicio TEXT NOT NULL,
  fin TEXT
);
CREATE INDEX IF NOT EXISTS idx_partidas_inicio ON partidas(inicio);
CREATE INDEX IF NOT EXISTS idx_partidas_fp ON partidas(organizador_fp);

CREATE TABLE IF NOT EXISTS partida_equipos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id TEXT NOT NULL,
  posicion INTEGER NOT NULL,
  nome TEXT NOT NULL,
  puntos_finais INTEGER NOT NULL,
  acertos_total INTEGER NOT NULL,
  prohibidas_total INTEGER NOT NULL,
  saltos_total INTEGER NOT NULL,
  ganador INTEGER DEFAULT 0,
  FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_equipos_partida ON partida_equipos(partida_id);

CREATE TABLE IF NOT EXISTS palabras_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  palabra TEXT NOT NULL UNIQUE,
  veces_xogada INTEGER DEFAULT 0,
  veces_acertada INTEGER DEFAULT 0,
  veces_saltada INTEGER DEFAULT 0,
  veces_prohibida INTEGER DEFAULT 0,
  tempo_medio_acerto REAL DEFAULT 0,
  actualizada_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reportes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  palabra TEXT NOT NULL,
  motivo TEXT NOT NULL,
  contacto TEXT,
  creado_en TEXT DEFAULT (datetime('now')),
  resolto INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_reportes_resolto ON reportes(resolto);

-- Rate limiting
CREATE TABLE IF NOT EXISTS rate_limit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  creado_en TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rl_ip_endpoint ON rate_limit(ip, endpoint);
CREATE INDEX IF NOT EXISTS idx_rl_creado ON rate_limit(creado_en);
