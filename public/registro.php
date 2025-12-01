<?php
session_start();
require_once '../api/config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = trim($_POST['nombre'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmar_password = $_POST['confirmar_password'] ?? '';
    
    if (empty($nombre) || empty($email) || empty($password) || empty($confirmar_password)) {
        header('Location: auth.html?error=3&tab=register');
        exit;
    }
    
    if ($password !== $confirmar_password) {
        header('Location: auth.html?error=3&tab=register');
        exit;
    }
    
    if (strlen($password) < 6) {
        header('Location: auth.html?error=3&tab=register');
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header('Location: auth.html?error=3&tab=register');
        exit;
    }
    
    try {
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            header('Location: auth.html?error=4&tab=register');
            exit;
        }
        
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param('sss', $nombre, $email, $password_hash);
        
        if ($stmt->execute()) {
            header('Location: auth.html?success=1&tab=login');
            exit;
        } else {
            header('Location: auth.html?error=5&tab=register');
            exit;
        }
    } catch (Exception $e) {
        header('Location: auth.html?error=2&tab=register');
        exit;
    }
}

header('Location: auth.html');
exit;
?>