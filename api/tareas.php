<?php
header('Content-Type: application/json');
require_once '../config/database.php';
session_start();

// Verificar autenticación (comentar temporalmente si no tienes login)
// if (!isset($_SESSION['usuario_id'])) {
//     http_response_code(401);
//     echo json_encode(['success' => false, 'message' => 'No autenticado']);
//     exit;
// }

// Usuario de prueba temporal
if (!isset($_SESSION['usuario_id'])) {
    $_SESSION['usuario_id'] = 1;
}

$method = $_SERVER['REQUEST_METHOD'];
$usuario_id = $_SESSION['usuario_id'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            obtenerTarea($_GET['id'], $usuario_id);
        } else if (isset($_GET['proyecto_id'])) {
            listarTareas($_GET['proyecto_id'], $usuario_id);
        }
        break;
        
    case 'POST':
        crearTarea($usuario_id);
        break;
        
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        actualizarTarea($_GET['id'], $data, $usuario_id);
        break;
        
    case 'DELETE':
        eliminarTarea($_GET['id'], $usuario_id);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

function listarTareas($proyecto_id, $usuario_id) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT * FROM tareas 
        WHERE proyecto_id = ? 
        ORDER BY orden ASC, fecha_creacion DESC
    ");
    $stmt->bind_param('i', $proyecto_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tareas = [];
    while ($row = $result->fetch_assoc()) {
        $tareas[] = $row;
    }
    
    echo json_encode(['success' => true, 'tareas' => $tareas]);
}

function obtenerTarea($id, $usuario_id) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT * FROM tareas WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($tarea = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'tarea' => $tarea]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tarea no encontrada']);
    }
}

function crearTarea($usuario_id) {
    global $conn;
    
    $proyecto_id = $_POST['proyecto_id'] ?? null;
    $titulo = trim($_POST['titulo'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $estado = $_POST['estado'] ?? 'tareas';
    $prioridad = $_POST['prioridad'] ?? 'media';
    
    if (!$proyecto_id || !$titulo) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        return;
    }
    
    $stmt = $conn->prepare("
        INSERT INTO tareas (proyecto_id, titulo, descripcion, estado, prioridad)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('issss', $proyecto_id, $titulo, $descripcion, $estado, $prioridad);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Tarea creada',
            'id' => $conn->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al crear tarea']);
    }
}

function actualizarTarea($id, $data, $usuario_id) {
    global $conn;
    
    $campos = [];
    $tipos = '';
    $valores = [];
    
    if (isset($data['titulo'])) {
        $campos[] = 'titulo = ?';
        $tipos .= 's';
        $valores[] = trim($data['titulo']);
    }
    if (isset($data['descripcion'])) {
        $campos[] = 'descripcion = ?';
        $tipos .= 's';
        $valores[] = trim($data['descripcion']);
    }
    if (isset($data['estado'])) {
        $campos[] = 'estado = ?';
        $tipos .= 's';
        $valores[] = $data['estado'];
    }
    if (isset($data['prioridad'])) {
        $campos[] = 'prioridad = ?';
        $tipos .= 's';
        $valores[] = $data['prioridad'];
    }
    if (isset($data['orden'])) {
        $campos[] = 'orden = ?';
        $tipos .= 'i';
        $valores[] = $data['orden'];
    }
    
    if (empty($campos)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No hay datos para actualizar']);
        return;
    }
    
    $valores[] = $id;
    $tipos .= 'i';
    
    $sql = "UPDATE tareas SET " . implode(', ', $campos) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($tipos, ...$valores);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Tarea actualizada']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al actualizar']);
    }
}

function eliminarTarea($id, $usuario_id) {
    global $conn;
    
    $stmt = $conn->prepare("DELETE FROM tareas WHERE id = ?");
    $stmt->bind_param('i', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Tarea eliminada']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al eliminar']);
    }
}
?>