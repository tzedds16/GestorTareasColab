<?php
// check_session.php - Verificar que el usuario esté logueado
session_start();

if (!isset($_SESSION['usuario_id'])) {
    header('Location: auth.html');
    exit;
}
?>
