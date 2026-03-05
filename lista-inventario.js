// --- VARIABLES DE ESTADO ---
let productosEnMemoria = []; 
let idProductoEditando = null;

// --- CARGA INICIAL Y NAVEGACIÓN ---
async function cargarTablaDesdeSupabase() {
    const body = document.getElementById("inventory-body");
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando inventario...</td></tr>';

    const { data, error } = await _supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error al obtener datos:", error);
        body.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar datos</td></tr>';
        return;
    }
    
    productosEnMemoria = data;
    renderizarTabla(data);
}

function renderizarTabla(lista) {
    const body = document.getElementById("inventory-body");
    body.innerHTML = "";

    if (lista.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay productos registrados.</td></tr>';
        return;
    }

    lista.forEach((prod, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><img src="${prod.url_imagen_1 || 'https://via.placeholder.com/50'}" class="thumb"></td>
            <td>${prod.nombre}</td>
            <td>${prod.categoria}</td>
            <td>${prod.stock}</td>
            <td>
                <span class="action-edit" onclick="openEditModal(${index})">Editar</span>
                <span class="action-delete" onclick="deleteProduct('${prod.id}')">Eliminar</span>
            </td>
        `;
        body.appendChild(tr);
    });
}

// --- FILTRADO ---
function filterTable() {
    const input = document.getElementById("search").value.toLowerCase();
    const resultados = productosEnMemoria.filter(p => 
        p.nombre.toLowerCase().includes(input) || 
        p.categoria.toLowerCase().includes(input)
    );
    renderizarTabla(resultados);
}

// --- ELIMINACIÓN ---
async function deleteProduct(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este producto de Makro SPA?")) {
        const { error } = await _supabase
            .from('productos')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error al eliminar: " + error.message);
        } else {
            cargarTablaDesdeSupabase(); 
        }
    }
}

// --- GESTIÓN DEL MODAL DE EDICIÓN ---

// 1. Carga dinámica de subcategorías para el modal
function cargarSubcategoriasEdicion(subcatPreseleccionada = "") {
    const catValue = document.getElementById("edit-cat").value;
    const subcatSelect = document.getElementById("edit-subcat");
    
    // Limpiar opciones actuales
    subcatSelect.innerHTML = '<option value="">Seleccione Sub-Categoría</option>';

    if (catValue && datosMakro[catValue]) {
        subcatSelect.disabled = false;

        datosMakro[catValue].forEach(sub => {
            const option = document.createElement("option");
            const val = sub.replace(/\s+/g, '_').toLowerCase();
            
            option.value = val;
            option.textContent = sub;

            // Preseleccionar si coincide con el dato de la base de datos
            if (val === subcatPreseleccionada) {
                option.selected = true;
            }
            
            subcatSelect.appendChild(option);
        });
    } else {
        subcatSelect.disabled = true;
    }
}

function openEditModal(index) {
    const p = productosEnMemoria[index];
    idProductoEditando = p.id;

    document.getElementById("edit-nombre").value = p.nombre;
    document.getElementById("edit-cat").value = p.categoria;
    document.getElementById("edit-stock").value = p.stock;
    document.getElementById("edit-desc").value = p.descripcion || "";

    // IMPORTANTE: Cargamos las subcategorías antes de mostrar el modal
    cargarSubcategoriasEdicion(p.subcategoria);

    document.getElementById("edit-modal").style.display = "flex";
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
    idProductoEditando = null;
}

async function saveEdit() {
    if (!idProductoEditando) return;

    const btn = document.querySelector('#edit-modal .btn-main');
    const originalText = btn.innerText;
    
    // Feedback visual de carga
    btn.disabled = true;
    btn.innerText = "Procesando y Guardando...";

    // 1. Recolectar datos básicos
    const datos = {
        nombre: document.getElementById("edit-nombre").value,
        categoria: document.getElementById("edit-cat").value,
        subcategoria: document.getElementById("edit-subcat").value,
        stock: parseInt(document.getElementById("edit-stock").value) || 0,
        descripcion: document.getElementById("edit-desc").value
    };

    try {
        // 2. Manejo de Nueva Imagen (Opcional)
        const inputFoto = document.getElementById("edit-foto");
        if (inputFoto.files && inputFoto.files[0]) {
            const archivo = inputFoto.files[0];
            
            // Configuración de compresión (WebP para ahorrar espacio)
            const opciones = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: 'image/webp'
            };

            // Compresión local
            const compressedFile = await imageCompression(archivo, opciones);
            
            // Subida al Storage
            const fileName = `productos/edit_${Date.now()}.webp`;
            const { error: uploadError } = await _supabase.storage
                .from('fotos-productos')
                .upload(fileName, compressedFile);

            if (uploadError) throw uploadError;

            // Obtener URL y agregarla a los datos de actualización
            const { data: publicData } = _supabase.storage
                .from('fotos-productos')
                .getPublicUrl(fileName);
            
            datos.url_imagen_1 = publicData.publicUrl;
        }

        // 3. Update en la tabla 'productos'
        const { error: updateError } = await _supabase
            .from('productos')
            .update(datos)
            .eq('id', idProductoEditando);

        if (updateError) throw updateError;

        alert("¡Producto de Makro SPA actualizado correctamente!");
        closeModal();
        cargarTablaDesdeSupabase(); // Refrescar la tabla

    } catch (err) {
        console.error("Error en edición:", err);
        alert("Hubo un problema: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}
