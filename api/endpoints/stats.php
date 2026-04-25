<?php
// GET /api/stats → estatísticas globais do xogo.
// - palabras máis acertadas / menos acertadas
// - palabras máis prohibidas
// - tempo medio de acerto máis rápido / máis lento
// - número total de partidas

declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderErro(405, 'METODO', 'Método non permitido.');
}

$pdo = obterConexion();
verificarLimite($pdo, 'stats', $config['rate_limit']['max_por_minuto'] * 3);

$totalPartidas    = (int) $pdo->query('SELECT COUNT(*) FROM partidas')->fetchColumn();
$totalPalabras    = (int) $pdo->query('SELECT COUNT(*) FROM palabras_stats')->fetchColumn();
$totalAcertos     = (int) ($pdo->query('SELECT COALESCE(SUM(veces_acertada), 0) FROM palabras_stats')->fetchColumn() ?: 0);
$totalXogadas     = (int) ($pdo->query('SELECT COALESCE(SUM(veces_xogada), 0) FROM palabras_stats')->fetchColumn() ?: 0);
$totalOrganizadores = (int) $pdo->query("SELECT COUNT(DISTINCT organizador_fp) FROM partidas WHERE organizador_fp IS NOT NULL AND organizador_fp <> ''")->fetchColumn();
$totalEquipos     = (int) $pdo->query('SELECT COUNT(*) FROM partida_equipos')->fetchColumn();

// Top 10 máis acertadas (mínimo 2 xogadas para evitar ruído).
$masAcertadas = $pdo->query(
    "SELECT palabra,
            veces_xogada,
            veces_acertada,
            (veces_acertada * 1.0 / veces_xogada) AS taxa
     FROM palabras_stats
     WHERE veces_xogada >= 2
     ORDER BY taxa DESC, veces_xogada DESC
     LIMIT 10"
)->fetchAll();

$menosAcertadas = $pdo->query(
    "SELECT palabra,
            veces_xogada,
            veces_acertada,
            (veces_acertada * 1.0 / veces_xogada) AS taxa
     FROM palabras_stats
     WHERE veces_xogada >= 2
     ORDER BY taxa ASC, veces_xogada DESC
     LIMIT 10"
)->fetchAll();

$tempoRapido = $pdo->query(
    "SELECT palabra, tempo_medio_acerto, veces_acertada
     FROM palabras_stats
     WHERE veces_acertada >= 2 AND tempo_medio_acerto > 0
     ORDER BY tempo_medio_acerto ASC
     LIMIT 5"
)->fetchAll();

$tempoLento = $pdo->query(
    "SELECT palabra, tempo_medio_acerto, veces_acertada
     FROM palabras_stats
     WHERE veces_acertada >= 2 AND tempo_medio_acerto > 0
     ORDER BY tempo_medio_acerto DESC
     LIMIT 5"
)->fetchAll();

function normalizarTaxa(array $filas): array {
    return array_map(function ($f) {
        return [
            'palabra' => $f['palabra'],
            'xogada'  => (int) $f['veces_xogada'],
            'acertada' => (int) $f['veces_acertada'],
            'taxa'    => round((float) $f['taxa'], 3),
        ];
    }, $filas);
}

function normalizarTempo(array $filas): array {
    return array_map(function ($f) {
        return [
            'palabra'  => $f['palabra'],
            'tempoMedio' => round((float) $f['tempo_medio_acerto'], 1),
            'acertada' => (int) $f['veces_acertada'],
        ];
    }, $filas);
}

responderOk([
    'totais' => [
        'partidas'      => $totalPartidas,
        'palabras'      => $totalPalabras,
        'acertos'       => $totalAcertos,
        'xogadas'       => $totalXogadas,
        'organizadores' => $totalOrganizadores,
        'equipos'       => $totalEquipos,
    ],
    'masAcertadas'   => normalizarTaxa($masAcertadas),
    'menosAcertadas' => normalizarTaxa($menosAcertadas),
    'tempoRapido' => normalizarTempo($tempoRapido),
    'tempoLento'  => normalizarTempo($tempoLento),
]);
