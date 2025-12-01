let tableroId = null;
let estadosChart = null;
let prioridadesChart = null;

window.addEventListener('DOMContentLoaded', function() {
    tableroId = localStorage.getItem('tablero_id');
    
    console.log('Tablero ID desde localStorage:', tableroId);
    
    if (tableroId) {
        cargarEstadisticas();
    } else {
        console.error('No se encontró el tablero en localStorage');
        cargarTablerosDisponibles();
    }
});

function cargarTablerosDisponibles() {
    fetch(`../api/tableros.php`)
        .then(r => r.json())
        .then(data => {
            console.log('Tableros disponibles:', data);
            if (data.success && data.tableros && data.tableros.length > 0) {
                tableroId = data.tableros[0].id;
                localStorage.setItem('tablero_id', tableroId);
                console.log('Usando tablero por defecto:', tableroId);
                cargarEstadisticas();
            } else {
                console.error('No hay tableros disponibles');
                mostrarError();
            }
        })
        .catch(err => console.error('Error cargando tableros:', err));
}

function cargarEstadisticas() {
    fetch(`../api/tareas.php?tablero_id=${tableroId}`)
        .then(r => r.json())
        .then(data => {
            console.log('Datos recibidos:', data);
            if (data.success && data.tareas) {
                let countTodo = 0;
                let countProgress = 0;
                let countDone = 0;
                let countAlta = 0;
                let countMedia = 0;
                let countBaja = 0;
                
                data.tareas.forEach(tarea => {
                    console.log('Tarea estado:', tarea.estado, 'Prioridad:', tarea.prioridad);
                    
                    if (tarea.estado === 'tareas') countTodo++;
                    else if (tarea.estado === 'en_proceso') countProgress++;
                    else if (tarea.estado === 'terminadas') countDone++;
                    
                    if (tarea.prioridad === 'alta' || tarea.prioridad === 'Alta') countAlta++;
                    else if (tarea.prioridad === 'media' || tarea.prioridad === 'Media') countMedia++;
                    else if (tarea.prioridad === 'baja' || tarea.prioridad === 'Baja') countBaja++;
                });
                
                console.log('Conteos finales - Todo:', countTodo, 'Progress:', countProgress, 'Done:', countDone);
                console.log('Prioridades - Alta:', countAlta, 'Media:', countMedia, 'Baja:', countBaja);
                
                document.getElementById('tareasTodo').textContent = countTodo;
                document.getElementById('tareasProgress').textContent = countProgress;
                document.getElementById('tareasDone').textContent = countDone;
                
                document.getElementById('tareasAlta').textContent = countAlta;
                document.getElementById('tareaMedia').textContent = countMedia;
                document.getElementById('tareasBaja').textContent = countBaja;
                
                dibujarGraficaEstados(countTodo, countProgress, countDone);
                dibujarGraficaPrioridades(countAlta, countMedia, countBaja);
            } else {
                console.error('No se encontraron tareas o no hubo respuesta válida');
                mostrarError();
            }
        })
        .catch(err => {
            console.error('Error cargando estadísticas:', err);
            mostrarError();
        });
}

function dibujarGraficaEstados(todo, progress, done) {
    const ctx = document.getElementById('estadosChart');
    if (!ctx) return;
    
    if (estadosChart) {
        estadosChart.destroy();
    }
    
    estadosChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Por Hacer', 'En Progreso', 'Terminadas'],
            datasets: [{
                data: [todo, progress, done],
                backgroundColor: [
                    '#ff9800',
                    '#2a72ff',
                    '#28a745'
                ],
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                }
            }
        }
    });
}

function dibujarGraficaPrioridades(alta, media, baja) {
    const ctx = document.getElementById('prioridadesChart');
    if (!ctx) return;
    
    if (prioridadesChart) {
        prioridadesChart.destroy();
    }
    
    prioridadesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Alta', 'Media', 'Baja'],
            datasets: [{
                label: 'Cantidad de Tareas',
                data: [alta, media, baja],
                backgroundColor: [
                    '#dc3545',
                    '#ffc107',
                    '#17a2b8'
                ],
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'x',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function mostrarError() {
    document.getElementById('tareasTodo').textContent = 'Error';
    document.getElementById('tareasProgress').textContent = 'Error';
    document.getElementById('tareasDone').textContent = 'Error';
    document.getElementById('tareasAlta').textContent = 'Error';
    document.getElementById('tareaMedia').textContent = 'Error';
    document.getElementById('tareasBaja').textContent = 'Error';
}

function irAlTablero() {
    window.history.back();
}
