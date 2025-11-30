<?php
header('Content-Type: application/json');
require_once '../config/database.php';
session_start();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$usuario_id = $_SESSION['usuario_id'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                obtenerTablero($_GET['id'], $usuario_id);
            } else if (isset($_GET['proyecto_id'])) {
                listarTablerosPorProyecto($_GET['proyecto_id'], $usuario_id);
            }
            break;
            
        case 'POST':
            crearTablero($usuario_id);
            break;
            
        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de tablero requerido']);
                exit;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            actualizarTablero($_GET['id'], $data, $usuario_id);
            break;
            
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de tablero requerido']);
                exit;
            }
            eliminarTablero($_GET['id'], $usuario_id);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

function verificarAccesoProyecto($proyecto_id, $usuario_id) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT id FROM proyectos
        WHERE id = ? AND (usuario_id = ? OR id IN (
            SELECT proyecto_id FROM colaboradores WHERE usuario_id = ?
        ))
    ");
    $stmt->bind_param('iii', $proyecto_id, $usuario_id, $usuario_id);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
}

function listarTablerosPorProyecto($proyecto_id, $usuario_id) {
    global $conn;
    
    if (!verificarAccesoProyecto($proyecto_id, $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este proyecto']);
        return;
    }
    
    $stmt = $conn->prepare("
        SELECT t.*, COUNT(ta.id) as total_tareas
        FROM tableros t
        LEFT JOIN tareas ta ON t.id = ta.tablero_id
        WHERE t.proyecto_id = ?
        GROUP BY t.id
        ORDER BY t.posicion ASC, t.fecha_creacion ASC
    ");
    $stmt->bind_param('i', $proyecto_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tableros = [];
    while ($row = $result->fetch_assoc()) {
        $tableros[] = $row;
    }
    
    echo json_encode(['success' => true, 'tableros' => $tableros]);
}

function obtenerTablero($id, $usuario_id) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT t.*, COUNT(ta.id) as total_tareas
        FROM tableros t
        LEFT JOIN tareas ta ON t.id = ta.tablero_id
        WHERE t.id = ?
        GROUP BY t.id
    ");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($tablero = $result->fetch_assoc()) {
        // Verificar acceso al proyecto
        if (!verificarAccesoProyecto($tablero['proyecto_id'], $usuario_id)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No tienes acceso a este tablero']);
            return;
        }
        
        echo json_encode(['success' => true, 'tablero' => $tablero]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tablero no encontrado']);
    }
}

function crearTablero($usuario_id) {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $proyecto_id = $data['proyecto_id'] ?? null;
    $nombre = trim($data['nombre'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    
    if (!$proyecto_id || !$nombre) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Proyecto y nombre son requeridos']);
        return;
    }
    
    // Verificar acceso al proyecto
    if (!verificarAccesoProyecto($proyecto_id, $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este proyecto']);
        return;
    }
    
    // Obtener siguiente posición
    $stmt = $conn->prepare("SELECT MAX(posicion) as max_pos FROM tableros WHERE proyecto_id = ?");
    $stmt->bind_param('i', $proyecto_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $posicion = ($result['max_pos'] ?? -1) + 1;
    
    $stmt = $conn->prepare("
        INSERT INTO tableros (proyecto_id, nombre, descripcion, posicion)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->bind_param('issi', $proyecto_id, $nombre, $descripcion, $posicion);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Tablero creado',
            'tablero_id' => $conn->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al crear tablero']);
    }
}

function actualizarTablero($id, $data, $usuario_id) {
    global $conn;
    
    // Obtener tablero y verificar acceso
    $stmt = $conn->prepare("SELECT proyecto_id FROM tableros WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$tablero = $result->fetch_assoc()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tablero no encontrado']);
        return;
    }
    
    if (!verificarAccesoProyecto($tablero['proyecto_id'], $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este tablero']);
        return;
    }
    
    $campos = [];
    $tipos = '';
    $valores = [];
    
    if (isset($data['nombre'])) {
        $campos[] = 'nombre = ?';
        $tipos .= 's';
        $valores[] = trim($data['nombre']);
    }
    if (isset($data['descripcion'])) {
        $campos[] = 'descripcion = ?';
        $tipos .= 's';
        $valores[] = trim($data['descripcion']);
    }
    if (isset($data['posicion'])) {
        $campos[] = 'posicion = ?';
        $tipos .= 'i';
        $valores[] = $data['posicion'];
    }
    
    if (empty($campos)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No hay datos para actualizar']);
        return;
    }
    
    $valores[] = $id;
    $tipos .= 'i';
    
    $sql = "UPDATE tableros SET " . implode(', ', $campos) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($tipos, ...$valores);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Tablero actualizado']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al actualizar']);
    }
}

function eliminarTablero($id, $usuario_id) {
    global $conn;
    
    // Obtener tablero y verificar acceso
    $stmt = $conn->prepare("SELECT proyecto_id FROM tableros WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$tablero = $result->fetch_assoc()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tablero no encontrado']);
        return;
    }
    
    if (!verificarAccesoProyecto($tablero['proyecto_id'], $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este tablero']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM tableros WHERE id = ?");
    $stmt->bind_param('i', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Tablero eliminado']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al eliminar']);
    }
}
?>
