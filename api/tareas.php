<?php
header('Content-Type: application/json');
require_once './config/database.php';
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
            if (isset($_GET['action']) && $_GET['action'] === 'metrics') {
                metricasTareas($usuario_id);
            } else if (isset($_GET['id'])) {
                obtenerTarea($_GET['id'], $usuario_id);
            } else if (isset($_GET['tablero_id'])) {
                listarTareasPorTablero($_GET['tablero_id'], $usuario_id);
            } else if (isset($_GET['proyecto_id'])) {
                listarTareasPorProyecto($_GET['proyecto_id'], $usuario_id);
            }
            break;
            
        case 'POST':
            if (isset($_GET['action']) && $_GET['action'] === 'create') {
                crearTareaPanel($usuario_id);
            } else {
                crearTarea($usuario_id);
            }
            break;
            
        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de tarea requerido']);
                exit;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            actualizarTarea($_GET['id'], $data, $usuario_id);
            break;
            
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de tarea requerido']);
                exit;
            }
            eliminarTarea($_GET['id'], $usuario_id);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

function verificarAccesoTablero($tablero_id, $usuario_id) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT tableros.id FROM tableros
        JOIN proyectos ON tableros.proyecto_id = proyectos.id
        WHERE tableros.id = ? AND (proyectos.usuario_id = ? OR proyectos.id IN (
            SELECT proyecto_id FROM colaboradores WHERE usuario_id = ?
        ))
    ");
    $stmt->bind_param('iii', $tablero_id, $usuario_id, $usuario_id);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
}

function listarTareasPorTablero($tablero_id, $usuario_id) {
    global $conn;
    
    if (!verificarAccesoTablero($tablero_id, $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este tablero']);
        return;
    }
    
    $stmt = $conn->prepare("
        SELECT *
        FROM tareas
        WHERE tablero_id = ?
        ORDER BY orden ASC, fecha_creacion DESC
    ");
    $stmt->bind_param('i', $tablero_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tareas = [];
    while ($row = $result->fetch_assoc()) {
        $tareas[] = $row;
    }
    
    echo json_encode(['success' => true, 'tareas' => $tareas]);
}

function listarTareasPorProyecto($proyecto_id, $usuario_id) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT id FROM proyectos
        WHERE id = ? AND (usuario_id = ? OR id IN (
            SELECT proyecto_id FROM colaboradores WHERE usuario_id = ?
        ))
    ");
    $stmt->bind_param('iii', $proyecto_id, $usuario_id, $usuario_id);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este proyecto']);
        return;
    }
    
    $stmt = $conn->prepare("
        SELECT t.*, tb.nombre as tablero_nombre
        FROM tareas t
        JOIN tableros tb ON t.tablero_id = tb.id
        WHERE tb.proyecto_id = ?
        ORDER BY tb.id, t.orden ASC, t.fecha_creacion DESC
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
    
    $stmt = $conn->prepare("
        SELECT *
        FROM tareas
        WHERE id = ?
    ");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($tarea = $result->fetch_assoc()) {
        if (!verificarAccesoTablero($tarea['tablero_id'], $usuario_id)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No tienes acceso a esta tarea']);
            return;
        }
        
        echo json_encode(['success' => true, 'tarea' => $tarea]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tarea no encontrada']);
    }
}

function crearTarea($usuario_id) {
    global $conn;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $tablero_id = $data['tablero_id'] ?? null;
    $titulo = trim($data['titulo'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $prioridad = $data['prioridad'] ?? 'media';
    $estado = $data['estado'] ?? 'tareas';
    
    if (!$tablero_id || !$titulo) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tablero y título son requeridos']);
        return;
    }
    
    if (!verificarAccesoTablero($tablero_id, $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este tablero']);
        return;
    }
    
    $stmt = $conn->prepare("
        INSERT INTO tareas (tablero_id, titulo, descripcion, prioridad, estado)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('issss', $tablero_id, $titulo, $descripcion, $prioridad, $estado);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Tarea creada',
            'tarea_id' => $conn->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al crear tarea']);
    }
}

function crearTareaPanel($usuario_id) {
    global $conn;
    $data = json_decode(file_get_contents('php://input'), true);
    $tablero_id = $data['tablero'] ?? null;
    $titulo = trim($data['titulo'] ?? '');
    $descripcion = trim($data['descripcion'] ?? '');
    $prioridad = $data['prioridad'] ?? 'media';
    $responsable = $data['responsable'] ?? null;
    $fecha_limite = $data['vencimiento'] ?? null;
    $estado = 'tareas';
    if (!$tablero_id || !$titulo || !$responsable || !$fecha_limite) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
        return;
    }
    if (!verificarAccesoTablero($tablero_id, $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a este tablero']);
        return;
    }
    $stmt = $conn->prepare(
        "INSERT INTO tareas (tablero_id, titulo, descripcion, prioridad, estado, responsable_id, fecha_limite)
        VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('issssis', $tablero_id, $titulo, $descripcion, $prioridad, $estado, $responsable, $fecha_limite);
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Tarea creada',
            'tarea_id' => $conn->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al crear tarea']);
    }
}

function metricasTareas($usuario_id) {
    global $conn;
    $total = 0;
    $pendientes = 0;
    $atrasadas = 0;
    $hoy = date('Y-m-d H:i:s');
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tareas");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $total = intval($row['total']);
    $stmt = $conn->prepare("SELECT COUNT(*) as pendientes FROM tareas WHERE estado = 'tareas'");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $pendientes = intval($row['pendientes']);
    $stmt = $conn->prepare("SELECT COUNT(*) as atrasadas FROM tareas WHERE estado = 'tareas' AND fecha_limite < ?");
    $stmt->bind_param('s', $hoy);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $atrasadas = intval($row['atrasadas']);
    echo json_encode(['total' => $total, 'pendientes' => $pendientes, 'atrasadas' => $atrasadas]);
}

function actualizarTarea($id, $data, $usuario_id) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT tablero_id FROM tareas WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$tarea = $result->fetch_assoc()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tarea no encontrada']);
        return;
    }
    
    if (!verificarAccesoTablero($tarea['tablero_id'], $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a esta tarea']);
        return;
    }
    
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
    if (isset($data['posicion'])) {
        $campos[] = 'orden = ?';
        $tipos .= 'i';
        $valores[] = $data['posicion'];
    }
    if (isset($data['fecha_limite'])) {
        $campos[] = 'fecha_limite = ?';
        $tipos .= 's';
        $valores[] = $data['fecha_limite'] ?: null;
    }
    if (isset($data['fecha_vencimiento'])) {
        $campos[] = 'fecha_limite = ?';
        $tipos .= 's';
        $valores[] = $data['fecha_vencimiento'] ?: null;
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
    
    $stmt = $conn->prepare("SELECT tablero_id FROM tareas WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$tarea = $result->fetch_assoc()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tarea no encontrada']);
        return;
    }
    
    if (!verificarAccesoTablero($tarea['tablero_id'], $usuario_id)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes acceso a esta tarea']);
        return;
    }
    
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
