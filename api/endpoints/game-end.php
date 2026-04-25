<?php
// POST /api/game-end → garda partida, equipos e actualiza stats de palabras.

declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderErro(405, 'METODO', 'Método non permitido.');
}

validarCsrf($config);

$pdo = obterConexion();
verificarLimite($pdo, 'game-end', $config['rate_limit']['max_por_minuto']);

$body = lerBody();

// ---------- Validación ----------
$id = validarUuid((string)($body['id'] ?? ''));
$organizador = validarOrganizadorOpcional(isset($body['organizador']) ? (string)$body['organizador'] : null);

$cfg = $body['config'] ?? null;
if (!is_array($cfg)) {
    throw new InvalidArgumentException('Falta a configuración.');
}
$numEquipos     = validarRangoInt($cfg['num_equipos']     ?? null, 2, 4, 'num_equipos');
$nivel          = validarNivel((string)($cfg['nivel']     ?? ''));
$modo           = validarModo((string)($cfg['modo']       ?? ''));
$obxectivo      = validarRangoInt($cfg['obxectivo']       ?? null, 1, 200, 'obxectivo');
$segundosQuenda = validarRangoInt($cfg['segundos_quenda'] ?? null, 10, 600, 'segundos_quenda');

$inicio = validarRangoInt($body['inicio'] ?? null, 1_000_000_000_000, 9_999_999_999_999, 'inicio');
$fin    = validarRangoInt($body['fin']    ?? null, 1_000_000_000_000, 9_999_999_999_999, 'fin');
if ($fin < $inicio) {
    throw new InvalidArgumentException('A data de fin é anterior ao inicio.');
}
$duracionSeg = (int) round(($fin - $inicio) / 1000);
if ($duracionSeg > 24 * 3600) {
    throw new InvalidArgumentException('Duración da partida fóra de rango.');
}

$equipos = $body['equipos'] ?? null;
if (!is_array($equipos) || count($equipos) !== $numEquipos) {
    throw new InvalidArgumentException('Lista de equipos inconsistente.');
}

$equiposNorm = [];
foreach ($equipos as $i => $eq) {
    if (!is_array($eq)) {
        throw new InvalidArgumentException("Equipo {$i} inválido.");
    }
    $nome      = validarNomeEquipo((string)($eq['nome'] ?? ''), 'Nome de equipo');
    $puntos    = validarRangoInt($eq['puntos']    ?? null, -200, 200, 'puntos');
    $acertos   = is_array($eq['acertos']    ?? null) ? $eq['acertos']    : [];
    $prohibidas = is_array($eq['prohibidas'] ?? null) ? $eq['prohibidas'] : [];
    $saltos    = is_array($eq['saltos']     ?? null) ? $eq['saltos']     : [];

    $equiposNorm[] = [
        'posicion'         => $i,
        'nome'             => $nome,
        'puntos_finais'    => $puntos,
        'acertos_total'    => count($acertos),
        'prohibidas_total' => count($prohibidas),
        'saltos_total'     => count($saltos),
    ];
}

// Determinar gañadores (pode haber empate).
$maxPuntos = max(array_column($equiposNorm, 'puntos_finais'));
foreach ($equiposNorm as &$eq) {
    $eq['ganador'] = ($eq['puntos_finais'] === $maxPuntos) ? 1 : 0;
}
unset($eq);

// Lista de palabras xogadas (para alimentar palabras_stats).
$palabrasXogadas = $body['palabras'] ?? [];
if (!is_array($palabrasXogadas)) {
    throw new InvalidArgumentException('Lista de palabras inválida.');
}
if (count($palabrasXogadas) > 1000) {
    throw new InvalidArgumentException('Demasiadas palabras nunha partida.');
}

// Agrupar por palabra para reducir UPSERTs.
$delta = []; // ['palabra' => ['xogada','acertada','saltada','prohibida','sumaTempoAcerto']]
foreach ($palabrasXogadas as $entrada) {
    if (!is_array($entrada)) continue;
    $palabra = validarPalabra((string)($entrada['palabra'] ?? ''));
    $resultado = (string)($entrada['resultado'] ?? '');
    if (!in_array($resultado, ['acerto', 'prohibida', 'saltada', 'anulada'], true)) continue;
    // 'anulada' non se conta en estatísticas; pásase de longo.
    if ($resultado === 'anulada') continue;

    if (!isset($delta[$palabra])) {
        $delta[$palabra] = [
            'xogada' => 0, 'acertada' => 0, 'saltada' => 0, 'prohibida' => 0,
            'sumaTempoAcerto' => 0.0,
        ];
    }
    $delta[$palabra]['xogada']++;
    if ($resultado === 'acerto') {
        $delta[$palabra]['acertada']++;
        $tempo = $entrada['tempo'] ?? null;
        if (is_numeric($tempo) && $tempo > 0 && $tempo < 3600) {
            $delta[$palabra]['sumaTempoAcerto'] += (float) $tempo;
        }
    } elseif ($resultado === 'prohibida') {
        $delta[$palabra]['prohibida']++;
    } else {
        $delta[$palabra]['saltada']++;
    }
}

// ---------- Inserción ----------
$inicioIso = msIso8601($inicio);
$finIso    = msIso8601($fin);
$fingerprint = obterFingerprint($config);

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO partidas
         (id, organizador, organizador_fp, num_equipos, nivel, segundos_quenda,
          modo, obxectivo, duracion_total, inicio, fin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $id, $organizador, $fingerprint, $numEquipos, $nivel, $segundosQuenda,
        $modo, $obxectivo, $duracionSeg, $inicioIso, $finIso,
    ]);

    $stmtEq = $pdo->prepare(
        'INSERT INTO partida_equipos
         (partida_id, posicion, nome, puntos_finais, acertos_total,
          prohibidas_total, saltos_total, ganador)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($equiposNorm as $eq) {
        $stmtEq->execute([
            $id,
            $eq['posicion'],
            $eq['nome'],
            $eq['puntos_finais'],
            $eq['acertos_total'],
            $eq['prohibidas_total'],
            $eq['saltos_total'],
            $eq['ganador'],
        ]);
    }

    foreach ($delta as $palabra => $d) {
        actualizarStatsPalabra($pdo, $palabra, $d);
    }

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    // Conflito de PRIMARY KEY → o id xa existía. Trátase como duplicado.
    if (str_contains((string)$e->getMessage(), 'UNIQUE') ||
        str_contains((string)$e->getMessage(), 'Duplicate')) {
        responderErro(409, 'DUPLICADO', 'Esta partida xa estaba gardada.');
    }
    throw $e;
}

responderOk(['id' => $id]);
