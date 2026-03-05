// --- VARIABLES DE ESTADO ---
let productosEnMemoria = []; 
let idProductoEditando = null;

// --- CARGA INICIAL Y NAVEGACIÓN ---
// Se llama desde la función showView en el HTML cuando viewId === 'list-view'
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
            cargarTablaDesdeSupabase(); // Recargar tras eliminar
        }
    }
}

// --- GESTIÓN DEL MODAL DE EDICIÓN ---
function openEditModal(index) {
    const p = productosEnMemoria[index];
    idProductoEditando = p.id;

    document.getElementById("edit-nombre").value = p.nombre;
    document.getElementById("edit-cat").value = p.categoria;
    document.getElementById("edit-stock").value = p.stock;
    document.getElementById("edit-desc").value = p.descripcion || "";

    // Cargar subcategorías y preseleccionar la actual
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
    btn.disabled = true;
    btn.innerText = "Guardando...";

    const datos = {
        nombre: document.getElementById("edit-nombre").value,
        categoria: document.getElementById("edit-cat").value,
        subcategoria: document.getElementById("edit-subcat").value,
        stock: parseInt(document.getElementById("edit-stock").value) || 0,
        descripcion: document.getElementById("edit-desc").value
    };

    const { error } = await _supabase
        .from('productos')
        .update(datos)
        .eq('id', idProductoEditando);

    if (error) {
        alert("Error al actualizar: " + error.message);
    } else {
        alert("Producto actualizado con éxito");
        closeModal();
        cargarTablaDesdeSupabase();
    }
    btn.disabled = false;
    btn.innerText = "Actualizar Datos";
}
