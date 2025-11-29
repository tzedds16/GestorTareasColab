// Variables globales
let proyectoId = new URLSearchParams(window.location.search).get('id') || 1;
let tareaModal;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando tablero con proyecto ID:', proyectoId);
    
    tareaModal = new bootstrap.Modal(document.getElementById('tareaModal'));
    
    // Cargar datos
    cargarProyecto();
    inicializarDragAndDrop();
    cargarTareas();
});

// Cargar información del proyecto
async function cargarProyecto() {
    try {
        console.log('Cargando proyecto...');
        
        const response = await fetch(`/gestor-tareas/api/proyectos.php?id=${proyectoId}`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos del proyecto:', data);
        
        if (data.success) {
            // ✅ VERIFICAR que los elementos existan antes de modificarlos
            const proyectoNombreEl = document.getElementById('proyectoNombre');
            const usuarioNombreEl = document.getElementById('usuarioNombre');
            
            if (proyectoNombreEl) {
                proyectoNombreEl.textContent = data.proyecto.nombre;
            } else {
                console.error('Elemento #proyectoNombre no encontrado');
            }
            
            if (usuarioNombreEl && data.usuario) {
                usuarioNombreEl.innerHTML = `
                    <i class="bi bi-person-circle"></i> ${data.usuario.nombre}
                `;
            } else {
                console.error('Elemento #usuarioNombre no encontrado');
            }
            
            document.title = `Kanban - ${data.proyecto.nombre}`;
        } else {
            console.error('Error en respuesta:', data.message);
            
            const proyectoNombreEl = document.getElementById('proyectoNombre');
            if (proyectoNombreEl) {
                proyectoNombreEl.textContent = 'Error: ' + data.message;
            }
        }
    } catch (error) {
        console.error('Error completo al cargar proyecto:', error);
        
        const proyectoNombreEl = document.getElementById('proyectoNombre');
        if (proyectoNombreEl) {
            proyectoNombreEl.textContent = 'Error de conexión';
        }
        
        mostrarAlerta('No se pudo cargar el proyecto. Verifica que MAMP esté corriendo.', 'danger');
    }
}

// Cargar tareas
async function cargarTareas() {
    try {
        console.log('Cargando tareas del proyecto:', proyectoId);
        
        const response = await fetch(`/gestor-tareas/api/tareas.php?proyecto_id=${proyectoId}`);
        
        console.log('Response status tareas:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos de tareas:', data);
        
        if (data.success) {
            // Limpiar columnas
            document.getElementById('columna-tareas').innerHTML = '';
            document.getElementById('columna-en_proceso').innerHTML = '';
            document.getElementById('columna-terminadas').innerHTML = '';
            
            if (data.tareas.length === 0) {
                mostrarColumnasVacias();
            } else {
                data.tareas.forEach(tarea => {
                    agregarTareaAlDOM(tarea);
                });
            }
            
            actualizarContadores();
        } else {
            mostrarAlerta('Error al cargar tareas: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error completo al cargar tareas:', error);
        mostrarAlerta('Error al cargar las tareas. Verifica la conexión.', 'danger');
    }
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
                const nuevaPosicion = evt.newIndex;
                
                actualizarEstadoTarea(tareaId, nuevoEstado, nuevaPosicion);
            }
        });
    });
}

