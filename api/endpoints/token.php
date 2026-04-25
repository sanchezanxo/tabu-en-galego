<?php
// GET /api/token → devolve token CSRF (e crea cookie de sesión se non existe).

declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    responderErro(405, 'METODO', 'Método non permitido.');
}

$pdo = obterConexion();
verificarLimite($pdo, 'token', $config['rate_limit']['max_por_minuto'] * 3);

$sesion = obterOuCrearSesion($config);
$token = xerarCsrfToken($sesion, $config);

responderOk(['csrf' => $token]);
