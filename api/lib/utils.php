<?php
// Helpers compartidos para os endpoints.
// CLAUDE.md §11 (seguridade).

declare(strict_types=1);

const TAMANO_MAXIMO_BODY = 16384; // 16 KB
const COOKIE_SESION = 'tabu_sid';

// ---------- Resposta ----------

function responderJson(array $datos, int $codigo = 200): void {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function responderOk(array $datos = []): void {
    responderJson(['ok' => true, 'datos' => $datos]);
}

function responderErro(int $codigo, string $clave, string $mensaxe): void {
    responderJson(['ok' => false, 'erro' => $mensaxe, 'codigo' => $clave], $codigo);
}

// ---------- CORS ----------

function configurarCors(array $config): void {
    $origen = $_SERVER['HTTP_ORIGIN'] ?? '';
    $permitidas = [$config['origen_permitido']];
    if (($config['env'] ?? 'production') === 'development') {
        $permitidas[] = 'http://localhost:8000';
        $permitidas[] = 'http://127.0.0.1:8000';
    }
    if ($origen && in_array($origen, $permitidas, true)) {
        header('Access-Control-Allow-Origin: ' . $origen);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
        header('Access-Control-Allow-Credentials: true');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ---------- Cookie de sesión + CSRF ----------

function obterOuCrearSesion(array $config): string {
    $sid = $_COOKIE[COOKIE_SESION] ?? '';
    if (!preg_match('/^[a-f0-9]{64}$/', $sid)) {
        $sid = bin2hex(random_bytes(32));
        $secure = (($config['env'] ?? 'production') !== 'development');
        setcookie(COOKIE_SESION, $sid, [
            'expires'  => 0,
            'path'     => '/',
            'secure'   => $secure,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        $_COOKIE[COOKIE_SESION] = $sid;
    }
    return $sid;
}

function xerarCsrfToken(string $sesion, array $config): string {
    return hash_hmac('sha256', $sesion, $config['csrf_salt']);
}

function validarCsrf(array $config): void {
    $recibido = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $sesion   = $_COOKIE[COOKIE_SESION] ?? '';
    if ($sesion === '' || !preg_match('/^[a-f0-9]{64}$/', $sesion)) {
        responderErro(403, 'CSRF_NO_SESION', 'Falta sesión. Pide /api/token primeiro.');
    }
    if ($recibido === '' || strlen($recibido) !== 64) {
        responderErro(403, 'CSRF_MISSING', 'Falta token de seguridade.');
    }
    $esperado = xerarCsrfToken($sesion, $config);
    if (!hash_equals($esperado, $recibido)) {
        responderErro(403, 'CSRF_INVALID', 'Token inválido.');
    }
}

// ---------- Lectura de body ----------

function lerBody(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false) {
        responderErro(400, 'BODY_ERR', 'Non se puido ler o corpo da petición.');
    }
    if (strlen($raw) > TAMANO_MAXIMO_BODY) {
        responderErro(413, 'BODY_TOO_LARGE', 'Petición demasiado grande.');
    }
    if ($raw === '') {
        responderErro(400, 'BODY_VACIO', 'Corpo baleiro.');
    }
    $datos = json_decode($raw, true);
    if (!is_array($datos)) {
        responderErro(400, 'BODY_JSON', 'JSON inválido.');
    }
    return $datos;
}

// ---------- Validación ----------

function validarNomeEquipo(string $nome, string $contexto = 'Nome'): string {
    $nome = trim($nome);
    if (mb_strlen($nome) < 1 || mb_strlen($nome) > 60) {
        throw new InvalidArgumentException("$contexto: lonxitude inválida.");
    }
    if (!preg_match('/^[\p{L}\p{N} \-\'·]+$/u', $nome)) {
        throw new InvalidArgumentException("$contexto: caracteres non permitidos.");
    }
    return $nome;
}

function validarNivel(string $nivel): string {
    $validos = ['facil', 'medio', 'dificil', 'mesturado'];
    if (!in_array($nivel, $validos, true)) {
        throw new InvalidArgumentException('Nivel inválido.');
    }
    return $nivel;
}

function validarModo(string $modo): string {
    if (!in_array($modo, ['puntos', 'roldas'], true)) {
        throw new InvalidArgumentException('Modo inválido.');
    }
    return $modo;
}

function validarRangoInt($valor, int $min, int $max, string $campo): int {
    if (!is_int($valor) && !(is_string($valor) && ctype_digit($valor))) {
        throw new InvalidArgumentException("$campo: ten que ser un enteiro.");
    }
    $n = (int) $valor;
    if ($n < $min || $n > $max) {
        throw new InvalidArgumentException("$campo: fóra de rango ($min..$max).");
    }
    return $n;
}

function validarUuid(string $uuid): string {
    if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $uuid)) {
        throw new InvalidArgumentException('Identificador de partida inválido.');
    }
    return strtolower($uuid);
}

function validarPalabra(string $p): string {
    $p = trim($p);
    if (mb_strlen($p) < 1 || mb_strlen($p) > 80) {
        throw new InvalidArgumentException('Palabra con lonxitude inválida.');
    }
    if (!preg_match('/^[\p{L}\p{N} \-\']+$/u', $p)) {
        throw new InvalidArgumentException('Palabra con caracteres non permitidos.');
    }
    return $p;
}

function validarOrganizadorOpcional(?string $nome): ?string {
    if ($nome === null) return null;
    $nome = trim($nome);
    if ($nome === '') return null;
    return validarNomeEquipo($nome, 'Organizador');
}

// ---------- Fingerprint ----------

function obterFingerprint(array $config): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    return hash_hmac('sha256', $ip . '|' . $ua, $config['fingerprint_salt']);
}

// ---------- Rate limiting ----------

function verificarLimite(PDO $pdo, string $endpoint, int $maxPorMinuto): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    if (obterDriver() === 'sqlite') {
        $sqlBorrar = "DELETE FROM rate_limit WHERE creado_en < datetime('now', '-1 minute')";
    } else {
        $sqlBorrar = "DELETE FROM rate_limit WHERE creado_en < (NOW() - INTERVAL 1 MINUTE)";
    }
    try {
        $pdo->exec($sqlBorrar);
    } catch (Throwable $e) {
        // Non bloqueante: o limite seguirá funcionando aínda sen limpeza.
    }

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM rate_limit WHERE ip = ? AND endpoint = ?');
    $stmt->execute([$ip, $endpoint]);
    if ((int) $stmt->fetchColumn() >= $maxPorMinuto) {
        responderErro(429, 'RATE_LIMIT', 'Demasiadas peticións. Agarda un momento.');
    }

    $pdo->prepare('INSERT INTO rate_limit (ip, endpoint) VALUES (?, ?)')
        ->execute([$ip, $endpoint]);
}

