// 1. Configuración de Supabase (Corregido: usamos un nombre distinto para la instancia)
const SUPABASE_URL = 'https://afrfaeouzkjdkkqeozgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcmZhZW91emtqZGtrcWVvemdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTg1OTUsImV4cCI6MjA4Nzc5NDU5NX0.CRUaz7sNOuotsV3tVM5O2KvTerAT6uTXHaTy4yKKAdM';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let archivosListos = { foto1: null, foto2: null, foto3: null };
let productosEnMemoria = []; // Para manejar la edición sin re-consultar
let idProductoEditando = null;

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

// --- CRUD SUPABASE ---

async function cargarTablaDesdeSupabase() {
    const { data, error } = await _supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (error) return console.error("Error:", error);
    
    productosEnMemoria = data;
    const body = document.getElementById("inventory-body");
    body.innerHTML = "";

    data.forEach((prod, index) => {
        body.innerHTML += `
            <tr>
                <td><img src="${prod.url_imagen_1 || 'https://via.placeholder.com/50'}" class="thumb"></td>
                <td>${prod.nombre}</td>
                <td>${prod.categoria}</td>
                <td>${prod.stock}</td>
                <td>
                    <span class="action-edit" onclick="openEditModal(${index})">Editar</span>
                    <span class="action-delete" onclick="deleteProduct('${prod.id}')">Eliminar</span>
                </td>
            </tr>
        `;
    });
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
async function inyectarEquipo(e) {
    e.preventDefault();
    
    // 1. Referencias y Feedback Visual
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Procesando e Inyectando...";
    btn.disabled = true;

    const urls = [];

    try {
        // 2. Ciclo de subida de imágenes procesadas (WebP)
        for (let i = 1; i <= 3; i++) {
            const file = archivosListos[`foto${i}`];
            if (file) {
                // Generamos un nombre único usando timestamp + índice
                const fileName = `productos/${Date.now()}_${i}.webp`;
                
                const { error: uploadError } = await _supabase.storage
                    .from('fotos-productos')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // Obtenemos la URL pública para la base de datos
                const { data: publicData } = _supabase.storage
                    .from('fotos-productos')
                    .getPublicUrl(fileName);
                
                urls.push(publicData.publicUrl);
            } else { 
                urls.push(null); 
            }
        }

        // 3. Inserción en la tabla de Supabase
        const { error: insertError } = await _supabase.from('productos').insert([{
            nombre: document.getElementById('nombre').value,
            categoria: document.getElementById('cat').value,
            subcategoria: document.getElementById('subcat').value,
            stock: parseInt(document.getElementById('stock').value) || 0,
            descripcion: document.getElementById('desc').value,
            url_imagen_1: urls[0], 
            url_imagen_2: urls[1], 
            url_imagen_3: urls[2]
        }]);

        if (insertError) throw insertError;

        // 4. Éxito y Limpieza Profunda
        alert("¡Producto inyectado con éxito en el catálogo de Makro SPA!");
        
        // Reset completo del formulario
        e.target.reset();
        
        // Limpieza de estados visuales y variables
        document.querySelectorAll('.thumb-preview').forEach(img => {
            img.src = "";
            img.style.display = 'none';
        });

        // IMPORTANTE: Deshabilitar subcategoría de nuevo hasta nueva selección
        const subcatSelect = document.getElementById('subcat');
        subcatSelect.disabled = true;
        subcatSelect.innerHTML = '<option value="">Primero elija categoría</option>';

        // Reset del objeto de archivos procesados
        archivosListos = { foto1: null, foto2: null, foto3: null };

    } catch (err) {
        console.error("Error técnico en inyección:", err);
        alert("Error: " + err.message);
    } finally {
        // Restaurar botón
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- MODAL DE EDICIÓN ---
function openEditModal(index) {
    const producto = productosEnMemoria[index];
    idProductoEditando = producto.id;

    document.getElementById("edit-nombre").value = producto.nombre;
    document.getElementById("edit-cat").value = producto.categoria;
    document.getElementById("edit-stock").value = producto.stock;
    document.getElementById("edit-desc").value = producto.descripcion || "";

    cargarSubcategoriasEdicion(producto.subcategoria);
    document.getElementById("edit-modal").style.display = "flex";
}

function cargarSubcategoriasEdicion(subcatPreseleccionada = "") {
    const catValue = document.getElementById("edit-cat").value;
    const subcatSelect = document.getElementById("edit-subcat");
    subcatSelect.innerHTML = '<option value="">Seleccione Sub-Categoría</option>';

    if (catValue && datosMakro[catValue]) {
        datosMakro[catValue].forEach(sub => {
            const option = document.createElement("option");
            option.value = sub.replace(/\s+/g, '_').toLowerCase();
            option.textContent = sub;
            if (option.value === subcatPreseleccionada) option.selected = true;
            subcatSelect.appendChild(option);
        });
    }
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
}

function filterTable() {
    let input = document.getElementById("search").value.toLowerCase();
    let rows = document.getElementById("inventory-body").getElementsByTagName("tr");
    for (let row of rows) {
        row.style.display = row.textContent.toLowerCase().includes(input) ? "" : "none";
    }
}
