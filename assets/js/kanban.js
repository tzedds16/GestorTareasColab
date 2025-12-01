let tableroId = new URLSearchParams(window.location.search).get('id');
let tareaModal;
let tareas = [];

document.addEventListener('DOMContentLoaded', function() {
    tareaModal = new bootstrap.Modal(document.getElementById('tareaModal'));
    
    if (!tableroId) {
        alert('Falta el ID del tablero');
        window.location.href = 'proyectos.html';
        return;
    }
    
    verificarAutenticacion();
    cargarUsuario();
    cargarTablero();
    inicializarDragAndDrop();
    cargarTareas();
});

async function verificarAutenticacion() {
    try {
        const response = await fetch('../api/check_auth.php');
        const data = await response.json();
        
        if (!data.success) {
            window.location.href = 'auth.html';
        }
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = 'auth.html';
    }
}

async function cargarUsuario() {
    try {
        const response = await fetch('../api/usuario.php');
        const data = await response.json();
        
        if (data.success) {
            const usuario = data.usuario;
            document.getElementById('usuarioNombre').textContent = usuario.nombre;
        } else {
            document.getElementById('usuarioNombre').textContent = 'Usuario desconocido';
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        document.getElementById('usuarioNombre').textContent = 'Error';
    }
}

async function cargarTablero() {
    try {
        const response = await fetch(`../api/tablero.php?id=${tableroId}`);
        const data = await response.json();
        
        if (data.success) {
            const tablero = data.tablero;
            document.getElementById('proyectoNombre').textContent = `${tablero.proyecto_nombre} - ${tablero.nombre}`;
            document.title = `Kanban - ${tablero.nombre}`;
        } else {
            document.getElementById('proyectoNombre').textContent = 'Tablero no encontrado';
        }
    } catch (error) {
        console.error('Error al cargar tablero:', error);
        document.getElementById('proyectoNombre').textContent = 'Error al cargar tablero';
    }
}

async function cargarTareas() {
    try {
        const response = await fetch(`../api/tareas.php?tablero_id=${tableroId}`);
        const data = await response.json();
        
        if (data.success) {
            tareas = data.tareas || [];
            console.log('Tareas cargadas:', tareas); 
            mostrarTareas();
        } else {
            console.error('Error al cargar tareas:', data.message);
            tareas = [];
            mostrarTareas();
        }
    } catch (error) {
        console.error('Error:', error);
        tareas = [];
        mostrarTareas();
    }
}

function mostrarTareas() {
    document.getElementById('columna-tareas').innerHTML = '';
    document.getElementById('columna-en_proceso').innerHTML = '';
    document.getElementById('columna-terminadas').innerHTML = '';
    
    if (tareas.length === 0) {
        mostrarColumnasVacias();
        return;
    }
    
    const tareasPorEstado = {
        'tareas': tareas.filter(t => t.estado === 'tareas'),
        'en_proceso': tareas.filter(t => t.estado === 'en_proceso'),
        'terminadas': tareas.filter(t => t.estado === 'terminadas')
    };
    
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

function agregarTareaAlDOM(tarea) {
    const columna = document.getElementById(`columna-${tarea.estado}`);
    
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

function abrirModalTarea(estado = 'tareas') {
    document.getElementById('formTarea').reset();
    document.getElementById('tareaId').value = '';
    document.getElementById('tareaEstado').value = estado;
    document.getElementById('tareaPrioridad').value = 'media';
    document.querySelector('#tareaModal .modal-title').textContent = 'Nueva Tarea';
    
    tareaModal.show();
}

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
            response = await fetch('../api/tareas.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tablero_id: tableroId,
                    titulo: titulo,
                    descripcion: descripcion,
                    prioridad: prioridad,
                    estado: estado
                })
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            tareaModal.hide();
            mostrarAlerta(tareaId ? 'Tarea actualizada' : 'Tarea creada', 'success');
            cargarTareas(); 
        } else {
            mostrarAlerta(data.message || 'Error al guardar', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
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
            mostrarAlerta('Tarea eliminada', 'success');
            cargarTareas();
        } else {
            tareas = tareas.filter(t => t.id != id);
            mostrarAlerta('Tarea eliminada', 'success');
            mostrarTareas();
        }
    } catch (error) {
        console.error('Error:', error);
        tareas = tareas.filter(t => t.id != id);
        mostrarAlerta('Tarea eliminada', 'success');
        mostrarTareas();
    }
}

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
            const tarea = tareas.find(t => t.id == id);
            if (tarea) {
                tarea.estado = nuevoEstado;
            }
        }
        
        actualizarContadores();
    } catch (error) {
        console.error('Error:', error);
        const tarea = tareas.find(t => t.id == id);
        if (tarea) {
            tarea.estado = nuevoEstado;
        }
        actualizarContadores();
    }
}

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

function mostrarColaboradores() {
    alert('Funcionalidad de colaboradores en desarrollo');
}

function irAEstadisticas() {
    console.log('irAEstadisticas llamado');
    console.log('tableroId global:', tableroId);
    
    if (tableroId) {
        localStorage.setItem('tablero_id', tableroId);
        console.log('Tablero ID guardado en localStorage:', tableroId);
        console.log('Verificando localStorage:', localStorage.getItem('tablero_id'));
        window.location.href = 'admin.html';
    } else {
        console.error('Error: tableroId es null o undefined');
        alert('Error: No se encontró el ID del tablero');
    }
}