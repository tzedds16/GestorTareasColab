<?php
/**
 * Script de inicialización de la base de datos
 * Ejecutar una sola vez: http://localhost:8888/GestorTareasColab/setup.php
 */

// Suprime errores para no mostrar mensajes de conexión fallida
$suppress_errors = true;

// Primero intentar conexión sin seleccionar BD para crearla
$host = '127.0.0.1';
$port = 8889; // Cambiar a 3306 si está en Windows
$user = 'root';
$pass = 'root';

// Conexión sin seleccionar BD
$conn_raw = @new mysqli($host, $user, $pass, '', $port);

if ($conn_raw->connect_error) {
    die(json_encode([
        'success' => false,
        'error' => 'Error de conexión: ' . $conn_raw->connect_error,
        'hints' => [
            'Verifica que MAMP esté ejecutándose',
            'En Mac, el puerto es 8889',
            'En Windows, el puerto es 3306',
            'Usuario: root',
            'Contraseña: root'
        ]
    ]));
}

// Leer el archivo schema.sql
$schema_file = __DIR__ . '/schema.sql';
if (!file_exists($schema_file)) {
    die(json_encode([
        'success' => false,
        'error' => 'Archivo schema.sql no encontrado',
        'path' => $schema_file
    ]));
}

$sql_content = file_get_contents($schema_file);

// Ejecutar cada instrucción SQL
$statements = array_filter(array_map('trim', explode(';', $sql_content)), function($s) {
    return !empty($s) && !preg_match('/^\s*--/', $s);
});

$success_count = 0;
$error_messages = [];

foreach ($statements as $statement) {
    if (empty(trim($statement))) continue;
    
    if (!$conn_raw->query($statement)) {
        // Ignorar errores si la BD ya existe
        if (strpos($conn_raw->error, 'already exists') === false) {
            $error_messages[] = $conn_raw->error;
        }
    } else {
        $success_count++;
    }
}

// Conexión final con BD seleccionada para verificar
$conn = new mysqli($host, $user, $pass, 'gestor_tareas', $port);
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'error' => 'Error al conectar a la BD: ' . $conn->connect_error
    ]));
}

// Verificar tablas
$tables_result = $conn->query("SHOW TABLES");
$tables = [];
while ($row = $tables_result->fetch_array(MYSQLI_NUM)) {
    $tables[] = $row[0];
}

$response = [
    'success' => true,
    'message' => 'Base de datos inicializada correctamente',
    'statements_executed' => $success_count,
    'tables_created' => $tables,
    'test_user' => [
        'email' => 'demo@example.com',
        'password' => 'demo1234',
        'note' => 'Usuario de prueba creado'
    ]
];

if (!empty($error_messages)) {
    $response['warnings'] = $error_messages;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

$conn_raw->close();
if (isset($conn)) $conn->close();
?>
