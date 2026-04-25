# Tabú Galego — As Chaves da Lingua

Web app para xogar ao **Tabú en galego** dentro en https://tabu.gal. Creado por [As Chaves da Lingua](https://aschavesdalingua.gal).

> As instrucións técnicas completas están en [`CLAUDE.md`](./CLAUDE.md). Este README só cobre deploy e arranque.

---

## Stack

- **Frontend**: HTML5 + CSS3 + JavaScript vanilla (ES6+). Sen frameworks, sen build-step.
- **Backend**: PHP 8.1+ procedural.
- **BBDD produción**: MariaDB 10.6+ (Lucushost).
- **BBDD local/dev**: SQLite 3 (ficheiro, sen servidor).
- **Servidor web**: Apache + `.htaccess`.

---

## Desenvolvemento local

### Requirimentos

- PHP 8.1+ con extensións `pdo_sqlite` e `pdo_mysql`.
- Un navegador moderno.

### Pasos

1. Clonar o repo e entrar no directorio:
   ```bash
   git clone <url> tabu-en-galego
   cd tabu-en-galego
   ```

2. Inicializar a BBDD local (SQLite):
   ```bash
   php db/init.php
   ```
   Isto crea `db/tabu.sqlite` (ignorado polo git).

3. Copiar a configuración de exemplo:
   ```bash
   cp api/config.sample.php api/config.php
   ```
   O ficheiro de exemplo xa vén apuntando a SQLite local.

4. Arrancar o servidor de desenvolvemento:
   ```bash
   php -S localhost:8000
   ```

5. Abrir <http://localhost:8000>.

---

## Despregamento en Lucushost (produción)

### 1. Requirimentos unha vez

- Subdominio `tabu.gal` creado no panel de Lucushost, apuntando a `/public_html/tabu/`.
- BBDD MariaDB dedicada (p. ex. `tabu_chaves`) cun usuario con permisos `SELECT, INSERT, UPDATE, DELETE`.

### 2. Subida do código

Subir vía FTP/SFTP a `/public_html/tabu/` **todo agás**:

- `db/tabu.sqlite` (só para dev local).
- `api/config.php` (créase a man no servidor).
- `.git/`, `CLAUDE.md`, `README.md` (opcional, se se quere aforrar espazo).
- `node_modules/`, `.env`, etc. (non existen neste proxecto, pero por se acaso).

### 3. BBDD

1. Abrir phpMyAdmin de Lucushost.
2. Seleccionar a BBDD `tabu_chaves`.
3. Importar `db/schema.mariadb.sql`.

### 4. Configuración

1. No servidor, copiar `api/config.sample.php` a `api/config.php`.
2. Editar `api/config.php` e poñer as credenciais reais de MariaDB (host, usuario, contrasinal, nome de BBDD).
3. Comprobar que `api/.htaccess` contén a regra `Deny` para `config.php`.

### 5. Verificación

- Visitar <https://tabu.gal> e comprobar que a home carga.
- Probar unha partida completa e gardar resultado no ranking.
- Revisar que `.htaccess` forza HTTPS e que a API responde en `/api/token`.

### 6. Actualizacións posteriores

- Subir ficheiros modificados vía FTP.
- Se hai migracións de BBDD pendentes: aplicar os SQL de `db/migrations/` en orde ascendente desde phpMyAdmin.

---

## Estrutura do proxecto

Descrición completa en [`CLAUDE.md` §3](./CLAUDE.md). Resumo:

```
├── index.html                # SPA single-page
├── assets/                   # css, js, fonts, img, sounds
├── data/palabras.json        # base léxica (v1)
├── api/                      # backend PHP
└── db/                       # esquemas e migracións
```

---

## Fases de desenvolvemento

Ver `CLAUDE.md` §12. Estado actual: **Fases 0–5 completadas**.

- ✅ Fase 0: estrutura + `palabras.json` (30 palabras de arranque) + README.
- ✅ Fase 1: UI estática navegable (HTML/CSS, 5 pantallas).
- ✅ Fase 2: lóxica do xogo no cliente (game.js, timer.js, persistencia en localStorage).
- ✅ Fase 3: backend mínimo (PHP/PDO, SQLite local + MariaDB en produción, endpoints `token`, `game-end`).
- ✅ Fase 4: ranking, estatísticas globais e pantalla de consulta.
- ✅ Fase 5: pulido — sons sintéticos con toggle mute, "Como se xoga", reporte de palabras, páxina Legal con Google Analytics propio (`G-5766K3C7RH`).
- ⏳ Fase 6 (opcional): panel admin con HTTP Basic Auth para revisar reportes e xestionar palabras; modo aula.

---

## Licenza

- **Código**: pendente de definir co propietario do proxecto.
- **Base léxica** (`data/palabras.json`): CC BY-NC 4.0.
