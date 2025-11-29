<?php
header('Content-Type: application/json');
session_start();

// Modo prueba
if (!isset($_SESSION['usuario_id'])) {
    $_SESSION['usuario_id'] = 1;
    $_SESSION['nombre'] = 'Usuario Demo';
    $_SESSION['email'] = 'demo@test.com';
}

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && isset($_GET['id'])) {
    $proyecto_id = intval($_GET['id']);
    
    try {
        // Obtener proyecto
        $stmt = $conn->prepare("SELECT * FROM proyectos WHERE id = ?");
        $stmt->bind_param('i', $proyecto_id);
        $stmt->execute();
        $proyecto = $stmt->get_result()->fetch_assoc();
        
        if (!$proyecto) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Proyecto no encontrado']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'proyecto' => $proyecto,
            'usuario' => [
                'id' => $_SESSION['usuario_id'],
                'nombre' => $_SESSION['nombre'],
                'email' => $_SESSION['email']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error del servidor: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Petición inválida']);
}
?>