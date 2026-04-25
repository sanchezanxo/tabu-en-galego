<?php
// POST /api/report-word → garda un reporte de palabra mal formada.

declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responderErro(405, 'METODO', 'Método non permitido.');
}

validarCsrf($config);

$pdo = obterConexion();
verificarLimite($pdo, 'report-word', $config['rate_limit']['max_por_minuto']);

$body = lerBody();

$palabra = validarPalabra((string)($body['palabra'] ?? ''));

$motivosValidos = ['ortografia', 'prohibidas', 'dificultade', 'outro'];
$motivo = (string)($body['motivo'] ?? '');
if (!in_array($motivo, $motivosValidos, true)) {
    throw new InvalidArgumentException('Motivo non válido.');
}

// Detalles libres opcionais (só permitidos co motivo "outro").
$detalle = isset($body['detalle']) ? trim((string)$body['detalle']) : '';
if ($detalle !== '') {
    if (mb_strlen($detalle) > 500) {
        throw new InvalidArgumentException('Detalle demasiado longo.');
    }
    // Bloquea spam con URLs.
    if (preg_match('#https?://#i', $detalle)) {
        throw new InvalidArgumentException('Non se permiten URLs no detalle.');
    }
    $motivoFinal = $motivo . ': ' . $detalle;
} else {
    $motivoFinal = $motivo;
}

$pdo->prepare('INSERT INTO reportes (palabra, motivo) VALUES (?, ?)')
    ->execute([$palabra, $motivoFinal]);

responderOk(['gardado' => true]);
