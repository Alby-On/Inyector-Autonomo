// Variables globales
let archivosListos = { foto1: null, foto2: null, foto3: null };

// Datos de Categorías Makro SPA
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

// --- INICIALIZACIÓN ---
document.getElementById('add-form').addEventListener('submit', inyectarEquipo);

// --- NAVEGACIÓN ---
function showView(viewId, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    btn.classList.add('active');
    
    // Si entramos a la lista, cargamos los datos de Supabase
    if(viewId === 'list-view') cargarTablaDesdeSupabase();
}

// --- LÓGICA DE CATEGORÍAS (Corregida) ---
function cargarSubcategorias() {
    const catSelect = document.getElementById("cat");
    const subcatSelect = document.getElementById("subcat");
    const seleccion = catSelect.value;

    subcatSelect.innerHTML = '<option value="">Seleccione Sub-Categoría</option>';

    if (seleccion && datosMakro[seleccion]) {
        subcatSelect.disabled = false; // Habilita el campo
        datosMakro[seleccion].forEach(sub => {
            const option = document.createElement("option");
            option.value = sub.replace(/\s+/g, '_').toLowerCase();
            option.textContent = sub;
            subcatSelect.appendChild(option);
        });
    } else {
        subcatSelect.disabled = true;
    }
}

async function deleteProduct(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto de Makro?")) {
        const { error } = await _supabase.from('productos').delete().eq('id', id);
        if (error) alert("Error al eliminar");
        else cargarTablaDesdeSupabase();
    }
}

// --- PROCESAMIENTO DE IMÁGENES ---
const opcionesCompresion = {
    maxSizeMB: 3,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp'
};

async function previewAndProcess(input, imgId) {
    const file = input.files[0];
    if (!file) return;
    const preview = document.getElementById(imgId);
    try {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
        const compressedFile = await imageCompression(file, opcionesCompresion);
        archivosListos[input.id] = compressedFile;
        console.log("Imagen procesada a WebP");
    } catch (error) {
        console.error("Error:", error);
    }
}

// --- INYECCIÓN (INSERT) ---
// Asegúrate de que esta variable sea accesible. Si está en otro archivo, NO la declares aquí de nuevo.
// let archivosListos = { foto1: null, foto2: null, foto3: null }; 

async function inyectarEquipo(e) {
    e.preventDefault();
    console.log("Iniciando inyección..."); // Debug en consola

    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Procesando e Inyectando...";
    btn.disabled = true;

    const urls = [];

    try {
        // 1. Validar que Supabase esté conectado
        if (typeof _supabase === 'undefined') {
            throw new Error("La conexión con Supabase no está definida. Revisa el orden de tus scripts.");
        }

        // 2. Ciclo de subida de imágenes
        for (let i = 1; i <= 3; i++) {
            const file = archivosListos[`foto${i}`];
            if (file) {
                const fileName = `productos/${Date.now()}_${i}.webp`;
                
                // Subida al Storage
                const { data: uploadData, error: uploadError } = await _supabase.storage
                    .from('fotos-productos')
                    .upload(fileName, file);

                if (uploadError) throw new Error("Error subiendo imagen " + i + ": " + uploadError.message);

                // Obtener URL pública
                const { data: publicData } = _supabase.storage
                    .from('fotos-productos')
                    .getPublicUrl(fileName);
                
                urls.push(publicData.publicUrl);
                console.log("Imagen " + i + " subida con éxito.");
            } else { 
                urls.push(null); 
            }
        }

        // 3. Inserción en la tabla
        const payload = {
            nombre: document.getElementById('nombre').value,
            categoria: document.getElementById('cat').value,
            subcategoria: document.getElementById('subcat').value,
            stock: parseInt(document.getElementById('stock').value) || 0,
            descripcion: document.getElementById('desc').value,
            url_imagen_1: urls[0], 
            url_imagen_2: urls[1], 
            url_imagen_3: urls[2]
        };

        console.log("Enviando datos a la DB:", payload);

        const { data, error: insertError } = await _supabase
            .from('productos')
            .insert([payload])
            .select(); // Agregamos .select() para confirmar que se creó

        if (insertError) throw new Error("Error en la base de datos: " + insertError.message);

        // 4. Éxito absoluto
        alert("¡Producto inyectado con éxito en Makro SPA!");
        
        // Limpieza solo si todo salió bien
        e.target.reset();
        document.querySelectorAll('.thumb-preview').forEach(img => {
            img.src = "";
            img.style.display = 'none';
        });
        document.getElementById('subcat').disabled = true;
        archivosListos = { foto1: null, foto2: null, foto3: null };

    } catch (err) {
        console.error("DETALLE DEL ERROR:", err);
        alert("FALLO LA INYECCIÓN: " + err.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}




