# Tabú Galego — As Chaves da Lingua

Web app para xogar ao **Tabú en galego** dentro en https://tabu.gal. Creado por Anxo Sánchez para [As Chaves da Lingua](https://aschavesdalingua.gal).

---

## Stack

- **Frontend**: HTML5 + CSS3 + JavaScript vanilla (ES6+). Sen frameworks, sen build-step.
- **Backend**: PHP 8.1+ procedural.
- **BBDD produción**: MariaDB 10.6+ (ou SQLite, segundo o despregue).
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

## Estrutura do proxecto

```
├── index.html                # SPA single-page
├── assets/                   # css, js, fonts, img, sounds
├── data/palabras.json        # base léxica (v1)
├── api/                      # backend PHP
└── db/                       # esquemas e migracións
```

---

## Licenza

- **Código**: [MIT](./LICENSE).
- **Base léxica** (`data/palabras.json`): CC BY-NC 4.0.
