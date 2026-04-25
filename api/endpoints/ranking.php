<?php
// GET /api/ranking?periodo=semana|mes|todo&top=20
// Devolve os mellores equipos por puntos finais.

declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderErro(405, 'METODO', 'Método non permitido.');
}

$pdo = obterConexion();
verificarLimite($pdo, 'ranking', $config['rate_limit']['max_por_minuto'] * 3);

$periodo = $_GET['periodo'] ?? 'todo';
if (!in_array($periodo, ['semana', 'mes', 'todo'], true)) {
    $periodo = 'todo';
}

$top = (int) ($_GET['top'] ?? 20);
if ($top < 1) $top = 1;
if ($top > 50) $top = 50;

$driverEsSqlite = obterDriver() === 'sqlite';

// Filtro de período sobre p.inicio (ambas BBDD aceptan strings ISO 8601 nas comparacións).
$where = '';
if ($periodo === 'semana') {
    $where = $driverEsSqlite
        ? "WHERE p.inicio >= datetime('now', '-7 days')"
        : "WHERE p.inicio >= (NOW() - INTERVAL 7 DAY)";
} elseif ($periodo === 'mes') {
    $where = $driverEsSqlite
        ? "WHERE p.inicio >= datetime('now', '-30 days')"
        : "WHERE p.inicio >= (NOW() - INTERVAL 30 DAY)";
}

$sql =
    "SELECT e.nome, e.puntos_finais, e.acertos_total, e.prohibidas_total,
            p.organizador, p.nivel, p.modo, p.inicio
     FROM partida_equipos e
     JOIN partidas p ON p.id = e.partida_id
     $where
     ORDER BY e.puntos_finais DESC, e.acertos_total DESC, p.inicio DESC
     LIMIT $top";

$stmt = $pdo->query($sql);
$filas = $stmt->fetchAll();

$resultado = array_map(function ($f) {
    return [
        'nome'        => $f['nome'],
        'puntos'      => (int) $f['puntos_finais'],
        'acertos'     => (int) $f['acertos_total'],
        'prohibidas'  => (int) $f['prohibidas_total'],
        'organizador' => $f['organizador'],
        'nivel'       => $f['nivel'],
        'modo'        => $f['modo'],
        'data'        => $f['inicio'],
    ];
}, $filas);

responderOk(['periodo' => $periodo, 'top' => $top, 'ranking' => $resultado]);