// Mostrar mensaje en columnas vacías
function mostrarColumnasVacias() {
    const columnas = {
        'tareas': 'No hay tareas pendientes',
        'en_proceso': 'No hay tareas en proceso',
        'terminadas': 'No hay tareas terminadas'
    };
    
    Object.keys(columnas).forEach(estado => {
        const columna = document.getElementById(`columna-${estado}`);
        if (columna) {
            columna.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>${columnas[estado]}</p>
                </div>
            `;
        }
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

// Agregar tarea al DOM
function agregarTareaAlDOM(tarea) {
    const columna = document.getElementById(`columna-${tarea.estado}`);
    
    if (!columna) {
        console.error('Columna no encontrada:', tarea.estado);
        return;
    }
    
    // Remover mensaje vacío si existe
    const emptyState = columna.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const tareaCard = document.createElement('div');
    tareaCard.className = 'tarea-card';
    tareaCard.dataset.tareaId = tarea.id;
    
    const prioridadClass = `prioridad-${tarea.prioridad}`;
    
    tareaCard.innerHTML = `
        <div class="tarea-titulo">${escapeHtml(tarea.titulo)}</div>
        ${tarea.descripcion ? `<div class="tarea-descripcion">${escapeHtml(tarea.descripcion)}</div>` : ''}
        <div class="tarea-footer">
            <span class="badge badge-prioridad ${prioridadClass}">${tarea.prioridad.toUpperCase()}</span>
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

// Abrir modal para crear tarea
function abrirModalTarea(estado = 'tareas') {
    document.getElementById('formTarea').reset();
    document.getElementById('tareaId').value = '';
    document.getElementById('tareaEstado').value = estado;
    document.querySelector('#tareaModal .modal-title').textContent = 'Nueva Tarea';
    
    tareaModal.show();
}

// Editar tarea
async function editarTarea(id) {
    try {
        const response = await fetch(`/gestor-tareas/api/tareas.php?id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const tarea = data.tarea;
            document.getElementById('tareaId').value = tarea.id;
            document.getElementById('tareaTitulo').value = tarea.titulo;
            document.getElementById('tareaDescripcion').value = tarea.descripcion || '';
            document.getElementById('tareaPrioridad').value = tarea.prioridad;
            document.getElementById('tareaEstado').value = tarea.estado;
            document.querySelector('#tareaModal .modal-title').textContent = 'Editar Tarea';
            
            tareaModal.show();
        }
    } catch (error) {
        console.error('Error al cargar tarea:', error);
        mostrarAlerta('Error al cargar la tarea', 'danger');
    }
}

// Guardar tarea
async function guardarTarea() {
    const form = document.getElementById('formTarea');
    const formData = new FormData(form);
    formData.append('proyecto_id', proyectoId);
    
    const tareaId = document.getElementById('tareaId').value;
    const url = tareaId 
        ? `/gestor-tareas/api/tareas.php?id=${tareaId}` 
        : '/gestor-tareas/api/tareas.php';
    const method = tareaId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            body: method === 'PUT' ? JSON.stringify(Object.fromEntries(formData)) : formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            tareaModal.hide();
            cargarTareas();
            mostrarAlerta('Tarea guardada exitosamente', 'success');
        } else {
            mostrarAlerta(data.message || 'Error al guardar la tarea', 'danger');
        }
    } catch (error) {
        console.error('Error al guardar tarea:', error);
        mostrarAlerta('Error al guardar la tarea', 'danger');
    }
}

// Eliminar tarea
async function eliminarTarea(id) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) {
        return;
    }
    
    try {
        const response = await fetch(`/gestor-tareas/api/tareas.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            cargarTareas();
            mostrarAlerta('Tarea eliminada exitosamente', 'success');
        } else {
            mostrarAlerta(data.message || 'Error al eliminar la tarea', 'danger');
        }
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        mostrarAlerta('Error al eliminar la tarea', 'danger');
    }
}

// Actualizar estado de tarea (drag & drop)
async function actualizarEstadoTarea(id, nuevoEstado, posicion) {
    try {
        const response = await fetch(`/gestor-tareas/api/tareas.php?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: nuevoEstado,
                orden: posicion
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            actualizarContadores();
        } else {
            mostrarAlerta('Error al actualizar la tarea', 'danger');
            cargarTareas();
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        cargarTareas();
    }
}

// Ir a estadísticas
function irAEstadisticas() {
    window.location.href = `/gestor-tareas/public/estadisticas.php?id=${proyectoId}`;
}

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarAlerta(mensaje, tipo = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 3000);
}