<?php
header('Content-Type: application/json');
require_once '../config/database.php';
session_start();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        registrarUsuario();
        break;
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'count') {
            contarUsuarios();
        } else if (isset($_GET['action']) && $_GET['action'] === 'list') {
            listarUsuariosPlano();
        } else if (isset($_GET['id'])) {
            obtenerUsuario($_GET['id']);
        } else {
            listarUsuarios();
        }
        break;
    case 'PUT':
        if (isset($_GET['id'])) {
            actualizarUsuario($_GET['id']);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

function contarUsuarios() {
    global $conn;
    try {
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM usuarios");
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        echo json_encode(['total' => intval($row['total'])]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['total' => 0]);
    }
}

function listarUsuariosPlano() {
    global $conn;
    try {
        $stmt = $conn->prepare("SELECT id, nombre, email FROM usuarios ORDER BY nombre");
        $stmt->execute();
        $result = $stmt->get_result();
        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
        echo json_encode($usuarios);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([]);
    }
}
function registrarUsuario() {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nombre = trim($data['nombre'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($nombre) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email no válido']);
        return;
    }
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Este email ya está registrado']);
            return;
        }
        
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param('sss', $nombre, $email, $password_hash);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'usuario_id' => $conn->insert_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al crear usuario: ' . $conn->error]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    }
}

function obtenerUsuario($id) {
    global $conn;
    
    if (!isset($_SESSION['usuario_id']) || ($_SESSION['usuario_id'] != $id && $_SESSION['rol'] != 'administrador')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("SELECT id, nombre, email, rol, fecha_creacion FROM usuarios WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($usuario = $result->fetch_assoc()) {
            echo json_encode(['success' => true, 'usuario' => $usuario]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    }
}

function listarUsuarios() {
    global $conn;
    
    if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] != 'administrador') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("SELECT id, nombre, email, rol, fecha_creacion FROM usuarios ORDER BY nombre");
        $stmt->execute();
        $result = $stmt->get_result();
        
        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
        
        echo json_encode(['success' => true, 'usuarios' => $usuarios]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    }
}

function actualizarUsuario($id) {
    global $conn;
    
    if (!isset($_SESSION['usuario_id']) || ($_SESSION['usuario_id'] != $id && $_SESSION['rol'] != 'administrador')) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $campos = [];
    $tipos = '';
    $valores = [];
    
    if (isset($data['nombre'])) {
        $campos[] = 'nombre = ?';
        $tipos .= 's';
        $valores[] = trim($data['nombre']);
    }
    
    if (isset($data['email'])) {
        $campos[] = 'email = ?';
        $tipos .= 's';
        $valores[] = trim($data['email']);
    }
    
    if (isset($data['password'])) {
        $campos[] = 'password = ?';
        $tipos .= 's';
        $valores[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }
    
    if (empty($campos)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No hay datos para actualizar']);
        return;
    }
    
    $valores[] = $id;
    $tipos .= 'i';
    
    try {
        $sql = "UPDATE usuarios SET " . implode(', ', $campos) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($tipos, ...$valores);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado exitosamente']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar usuario']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    }
}
?>