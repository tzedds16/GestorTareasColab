let proyectoId = new URLSearchParams(window.location.search).get('id') || 1;
let tareaModal;
let tareas = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    tareaModal = new bootstrap.Modal(document.getElementById('tareaModal'));
    
    // Cargar datos
    cargarProyecto();
    inicializarDragAndDrop();
    cargarTareas();
});

// Cargar información del proyecto
async function cargarProyecto() {
    try {
        const response = await fetch(`../api/proyectos.php?id=${proyectoId}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('proyectoNombre').textContent = data.proyecto.nombre;
            document.getElementById('usuarioNombre').innerHTML = `<i class="bi bi-person-circle"></i> ${data.usuario.nombre}`;
            document.title = `Kanban - ${data.proyecto.nombre}`;
        } else {
            // Modo demo
            document.getElementById('proyectoNombre').textContent = 'Proyecto ' + proyectoId;
            document.getElementById('usuarioNombre').innerHTML = '<i class="bi bi-person-circle"></i> Usuario Demo';
        }
    } catch (error) {
        console.error('Error:', error);
        // Modo demo
        document.getElementById('proyectoNombre').textContent = 'Proyecto ' + proyectoId;
        document.getElementById('usuarioNombre').innerHTML = '<i class="bi bi-person-circle"></i> Usuario Demo';
    }
}

// Cargar tareas del proyecto
async function cargarTareas() {
    try {
        const response = await fetch(`../api/tareas.php?proyecto_id=${proyectoId}`);
        const data = await response.json();
        
        if (data.success) {
            tareas = data.tareas || [];
            mostrarTareas();
        } else {
            // Modo demo - tareas de ejemplo
            tareas = [
                { id: 1, proyecto_id: proyectoId, titulo: 'Diseñar interfaz', descripcion: 'Crear diseño en Figma', estado: 'tareas', prioridad: 'alta' },
                { id: 2, proyecto_id: proyectoId, titulo: 'Configurar BD', descripcion: 'Crear tablas necesarias', estado: 'en_proceso', prioridad: 'media' },
                { id: 3, proyecto_id: proyectoId, titulo: 'Testing inicial', descripcion: 'Pruebas de funcionalidad', estado: 'terminadas', prioridad: 'baja' }
            ];
            mostrarTareas();
        }
    } catch (error) {
        console.error('Error:', error);
        // Modo demo
        tareas = [
            { id: 1, proyecto_id: proyectoId, titulo: 'Tarea de ejemplo', descripcion: 'Descripción de la tarea', estado: 'tareas', prioridad: 'media' }
        ];
        mostrarTareas();
    }
}

// Mostrar tareas en las columnas
function mostrarTareas() {
    // Limpiar columnas
    document.getElementById('columna-tareas').innerHTML = '';
    document.getElementById('columna-en_proceso').innerHTML = '';
    document.getElementById('columna-terminadas').innerHTML = '';
    
    if (tareas.length === 0) {
        mostrarColumnasVacias();
        return;
    }
    
    // Agrupar tareas por estado
    const tareasPorEstado = {
        'tareas': tareas.filter(t => t.estado === 'tareas'),
        'en_proceso': tareas.filter(t => t.estado === 'en_proceso'),
        'terminadas': tareas.filter(t => t.estado === 'terminadas')
    };
    
    // Mostrar tareas en cada columna
    Object.keys(tareasPorEstado).forEach(estado => {
        const columna = document.getElementById(`columna-${estado}`);
        const tareasEnEstado = tareasPorEstado[estado];
        
        if (tareasEnEstado.length === 0) {
            columna.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                    <p class="mt-2">No hay tareas ${getTextoEstado(estado)}</p>
                </div>
            `;
        } else {
            tareasEnEstado.forEach(tarea => {
                agregarTareaAlDOM(tarea);
            });
        }
    });
    
    actualizarContadores();
}

