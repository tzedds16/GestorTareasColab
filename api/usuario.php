<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

echo json_encode([
    'success' => true,
    'usuario' => [
        'id' => $_SESSION['usuario_id'],
        'nombre' => $_SESSION['nombre'],
        'email' => $_SESSION['email'],
        'rol' => $_SESSION['rol'] ?? 'usuario'
    ]
]);
?>
