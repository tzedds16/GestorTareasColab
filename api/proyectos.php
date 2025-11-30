<?php
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Obtener proyecto específico
                $proyecto_id = intval($_GET['id']);
                
                $stmt = $conn->prepare("
                    SELECT p.*, u.nombre as usuario_nombre 
                    FROM proyectos p 
                    LEFT JOIN usuarios u ON p.usuario_id = u.id 
                    WHERE p.id = ? AND (p.usuario_id = ? OR p.id IN (
                        SELECT proyecto_id FROM colaboradores WHERE usuario_id = ?
                    ))
                ");
                $stmt->bind_param('iii', $proyecto_id, $_SESSION['usuario_id'], $_SESSION['usuario_id']);
                $stmt->execute();
                $proyecto = $stmt->get_result()->fetch_assoc();
                
                if (!$proyecto) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Proyecto no encontrado']);
                    exit;
                }
                
                echo json_encode([
                    'success' => true,
                    'proyecto' => $proyecto,
                    'usuario' => [
                        'id' => $_SESSION['usuario_id'],
                        'nombre' => $_SESSION['nombre'],
                        'email' => $_SESSION['email']
                    ]
                ]);
                
            } else {
                // Listar todos los proyectos del usuario
                $stmt = $conn->prepare("
                    SELECT p.*, u.nombre as usuario_nombre 
                    FROM proyectos p 
                    LEFT JOIN usuarios u ON p.usuario_id = u.id 
                    WHERE p.usuario_id = ? OR p.id IN (
                        SELECT proyecto_id FROM colaboradores WHERE usuario_id = ?
                    )
                    ORDER BY p.fecha_creacion DESC
                ");
                $stmt->bind_param('ii', $_SESSION['usuario_id'], $_SESSION['usuario_id']);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $proyectos = [];
                while ($row = $result->fetch_assoc()) {
                    $proyectos[] = $row;
                }
                
                echo json_encode([
                    'success' => true,
                    'proyectos' => $proyectos
                ]);
            }
            break;
            
        case 'POST':
            // Crear nuevo proyecto
            $data = json_decode(file_get_contents('php://input'), true);
            
            $nombre = trim($data['nombre'] ?? '');
            $descripcion = trim($data['descripcion'] ?? '');
            $color = $data['color'] ?? '#6366f1';
            
            if (empty($nombre)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El nombre del proyecto es requerido']);
                exit;
            }
            
            $stmt = $conn->prepare("INSERT INTO proyectos (nombre, descripcion, color, usuario_id) VALUES (?, ?, ?, ?)");
            $stmt->bind_param('sssi', $nombre, $descripcion, $color, $_SESSION['usuario_id']);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Proyecto creado exitosamente',
                    'proyecto_id' => $conn->insert_id
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear proyecto: ' . $conn->error]);
            }
            break;
            
        case 'PUT':
            // Actualizar proyecto
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de proyecto requerido']);
                exit;
            }
            
            $proyecto_id = intval($_GET['id']);
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verificar que el usuario es el dueño del proyecto
            $stmt = $conn->prepare("SELECT usuario_id FROM proyectos WHERE id = ?");
            $stmt->bind_param('i', $proyecto_id);
            $stmt->execute();
            $proyecto = $stmt->get_result()->fetch_assoc();
            
            if (!$proyecto || $proyecto['usuario_id'] != $_SESSION['usuario_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'No tienes permisos para editar este proyecto']);
                exit;
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
            if (isset($data['color'])) {
                $campos[] = 'color = ?';
                $tipos .= 's';
                $valores[] = $data['color'];
            }
            if (isset($data['activo'])) {
                $campos[] = 'activo = ?';
                $tipos .= 'i';
                $valores[] = $data['activo'] ? 1 : 0;
            }
            
            if (empty($campos)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No hay datos para actualizar']);
                exit;
            }
            
            $valores[] = $proyecto_id;
            $tipos .= 'i';
            
            $sql = "UPDATE proyectos SET " . implode(', ', $campos) . " WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($tipos, ...$valores);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Proyecto actualizado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar proyecto']);
            }
            break;
            
        case 'DELETE':
            // Eliminar proyecto
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID de proyecto requerido']);
                exit;
            }
            
            $proyecto_id = intval($_GET['id']);
            
            // Verificar que el usuario es el dueño del proyecto
            $stmt = $conn->prepare("SELECT usuario_id FROM proyectos WHERE id = ?");
            $stmt->bind_param('i', $proyecto_id);
            $stmt->execute();
            $proyecto = $stmt->get_result()->fetch_assoc();
            
            if (!$proyecto || $proyecto['usuario_id'] != $_SESSION['usuario_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'No tienes permisos para eliminar este proyecto']);
                exit;
            }
            
            $stmt = $conn->prepare("DELETE FROM proyectos WHERE id = ?");
            $stmt->bind_param('i', $proyecto_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Proyecto eliminado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al eliminar proyecto']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?>