// Agregar tarea al DOM
function agregarTareaAlDOM(tarea) {
    const columna = document.getElementById(`columna-${tarea.estado}`);
    
    // Remover mensaje vacio si existe
    const emptyState = columna.querySelector('.text-center.text-muted');
    if (emptyState) {
        emptyState.remove();
    }
    
    const tareaCard = document.createElement('div');
    tareaCard.className = 'tarea-card';
    tareaCard.dataset.tareaId = tarea.id;
    
    const prioridadClass = `prioridad-${tarea.prioridad}`;
    const prioridadText = tarea.prioridad.charAt(0).toUpperCase() + tarea.prioridad.slice(1);
    
    tareaCard.innerHTML = `
        <div class="tarea-titulo">${escapeHtml(tarea.titulo)}</div>
        ${tarea.descripcion ? `<div class="tarea-descripcion">${escapeHtml(tarea.descripcion)}</div>` : ''}
        <div class="tarea-footer">
            <span class="badge ${prioridadClass}">${prioridadText}</span>
            <div class="tarea-acciones">
                <button class="btn btn-sm btn-outline-primary" onclick="editarTarea(${tarea.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarTarea(${tarea.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    columna.appendChild(tareaCard);
}

// Inicializar drag and drop
function inicializarDragAndDrop() {
    const columnas = ['tareas', 'en_proceso', 'terminadas'];
    
    columnas.forEach(estado => {
        const columna = document.getElementById(`columna-${estado}`);
        
        new Sortable(columna, {
            group: 'tareas',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            
            onEnd: function(evt) {
                const tareaId = evt.item.dataset.tareaId;
                const nuevoEstado = evt.to.dataset.estado;
                
                if (tareaId && nuevoEstado) {
                    actualizarEstadoTarea(tareaId, nuevoEstado);
                }
            }
        });
    });
}

// Mostrar columnas vacias
function mostrarColumnasVacias() {
    const columnas = {
        'tareas': 'No hay tareas pendientes',
        'en_proceso': 'No hay tareas en proceso', 
        'terminadas': 'No hay tareas terminadas'
    };
    
    Object.keys(columnas).forEach(estado => {
        const columna = document.getElementById(`columna-${estado}`);
        columna.innerHTML = `
            <div class="text-center text-muted p-4">
                <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                <p class="mt-2">${columnas[estado]}</p>
            </div>
        `;
    });
}

// Actualizar contadores
function actualizarContadores() {
    const columnas = ['tareas', 'en_proceso', 'terminadas'];
    
    columnas.forEach(estado => {
        const columna = document.getElementById(`columna-${estado}`);
        const contador = document.getElementById(`contador-${estado}`);
        
        if (columna && contador) {
            const total = columna.querySelectorAll('.tarea-card').length;
            contador.textContent = total;
        }
    });
}

// Abrir modal para crear tarea
function abrirModalTarea(estado = 'tareas') {
    document.getElementById('formTarea').reset();
    document.getElementById('tareaId').value = '';
    document.getElementById('tareaEstado').value = estado;
    document.getElementById('tareaPrioridad').value = 'media';
    document.querySelector('#tareaModal .modal-title').textContent = 'Nueva Tarea';
    
    tareaModal.show();
}

// Editar tarea
function editarTarea(id) {
    const tarea = tareas.find(t => t.id == id);
    if (tarea) {
        document.getElementById('tareaId').value = tarea.id;
        document.getElementById('tareaTitulo').value = tarea.titulo;
        document.getElementById('tareaDescripcion').value = tarea.descripcion || '';
        document.getElementById('tareaPrioridad').value = tarea.prioridad;
        document.getElementById('tareaEstado').value = tarea.estado;
        document.querySelector('#tareaModal .modal-title').textContent = 'Editar Tarea';
        
        tareaModal.show();
    }
}

// Guardar tarea
async function guardarTarea() {
    const tareaId = document.getElementById('tareaId').value;
    const titulo = document.getElementById('tareaTitulo').value.trim();
    const descripcion = document.getElementById('tareaDescripcion').value.trim();
    const prioridad = document.getElementById('tareaPrioridad').value;
    const estado = document.getElementById('tareaEstado').value;
    
    if (!titulo) {
        mostrarAlerta('El título es requerido', 'danger');
        return;
    }
    
    try {
        let response;
        
        if (tareaId) {
            // Actualizar tarea existente
            response = await fetch(`../api/tareas.php?id=${tareaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    titulo: titulo,
                    descripcion: descripcion,
                    prioridad: prioridad,
                    estado: estado
                })
            });
        } else {
            // Crear nueva tarea
            const formData = new FormData();
            formData.append('proyecto_id', proyectoId);
            formData.append('titulo', titulo);
            formData.append('descripcion', descripcion);
            formData.append('prioridad', prioridad);
            formData.append('estado', estado);
            
            response = await fetch('../api/tareas.php', {
                method: 'POST',
                body: formData
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            tareaModal.hide();
            mostrarAlerta(tareaId ? 'Tarea actualizada' : 'Tarea creada', 'success');
            cargarTareas(); // Recargar tareas
        } else {
            // Actualizar localmente
            if (tareaId) {
                const index = tareas.findIndex(t => t.id == tareaId);
                if (index !== -1) {
                    tareas[index] = { ...tareas[index], titulo, descripcion, prioridad, estado };
                }
            } else {
                const nuevaTarea = {
                    id: Date.now(), // ID temporal
                    proyecto_id: proyectoId,
                    titulo: titulo,
                    descripcion: descripcion,
                    prioridad: prioridad,
                    estado: estado
                };
                tareas.push(nuevaTarea);
            }
            tareaModal.hide();
            mostrarAlerta(tareaId ? 'Tarea actualizada' : 'Tarea creada', 'success');
            mostrarTareas();
        }
    } catch (error) {
        console.error('Error:', error);
        // Actualizar localmente
        if (tareaId) {
            const index = tareas.findIndex(t => t.id == tareaId);
            if (index !== -1) {
                tareas[index] = { ...tareas[index], titulo, descripcion, prioridad, estado };
            }
        } else {
            const nuevaTarea = {
                id: Date.now(),
                proyecto_id: proyectoId,
                titulo: titulo,
                descripcion: descripcion,
                prioridad: prioridad,
                estado: estado
            };
            tareas.push(nuevaTarea);
        }
        tareaModal.hide();
        mostrarAlerta(tareaId ? 'Tarea actualizada' : 'Tarea creada', 'success');
        mostrarTareas();
    }
}

