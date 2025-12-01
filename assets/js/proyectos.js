// proyectos.js - Funcionalidades para la página de proyectos

let proyectos = [];
let proyectoModal;

document.addEventListener('DOMContentLoaded', function() {
    proyectoModal = new bootstrap.Modal(document.getElementById('modalProyecto'));
    
    // Verificar autenticación y cargar datos
    verificarAutenticacion();
    cargarUsuario();
    cargarProyectos();
    mostrarAlertaDeLlamadaLogin();
});

// Verificar si el usuario está autenticado
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

// Cargar datos del usuario
async function cargarUsuario() {
    try {
        const response = await fetch('../api/usuario.php');
        const data = await response.json();
        
        if (data.success) {
            const usuario = data.usuario;
            document.getElementById('userInfo').textContent = usuario.nombre;
        } else {
            document.getElementById('userInfo').textContent = 'Usuario desconocido';
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        document.getElementById('userInfo').textContent = 'Error';
    }
}

// Mostrar alerta si viene de login exitoso
function mostrarAlertaDeLlamadaLogin() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login_success')) {
        const container = document.getElementById('mainAlertContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = 'Inicio de sesión exitoso. ¡Bienvenido! <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
        container.appendChild(alertDiv);

        if (window.history && window.history.replaceState) {
            const url = new URL(window.location);
            url.searchParams.delete('login_success');
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }

        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            try { bsAlert.close(); } catch(e){}
        }, 3500);
    }
}

// Cargar proyectos desde la API
async function cargarProyectos() {
    try {
        const response = await fetch('../api/proyectos.php');
        const data = await response.json();
        
        if (data.success) {
            proyectos = data.proyectos;
            mostrarProyectos();
        } else {
            mostrarError('Error al cargar proyectos: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al conectar con el servidor. Intenta nuevamente.');
    }
}

// Mostrar proyectos en el sidebar y en el contenido principal
function mostrarProyectos() {
    const listaProyectos = document.getElementById('listaProyectos');
    const boardsList = document.getElementById('boardsList');
    
    // Limpiar listas
    listaProyectos.innerHTML = '';
    boardsList.innerHTML = '';
    
    if (proyectos.length === 0) {
        // Mostrar estado vacío
        boardsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="bi bi-inbox" style="font-size: 4rem; opacity: 0.5;"></i>
                    <h4 class="mt-3">No tienes proyectos</h4>
                    <p class="text-muted">Crea tu primer proyecto para comenzar</p>
                    <button class="btn btn-primary mt-3" onclick="abrirModalProyecto()">
                        Crear Primer Proyecto
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Mostrar proyectos en sidebar
    proyectos.forEach(proyecto => {
        const proyectoElement = document.createElement('div');
        proyectoElement.className = 'sidebar-project';
        proyectoElement.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="color-indicator" style="background: ${proyecto.color}"></div>
                ${proyecto.nombre}
            </div>
        `;
        proyectoElement.onclick = () => irATablero(proyecto.id);
        listaProyectos.appendChild(proyectoElement);
    });
    
    // Mostrar proyectos en contenido principal
    proyectos.forEach(proyecto => {
        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
            <div class="board-card" onclick="irATablero(${proyecto.id})">
                <div class="d-flex align-items-center mb-2">
                    <div class="color-indicator" style="background: ${proyecto.color}"></div>
                    <h5 class="mb-0">${proyecto.nombre}</h5>
                </div>
                <p class="text-muted small mb-2">${proyecto.descripcion || 'Sin descripción'}</p>
                <small class="text-muted">Haz clic para abrir</small>
            </div>
        `;
        boardsList.appendChild(col);
    });
    
    // Agregar botón para nuevo proyecto
    const colAdd = document.createElement('div');
    colAdd.className = 'col-md-4';
    colAdd.innerHTML = `
        <div class="board-card add-board" onclick="abrirModalProyecto()">
            <span class="plus">+</span>
            <div>Nuevo Proyecto</div>
        </div>
    `;
    boardsList.appendChild(colAdd);
}

// Abrir modal para crear proyecto
function abrirModalProyecto() {
    document.getElementById('formProyecto').reset();
    document.getElementById('proyectoColor').value = '#6366f1';
    proyectoModal.show();
}

// Crear nuevo proyecto
async function crearProyecto() {
    const nombre = document.getElementById('proyectoNombre').value.trim();
    const descripcion = document.getElementById('proyectoDescripcion').value.trim();
    const color = document.getElementById('proyectoColor').value;
    
    if (!nombre) {
        mostrarError('El nombre del proyecto es requerido');
        return;
    }
    
    try {
        const response = await fetch('../api/proyectos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                descripcion: descripcion,
                color: color
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            proyectoModal.hide();
            mostrarMensaje('Proyecto creado exitosamente', 'success');
            cargarProyectos(); // Recargar la lista desde BD
        } else {
            mostrarError(data.message || 'Error al crear proyecto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al guardar el proyecto. Intenta nuevamente.');
    }
}

// Ir al tablero de un proyecto
async function irATablero(proyectoId) {
    try {
        // Primero, obtener o crear el tablero para este proyecto
        const response = await fetch(`../api/tableros.php?proyecto_id=${proyectoId}`);
        const data = await response.json();
        
        if (data.success && data.tableros && data.tableros.length > 0) {
            // Si existe al menos un tablero, ir al primero
            window.location.href = `tablero.html?id=${data.tableros[0].id}`;
        } else {
            // Si no existe tablero, crear uno por defecto
            crearTableroYNavegar(proyectoId);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al acceder al proyecto. Intenta nuevamente.');
    }
}

// Crear tablero por defecto y navegar
async function crearTableroYNavegar(proyectoId) {
    try {
        const response = await fetch('../api/tableros.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: 'Kanban',
                proyecto_id: proyectoId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = `tablero.html?id=${data.tablero_id}`;
        } else {
            mostrarError('Error al crear tablero: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al crear tablero. Intenta nuevamente.');
    }
}

// Utilidades
function mostrarMensaje(mensaje, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alerta.style.zIndex = '9999';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 4000);
}

function mostrarError(mensaje) {
    mostrarMensaje(mensaje, 'danger');
}