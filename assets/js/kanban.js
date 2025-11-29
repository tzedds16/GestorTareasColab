const proyectoId = window.proyectoId || new URLSearchParams(window.location.search).get('id') || 1;
let tareaModal;

document.addEventListener('DOMContentLoaded', function() {
    tareaModal = new bootstrap.Modal(document.getElementById('tareaModal'));
    
    // Inicializar Sortable en cada columna
    inicializarDragAndDrop();
    
    // Cargar tareas
    cargarTareas();
});

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

async function cargarTareas() {
    try {
        const response = await fetch(`../api/tareas.php?proyecto_id=${proyectoId}`);
        const data = await response.json();
        
        if (data.success) {
            // Limpiar columnas
            document.getElementById('columna-tareas').innerHTML = '';
            document.getElementById('columna-en_proceso').innerHTML = '';
            document.getElementById('columna-terminadas').innerHTML = '';
            
            // Agregar tareas a cada columna
            data.tareas.forEach(tarea => {
                agregarTareaAlDOM(tarea);
            });
        } else {
            mostrarAlerta('Error al cargar tareas: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        mostrarAlerta('Error al cargar las tareas', 'danger');
    }
}

function agregarTareaAlDOM(tarea) {
    const columna = document.getElementById(`columna-${tarea.estado}`);
    
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

function abrirModalTarea(estado = 'tareas') {
    document.getElementById('formTarea').reset();
    document.getElementById('tareaId').value = '';
    document.getElementById('tareaEstado').value = estado;
    document.querySelector('#tareaModal .modal-title').textContent = 'Nueva Tarea';
    
    tareaModal.show();
}

async function editarTarea(id) {
    try {
        const response = await fetch(`../api/tareas.php?id=${id}`);
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

async function guardarTarea() {
    const form = document.getElementById('formTarea');
    const formData = new FormData(form);
    formData.append('proyecto_id', proyectoId);
    
    const tareaId = document.getElementById('tareaId').value;
    const url = tareaId ? `../api/tareas.php?id=${tareaId}` : '../api/tareas.php';
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

async function actualizarEstadoTarea(id, nuevoEstado, posicion) {
    try {
        const response = await fetch(`../api/tareas.php?id=${id}`, {
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
        
        if (!data.success) {
            mostrarAlerta('Error al actualizar la tarea', 'danger');
            cargarTareas();
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        cargarTareas();
    }
}

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