// Eliminar tarea
async function eliminarTarea(id) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) {
        return;
    }
    
    try {
        const response = await fetch(`../api/tareas.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarAlerta('Tarea eliminada', 'success');
            cargarTareas();
        } else {
            // Eliminar localmente
            tareas = tareas.filter(t => t.id != id);
            mostrarAlerta('Tarea eliminada', 'success');
            mostrarTareas();
        }
    } catch (error) {
        console.error('Error:', error);
        // Eliminar localmente
        tareas = tareas.filter(t => t.id != id);
        mostrarAlerta('Tarea eliminada', 'success');
        mostrarTareas();
    }
}

// Actualizar estado de tarea (drag & drop)
async function actualizarEstadoTarea(id, nuevoEstado) {
    try {
        const response = await fetch(`../api/tareas.php?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: nuevoEstado
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            // Actualizar localmente
            const tarea = tareas.find(t => t.id == id);
            if (tarea) {
                tarea.estado = nuevoEstado;
            }
        }
        
        actualizarContadores();
    } catch (error) {
        console.error('Error:', error);
        // Actualizar localmente
        const tarea = tareas.find(t => t.id == id);
        if (tarea) {
            tarea.estado = nuevoEstado;
        }
        actualizarContadores();
    }
}

// Funciones de utilidad
function getTextoEstado(estado) {
    const estados = {
        'tareas': 'pendientes',
        'en_proceso': 'en proceso', 
        'terminadas': 'terminadas'
    };
    return estados[estado] || estado;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const alertContainer = document.getElementById('alert-container') || crearContenedorAlertas();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo} alert-dismissible fade show`;
    alert.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 4000);
}

function crearContenedorAlertas() {
    const container = document.createElement('div');
    container.id = 'alert-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Funciones de navegacion
function mostrarColaboradores() {
    alert('Funcionalidad de colaboradores en desarrollo');
}

function irAEstadisticas() {
    alert('Funcionalidad de estadísticas en desarrollo');
}