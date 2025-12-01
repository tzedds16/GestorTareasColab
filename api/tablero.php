<?php
header('Content-Type: application/json');
require_once './config/database.php';
session_start();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$tablero_id = $_GET['id'] ?? null;

if (!$tablero_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de tablero requerido']);
    exit;
}

try {
    // Obtener tablero y verificar acceso
    $stmt = $conn->prepare("
        SELECT t.id, t.nombre, p.id as proyecto_id, p.nombre as proyecto_nombre
        FROM tableros t
        JOIN proyectos p ON t.proyecto_id = p.id
        WHERE t.id = ? AND (p.usuario_id = ? OR p.id IN (
            SELECT proyecto_id FROM colaboradores WHERE usuario_id = ?
        ))
    ");
    
    $usuario_id = $_SESSION['usuario_id'];
    $stmt->bind_param('iii', $tablero_id, $usuario_id, $usuario_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($tablero = $result->fetch_assoc()) {
        echo json_encode([
            'success' => true,
            'tablero' => $tablero
        ]);
    } else {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este tablero']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