// ---------- Datas ----------

function msIso8601(int $ms): string {
    // Convén pasar UTC para coincidir entre SQLite (datetime('now') en UTC) e MariaDB.
    $dt = (new DateTimeImmutable('@' . intdiv($ms, 1000)))
        ->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Y-m-d H:i:s');
}

// ---------- UPSERT portable de palabras_stats ----------

function actualizarStatsPalabra(PDO $pdo, string $palabra, array $delta): void {
    // delta: ['xogada'=>1,'acertada'=>0,'saltada'=>0,'prohibida'=>0,'sumaTempoAcerto'=>0.0]
    $sel = $pdo->prepare(
        'SELECT veces_xogada, veces_acertada, veces_saltada, veces_prohibida, tempo_medio_acerto
         FROM palabras_stats WHERE palabra = ?'
    );
    $sel->execute([$palabra]);
    $fila = $sel->fetch();

    if ($fila === false) {
        $tempoMedio = 0.0;
        if ($delta['acertada'] > 0 && $delta['sumaTempoAcerto'] > 0) {
            $tempoMedio = $delta['sumaTempoAcerto'] / $delta['acertada'];
        }
        $ins = $pdo->prepare(
            'INSERT INTO palabras_stats
             (palabra, veces_xogada, veces_acertada, veces_saltada, veces_prohibida, tempo_medio_acerto)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            $palabra,
            $delta['xogada'],
            $delta['acertada'],
            $delta['saltada'],
            $delta['prohibida'],
            $tempoMedio,
        ]);
        return;
    }

    $acertosPrev = (int) $fila['veces_acertada'];
    $tempoMedioPrev = (float) $fila['tempo_medio_acerto'];
    $acertosNovos = $delta['acertada'];
    $totalAcertos = $acertosPrev + $acertosNovos;

    $tempoMedio = $tempoMedioPrev;
    if ($totalAcertos > 0) {
        $tempoMedio = (
            $tempoMedioPrev * $acertosPrev + $delta['sumaTempoAcerto']
        ) / $totalAcertos;
    }

    if (obterDriver() === 'sqlite') {
        $upd = $pdo->prepare(
            "UPDATE palabras_stats
             SET veces_xogada = veces_xogada + ?,
                 veces_acertada = veces_acertada + ?,
                 veces_saltada = veces_saltada + ?,
                 veces_prohibida = veces_prohibida + ?,
                 tempo_medio_acerto = ?,
                 actualizada_en = datetime('now')
             WHERE palabra = ?"
        );
    } else {
        $upd = $pdo->prepare(
            'UPDATE palabras_stats
             SET veces_xogada = veces_xogada + ?,
                 veces_acertada = veces_acertada + ?,
                 veces_saltada = veces_saltada + ?,
                 veces_prohibida = veces_prohibida + ?,
                 tempo_medio_acerto = ?
             WHERE palabra = ?'
        );
    }
    $upd->execute([
        $delta['xogada'],
        $delta['acertada'],
        $delta['saltada'],
        $delta['prohibida'],
        $tempoMedio,
        $palabra,
    ]);
}

// ---------- Logging ----------

function rexistrarErro(Throwable $e, array $config): void {
    $linha = '[' . date('c') . '] ' . $e->getMessage()
           . ' @ ' . $e->getFile() . ':' . $e->getLine() . "\n";
    @error_log($linha, 3, $config['log_path']);
}
