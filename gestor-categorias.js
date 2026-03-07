// =========================================
// VARIABLES DE ESTADO LOCAL
// =========================================
let subcatsTemporales = [];
let datosEnergy = {}; // Ahora se llena desde Supabase

/**
 * SINCRONIZAR CATÁLOGO DESDE SUPABASE
 * Carga los datos de la tabla configuracion_catalogo al objeto global
 */
async function sincronizarCatalogoDesdeBD() {
    try {
        const { data, error } = await _supabase
            .from('configuracion_catalogo')
            .select('*');

        if (error) throw error;

        // Transformamos el array de la BD al formato de objeto { key: [subs] }
        const nuevoCatalogo = {};
        data.forEach(item => {
            nuevoCatalogo[item.categoria] = item.subcategorias;
        });

        datosEnergy = nuevoCatalogo;
        console.log("Catálogo sincronizado desde Supabase");
    } catch (err) {
        console.error("Error al sincronizar catálogo:", err);
    }
}

/**
 * RENDERIZAR LISTA PRINCIPAL EN SETTINGS
 */
async function cargarCategoriasActuales() {
    const container = document.getElementById('categories-list-container');
    if (!container) return;

    container.innerHTML = "<p style='text-align:center;'>🔍 Conectando con Supabase...</p>";

    try {
        // 1. Forzar sincronización del objeto global
        await sincronizarCatalogoDesdeBD();

        // 2. Verificar si datosEnergy tiene algo
        const keys = Object.keys(datosEnergy);
        console.log("Categorías encontradas:", keys.length);

        if (keys.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; border:1px dashed #ccc; border-radius:10px;">
                    <p>No hay categorías en la base de datos.</p>
                    <button class="btn-main" onclick="openCreateCategoryModal()" style="width:auto; padding:8px 15px;">
                        Crear mi primera categoría
                    </button>
                </div>`;
            return;
        }

        // 3. Traer conteo de productos
        const { data: productos, error: errProd } = await _supabase.from('productos').select('categoria');
        if (errProd) throw errProd;

        const conteo = {};
        productos.forEach(p => { conteo[p.categoria] = (conteo[p.categoria] || 0) + 1; });

        container.innerHTML = ""; // Limpiar para renderizar

        // 4. Renderizar
        keys.forEach(catKey => {
            const numProductos = conteo[catKey] || 0;
            const subcategorias = datosEnergy[catKey];

            const card = document.createElement('div');
            card.className = "card";
            card.style.cssText = "margin-bottom:15px; padding:20px; border-left:5px solid var(--primary); background:#fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";

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
                        <button onclick="openEditCategoryModal('${catKey}')" style="background:none; border:none; color:var(--primary); font-weight:600; cursor:pointer;">✏️ Editar</button>
                        <button style="background:none; border:none; color:${numProductos > 0 ? '#cbd5e1' : 'var(--danger)'}; font-weight:600; cursor:pointer;" 
                                onclick="${numProductos === 0 ? `eliminarCategoria('${catKey}')` : "alert('No puedes eliminar una categoría con productos')"}">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                    ${subcategorias.map(sub => `
                        <span style="background:#f1f5f9; color:#475569; padding:4px 12px; border-radius:15px; font-size:0.8rem; border:1px solid #e2e8f0;">
                            ${sub}
                        </span>
                    `).join('')}
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error completo:", err);
        container.innerHTML = `
            <div style="color:red; text-align:center; padding:20px;">
                <strong>❌ Error de conexión:</strong><br>
                ${err.message || "No se pudo conectar con Supabase"}
            </div>`;
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

function openEditCategoryModal(key) {
    const modal = document.getElementById('category-modal');
    document.getElementById('modal-category-title').innerText = "✏️ Editar Categoría";
    document.getElementById('modal-editing-key').value = key;
    document.getElementById('modal-input-cat-name').value = key.replace(/_/g, ' ').toUpperCase();
    
    subcatsTemporales = [...(datosEnergy[key] || [])];
    renderSubListInModal();
    modal.style.display = "flex";
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
// GUARDADO E INYECCIÓN (CONEXIÓN BD)
// =========================================

async function processCategorySave() {
    const nameInput = document.getElementById('modal-input-cat-name');
    const editingKey = document.getElementById('modal-editing-key').value;
    const nuevoNombre = nameInput.value.trim();
    
    // Normalizar key: "Energía Solar" -> "energia_solar"
    const nuevaKey = nuevoNombre.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');

    if (subcatsTemporales.length === 0) {
        document.getElementById('sub-min-warning').style.display = "block";
        return;
    }

    const btn = document.getElementById('btn-process-cat');
    btn.disabled = true;
    btn.innerText = "Sincronizando...";

    try {
        if (editingKey) {
            // 1. Si el nombre cambió, actualizar productos en cascada
            if (editingKey !== nuevaKey) {
                await _supabase.from('productos').update({ categoria: nuevaKey }).eq('categoria', editingKey);
                await _supabase.from('configuracion_catalogo').delete().eq('categoria', editingKey);
            }
            
            // 2. Upsert en tabla de configuración
            const { error } = await _supabase
                .from('configuracion_catalogo')
                .upsert({ 
                    categoria: nuevaKey, 
                    nombre_visible: nuevoNombre, 
                    subcategorias: subcatsTemporales 
                }, { onConflict: 'categoria' });
            
            if (error) throw error;
        } else {
            // INSERTAR NUEVA
            const { error } = await _supabase
                .from('configuracion_catalogo')
                .insert([{ 
                    categoria: nuevaKey, 
                    nombre_visible: nuevoNombre, 
                    subcategorias: subcatsTemporales 
                }]);
            if (error) throw error;
        }

        await cargarCategoriasActuales(); // Esto sincroniza datosEnergy y refresca UI
        if (typeof actualizarTodosLosSelects === 'function') actualizarTodosLosSelects();
        
        closeCategoryModal();
        alert("¡Base de datos actualizada!");

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Guardar Cambios";
    }
}

async function eliminarCategoria(key) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${key}"?`)) return;
    
    try {
        const { error } = await _supabase
            .from('configuracion_catalogo')
            .delete()
            .eq('categoria', key);
            
        if (error) throw error;

        await cargarCategoriasActuales();
        if (typeof actualizarTodosLosSelects === 'function') actualizarTodosLosSelects();
    } catch (err) {
        alert("Error al eliminar: " + err.message);
    }
}

/**
 * NAVEGACIÓN
 */
function showView(viewId, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
    if (btn) btn.classList.add('active');

    if (viewId === 'list-view') {
        if (typeof cargarTablaDesdeSupabase === 'function') cargarTablaDesdeSupabase();
    }

    if (viewId === 'settings-view') {
        cargarCategoriasActuales();
    }
}
