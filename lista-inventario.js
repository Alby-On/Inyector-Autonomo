// --- VARIABLES DE ESTADO ---
let productosEnMemoria = []; 
let idProductoEditando = null;

// --- CARGA INICIAL Y NAVEGACIÓN ---
async function cargarTablaDesdeSupabase() {
    const body = document.getElementById("inventory-body");
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando inventario...</td></tr>';

    const { data, error } = await _supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error al obtener datos:", error);
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar datos</td></tr>';
        return;
    }
    
    productosEnMemoria = data;
    renderizarTabla(data);
}

function renderizarTabla(lista) {
    const body = document.getElementById("inventory-body");
    body.innerHTML = "";

    if (lista.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay productos registrados.</td></tr>';
        return;
    }

    lista.forEach((prod) => {
        const tr = document.createElement("tr");
        
        const precioFormateado = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(prod.precio || 0);

        tr.innerHTML = `
            <td><img src="${prod.url_imagen_1 || 'https://via.placeholder.com/50'}" class="thumb"></td>
            <td>${prod.nombre}</td>
            <td>${prod.categoria}</td>
            <td><strong>${precioFormateado}</strong></td>
            <td>${prod.stock} unidades</td>
            <td>
                <span class="action-edit" onclick="prepararEdicion('${prod.id}')">Editar</span>
                <span class="action-delete" onclick="deleteProduct('${prod.id}')">Eliminar</span>
            </td>
        `;
        body.appendChild(tr);
    });
}

// --- NUEVA FUNCIÓN DE APOYO PARA EDICIÓN ---
function prepararEdicion(id) {
    // Buscamos el producto exacto por su ID en el arreglo de memoria
    const p = productosEnMemoria.find(item => item.id === id);
    if (!p) return; 

    idProductoEditando = p.id;

    // Rellenar campos
    document.getElementById("edit-nombre").value = p.nombre;
    document.getElementById("edit-cat").value = p.categoria;
    document.getElementById("edit-stock").value = p.stock;
    document.getElementById("edit-precio").value = p.precio || 0;
    document.getElementById("edit-desc").value = p.descripcion || "";

    // Sincronizado con datosEnergy (el nombre que usas ahora)
    cargarSubcategoriasEdicion(p.subcategoria);

    for (let i = 1; i <= 3; i++) {
        const imgPre = document.getElementById(`pre-edit-${i}`);
        const url = p[`url_imagen_${i}`];
        imgPre.src = url || "";
        imgPre.style.display = url ? "block" : "none";
    }

    const modal = document.getElementById("edit-modal");
    if(modal) modal.style.display = "flex";
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
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

    const producto = productosEnMemoria.find(p => p.id === id);
    
    try {
        const archivosABorrar = [];
        for (let i = 1; i <= 3; i++) {
            const url = producto[`url_imagen_${i}`];
            if (url) {
                const nombreArchivo = url.split('/').pop().split('?')[0];
                archivosABorrar.push(`productos/${nombreArchivo}`);
            }
        }

        if (archivosABorrar.length > 0) {
            await _supabase.storage.from('fotos-productos').remove(archivosABorrar);
        }

        const { error } = await _supabase.from('productos').delete().eq('id', id);
        if (error) throw error;

        alert("Producto eliminado correctamente.");
        cargarTablaDesdeSupabase();
    } catch (err) {
        console.error(err);
        alert("Error al eliminar: " + err.message);
    }
}

// --- CATEGORÍAS EN EDICIÓN ---
function cargarSubcategoriasEdicion(subcatPreseleccionada = "") {
    const catValue = document.getElementById("edit-cat").value;
    const subcatSelect = document.getElementById("edit-subcat");
    
    subcatSelect.innerHTML = '<option value="">Seleccione Sub-Categoría</option>';

    // CAMBIO: Ahora verifica datosEnergy (que es tu variable actual)
    if (catValue && typeof datosEnergy !== 'undefined' && datosEnergy[catValue]) {
        subcatSelect.disabled = false;
        datosEnergy[catValue].forEach(sub => {
            const option = document.createElement("option");
            const val = sub.replace(/\s+/g, '_').toLowerCase();
            option.value = val;
            option.textContent = sub;
            if (val === subcatPreseleccionada) option.selected = true;
            subcatSelect.appendChild(option);
        });
    } else {
        subcatSelect.disabled = true;
    }
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
    ['pre-edit-1', 'pre-edit-2', 'pre-edit-3'].forEach(id => {
        const img = document.getElementById(id);
        img.src = "";
        img.style.display = "none";
    });
    ['edit-foto1', 'edit-foto2', 'edit-foto3'].forEach(id => {
        document.getElementById(id).value = "";
    });
}

async function saveEdit() {
    if (!idProductoEditando) return;

    const btn = document.querySelector('#edit-modal .btn-main');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Actualizando...";

    const productoActual = productosEnMemoria.find(p => p.id === idProductoEditando);

    const datos = {
        nombre: document.getElementById("edit-nombre").value,
        categoria: document.getElementById("edit-cat").value,
        subcategoria: document.getElementById("edit-subcat").value,
        stock: parseInt(document.getElementById("edit-stock").value) || 0,
        precio: parseInt(document.getElementById("edit-precio").value) || 0, // <-- PRECIO AÑADIDO
        descripcion: document.getElementById("edit-desc").value
    };

    try {
        const fotoIds = ['edit-foto1', 'edit-foto2', 'edit-foto3'];
        
        for (let i = 0; i < fotoIds.length; i++) {
            const input = document.getElementById(fotoIds[i]);
            
            if (input.files && input.files[0]) {
                const urlVieja = productoActual[`url_imagen_${i+1}`];
                if (urlVieja) {
                    try {
                        const nombreLimpio = urlVieja.split('productos/').pop().split('?')[0];
                        await _supabase.storage
                            .from('fotos-productos')
                            .remove([`productos/${nombreLimpio}`]);
                    } catch (e) { console.warn("Archivo anterior no encontrado."); }
                }

                const archivo = input.files[0];
                const opciones = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };
                const compressedFile = await imageCompression(archivo, opciones);
                
                const nuevoPath = `productos/${idProductoEditando}_img${i+1}_${Date.now()}.webp`;
                const { error: uploadError } = await _supabase.storage
                    .from('fotos-productos')
                    .upload(nuevoPath, compressedFile);

                if (uploadError) throw uploadError;

                const { data: publicData } = _supabase.storage.from('fotos-productos').getPublicUrl(nuevoPath);
                datos[`url_imagen_${i+1}`] = publicData.publicUrl;
            }
        }

        const { error: updateError } = await _supabase
            .from('productos')
            .update(datos)
            .eq('id', idProductoEditando);

        if (updateError) throw updateError;

        alert("¡Producto actualizado exitosamente!");
        closeModal();
        cargarTablaDesdeSupabase();

    } catch (err) {
        console.error("Error al actualizar:", err);
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

function previewEdit(input, imgId) {
    const preview = document.getElementById(imgId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}
