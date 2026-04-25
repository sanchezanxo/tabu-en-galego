-- Esquema MariaDB (produción Lucushost).
-- Mantéñase paralelo a schema.sqlite.sql.
-- CLAUDE.md §7.4.

CREATE TABLE IF NOT EXISTS palabras (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  palabra VARCHAR(80) NOT NULL,
  nivel VARCHAR(20) NOT NULL,
  categoria VARCHAR(40) NOT NULL,
  notas TEXT,
  activa TINYINT(1) DEFAULT 1,
  creada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nivel (nivel),
  INDEX idx_categoria (categoria),
  CHECK (nivel IN ('facil','medio','dificil'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prohibidas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  palabra_id INT UNSIGNED NOT NULL,
  prohibida VARCHAR(80) NOT NULL,
  FOREIGN KEY (palabra_id) REFERENCES palabras(id) ON DELETE CASCADE,
  INDEX idx_palabra (palabra_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partidas (
  id CHAR(36) PRIMARY KEY,
  organizador VARCHAR(60),
  organizador_fp VARCHAR(64),
  num_equipos TINYINT UNSIGNED NOT NULL,
  nivel VARCHAR(20) NOT NULL,
  segundos_quenda SMALLINT UNSIGNED NOT NULL,
  modo VARCHAR(10) NOT NULL,
  obxectivo SMALLINT UNSIGNED NOT NULL,
  duracion_total SMALLINT UNSIGNED,
  inicio DATETIME NOT NULL,
  fin DATETIME,
  INDEX idx_inicio (inicio),
  INDEX idx_fp (organizador_fp),
  CHECK (modo IN ('puntos','roldas'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partida_equipos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  partida_id CHAR(36) NOT NULL,
  posicion TINYINT UNSIGNED NOT NULL,
  nome VARCHAR(60) NOT NULL,
  puntos_finais SMALLINT NOT NULL,
  acertos_total SMALLINT UNSIGNED NOT NULL,
  prohibidas_total SMALLINT UNSIGNED NOT NULL,
  saltos_total SMALLINT UNSIGNED NOT NULL,
  ganador TINYINT(1) DEFAULT 0,
  FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
  INDEX idx_partida (partida_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS palabras_stats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  palabra VARCHAR(80) NOT NULL UNIQUE,
  veces_xogada INT UNSIGNED DEFAULT 0,
  veces_acertada INT UNSIGNED DEFAULT 0,
  veces_saltada INT UNSIGNED DEFAULT 0,
  veces_prohibida INT UNSIGNED DEFAULT 0,
  tempo_medio_acerto FLOAT DEFAULT 0,
  actualizada_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_palabra (palabra)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reportes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  palabra VARCHAR(80) NOT NULL,
  motivo TEXT NOT NULL,
  contacto VARCHAR(120),
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolto TINYINT(1) DEFAULT 0,
  INDEX idx_resolto (resolto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(40) NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_ep (ip, endpoint),
  INDEX idx_creado (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
