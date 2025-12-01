// proyectos.js - Funcionalidades para la página de proyectos

let proyectos = [];
let tableros = [];
let proyectoModal;
let tableroModal;
let currentProyectoId = null;

document.addEventListener('DOMContentLoaded', function() {
    proyectoModal = new bootstrap.Modal(document.getElementById('modalProyecto'));
    tableroModal = new bootstrap.Modal(document.getElementById('modalTablero'));

    // Verificar autenticación y cargar datos
    verificarAutenticacion();
    cargarUsuario();
    cargarProyectos(); // carga proyectos para select & sidebar
    cargarTableros(); // carga los tableros para la vista principal
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
            poblarSelectProyectos();
            poblarSidebarProyectos();
        } else {
            mostrarError('Error al cargar proyectos: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al conectar con el servidor. Intenta nuevamente.');
    }
}

// Cargar tableros desde la API (lista global del usuario)
async function cargarTableros() {
    try {
        const response = await fetch('../api/tableros.php');
        const data = await response.json();

        if (data.success) {
            tableros = data.tableros || [];
            mostrarTableros();
        } else {
            mostrarError('Error al cargar tableros: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al conectar con el servidor. Intenta nuevamente.');
    }
}

// Mostrar proyectos en el sidebar y en el contenido principal
function poblarSidebarProyectos() {
    const listaProyectos = document.getElementById('listaProyectos');
    listaProyectos.innerHTML = '';
    proyectos.forEach(proyecto => {
        const proyectoElement = document.createElement('div');
        proyectoElement.className = 'sidebar-project';
        proyectoElement.dataset.proyectoId = proyecto.id;
        proyectoElement.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <div class="color-indicator" style="background: ${proyecto.color}"></div>
                    <span class="ms-2">${proyecto.nombre}</span>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-danger del-proj-btn" title="Eliminar proyecto">×</button>
                </div>
            </div>
        `;
        proyectoElement.onclick = () => filtrarPorProyecto(proyecto.id);
        // botón eliminar dentro del elemento
        const delBtn = proyectoElement.querySelector('.del-proj-btn');
        if (delBtn) {
            delBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                eliminarProyecto(proyecto.id, proyecto.nombre);
            });
        }
        listaProyectos.appendChild(proyectoElement);
    });

}

function poblarSelectProyectos() {
    const select = document.getElementById('proyectoSelect');
    if (!select) return;
    select.innerHTML = '';
    proyectos.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nombre;
        select.appendChild(opt);
    });
}

function mostrarTableros(filterProyectoId = null) {
    const boardsList = document.getElementById('boardsList');
    boardsList.innerHTML = '';
    // Si no se indica proyecto y no hay proyecto seleccionado, mostrar placeholder
    if (!filterProyectoId && !currentProyectoId) {
        boardsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="bi bi-kanban" style="font-size: 4rem; opacity: 0.5;"></i>
                    <h4 class="mt-3">Selecciona un proyecto</h4>
                    <p class="text-muted">Selecciona un proyecto en la barra lateral para ver sus tableros o crea uno nuevo.</p>
                    <button class="btn btn-outline-primary mt-3 me-2" onclick="abrirModalProyecto()">＋ Crear proyecto</button>
                </div>
            </div>
        `;
        return;
    }

    const lista = (filterProyectoId || currentProyectoId) ? tableros.filter(t => t.proyecto_id == (filterProyectoId || currentProyectoId)) : tableros;

    if (!lista || lista.length === 0) {
        boardsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="bi bi-inbox" style="font-size: 4rem; opacity: 0.5;"></i>
                    <h4 class="mt-3">No tienes tableros</h4>
                    <p class="text-muted">Crea tu primer tablero para comenzar</p>
                    <button class="btn btn-primary mt-3" onclick="abrirModalTablero()">
                        Crear Primer Tablero
                    </button>
                </div>
            </div>
        `;
        return;
    }

    lista.forEach(tablero => {
        const col = document.createElement('div');
        col.className = 'col-md-4';
        const proyectoColor = tablero.proyecto_color || '#6366f1';
        const proyectoNombre = tablero.proyecto_nombre || '';
        col.innerHTML = `
            <div class="board-card" onclick="irATablero(${tablero.id})">
                <div class="d-flex justify-content-end mb-2">
                    <button class="btn btn-sm btn-outline-danger del-board-btn" title="Eliminar tablero">×</button>
                </div>
                <div class="d-flex align-items-center mb-2">
                    <div class="color-indicator" style="background: ${proyectoColor}"></div>
                    <h5 class="mb-0">${tablero.nombre}</h5>
                </div>
                <p class="text-muted small mb-2">${proyectoNombre}</p>
                <small class="text-muted">Haz clic para abrir</small>
            </div>
        `;
        boardsList.appendChild(col);
        // Añadir listener al botón eliminar para evitar propagación del click
        const delBtn = col.querySelector('.del-board-btn');
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                eliminarTablero(tablero.id, tablero.nombre);
            });
        }
    });

    // Agregar botón para nuevo tablero
    const colAdd = document.createElement('div');
    colAdd.className = 'col-md-4';
    colAdd.innerHTML = `
        <div class="board-card add-board" onclick="abrirModalTablero()">
            <span class="plus">+</span>
            <div>Nuevo Tablero</div>
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

function abrirModalTablero() {
    const form = document.getElementById('formTablero');
    if (form) form.reset();
    // Asegurar que hay un proyecto seleccionado
    if (!currentProyectoId && proyectos.length > 0) {
        setSelectedProject(proyectos[0].id);
    }
    // Mostrar info del proyecto actual en el modal
    const info = document.getElementById('tableroProyectoInfo');
    const hid = document.getElementById('tableroProyectoId');
    const proj = proyectos.find(p => p.id == currentProyectoId);
    if (info) info.textContent = proj ? proj.nombre : 'Ningún proyecto seleccionado';
    if (hid) hid.value = proj ? proj.id : '';
    tableroModal.show();
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

// Crear nuevo tablero
async function crearTablero() {
    const nombre = document.getElementById('tableroNombre').value.trim();
    // obtener proyecto desde hidden input o variable global
    const proyectoHidden = document.getElementById('tableroProyectoId');
    const proyectoId = proyectoHidden && proyectoHidden.value ? proyectoHidden.value : currentProyectoId;

    if (!nombre || !proyectoId) {
        mostrarError('El nombre del tablero y el proyecto son requeridos (selecciona un proyecto)');
        return;
    }

    try {
        const response = await fetch('../api/tableros.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombre,
                proyecto_id: parseInt(proyectoId, 10)
            })
        });

        const data = await response.json();

        if (data.success) {
            tableroModal.hide();
            mostrarMensaje('Tablero creado exitosamente', 'success');
            cargarTableros(); // Recargar la lista desde BD
        } else {
            mostrarError(data.message || 'Error al crear tablero');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al guardar el tablero. Intenta nuevamente.');
    }
}

// Ir al tablero de un proyecto
async function irATablero(proyectoId) {
    // si nos pasan un id de tablero (cuando se hace click sobre tarjeta), navegar directamente
    if (!isNaN(proyectoId)) {
        window.location.href = `tablero.html?id=${proyectoId}`;
        return;
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

function filtrarPorProyecto(proyectoId) {
    setSelectedProject(proyectoId);
    mostrarTableros(proyectoId);
}

function setSelectedProject(proyectoId) {
    currentProyectoId = proyectoId;
    // actualizar apariencia del sidebar
    const items = document.querySelectorAll('#listaProyectos .sidebar-project');
    items.forEach(it => {
        if (it.dataset && it.dataset.proyectoId == proyectoId) {
            it.classList.add('active');
        } else {
            it.classList.remove('active');
        }
    });
    // actualizar info del modal de tablero si está presente
    const info = document.getElementById('tableroProyectoInfo');
    const hid = document.getElementById('tableroProyectoId');
    const proj = proyectos.find(p => p.id == proyectoId);
    if (info) info.textContent = proj ? proj.nombre : 'Ningún proyecto seleccionado';
    if (hid) hid.value = proj ? proj.id : '';
}

// Eliminar proyecto (con confirmación)
async function eliminarProyecto(proyectoId, proyectoNombre = '') {
    if (!confirm(`¿Eliminar el proyecto "${proyectoNombre}"? Esta acción eliminará también sus tableros y tareas.`)) {
        return;
    }

    try {
        const response = await fetch(`../api/proyectos.php?id=${proyectoId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            mostrarMensaje('Proyecto eliminado', 'success');
            // Si el proyecto eliminado estaba seleccionado, limpiar selección
            if (currentProyectoId == proyectoId) {
                currentProyectoId = null;
            }
            // Recargar proyectos y tableros
            await cargarProyectos();
            await cargarTableros();
            // Actualizar vista de tableros (mostrará placeholder si no hay selección)
            mostrarTableros();
        } else {
            mostrarError(data.message || 'Error al eliminar proyecto');
        }
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        mostrarError('Error al eliminar proyecto. Intenta nuevamente.');
    }
}

// Eliminar tablero (con confirmación)
async function eliminarTablero(tableroId, tableroNombre = '') {
    if (!confirm(`¿Eliminar el tablero "${tableroNombre}"? Esta acción eliminará también sus tareas.`)) {
        return;
    }

    try {
        const response = await fetch(`../api/tableros.php?id=${tableroId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            mostrarMensaje('Tablero eliminado', 'success');
            // Recargar lista de tableros y refrescar vista filtrada
            await cargarTableros();
            mostrarTableros(currentProyectoId);
        } else {
            mostrarError(data.message || 'Error al eliminar tablero');
        }
    } catch (error) {
        console.error('Error al eliminar tablero:', error);
        mostrarError('Error al eliminar tablero. Intenta nuevamente.');
    }
}