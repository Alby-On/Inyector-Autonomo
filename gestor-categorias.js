// =========================================
// VARIABLES DE ESTADO LOCAL
// =========================================
let subcatsTemporales = [];

/**
 * RENDERIZAR LISTA PRINCIPAL EN SETTINGS
 * Trae categorías de datosEnergy y conteos de Supabase
 */
async function cargarCategoriasActuales() {
    const container = document.getElementById('categories-list-container');
    if (!container) return;

    container.innerHTML = "<p style='text-align:center;'>Cargando catálogo...</p>";

    try {
        // Consultar conteo de productos en Supabase
        const { data: productos, error } = await _supabase
            .from('productos')
            .select('categoria');

        if (error) throw error;

        const conteo = {};
        productos.forEach(p => {
            conteo[p.categoria] = (conteo[p.categoria] || 0) + 1;
        });

        container.innerHTML = ""; 

        Object.keys(datosEnergy).forEach(catKey => {
            const numProductos = conteo[catKey] || 0;
            const subcategorias = datosEnergy[catKey];

            const card = document.createElement('div');
            card.className = "card";
            card.style.cssText = "margin-bottom:15px; padding:20px; border-left:5px solid var(--primary); background:#fff; box-shadow: var(--shadow);";

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div>
                        <strong style="font-size:1.1rem; color:var(--dark); text-transform: uppercase;">
                            📂 ${catKey.replace(/_/g, ' ')}
                        </strong>
                        <div style="color:#64748b; font-size:0.85rem; margin-top:4px;">
                            ${numProductos} productos registrados
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="action-edit" onclick="openEditCategoryModal('${catKey}')" style="background:none; border:none; color:var(--primary); font-weight:600; cursor:pointer;">✏️ Editar</button>
                        <button class="${numProductos > 0 ? '' : 'action-delete'}" 
                                style="background:none; border:none; color:${numProductos > 0 ? '#cbd5e1' : 'var(--danger)'}; font-weight:600; cursor:${numProductos > 0 ? 'not-allowed' : 'pointer'};"
                                ${numProductos > 0 ? 'disabled title="En uso"' : `onclick="eliminarCategoria('${catKey}')"`}>
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${subcategorias.map(sub => `
                        <span style="background:var(--light); color:#475569; padding:4px 12px; border-radius:15px; font-size:0.8rem; border:1px solid var(--border);">
                            ${sub}
                        </span>
                    `).join('')}
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p style='color:red;'>Error al conectar con la base de datos.</p>";
    }
}

// =========================================
// LÓGICA DEL MODAL (CREAR / EDITAR)
// =========================================

function openCreateCategoryModal() {
    document.getElementById('modal-category-title').innerText = "✚ Nueva Categoría";
    document.getElementById('modal-editing-key').value = ""; 
    document.getElementById('modal-input-cat-name').value = "";
    subcatsTemporales = [];
    renderSubListInModal();
    document.getElementById('category-modal').style.display = "flex";
}

function closeCategoryModal() {
    document.getElementById('category-modal').style.display = "none";
    document.getElementById('sub-min-warning').style.display = "none";
}

function addSubToModalList() {
    const input = document.getElementById('modal-input-sub-name');
    const val = input.value.trim();
    if (val && !subcatsTemporales.includes(val)) {
        subcatsTemporales.push(val);
        input.value = "";
        renderSubListInModal();
        document.getElementById('sub-min-warning').style.display = "none";
    }
}

function removeSubFromModalList(index) {
    subcatsTemporales.splice(index, 1);
    renderSubListInModal();
}

function renderSubListInModal() {
    const container = document.getElementById('modal-sub-list');
    container.innerHTML = subcatsTemporales.length === 0 ? '<small style="color:#94a3b8">Agregue al menos una subcategoría...</small>' : "";
    
    subcatsTemporales.forEach((sub, i) => {
        const badge = document.createElement('span');
        badge.style.cssText = "background:white; border:1px solid #e2e8f0; padding:4px 12px; border-radius:20px; font-size:0.85rem; display:flex; align-items:center; gap:8px; font-weight:500;";
        badge.innerHTML = `${sub} <b style="color:red; cursor:pointer;" onclick="removeSubFromModalList(${i})">&times;</b>`;
        container.appendChild(badge);
    });
}

// =========================================
// GUARDADO E INYECCIÓN
// =========================================

async function processCategorySave() {
    const nameInput = document.getElementById('modal-input-cat-name');
    const editingKey = document.getElementById('modal-editing-key').value;
    const nuevoNombre = nameInput.value.trim();
    const nuevaKey = nuevoNombre.toLowerCase().replace(/\s+/g, '_');

    if (subcatsTemporales.length === 0) {
        document.getElementById('sub-min-warning').style.display = "block";
        return;
    }

    const btn = document.getElementById('btn-process-cat');
    btn.disabled = true;
    btn.innerText = "Procesando...";

    try {
        // Si estamos editando y el nombre cambió, actualizamos en cascada en Supabase
        if (editingKey && editingKey !== nuevaKey) {
            const { error } = await _supabase
                .from('productos')
                .update({ categoria: nuevaKey })
                .eq('categoria', editingKey);
            if (error) throw error;
            delete datosEnergy[editingKey];
        }

        // Actualizar el objeto global y persistir
        datosEnergy[nuevaKey] = subcatsTemporales;
        localStorage.setItem('config_energy_v2', JSON.stringify(datosEnergy));

        // Refrescar UI
        if (typeof actualizarTodosLosSelects === 'function') actualizarTodosLosSelects();
        cargarCategoriasActuales();
        closeCategoryModal();
        alert("Catálogo actualizado con éxito.");

    } catch (err) {
        alert("Error al guardar: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar Cambios";
    }
}

async function eliminarCategoria(key) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${key}"?`)) return;
    
    delete datosEnergy[key];
    localStorage.setItem('config_energy_v2', JSON.stringify(datosEnergy));
    
    if (typeof actualizarTodosLosSelects === 'function') actualizarTodosLosSelects();
    cargarCategoriasActuales();
}
/**
 * Controla el cambio de pestañas (vistas) en la aplicación
 * @param {string} viewId - El ID del div que se quiere mostrar
 * @param {HTMLElement} btn - El botón que recibió el clic para activarlo
 */
function showView(viewId, btn) {
    // 1. Ocultar todas las secciones que tengan la clase 'view'
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });

    // 2. Quitar la clase 'active' de todos los botones de navegación
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
    });

    // 3. Mostrar la sección seleccionada
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }

    // 4. Marcar el botón actual como activo
    if (btn) {
        btn.classList.add('active');
    }

    // --- LÓGICA DE CARGA AUTOMÁTICA ---
    
    // Si entra a la lista de inventario, refresca la tabla desde Supabase
    if (viewId === 'list-view') {
        if (typeof cargarTablaDesdeSupabase === 'function') {
            cargarTablaDesdeSupabase();
        }
    }

    // Si entra a categorías, refresca el catálogo
    if (viewId === 'settings-view') {
        if (typeof cargarCategoriasActuales === 'function') {
            cargarCategoriasActuales();
        }
    }
}
