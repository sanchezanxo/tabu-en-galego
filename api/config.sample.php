<?php
// Modelo de configuración. Copia a api/config.php e edita os valores.
// CLAUDE.md §7.6.

return [
    // 'development' en local, 'production' no servidor.
    'env' => 'development',

    'db' => [
        // En local: 'sqlite'. En Lucushost: 'mysql'.
        'driver'      => 'sqlite',
        'sqlite_path' => __DIR__ . '/../db/tabu.sqlite',

        // Só se usan con driver='mysql':
        'host'     => 'localhost',
        'port'     => 3306,
        'database' => 'tabu_chaves',
        'user'     => 'usuario',
        'password' => '__CAMBIAR__',
    ],

    // Xerar con: php -r "echo bin2hex(random_bytes(32)).PHP_EOL;"
    // Distintos en local e produción. Nunca commitear este ficheiro.
    'csrf_salt'        => '__XERAR_32_BYTES_ALEATORIOS__',
    'fingerprint_salt' => '__XERAR_OUTROS_32_BYTES__',

    // Orixe permitida para CORS (en produción).
    'origen_permitido' => 'https://tabu.gal',

    // Ficheiro de log (fóra do webroot en produción).
    'log_path' => __DIR__ . '/../tabu-erros.log',

    'rate_limit' => [
        'max_por_minuto' => 10,
    ],
];
