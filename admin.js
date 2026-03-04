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
        "electricidad": ["Conductores", "Canalización", "Artefactos", "Tableros y Armarios", "Accesorios de Conexión"],
        "protecciones": ["Protecciones Eléctricas", "Componentes de Maniobra", "Control de Motores", "Comandos"],
        "automatizacion": ["Automatización", "Instrumentación", "Domótica"],
        "iluminacion": ["Interior", "Exterior", "Emergencia"],
        "ferreteria": ["Herramientas Eléctricas (Total)", "Herramientas Manuales", "Gasfitería Eléctrica"],
        "seguridad": ["Protección Corporal", "Protección de Extremidades", "Protección Facial", "Vigilancia"],
        "conectividad": ["Redes", "ERNC y Riego"]
    };

    function cargarSubcategorias() {
    const catSelect = document.getElementById("cat");
    const subcatSelect = document.getElementById("subcat");
    const categoriaSeleccionada = catSelect.value;

    // Limpiar subcategorías previas
    subcatSelect.innerHTML = '<option value="">Seleccione Sub-categoría</option>';

    if (categoriaSeleccionada && datosMakro[categoriaSeleccionada]) {
        subcatSelect.disabled = false;

        datosMakro[categoriaSeleccionada].forEach(sub => {
            const option = document.createElement("option");
            // El valor será el nombre en minúsculas y sin espacios
            option.value = sub.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
            option.textContent = sub;
            subcatSelect.appendChild(option);
        });
    } else {
        subcatSelect.disabled = true;
        subcatSelect.innerHTML = '<option value="">Primero elija categoría</option>';
    }
}
