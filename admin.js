/**
 * Cambia la vista activa del gestor
 * @param {string} viewId - El ID del div a mostrar
 * @param {HTMLElement} btn - El botón presionado
 */
function showView(viewId, btn) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Quitar estado activo de todos los botones
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Mostrar la vista seleccionada
    document.getElementById(viewId).classList.add('active');
    
    // Activar el botón presionado
    btn.classList.add('active');
}

/**
 * Filtra las filas de la tabla de inventario según el buscador
 */
function filterTable() {
    let input = document.getElementById("search").value.toLowerCase();
    let rows = document.getElementById("inventory-body").getElementsByTagName("tr");
    
    for (let row of rows) {
        // Muestra u oculta la fila basándose en si el texto coincide
        row.style.display = row.textContent.toLowerCase().includes(input) ? "" : "none";
    }
}

/**
 * Funciones para el manejo del Modal de Edición
 */
function openEditModal() { 
    document.getElementById('edit-modal').style.display = 'flex'; 
}

function closeModal() { 
    document.getElementById('edit-modal').style.display = 'none'; 
}

// Ejemplo de función para guardar (puedes conectarla con Supabase aquí)
function saveEdit() {
    console.log("Datos actualizados localmente");
    closeModal();
}
    const datosMakro = {
    "elec_domiciliaria": ["Conductores", "Canalización PVC", "Artefactos", "Protecciones", "Cajas y Accesorios"],
    "elec_industrial": ["Tableros y Gabinetes", "Control de Motores", "Maniobra y Relés", "Comandos y Señalética", "Canalización Galvanizada"],
    "herramientas": ["Herramientas Eléctricas Total", "Herramientas de Mano", "Instrumentos de Medición"],
    "ferreteria_industrial": ["Fijaciones y Anclajes", "Abrasivos y Corte", "Adhesivos y Sellantes"],
    "gasfiteria": ["Duchas Eléctricas", "Llaves de Agua Eléctricas", "Termos Eléctricos","Tuberías PPR/PVC", "Llaves de Paso", "Fitting y Válvulas"],
    "epp": ["Calzado de Seguridad", "Ropa de Trabajo", "Guantes", "Cascos y Antiparras"],
    "seguridad_vigilancia": ["Cámaras CCTV", "Alarmas", "Conectividad y Redes"],
    "automatizacion_control": ["Instrumentación Industrial", "Domótica", "Sensores y PLCs"],
    "iluminacion": ["Proyectores Exterior", "Focos Interior", "Emergencia"],
    "ernc_riego": ["Energía Solar", "Sistemas de Riego"]
};

   function cargarSubcategorias() {
    const catSelect = document.getElementById("cat");
    const subcatSelect = document.getElementById("subcat");
    const seleccion = catSelect.value;

    // Limpiar opciones anteriores
    subcatSelect.innerHTML = '<option value="">Seleccione Sub-Categoría</option>';

    if (seleccion && datosMakro[seleccion]) {
        subcatSelect.disabled = false;
        
        datosMakro[seleccion].forEach(sub => {
            const option = document.createElement("option");
            // El valor interno será el nombre sin espacios para facilitar la base de datos
            option.value = sub.replace(/\s+/g, '_').toLowerCase();
            option.textContent = sub;
            subcatSelect.appendChild(option);
        });
    } else {
        subcatSelect.disabled = true;
    }
}
// Variable global para saber qué producto estamos editando
let editIndex = null;

// 1. Función para cargar subcategorías DENTRO del modal
function cargarSubcategoriasEdicion(subcatPreseleccionada = "") {
    const catSelect = document.getElementById("edit-cat");
    const subcatSelect = document.getElementById("edit-subcat");
    const seleccion = catSelect.value;

    subcatSelect.innerHTML = '<option value="">Seleccione Sub-Categoría</option>';

    if (seleccion && datosMakro[seleccion]) {
        datosMakro[seleccion].forEach(sub => {
            const option = document.createElement("option");
            option.value = sub.replace(/\s+/g, '_').toLowerCase();
            option.textContent = sub;
            if (option.value === subcatPreseleccionada) option.selected = true;
            subcatSelect.appendChild(option);
        });
    }
}

// 2. Función para abrir el modal con los datos actuales
function openEditModal(index) {
    editIndex = index;
    const producto = inventario[index]; // Asumiendo que tu array se llama inventario

    document.getElementById("edit-nombre").value = producto.nombre;
    document.getElementById("edit-cat").value = producto.categoria;
    document.getElementById("edit-stock").value = producto.stock;
    document.getElementById("edit-desc").value = producto.descripcion || "";

    // Cargar las subcategorías y preseleccionar la correcta
    cargarSubcategoriasEdicion(producto.subcategoria);

    document.getElementById("edit-modal").style.display = "flex";
}

// 3. Función para borrar un artículo
function deleteProduct(index) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto de Makro?")) {
        inventario.splice(index, 1);
        renderTable(); // Función que vuelve a dibujar la tabla
    }
}

// 4. Cerrar Modal
function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
}
