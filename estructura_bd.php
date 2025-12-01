<?php
/**
 * Script para ver la estructura final de la BD
 * Ejecutar: http://localhost:8888/GestorTareasColab/estructura_bd.php
 */

$host = '127.0.0.1';
$port = 8889;
$user = 'root';
$pass = 'root';
$database = 'gestor_tareas';

// Conexión
$conn = new mysqli($host, $user, $pass, $database, $port);

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'error' => 'Error de conexión: ' . $conn->connect_error
    ]));
}

// 1. Obtener todas las tablas
$result = $conn->query("SHOW TABLES");
$tables = [];
while ($row = $result->fetch_array(MYSQLI_NUM)) {
    $tables[] = $row[0];
}

// 2. Para cada tabla, obtener su estructura y registros
$estructura = [];
foreach ($tables as $table) {
    // Estructura
    $result = $conn->query("DESCRIBE $table");
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = [
            'Field' => $row['Field'],
            'Type' => $row['Type'],
            'Null' => $row['Null'],
            'Key' => $row['Key'],
            'Default' => $row['Default']
        ];
    }
    
    // Cantidad de registros
    $result = $conn->query("SELECT COUNT(*) as total FROM $table");
    $count = $result->fetch_assoc()['total'];
    
    $estructura[$table] = [
        'columnas' => $columns,
        'registros' => $count
    ];
}

$response = [
    'success' => true,
    'base_datos' => $database,
    'tablas_totales' => count($tables),
    'tablas' => $estructura,
    'descripcion' => [
        'usuarios' => 'Almacena los usuarios del sistema (id, nombre, email, password, rol)',
        'proyectos' => 'Proyectos creados por usuarios (id, nombre, descripcion, color, usuario_id)',
        'tableros' => 'Tableros Kanban dentro de proyectos (id, nombre, proyecto_id, posicion)',
        'tareas' => 'Tareas individuales dentro de tableros (id, tablero_id, titulo, descripcion, estado, prioridad, orden)',
        'colaboradores' => 'Usuarios colaboradores en proyectos (id, proyecto_id, usuario_id, rol)'
    ]
];

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

$conn->close();
?>
