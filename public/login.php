<?php
session_start();
require_once '../api/config/database.php';

// Si ya está logueado, redirigir a proyectos
if (isset($_SESSION['usuario_id'])) {
    header('Location: proyectos.php');
    exit;
}

// Si no es POST, redirigir a auth.html
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: auth.html');
    exit;
}

// Procesar login
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    header('Location: auth.html?error=3&tab=login');
    exit;
}

try {
    $stmt = $conn->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    
    if ($usuario && password_verify($password, $usuario['password'])) {
        // Login exitoso - crear sesión
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['nombre'] = $usuario['nombre'];
        $_SESSION['email'] = $usuario['email'];
        $_SESSION['rol'] = $usuario['rol'];
        
        // Redirigir a proyectos mostrando un popup de éxito
        header('Location: proyectos.php?login_success=1');
        exit;
    } else {
        // Email no existe o contraseña incorrecta
        header('Location: auth.html?error=1&tab=login');
        exit;
    }
} catch (Exception $e) {
    header('Location: auth.html?error=2&tab=login');
    exit;
}
?>
