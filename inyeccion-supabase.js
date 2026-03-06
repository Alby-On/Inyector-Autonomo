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
    
    if(viewId === 'list-view') cargarTablaDesdeSupabase();
}

// --- LÓGICA DE CATEGORÍAS ---
function cargarSubcategorias() {
    const catSelect = document.getElementById("cat");
    const subcatSelect = document.getElementById("subcat");
    const seleccion = catSelect.value;

    subcatSelect.innerHTML = '<option value="">Seleccione Sub-Categoría</option>';

    if (seleccion && datosMakro[seleccion]) {
        subcatSelect.disabled = false; 
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

// --- PROCESAMIENTO DE IMÁGENES ---
const opcionesCompresion = {
    maxSizeMB: 1, // Bajado a 1MB para mejor rendimiento en web
    maxWidthOrHeight: 1200,
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
    } catch (error) {
        console.error("Error al procesar preview:", error);
    }
}

// --- INYECCIÓN (INSERT) ---
async function inyectarEquipo(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Procesando e Inyectando...";
    btn.disabled = true;

    const urls = [];

    try {
        if (typeof _supabase === 'undefined') {
            throw new Error("La conexión con Supabase no está definida.");
        }

        // 1. Ciclo de subida de imágenes al Storage
        for (let i = 1; i <= 3; i++) {
            const file = archivosListos[`foto${i}`];
            if (file) {
                const fileName = `productos/${Date.now()}_${i}.webp`;
                const { error: uploadError } = await _supabase.storage
                    .from('fotos-productos')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: publicData } = _supabase.storage
                    .from('fotos-productos')
                    .getPublicUrl(fileName);
                
                urls.push(publicData.publicUrl);
            } else { 
                urls.push(null); 
            }
        }

        // 2. Preparación del Payload con la nueva variable PRECIO
        const payload = {
            nombre: document.getElementById('nombre').value,
            categoria: document.getElementById('cat').value,
            subcategoria: document.getElementById('subcat').value,
            stock: parseInt(document.getElementById('stock').value) || 0,
            precio: parseInt(document.getElementById('precio').value) || 0, // <-- CAMBIO APLICADO
            descripcion: document.getElementById('desc').value,
            url_imagen_1: urls[0], 
            url_imagen_2: urls[1], 
            url_imagen_3: urls[2]
        };

        // 3. Inserción en la tabla
        const { error: insertError } = await _supabase
            .from('productos')
            .insert([payload]);

        if (insertError) throw insertError;

        // 4. Éxito y Limpieza
        alert("¡Producto inyectado con éxito en Makro SPA!");
        
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


