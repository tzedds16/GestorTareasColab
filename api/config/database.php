<?php
// Prevenir acceso directo
defined('ACCESO_PERMITIDO') or define('ACCESO_PERMITIDO', true);

// Habilitar errores para debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configuración MAMP
// Ajusta según el resultado de test_diagnostico.php
define('DB_HOST', '127.0.0.1'); // Prueba con 127.0.0.1 primero
define('DB_PORT', 8889);         // 8889 en Mac Y Windows MAMP, 3306 en MySQL nativo
define('DB_NAME', 'gestor_tareas');
define('DB_USER', 'root');
define('DB_PASS', 'root');       // Prueba con 'root' o '' (vacío)

try {
    // Crear conexión
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    
    // Verificar conexión
    if ($conn->connect_error) {
        throw new Exception($conn->connect_error, $conn->connect_errno);
    }
    
    // Establecer charset
    if (!$conn->set_charset('utf8mb4')) {
        throw new Exception('Error al establecer charset: ' . $conn->error);
    }
    
} catch (Exception $e) {
    die(json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'config' => [
            'host' => DB_HOST,
            'port' => DB_PORT,
            'user' => DB_USER,
            'database' => DB_NAME
        ]
    ]));
}
?>