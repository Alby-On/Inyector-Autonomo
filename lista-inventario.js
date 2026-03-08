// --- VARIABLES DE ESTADO ---
let productosEnMemoria = []; 
let idProductoEditando = null;
let categoriasCatalogo = {}; // Almacenará el catálogo dinámico para el modal de edición

/**
 * CARGA INICIAL Y NAVEGACIÓN
 */
async function cargarTablaDesdeSupabase() {
    const body = document.getElementById("inventory-body");
    if (!body) return;

    body.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando inventario...</td></tr>';

    try {
        const client = window._supabase || _supabase;
        
        // 1. Sincronizamos las categorías para el modal de edición antes de renderizar
        await sincronizarCategoriasParaEdicion();

        // 2. Traemos los productos
        const { data, error } = await client
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        productosEnMemoria = data;
        renderizarTabla(data);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar datos</td></tr>';
    }
}

/**
 * Trae las categorías actuales de Supabase para que el modal de edición 
 * tenga los selects actualizados.
 */
async function sincronizarCategoriasParaEdicion() {
    try {
        const client = window._supabase || _supabase;
        const { data, error } = await client
            .from('configuracion_catalogo')
            .select('*');

        if (error) throw error;

        categoriasCatalogo = {};
        const editCatSelect = document.getElementById("edit-cat");
        if (editCatSelect) {
            editCatSelect.innerHTML = '<option value="">Seleccione Categoría</option>';
            data.forEach(item => {
                categoriasCatalogo[item.categoria] = item.subcategorias;
                const opt = document.createElement("option");
                opt.value = item.categoria;
                opt.textContent = item.nombre_visible;
                editCatSelect.appendChild(opt);
            });
        }
    } catch (err) {
        console.warn("No se pudieron sincronizar categorías para edición:", err);
    }
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
            <td>${prod.categoria.replace(/_/g, ' ').toUpperCase()}</td>
            <td><strong>${precioFormateado}</strong></td>
            <td>${prod.stock} unidades</td>
            <td>
                <span class="action-edit" onclick="prepararEdicion('${prod.id}')">✏️ Editar</span>
                <span class="action-delete" onclick="deleteProduct('${prod.id}')">🗑️ Eliminar</span>
            </td>
        `;
        body.appendChild(tr);
    });
}

function prepararEdicion(id) {
    const p = productosEnMemoria.find(item => item.id === id);
    if (!p) return; 

    idProductoEditando = p.id;

    // Rellenar campos básicos
    document.getElementById("edit-nombre").value = p.nombre;
    document.getElementById("edit-cat").value = p.categoria;
    document.getElementById("edit-stock").value = p.stock;
    document.getElementById("edit-precio").value = p.precio || 0;
    document.getElementById("edit-desc").value = p.descripcion || "";

    // Cargar subcategorías basadas en la categoría del producto
    cargarSubcategoriasEdicion(p.subcategoria);

    // Fotografías
    for (let i = 1; i <= 3; i++) {
        const imgPre = document.getElementById(`pre-edit-${i}`);
        const url = p[`url_imagen_${i}`];
        imgPre.src = url || "";
        imgPre.style.display = url ? "block" : "none";
    }

    const modal = document.getElementById("edit-modal");
    if(modal) modal.style.display = "flex";
}

function cargarSubcategoriasEdicion(subcatPreseleccionada = "") {
    const catValue = document.getElementById("edit-cat").value;
    const subcatSelect = document.getElementById("edit-subcat");
    
    subcatSelect.innerHTML = '<option value="">Seleccione Sub-Categoría</option>';

    if (catValue && categoriasCatalogo[catValue]) {
        subcatSelect.disabled = false;
        categoriasCatalogo[catValue].forEach(sub => {
            const option = document.createElement("option");
            option.value = sub; // Usamos el nombre directo
            option.textContent = sub;
            if (sub === subcatPreseleccionada) option.selected = true;
            subcatSelect.appendChild(option);
        });
    } else {
        subcatSelect.disabled = true;
    }
}

async function deleteProduct(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    const client = window._supabase || _supabase;
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
            await client.storage.from('fotos-productos').remove(archivosABorrar);
        }

        const { error } = await client.from('productos').delete().eq('id', id);
        if (error) throw error;

        alert("Producto eliminado correctamente.");
        cargarTablaDesdeSupabase();
    } catch (err) {
        console.error(err);
        alert("Error al eliminar: " + err.message);
    }
}

async function saveEdit() {
    if (!idProductoEditando) return;
    const client = window._supabase || _supabase;

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
        precio: parseInt(document.getElementById("edit-precio").value) || 0,
        descripcion: document.getElementById("edit-desc").value
    };

    try {
        const fotoIds = ['edit-foto1', 'edit-foto2', 'edit-foto3'];
        
        for (let i = 0; i < fotoIds.length; i++) {
            const input = document.getElementById(fotoIds[i]);
            if (input.files && input.files[0]) {
                const urlVieja = productoActual[`url_imagen_${i+1}`];
                if (urlVieja) {
                    const nombreLimpio = urlVieja.split('productos/').pop().split('?')[0];
                    await client.storage.from('fotos-productos').remove([`productos/${nombreLimpio}`]);
                }

                const archivo = input.files[0];
                const opciones = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };
                const compressedFile = await imageCompression(archivo, opciones);
                
                const nuevoPath = `productos/${idProductoEditando}_img${i+1}_${Date.now()}.webp`;
                await client.storage.from('fotos-productos').upload(nuevoPath, compressedFile);

                const { data: publicData } = client.storage.from('fotos-productos').getPublicUrl(nuevoPath);
                datos[`url_imagen_${i+1}`] = publicData.publicUrl;
            }
        }

        const { error } = await client.from('productos').update(datos).eq('id', idProductoEditando);
        if (error) throw error;

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

function filterTable() {
    const input = document.getElementById("search").value.toLowerCase();
    const resultados = productosEnMemoria.filter(p => 
        p.nombre.toLowerCase().includes(input) || 
        p.categoria.toLowerCase().includes(input)
    );
    renderizarTabla(resultados);
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
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
