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
    "elec_domiciliaria": ["Conductores", "Canalización PVC", "Artefactos", "Protecciones Domiciliarias", "Cajas y Accesorios"],
    "elec_industrial": ["Tableros y Gabinetes", "Control de Motores", "Maniobra y Relés", "Comandos y Señalética", "Canalización Galvanizada"],
    "herramientas": ["Herramientas Eléctricas (Total)", "Herramientas de Mano", "Instrumentos de Medición", "Cajas y Organizadores"],
    "ferreteria_industrial": ["Fijaciones y Anclajes", "Abrasivos y Corte", "Adhesivos y Sellantes", "Herrajes Pesados"],
    "gasfiteria_electrica": ["Duchas Eléctricas", "Llaves de Agua Eléctricas", "Calentadores de Punto"],
    "gasfiteria_general": ["Tuberías y Terminales (PPR/PVC)", "Llaves de Paso", "Fitting y Conexiones", "Válvulas y Grifería"],
    "epp": ["Calzado de Seguridad", "Protección Corporal", "Guantes de Trabajo", "Protección Facial y Craneal"],
    "seguridad_vigilancia": ["Cámaras CCTV", "Alarmas", "Citofonía", "Redes y Datos"],
    "automatizacion_control": ["Instrumentación Industrial", "Domótica Smart Home", "Sensores y PLCs"],
    "iluminacion": ["Proyectores LED (Exterior)", "Paneles y Focos (Interior)", "Emergencia"],
    "ernc_riego": ["Paneles Solares", "Controladores y Baterías", "Sistemas de Riego"]
};

   function cargarSubcategorias() {
    const catSelect = document.getElementById("cat");
    const subcatSelect = document.getElementById("subcat");
    const seleccion = catSelect.value;

    // Limpiar subcategorías previas
    subcatSelect.innerHTML = '<option value="">Seleccione Sub-categoría</option>';

    if (seleccion && datosMakro[seleccion]) {
        subcatSelect.disabled = false;
        
        datosMakro[seleccion].forEach(sub => {
            const option = document.createElement("option");
            // Limpiamos el texto para el valor (sin acentos, minúsculas, guiones bajos)
            option.value = sub.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
            option.textContent = sub;
            subcatSelect.appendChild(option);
        });
    } else {
        subcatSelect.disabled = true;
    }
}
