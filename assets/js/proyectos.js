function agregarTablero() {
    const nombre = prompt("Nombre del nuevo tablero:");
    if (!nombre) return;

    const container = document.getElementById("boardsList");
    const col = document.createElement("div");
    col.classList.add("col-auto");

    col.innerHTML = `
        <div class="board-card">${nombre}</div>
    `;

    container.insertBefore(col, container.lastElementChild);
}

function agregarProyecto() {
    alert("Aquí pronto podrás crear proyectos de verdad.");
}

function agregarTablero() {
    alert("Aquí podrás agregar un tablero.");
}
