<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado', 'redirect' => 'auth.html']);
    exit;
}

echo json_encode(['success' => true, 'authenticated' => true]);
?>
