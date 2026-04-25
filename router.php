<?php
// router.php — só para `php -S` en desenvolvemento.
// Simula o que fai Apache co .htaccess de produción.
// Lanzar con: php -S localhost:8000 router.php

declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

// Bloquear acceso aos cartafoles sensibles.
if (preg_match('#^/(db|api/lib)(/|$)#', $uri)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Prohibido.';
    return true;
}
// E ao config en si.
if ($uri === '/api/config.php' || str_ends_with($uri, '/.htaccess')) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Prohibido.';
    return true;
}

// Rutas da API → api/index.php (fai o seu propio enrutado interno).
if (str_starts_with($uri, '/api/')) {
    require __DIR__ . '/api/index.php';
    return true;
}

// Ficheiros estáticos físicos → servir directos.
$ruta = __DIR__ . $uri;
if ($uri !== '/' && file_exists($ruta) && !is_dir($ruta)) {
    return false;
}

// Para extensións estáticas que non existen, devolver 404 directo
// en vez de caer no SPA fallback (que devolvería index.html).
if (preg_match('/\.(woff2?|ttf|otf|eot|png|jpe?g|gif|svg|ico|mp3|wav|ogg|css|js|map|webmanifest)$/i', $uri)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Non atopado.';
    return true;
}

// SPA fallback.
require __DIR__ . '/index.html';
return true;
