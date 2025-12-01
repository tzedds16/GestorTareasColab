<?php
session_start();
require_once '../api/config/database.php';

// Verificar autenticación
if (!isset($_SESSION['usuario_id'])) {
    header('Location: auth.html');
    exit;
}

$proyecto_id = $_GET['id'] ?? null;
if (!$proyecto_id) {
    header('Location: proyectos.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kanban - Tablero</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
    <!-- Header -->
    <nav class="navbar navbar-dark bg-dark">
        <div class="container-fluid">
            <span class="navbar-brand mb-0 h1">KANBAN</span>
            <div class="d-flex align-items-center">
                <span class="text-light me-3" id="usuarioNombre"><?php echo htmlspecialchars($_SESSION['nombre']); ?></span>
                <button class="btn btn-outline-light me-2" data-bs-toggle="modal" data-bs-target="#colaboradoresModal">
                    <i class="bi bi-people"></i> Colaboradores
                </button>
                <button class="btn btn-outline-light" onclick="window.location.href='estadisticas.php?id=<?= $proyecto_id ?>'">
                    <i class="bi bi-bar-chart"></i> Estadísticas
                </button>
            </div>
        </div>
    </nav>

    <!-- Título del Proyecto -->
    <div class="container-fluid mt-3">
        <div class="d-flex justify-content-between align-items-center bg-primary text-white p-3 rounded">
            <h4 class="mb-0" id="proyectoNombre">Proyecto 1 - Tablero 1</h4>
            <div>
                <button class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#colaboradoresModal">
                    <i class="bi bi-person-circle"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Tablero Kanban -->
    <div class="container-fluid mt-4">
        <div class="row g-3">
            <!-- Columna: Tareas -->
            <div class="col-md-4">
                <div class="kanban-column">
                    <div class="kanban-header">
                        <h5>Tareas</h5>
                        <button class="btn btn-sm btn-light" onclick="abrirModalTarea('tareas')">
                            <i class="bi bi-plus-lg"></i> Añade
                        </button>
                    </div>
                    <div class="kanban-body" id="columna-tareas" data-estado="tareas">
                        <!-- Las tareas se cargarán dinámicamente -->
                    </div>
                </div>
            </div>

            <!-- Columna: En Proceso -->
            <div class="col-md-4">
                <div class="kanban-column">
                    <div class="kanban-header">
                        <h5>En Proceso</h5>
                        <button class="btn btn-sm btn-light" onclick="abrirModalTarea('en_proceso')">
                            <i class="bi bi-plus-lg"></i> Añade
                        </button>
                    </div>
                    <div class="kanban-body" id="columna-en_proceso" data-estado="en_proceso">
                        <!-- Las tareas se cargarán dinámicamente -->
                    </div>
                </div>
            </div>

            <!-- Columna: Terminadas -->
            <div class="col-md-4">
                <div class="kanban-column">
                    <div class="kanban-header">
                        <h5>Terminadas</h5>
                        <button class="btn btn-sm btn-light" onclick="abrirModalTarea('terminadas')">
                            <i class="bi bi-plus-lg"></i> Añade
                        </button>
                    </div>
                    <div class="kanban-body" id="columna-terminadas" data-estado="terminadas">
                        <!-- Las tareas se cargarán dinámicamente -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal para Crear/Editar Tarea -->
    <div class="modal fade" id="tareaModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Nueva Tarea</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formTarea">
                        <input type="hidden" id="tareaId" name="id">
                        <input type="hidden" id="tareaEstado" name="estado">
                        
                        <div class="mb-3">
                            <label class="form-label">Título</label>
                            <input type="text" class="form-control" id="tareaTitulo" name="titulo" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Descripción</label>
                            <textarea class="form-control" id="tareaDescripcion" name="descripcion" rows="3"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Prioridad</label>
                            <select class="form-select" id="tareaPrioridad" name="prioridad">
                                <option value="baja">Baja</option>
                                <option value="media" selected>Media</option>
                                <option value="alta">Alta</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="guardarTarea()">Guardar</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <script>
        // Pasar el ID del tablero a kanban.js
        const tableroId = <?php echo intval($proyecto_id); ?>;
    </script>
    <script src="../assets/js/kanban.js"></script>
</body>
</html>