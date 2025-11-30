<?php
session_start();
require_once '../api/config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = trim($_POST['nombre'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmar_password = $_POST['confirmar_password'] ?? '';
    
    // Validaciones
    if (empty($nombre) || empty($email) || empty($password) || $password !== $confirmar_password) {
        header('Location: auth.html?error=3');
        exit;
    }
    
    if (strlen($password) < 6) {
        header('Location: auth.html?error=3');
        exit;
    }
    
    try {
        // Verificar si email existe
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        
        if ($stmt->get_result()->num_rows > 0) {
            header('Location: auth.html?error=4');
            exit;
        }
        
        // Crear usuario
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param('sss', $nombre, $email, $password_hash);
        
        if ($stmt->execute()) {
            $_SESSION['usuario_id'] = $conn->insert_id;
            $_SESSION['nombre'] = $nombre;
            $_SESSION['email'] = $email;
            $_SESSION['rol'] = 'usuario';
            
            header('Location: proyectos.html');
            exit;
        } else {
            header('Location: auth.html?error=5');
            exit;
        }
    } catch (Exception $e) {
        header('Location: auth.html?error=2');
        exit;
    }
}

header('Location: auth.html');
exit;
?>